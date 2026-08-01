import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Eye, Mic, MicOff, Video, VideoOff, AlertCircle } from 'lucide-react';
import { Badge } from '../common/Badge';

export const CameraFeed = ({ isMicOn, isCameraOn, onToggleMic, onToggleCamera }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let currentStream = null;

    async function enableCamera() {
      if (!isCameraOn) {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        return;
      }

      try {
        setError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: isMicOn,
        });
        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn('Camera access error:', err);
        setError('Camera permission denied or camera not available.');
      }
    }

    enableCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn, stream]);

  return (
    <div className="relative w-full h-full bg-surfaceDark/80 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center group">
      {isCameraOn ? (
        error ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-gray-400">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <span className="text-xs max-w-xs">{error}</span>
            <span className="text-[11px] text-tealAccent">Please allow camera access in your browser address bar.</span>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        )
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <VideoOff className="w-10 h-10" />
          <span className="text-xs">Camera Turned Off</span>
        </div>
      )}

      {/* Facial Detection Bounding Box Simulation */}
      {isCameraOn && !error && (
        <motion.div
          animate={{
            scale: [1, 1.01, 1],
            borderColor: ['rgba(20, 184, 166, 0.6)', 'rgba(6, 182, 212, 0.9)', 'rgba(20, 184, 166, 0.6)']
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute top-1/5 left-1/4 w-1/2 h-3/5 border-2 border-tealAccent rounded-2xl pointer-events-none p-2 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center text-[10px] font-mono text-tealAccent bg-bgDark/80 px-2 py-0.5 rounded">
            <span>Eye Contact: 96%</span>
            <span>Head Pose: 0°</span>
          </div>
          <div className="text-[10px] font-mono text-emeraldAccent bg-bgDark/80 px-2 py-0.5 rounded self-start">
            State: Composed
          </div>
        </motion.div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-bgDark/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 z-10">
        <Badge variant={stream ? "emerald" : "amber"} size="sm" className="font-mono">
          <span className="w-2 h-2 rounded-full bg-emeraldAccent animate-ping mr-1" />
          {stream ? "WEBCAM ACTIVE" : "STREAM OFFLINE"}
        </Badge>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMic}
            className={`p-2 rounded-lg transition-colors ${
              isMicOn ? 'bg-tealAccent/20 text-tealAccent hover:bg-tealAccent/30' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleCamera}
            className={`p-2 rounded-lg transition-colors ${
              isCameraOn ? 'bg-tealAccent/20 text-tealAccent hover:bg-tealAccent/30' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

