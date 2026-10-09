import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, FaceLandmarker, ObjectDetector } from '@mediapipe/tasks-vision';

let sharedVisionPromise = null;
let sharedFaceLandmarkerPromise = null;
let sharedObjectDetectorPromise = null;

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm';
const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const OBJECT_DETECTOR_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite';

async function getVisionTasksResolver() {
  if (!sharedVisionPromise) {
    sharedVisionPromise = FilesetResolver.forVisionTasks(WASM_URL);
  }
  return sharedVisionPromise;
}

async function getFaceLandmarkerInstance() {
  if (!sharedFaceLandmarkerPromise) {
    sharedFaceLandmarkerPromise = (async () => {
      const vision = await getVisionTasksResolver();
      try {
        return await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'IMAGE',
          numFaces: 2,
        });
      } catch (err) {
        console.warn('[InterviewIQ] GPU delegate failed for FaceLandmarker, using CPU fallback:', err);
        return await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
            delegate: 'CPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'IMAGE',
          numFaces: 2,
        });
      }
    })();
  }
  return sharedFaceLandmarkerPromise;
}

async function getObjectDetectorInstance() {
  if (!sharedObjectDetectorPromise) {
    sharedObjectDetectorPromise = (async () => {
      try {
        const vision = await getVisionTasksResolver();
        return await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: OBJECT_DETECTOR_MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          scoreThreshold: 0.40,
          maxResults: 4,
        });
      } catch (err) {
        console.warn('[InterviewIQ] ObjectDetector GPU failed, trying CPU fallback:', err);
        try {
          const vision = await getVisionTasksResolver();
          return await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: OBJECT_DETECTOR_MODEL_URL,
              delegate: 'CPU',
            },
            runningMode: 'IMAGE',
            scoreThreshold: 0.40,
            maxResults: 4,
          });
        } catch (cpuErr) {
          console.warn('[InterviewIQ] ObjectDetector unavailable in current environment:', cpuErr);
          return null;
        }
      }
    })();
  }
  return sharedObjectDetectorPromise;
}

/**
 * Calculates Euclidean distance between two landmarks.
 */
function dist(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Calculates Eye Aspect Ratio (EAR) from 3D facial landmarks.
 */
function computeEAR(pCorner1, pCorner2, pTop1, pBottom1, pTop2, pBottom2) {
  const horizontal = dist(pCorner1, pCorner2);
  if (horizontal < 0.001) return 0.25;
  const vertical = (dist(pTop1, pBottom1) + dist(pTop2, pBottom2)) / 2.0;
  return vertical / horizontal;
}

/**
 * Custom Hook for real-time in-browser face landmarker, eye tracking,
 * gaze estimation, and mobile phone detection during interviews.
 */
export function useFaceDetection(videoRef, options = {}) {
  const {
    isEnabled = true,
    isMirrored = true,
    intervalMs = 120,
    phoneDetectionEnabled = true,
    phoneConfidenceThreshold = 0.45,
    eyeClosureThresholdSec = 2.5,
    offCameraThresholdSec = 3.5,
    onProctoringEvent = null,
  } = options;

  // ─── Status & Tracking States ──────────────────────────────────────────────
  const [faceStatus, setFaceStatus] = useState('initializing');
  const [faceCount, setFaceCount] = useState(0);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [isOutOfFrame, setIsOutOfFrame] = useState(false);
  const [isMultipleFaces, setIsMultipleFaces] = useState(false);
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const [error, setError] = useState(null);

  // ─── Legacy metrics for backward compatibility ────────────────────────────
  const [metrics, setMetrics] = useState({
    eyeContactScore: 95,
    postureState: 'Composed',
    positionQuality: 0.9,
    centerX: 0.5,
    centerY: 0.5,
  });

  // ─── Phase 16: Eye Openness Metrics ───────────────────────────────────────
  const [eyeMetrics, setEyeMetrics] = useState({
    leftEyeState: 'open',
    rightEyeState: 'open',
    overallEyeState: 'open',
    eyeOpenPercentage: 95,
    blinkCount: 0,
    blinkFrequency: 16.0,
    isProlongedClosure: false,
    prolongedClosureCount: 0,
    validTrackingDurationSec: 0,
  });

  // ─── Phase 16: Gaze Estimation Metrics ────────────────────────────────────
  const [gazeMetrics, setGazeMetrics] = useState({
    gazeDirection: 'camera_directed',
    cameraDirectedGazePercentage: 85,
    screenDirectedGazePercentage: 10,
    offCameraGazeDurationSec: 0,
    longestOffCameraIntervalSec: 0,
    isLookingAway: false,
    faceTrackingCoverage: 1.0,
  });

  // ─── Phase 16: Mobile Phone Detection ─────────────────────────────────────
  const [phoneDetection, setPhoneDetection] = useState({
    isPhoneDetected: false,
    confidence: 0,
    durationSec: 0,
    boundingBox: null,
  });

  // ─── Internal Tracking Refs ───────────────────────────────────────────────
  const landmarkerRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const lastObjectDetectionTimeRef = useRef(0);

  // Statistics accumulators
  const sessionStartTimeRef = useRef(Date.now());
  const validFramesCountRef = useRef(0);
  const totalFramesCountRef = useRef(0);
  const eyesOpenFramesRef = useRef(0);
  const cameraGazeFramesRef = useRef(0);
  const screenGazeFramesRef = useRef(0);
  const offCameraGazeFramesRef = useRef(0);

  // Blinking & Eye Closure State Machine
  const isEyeClosedRef = useRef(false);
  const eyeClosureStartTimeRef = useRef(null);
  const blinkCountRef = useRef(0);
  const prolongedClosureCountRef = useRef(0);
  const prolongedClosureEmittedRef = useRef(false);

  // Off-camera Gaze State Machine
  const isOffCameraRef = useRef(false);
  const offCameraStartTimeRef = useRef(null);
  const totalOffCameraDurationRef = useRef(0);
  const longestOffCameraIntervalRef = useRef(0);
  const offCameraEmittedRef = useRef(false);

  // Gaze smoothing buffer
  const gazeHistoryRef = useRef([]);

  // Mobile Phone Detection State Machine
  const phoneConsecutiveDetectionsRef = useRef(0);
  const activePhoneEventRef = useRef(null);
  const phoneLastSeenTimeRef = useRef(0);

  // Event callback ref to avoid effect recreation
  const onProctoringEventRef = useRef(onProctoringEvent);
  useEffect(() => {
    onProctoringEventRef.current = onProctoringEvent;
  }, [onProctoringEvent]);

  // Safe event emitter
  const emitEvent = useCallback((eventType, details = {}) => {
    if (typeof onProctoringEventRef.current === 'function') {
      try {
        onProctoringEventRef.current({
          event_type: eventType,
          timestamp: new Date().toISOString(),
          ...details,
        });
      } catch (err) {
        console.warn('[InterviewIQ] Proctoring event handler error:', err);
      }
    }
  }, []);

  // ─── Initialize Detectors ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function initPipelines() {
      try {
        setError(null);
        const [landmarker, detector] = await Promise.all([
          getFaceLandmarkerInstance(),
          getObjectDetectorInstance(),
        ]);
        if (isMounted) {
          landmarkerRef.current = landmarker;
          objectDetectorRef.current = detector;
          setIsDetectorReady(true);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[InterviewIQ] Real-time visual proctoring fallback mode:', err);
          setError('Running visual analysis in browser fallback mode');
          setIsDetectorReady(true);
        }
      }
    }

    initPipelines();
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── Main Video Analysis Loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!isEnabled) {
      setFaceStatus('camera_off');
      setBoundingBoxes([]);
      setFaceCount(0);
      setIsOutOfFrame(false);
      setIsMultipleFaces(false);
      setPhoneDetection({ isPhoneDetected: false, confidence: 0, durationSec: 0, boundingBox: null });
      return;
    }

    let timerId = null;
    isRunningRef.current = true;
    sessionStartTimeRef.current = Date.now();

    const processFrame = async () => {
      if (!isRunningRef.current) return;

      const now = performance.now();
      if (now - lastDetectionTimeRef.current < intervalMs) {
        timerId = setTimeout(processFrame, intervalMs - (now - lastDetectionTimeRef.current));
        return;
      }
      lastDetectionTimeRef.current = now;

      const video = videoRef?.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        timerId = setTimeout(processFrame, intervalMs);
        return;
      }

      totalFramesCountRef.current += 1;
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;

      // ── 1. FACE & EYE LANDMARKING INFERENCE ──
      try {
        const landmarker = landmarkerRef.current;
        if (landmarker) {
          const result = landmarker.detect(video);
          const faces = result?.faceLandmarks || [];
          const count = faces.length;
          setFaceCount(count);

          if (count === 0) {
            setBoundingBoxes([]);
            setFaceStatus('no_face');
            setIsOutOfFrame(true);
            setIsMultipleFaces(false);

            // Handle off-camera duration when subject completely exits
            if (!isOffCameraRef.current) {
              isOffCameraRef.current = true;
              offCameraStartTimeRef.current = Date.now();
            } else {
              const awayDuration = (Date.now() - offCameraStartTimeRef.current) / 1000;
              if (awayDuration >= offCameraThresholdSec && !offCameraEmittedRef.current) {
                offCameraEmittedRef.current = true;
                emitEvent('off_camera_gaze', {
                  duration_seconds: awayDuration,
                  metadata: { reason: 'face_out_of_frame' },
                });
              }
            }
          } else {
            setIsOutOfFrame(false);
            validFramesCountRef.current += 1;

            if (count > 1) {
              setFaceStatus('multiple_faces');
              setIsMultipleFaces(true);
              emitEvent('multiple_faces_detected', {
                metadata: { face_count: count },
              });
            } else {
              setFaceStatus('single_face');
              setIsMultipleFaces(false);
            }

            // Extract Bounding Boxes for all detected faces
            const boxes = faces.map((landmarks) => {
              let minX = 1.0, minY = 1.0, maxX = 0.0, maxY = 0.0;
              for (let i = 0; i < landmarks.length; i++) {
                const p = landmarks[i];
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
              }
              const padX = (maxX - minX) * 0.1;
              const padY = (maxY - minY) * 0.12;
              let bX = Math.max(0, minX - padX);
              let bY = Math.max(0, minY - padY);
              let bW = Math.min(1 - bX, (maxX - minX) + padX * 2);
              let bH = Math.min(1 - bY, (maxY - minY) + padY * 2);

              if (isMirrored) {
                bX = 1.0 - (bX + bW);
              }

              return {
                x: Math.max(0, Math.min(1, bX)),
                y: Math.max(0, Math.min(1, bY)),
                width: Math.max(0, Math.min(1, bW)),
                height: Math.max(0, Math.min(1, bH)),
                confidence: 0.95,
              };
            });
            setBoundingBoxes(boxes);

            // Primary Face Landmarks Analysis
            const lm = faces[0];

            // ── 1.A EYE OPENNESS ESTIMATION ──
            // Left Eye: 33 (corner), 133 (corner), 160/144, 158/153
            // Right Eye: 362 (corner), 263 (corner), 385/380, 387/373
            const leftEAR = computeEAR(lm[33], lm[133], lm[160], lm[144], lm[158], lm[153]);
            const rightEAR = computeEAR(lm[362], lm[263], lm[385], lm[380], lm[387], lm[373]);

            // Check blendshapes if available
            let blendBlinkLeft = null;
            let blendBlinkRight = null;
            if (result.faceBlendshapes && result.faceBlendshapes[0]) {
              const cats = result.faceBlendshapes[0].categories;
              for (let i = 0; i < cats.length; i++) {
                if (cats[i].categoryName === 'eyeBlinkLeft') blendBlinkLeft = cats[i].score;
                if (cats[i].categoryName === 'eyeBlinkRight') blendBlinkRight = cats[i].score;
              }
            }

            // Calibrate eye state
            const isLeftClosed = blendBlinkLeft !== null ? blendBlinkLeft > 0.55 : leftEAR < 0.17;
            const isRightClosed = blendBlinkRight !== null ? blendBlinkRight > 0.55 : rightEAR < 0.17;
            const leftState = isLeftClosed ? 'closed' : 'open';
            const rightState = isRightClosed ? 'closed' : 'open';
            const bothClosed = isLeftClosed && isRightClosed;
            const overallEyeState = bothClosed ? 'closed' : 'open';

            if (!bothClosed) {
              eyesOpenFramesRef.current += 1;
            }

            // Eye closure duration & blink tracking
            const nowMs = Date.now();
            if (bothClosed) {
              if (!isEyeClosedRef.current) {
                isEyeClosedRef.current = true;
                eyeClosureStartTimeRef.current = nowMs;
                prolongedClosureEmittedRef.current = false;
              } else {
                const closureSec = (nowMs - eyeClosureStartTimeRef.current) / 1000;
                if (closureSec >= eyeClosureThresholdSec && !prolongedClosureEmittedRef.current) {
                  prolongedClosureEmittedRef.current = true;
                  prolongedClosureCountRef.current += 1;
                  emitEvent('prolonged_eye_closure', {
                    duration_seconds: closureSec,
                    metadata: { left_ear: leftEAR, right_ear: rightEAR },
                  });
                }
              }
            } else {
              if (isEyeClosedRef.current) {
                const closureDurationMs = nowMs - (eyeClosureStartTimeRef.current || nowMs);
                // Natural blink detection: brief closure between 80ms and 450ms
                if (closureDurationMs >= 70 && closureDurationMs <= 450) {
                  blinkCountRef.current += 1;
                }
                isEyeClosedRef.current = false;
                eyeClosureStartTimeRef.current = null;
                prolongedClosureEmittedRef.current = false;
              }
            }

            const elapsedMinutes = Math.max(0.1, (nowMs - sessionStartTimeRef.current) / 60000);
            const eyeOpenPct = Math.round(
              (eyesOpenFramesRef.current / Math.max(1, validFramesCountRef.current)) * 100
            );
            const blinkRate = Math.round((blinkCountRef.current / elapsedMinutes) * 10) / 10;

            setEyeMetrics({
              leftEyeState: leftState,
              rightEyeState: rightState,
              overallEyeState,
              eyeOpenPercentage: Math.max(60, Math.min(100, eyeOpenPct)),
              blinkCount: blinkCountRef.current,
              blinkFrequency: blinkRate,
              isProlongedClosure: prolongedClosureEmittedRef.current,
              prolongedClosureCount: prolongedClosureCountRef.current,
              validTrackingDurationSec: Math.round((validFramesCountRef.current * intervalMs) / 1000),
            });

            // ── 1.B GAZE & HEAD POSE ESTIMATION ──
            // Key landmarks: Iris left (468), Iris right (473), Nose tip (1), Chin (152), Forehead (10)
            const leftIris = lm[468] || lm[469];
            const rightIris = lm[473] || lm[474];
            const noseTip = lm[1];
            const leftCheek = lm[234];
            const rightCheek = lm[454];

            // Horizontal symmetry ratio (0.5 = facing forward)
            const cheekDist = dist(leftCheek, rightCheek);
            const headYawRatio = cheekDist > 0.01 ? dist(leftCheek, noseTip) / cheekDist : 0.5;

            // Iris relative horizontal position in eye socket
            const leftEyeWidth = dist(lm[33], lm[133]);
            const leftIrisRatio = leftEyeWidth > 0.005 && leftIris ? (leftIris.x - lm[33].x) / leftEyeWidth : 0.5;

            // Vertical pitch ratio
            const verticalFaceHeight = dist(lm[10], lm[152]);
            const headPitchRatio = verticalFaceHeight > 0.01 ? dist(lm[10], noseTip) / verticalFaceHeight : 0.5;

            let instantGaze = 'camera_directed';
            // Off camera: extreme head turn or gaze looking far away
            if (Math.abs(headYawRatio - 0.5) > 0.22 || Math.abs(leftIrisRatio - 0.5) > 0.35 || headPitchRatio > 0.65 || headPitchRatio < 0.35) {
              instantGaze = 'off_camera';
            } else if (headPitchRatio > 0.56 || (leftIris && leftIris.y > lm[33].y + 0.012)) {
              // Looking down slightly at screen / questions
              instantGaze = 'screen_directed';
            } else {
              instantGaze = 'camera_directed';
            }

            // Gaze smoothing buffer (rolling window of 6 frames)
            gazeHistoryRef.current.push(instantGaze);
            if (gazeHistoryRef.current.length > 6) gazeHistoryRef.current.shift();

            const gazeCounts = gazeHistoryRef.current.reduce((acc, g) => {
              acc[g] = (acc[g] || 0) + 1;
              return acc;
            }, {});
            const smoothedGaze = Object.keys(gazeCounts).reduce((a, b) =>
              gazeCounts[a] > gazeCounts[b] ? a : b
            );

            if (smoothedGaze === 'camera_directed') cameraGazeFramesRef.current += 1;
            else if (smoothedGaze === 'screen_directed') screenGazeFramesRef.current += 1;
            else if (smoothedGaze === 'off_camera') offCameraGazeFramesRef.current += 1;

            // Off-camera gaze duration tracking
            if (smoothedGaze === 'off_camera') {
              if (!isOffCameraRef.current) {
                isOffCameraRef.current = true;
                offCameraStartTimeRef.current = nowMs;
                offCameraEmittedRef.current = false;
              } else {
                const offDuration = (nowMs - offCameraStartTimeRef.current) / 1000;
                if (offDuration > longestOffCameraIntervalRef.current) {
                  longestOffCameraIntervalRef.current = offDuration;
                }
                if (offDuration >= offCameraThresholdSec && !offCameraEmittedRef.current) {
                  offCameraEmittedRef.current = true;
                  emitEvent('off_camera_gaze', {
                    duration_seconds: offDuration,
                    metadata: { gaze_direction: 'off_camera', head_yaw: headYawRatio },
                  });
                }
              }
            } else {
              if (isOffCameraRef.current) {
                const offDuration = (nowMs - (offCameraStartTimeRef.current || nowMs)) / 1000;
                totalOffCameraDurationRef.current += offDuration;
                isOffCameraRef.current = false;
                offCameraStartTimeRef.current = null;
                offCameraEmittedRef.current = false;
              }
            }

            const validCount = Math.max(1, validFramesCountRef.current);
            const cameraPct = Math.round((cameraGazeFramesRef.current / validCount) * 100);
            const screenPct = Math.round((screenGazeFramesRef.current / validCount) * 100);
            const coverage = Math.min(1.0, Math.round((validFramesCountRef.current / totalFramesCountRef.current) * 100) / 100);

            setGazeMetrics({
              gazeDirection: smoothedGaze,
              cameraDirectedGazePercentage: cameraPct,
              screenDirectedGazePercentage: screenPct,
              offCameraGazeDurationSec: Math.round(totalOffCameraDurationRef.current * 10) / 10,
              longestOffCameraIntervalSec: Math.round(longestOffCameraIntervalRef.current * 10) / 10,
              isLookingAway: smoothedGaze === 'off_camera',
              faceTrackingCoverage: coverage,
            });

            // Legacy metrics
            const primaryBox = boxes[0];
            const centerX = primaryBox.x + primaryBox.width / 2;
            const centerY = primaryBox.y + primaryBox.height / 2;
            const distFromCenter = Math.sqrt(Math.pow(centerX - 0.5, 2) + Math.pow(centerY - 0.45, 2));

            let posture = 'Composed';
            if (distFromCenter > 0.28) posture = 'Off-Center';
            else if (distFromCenter > 0.18) posture = 'Slight Turn';

            setMetrics({
              eyeContactScore: cameraPct,
              postureState: posture,
              positionQuality: Math.round(Math.max(0.2, 1.0 - distFromCenter * 1.5) * 100) / 100,
              centerX: Math.round(centerX * 100) / 100,
              centerY: Math.round(centerY * 100) / 100,
            });
          }
        }
      } catch (err) {
        // Drop frame silently to prevent inference blocking
      }

      // ── 2. REAL-TIME MOBILE PHONE OBJECT DETECTION ──
      // Runs at a controlled rate (~350ms) to ensure lightweight execution
      if (phoneDetectionEnabled && objectDetectorRef.current && now - lastObjectDetectionTimeRef.current >= 350) {
        lastObjectDetectionTimeRef.current = now;
        try {
          const detector = objectDetectorRef.current;
          const detectionResult = detector.detect(video);
          const rawDetections = detectionResult?.detections || [];

          // Find candidate phone detections
          let bestPhoneDet = null;
          let bestPhoneScore = 0;

          for (let i = 0; i < rawDetections.length; i++) {
            const det = rawDetections[i];
            const categories = det.categories || [];
            for (let c = 0; c < categories.length; c++) {
              const name = (categories[c].categoryName || '').toLowerCase();
              const score = categories[c].score || 0;
              if ((name.includes('cell phone') || name.includes('phone') || name.includes('mobile')) && score >= phoneConfidenceThreshold) {
                if (score > bestPhoneScore) {
                  bestPhoneScore = score;
                  bestPhoneDet = det;
                }
              }
            }
          }

          const nowMs = Date.now();
          if (bestPhoneDet) {
            phoneConsecutiveDetectionsRef.current += 1;
            phoneLastSeenTimeRef.current = nowMs;

            // Temporal confirmation: require at least 2 consecutive positive detections
            if (phoneConsecutiveDetectionsRef.current >= 2) {
              const bbox = bestPhoneDet.boundingBox;
              let normX = bbox.originX / vWidth;
              let normY = bbox.originY / vHeight;
              let normW = bbox.width / vWidth;
              let normH = bbox.height / vHeight;
              if (isMirrored) normX = 1.0 - (normX + normW);

              const formattedBox = {
                x: Math.max(0, Math.min(1, normX)),
                y: Math.max(0, Math.min(1, normY)),
                width: Math.max(0, Math.min(1, normW)),
                height: Math.max(0, Math.min(1, normH)),
              };

              if (!activePhoneEventRef.current) {
                const eventId = `phone_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                activePhoneEventRef.current = {
                  eventId,
                  startTime: nowMs,
                  maxConfidence: bestPhoneScore,
                };
                emitEvent('phone_detected', {
                  event_id: eventId,
                  confidence: bestPhoneScore,
                  metadata: { bounding_box: formattedBox },
                });
              } else {
                activePhoneEventRef.current.maxConfidence = Math.max(
                  activePhoneEventRef.current.maxConfidence,
                  bestPhoneScore
                );
              }

              const phoneDurationSec = (nowMs - activePhoneEventRef.current.startTime) / 1000;
              setPhoneDetection({
                isPhoneDetected: true,
                confidence: Math.round(bestPhoneScore * 100) / 100,
                durationSec: Math.round(phoneDurationSec * 10) / 10,
                boundingBox: formattedBox,
              });
            }
          } else {
            phoneConsecutiveDetectionsRef.current = 0;
            // Phone not visible: check if active phone event should close (> 1.5s absent)
            if (activePhoneEventRef.current && nowMs - phoneLastSeenTimeRef.current > 1500) {
              const finalDurationSec = (nowMs - activePhoneEventRef.current.startTime) / 1000;
              emitEvent('phone_detection_ended', {
                event_id: activePhoneEventRef.current.eventId,
                duration_seconds: finalDurationSec,
                confidence: activePhoneEventRef.current.maxConfidence,
                metadata: { total_duration_seconds: finalDurationSec },
              });
              activePhoneEventRef.current = null;
              setPhoneDetection({
                isPhoneDetected: false,
                confidence: 0,
                durationSec: 0,
                boundingBox: null,
              });
            }
          }
        } catch (objErr) {
          // Pass silently
        }
      }

      if (isRunningRef.current) {
        timerId = setTimeout(processFrame, intervalMs);
      }
    };

    timerId = setTimeout(processFrame, intervalMs);

    return () => {
      isRunningRef.current = false;
      if (timerId) clearTimeout(timerId);

      // Cleanly end any active phone detection event upon unmount
      if (activePhoneEventRef.current) {
        emitEvent('phone_detection_ended', {
          event_id: activePhoneEventRef.current.eventId,
          duration_seconds: (Date.now() - activePhoneEventRef.current.startTime) / 1000,
        });
        activePhoneEventRef.current = null;
      }
    };
  }, [
    isEnabled,
    isMirrored,
    intervalMs,
    phoneDetectionEnabled,
    phoneConfidenceThreshold,
    eyeClosureThresholdSec,
    offCameraThresholdSec,
    emitEvent,
    videoRef,
  ]);

  return {
    faceStatus,
    faceCount,
    boundingBoxes,
    metrics,
    eyeMetrics,
    gazeMetrics,
    phoneDetection,
    isOutOfFrame,
    isMultipleFaces,
    isDetectorReady,
    error,
  };
}
