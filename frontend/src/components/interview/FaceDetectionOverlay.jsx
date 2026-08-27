import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Users, ScanFace, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';

/**
 * FaceDetectionOverlay renders real-time HUD bounding boxes, proctoring warnings,
 * and candidate composure telemetry directly over the live interview video stream.
 */
export const FaceDetectionOverlay = ({
  boundingBoxes = [],
  faceStatus = 'initializing',
  faceCount = 0,
  metrics = {},
  isOutOfFrame = false,
  isMultipleFaces = false,
  isCameraOn = true,
}) => {
  if (!isCameraOn) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex flex-col justify-between p-3">
      {/* TOP STATUS BAR OVERLAY */}
      <div className="flex items-center justify-between gap-2">
        {/* Real-time Face Verification Badge */}
        <AnimatePresence mode="wait">
          {faceStatus === 'single_face' && (
            <motion.div
              key="single-face-badge"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-mono text-[11px] font-bold shadow-lg"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1 FACE VERIFIED</span>
            </motion.div>
          )}

          {isOutOfFrame && (
            <motion.div
              key="out-of-frame-badge"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/90 text-black font-mono text-[11px] font-extrabold shadow-lg animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>OUT OF FRAME</span>
            </motion.div>
          )}

          {isMultipleFaces && (
            <motion.div
              key="multi-face-badge"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/90 text-white font-mono text-[11px] font-extrabold shadow-lg animate-pulse"
            >
              <Users className="w-3.5 h-3.5" />
              <span>MULTIPLE FACES ({faceCount})</span>
            </motion.div>
          )}

          {faceStatus === 'initializing' && (
            <motion.div
              key="init-face-badge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 text-neutral-400 font-mono text-[11px]"
            >
              <ScanFace className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>CALIBRATING SENSOR...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Composure & Eye Contact Telemetry (Top Right) */}
        {faceStatus === 'single_face' && metrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 font-mono text-[10px]"
          >
            <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-md shadow-md">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Eye Contact: {metrics.eyeContactScore || 95}%</span>
            </div>
            <div className="bg-black/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md shadow-md hidden sm:block">
              {metrics.postureState || 'Composed'}
            </div>
          </motion.div>
        )}
      </div>

      {/* DYNAMIC FACE BOUNDING BOXES */}
      <div className="absolute inset-0 pointer-events-none">
        {boundingBoxes.map((box, idx) => {
          const isPrimary = idx === 0;
          const isMulti = boundingBoxes.length > 1;

          const borderColor = isMulti
            ? 'border-red-500'
            : isOutOfFrame
            ? 'border-amber-400'
            : 'border-cyan-400';

          const glowColor = isMulti
            ? 'rgba(239, 68, 68, 0.4)'
            : 'rgba(6, 182, 212, 0.35)';

          return (
            <motion.div
              key={`face-box-${idx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`,
              }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                boxShadow: `0 0 16px ${glowColor}`,
              }}
              className={`absolute border-2 ${borderColor} rounded-2xl transition-all pointer-events-none`}
            >
              {/* Corner HUD Bracket Accents */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white rounded-tl-sm" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white rounded-tr-sm" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white rounded-bl-sm" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white rounded-br-sm" />

              {/* Tag Label on Box */}
              <div className="absolute -top-5 left-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/85 text-white border border-white/20 flex items-center gap-1 shadow-md">
                {isMulti ? (
                  <span className="text-red-400">Subject #{idx + 1}</span>
                ) : (
                  <span className="text-cyan-400">Candidate Target</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* PROCTORING ALERT BANNERS (Centered Overlay) */}
      <div className="flex flex-col items-center justify-center gap-2 mb-12">
        <AnimatePresence>
          {isOutOfFrame && (
            <motion.div
              key="alert-no-face"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="bg-amber-950/90 border border-amber-500/60 rounded-xl px-4 py-2.5 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-amber-200 text-xs font-mono max-w-sm text-center"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <strong className="block text-amber-300 font-bold uppercase text-[11px]">
                  Candidate Out of Frame
                </strong>
                <span>Please position your face centered in the camera preview.</span>
              </div>
            </motion.div>
          )}

          {isMultipleFaces && (
            <motion.div
              key="alert-multi-face"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="bg-red-950/90 border border-red-500/70 rounded-xl px-4 py-2.5 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-red-200 text-xs font-mono max-w-sm text-center"
            >
              <Users className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              <div>
                <strong className="block text-red-300 font-bold uppercase text-[11px]">
                  Multiple Faces Detected ({faceCount})
                </strong>
                <span>Only one candidate should be visible during the interview session.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
