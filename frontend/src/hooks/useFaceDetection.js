import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

let sharedFaceDetectorPromise = null;

/**
 * Initializes and caches a shared MediaPipe FaceDetector instance across component renders.
 */
async function getFaceDetectorInstance() {
  if (!sharedFaceDetectorPromise) {
    sharedFaceDetectorPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm'
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.5,
        });
        return detector;
      } catch (err) {
        console.warn('[InterviewIQ] GPU delegate failed for FaceDetector, trying CPU:', err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm'
          );
          return await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'CPU',
            },
            runningMode: 'IMAGE',
            minDetectionConfidence: 0.5,
          });
        } catch (cpuErr) {
          console.error('[InterviewIQ] Failed to initialize MediaPipe FaceDetector:', cpuErr);
          sharedFaceDetectorPromise = null;
          throw cpuErr;
        }
      }
    })();
  }
  return sharedFaceDetectorPromise;
}

/**
 * Custom Hook for real-time in-browser face detection during interviews.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Reference to live candidate video element
 * @param {Object} options
 * @param {boolean} options.isEnabled - Whether detection loop is active
 * @param {boolean} options.isMirrored - Whether candidate video is mirrored horizontally
 * @param {number} options.intervalMs - Detection interval in milliseconds (default 120ms ~ 8 FPS)
 */
export function useFaceDetection(videoRef, options = {}) {
  const {
    isEnabled = true,
    isMirrored = true,
    intervalMs = 120,
  } = options;

  const [faceStatus, setFaceStatus] = useState('initializing'); // 'initializing' | 'no_face' | 'single_face' | 'multiple_faces' | 'camera_off' | 'error'
  const [faceCount, setFaceCount] = useState(0);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [metrics, setMetrics] = useState({
    eyeContactScore: 95,
    postureState: 'Composed',
    positionQuality: 0.9,
    centerX: 0.5,
    centerY: 0.5,
  });
  const [isOutOfFrame, setIsOutOfFrame] = useState(false);
  const [isMultipleFaces, setIsMultipleFaces] = useState(false);
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const [error, setError] = useState(null);

  const detectorRef = useRef(null);
  const isRunningRef = useRef(false);
  const consecutiveNoFaceFrames = useRef(0);
  const lastDetectionTimeRef = useRef(0);

  // Initialize MediaPipe FaceDetector
  useEffect(() => {
    let isMounted = true;

    async function initDetector() {
      try {
        setError(null);
        const detector = await getFaceDetectorInstance();
        if (isMounted) {
          detectorRef.current = detector;
          setIsDetectorReady(true);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[InterviewIQ] Face detector initialization notice:', err);
          setError('Real-time face detector running in browser-native fallback mode');
          setIsDetectorReady(false);
        }
      }
    }

    initDetector();

    return () => {
      isMounted = false;
    };
  }, []);

  // Main Detection Loop
  useEffect(() => {
    if (!isEnabled) {
      setFaceStatus('camera_off');
      setBoundingBoxes([]);
      setFaceCount(0);
      setIsOutOfFrame(false);
      setIsMultipleFaces(false);
      return;
    }

    let animationFrameId = null;
    let timerId = null;
    isRunningRef.current = true;

    const detectFrame = async () => {
      if (!isRunningRef.current) return;

      const now = performance.now();
      if (now - lastDetectionTimeRef.current < intervalMs) {
        timerId = setTimeout(detectFrame, intervalMs - (now - lastDetectionTimeRef.current));
        return;
      }
      lastDetectionTimeRef.current = now;

      const video = videoRef?.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        timerId = setTimeout(detectFrame, intervalMs);
        return;
      }

      try {
        const detector = detectorRef.current;
        if (detector) {
          const detectionResult = detector.detect(video);
          const detections = detectionResult?.detections || [];
          const count = detections.length;

          const vWidth = video.videoWidth;
          const vHeight = video.videoHeight;

          const boxes = detections.map((det) => {
            const bbox = det.boundingBox;
            // Calculate normalized percentage coordinates
            let normX = bbox.originX / vWidth;
            let normY = bbox.originY / vHeight;
            let normW = bbox.width / vWidth;
            let normH = bbox.height / vHeight;

            // Handle horizontal mirroring if applied to video element
            if (isMirrored) {
              normX = 1.0 - (normX + normW);
            }

            return {
              x: Math.max(0, Math.min(1, normX)),
              y: Math.max(0, Math.min(1, normY)),
              width: Math.max(0, Math.min(1, normW)),
              height: Math.max(0, Math.min(1, normH)),
              confidence: det.categories?.[0]?.score || 0.9,
            };
          });

          setBoundingBoxes(boxes);
          setFaceCount(count);

          if (count === 0) {
            consecutiveNoFaceFrames.current += 1;
            // Debounce out of frame warning (~1 second)
            if (consecutiveNoFaceFrames.current >= Math.max(2, Math.floor(1000 / intervalMs))) {
              setIsOutOfFrame(true);
              setFaceStatus('no_face');
            }
            setIsMultipleFaces(false);
          } else if (count === 1) {
            consecutiveNoFaceFrames.current = 0;
            setIsOutOfFrame(false);
            setIsMultipleFaces(false);
            setFaceStatus('single_face');

            // Calculate live composure & eye contact metrics from primary face bounding box
            const primary = boxes[0];
            const centerX = primary.x + primary.width / 2;
            const centerY = primary.y + primary.height / 2;
            const distFromCenter = Math.sqrt(Math.pow(centerX - 0.5, 2) + Math.pow(centerY - 0.45, 2));

            // Eye contact percentage based on framing alignment
            const eyeContact = Math.round(Math.max(60, Math.min(99, 100 - distFromCenter * 110)));
            const positionQuality = Math.round(Math.max(0.2, Math.min(1.0, 1.0 - distFromCenter * 1.5)) * 100) / 100;

            let posture = 'Composed';
            if (distFromCenter > 0.28) {
              posture = 'Off-Center';
            } else if (distFromCenter > 0.18) {
              posture = 'Slight Turn';
            }

            setMetrics({
              eyeContactScore: eyeContact,
              postureState: posture,
              positionQuality,
              centerX: Math.round(centerX * 100) / 100,
              centerY: Math.round(centerY * 100) / 100,
            });
          } else {
            // Multiple faces (> 1)
            consecutiveNoFaceFrames.current = 0;
            setIsOutOfFrame(false);
            setIsMultipleFaces(true);
            setFaceStatus('multiple_faces');
          }
        } else if (window.FaceDetector) {
          // Native browser FaceDetector API fallback
          try {
            const nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
            const faces = await nativeDetector.detect(video);
            const count = faces.length;
            setFaceCount(count);

            const vWidth = video.videoWidth;
            const vHeight = video.videoHeight;

            const boxes = faces.map((f) => {
              const bbox = f.boundingBox;
              let normX = bbox.x / vWidth;
              let normY = bbox.y / vHeight;
              let normW = bbox.width / vWidth;
              let normH = bbox.height / vHeight;
              if (isMirrored) normX = 1.0 - (normX + normW);
              return { x: normX, y: normY, width: normW, height: normH, confidence: 0.95 };
            });

            setBoundingBoxes(boxes);
            if (count === 0) {
              setFaceStatus('no_face');
              setIsOutOfFrame(true);
              setIsMultipleFaces(false);
            } else if (count === 1) {
              setFaceStatus('single_face');
              setIsOutOfFrame(false);
              setIsMultipleFaces(false);
            } else {
              setFaceStatus('multiple_faces');
              setIsOutOfFrame(false);
              setIsMultipleFaces(true);
            }
          } catch (e) {
            // Silently maintain current state
          }
        }
      } catch (err) {
        // Prevent log spam if frame is dropped
      }

      if (isRunningRef.current) {
        timerId = setTimeout(detectFrame, intervalMs);
      }
    };

    timerId = setTimeout(detectFrame, intervalMs);

    return () => {
      isRunningRef.current = false;
      if (timerId) clearTimeout(timerId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isEnabled, isMirrored, intervalMs, isDetectorReady, videoRef]);

  return {
    faceStatus,
    faceCount,
    boundingBoxes,
    metrics,
    isOutOfFrame,
    isMultipleFaces,
    isDetectorReady,
    error,
  };
}
