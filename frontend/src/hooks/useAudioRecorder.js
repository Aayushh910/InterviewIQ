import { useState, useRef, useCallback } from 'react';

const getSupportedMimeType = () => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return 'audio/webm';
};

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = useCallback(async (stream) => {
    let targetStream = stream;
    if (!targetStream || targetStream.getAudioTracks().length === 0) {
      try {
        targetStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.warn('Cannot start audio recording: MediaStream audio track missing and getUserMedia failed:', err);
        return;
      }
    }


    try {
      // Create audio-only MediaStream from audio tracks if stream has both video & audio
      const audioTracks = stream.getAudioTracks();
      const audioStream = audioTracks.length > 0 ? new MediaStream(audioTracks) : stream;

      audioChunksRef.current = [];
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(audioStream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed starting MediaRecorder:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        const mimeType = getSupportedMimeType();
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        resolve(blob);
        return;
      }

      recorder.onstop = () => {
        setIsRecording(false);
        const mimeType = getSupportedMimeType();
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
        setIsRecording(false);
        resolve(new Blob([], { type: 'audio/webm' }));
      }
    });
  }, []);

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) { }
    }
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    reset,
  };
};

export default useAudioRecorder;
