import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Users,
  ScanFace,
  Eye,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Layers,
  X,
} from 'lucide-react';

/**
 * FaceDetectionOverlay renders real-time HUD bounding boxes, proctoring warnings,
 * eye/gaze telemetry, and mobile phone alerts directly over the live interview video stream.
 */
export const FaceDetectionOverlay = ({
  boundingBoxes = [],
  faceStatus = 'initializing',
  faceCount = 0,
  metrics = {},
  eyeMetrics = {},
  gazeMetrics = {},
  phoneDetection = {},
  monitoringState = {},
  isOutOfFrame = false,
  isMultipleFaces = false,
  isCameraOn = true,
  onDismissWarning = null,
}) => {
  if (!isCameraOn) return null;

  const isPhoneVisible = phoneDetection?.isPhoneDetected;
  const phoneBox = phoneDetection?.boundingBox;
  const isLookingAway = gazeMetrics?.isLookingAway;
  const activeWarning = monitoringState?.activeWarning;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex flex-col justify-between p-3">
      {/* TOP STATUS BAR OVERLAY */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Real-time Status Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <AnimatePresence mode="wait">
            {faceStatus === 'single_face' && !isPhoneVisible && (
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

            {isPhoneVisible && (
              <motion.div
                key="phone-detected-badge"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/90 text-white font-mono text-[11px] font-extrabold shadow-lg animate-pulse border border-red-400/50"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>MOBILE PHONE DETECTED</span>
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
                <span>CALIBRATING SENSORS...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab departures indicator if monitoring active */}
          {monitoringState?.departureCount !== undefined && monitoringState.departureCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2 py-1 rounded-lg font-mono text-[10px]">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Departures: {monitoringState.departureCount}</span>
            </div>
          )}
        </div>

        {/* Live Composure & Eye Contact Telemetry (Top Right) */}
        {faceStatus === 'single_face' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 font-mono text-[10px] flex-wrap"
          >
            {/* Eye Contact score */}
            <div
              className={`flex items-center gap-1 bg-black/80 backdrop-blur-md border px-2 py-0.5 rounded-md shadow-md ${
                isLookingAway
                  ? 'border-amber-500/50 text-amber-300'
                  : 'border-cyan-500/30 text-cyan-400'
              }`}
            >
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>
                Eye Contact:{' '}
                {gazeMetrics?.cameraDirectedGazePercentage ?? metrics.eyeContactScore ?? 95}%
              </span>
            </div>

            {/* Gaze direction badge */}
            {gazeMetrics?.gazeDirection && (
              <div
                className={`px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border text-[9px] font-semibold hidden md:block ${
                  gazeMetrics.gazeDirection === 'camera_directed'
                    ? 'border-emerald-500/30 text-emerald-400'
                    : gazeMetrics.gazeDirection === 'screen_directed'
                    ? 'border-cyan-500/30 text-cyan-300'
                    : 'border-amber-500/40 text-amber-400'
                }`}
              >
                {gazeMetrics.gazeDirection === 'camera_directed'
                  ? 'Looking at Camera'
                  : gazeMetrics.gazeDirection === 'screen_directed'
                  ? 'Screen Directed'
                  : 'Off-Camera'}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* DYNAMIC HUD BOUNDING BOXES */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Face Bounding Boxes */}
        {boundingBoxes.map((box, idx) => {
          const isMulti = boundingBoxes.length > 1;
          const borderColor = isMulti
            ? 'border-red-500'
            : isOutOfFrame
            ? 'border-amber-400'
            : 'border-cyan-400';

          const glowColor = isMulti ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.35)';

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

        {/* Mobile Phone Bounding Box (Phase 16) */}
        {isPhoneVisible && phoneBox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              left: `${phoneBox.x * 100}%`,
              top: `${phoneBox.y * 100}%`,
              width: `${phoneBox.width * 100}%`,
              height: `${phoneBox.height * 100}%`,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
            }}
            className="absolute border-2 border-red-500 rounded-lg pointer-events-none animate-pulse"
          >
            <div className="absolute -top-5 left-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white flex items-center gap-1 shadow-md">
              <Smartphone className="w-2.5 h-2.5" />
              <span>Mobile Phone ({Math.round((phoneDetection.confidence || 0.8) * 100)}%)</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* PROCTORING ALERT BANNERS (Centered Overlay) */}
      <div className="flex flex-col items-center justify-center gap-2 mb-10 pointer-events-auto">
        <AnimatePresence>
          {/* Active Browser Monitoring Warning (Phase 17) */}
          {activeWarning && (
            <motion.div
              key="alert-monitoring-warning"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`rounded-xl px-4 py-3 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs font-mono max-w-md border ${
                activeWarning.type === 'auto_submit'
                  ? 'bg-red-950/95 border-red-500 text-red-200'
                  : 'bg-amber-950/95 border-amber-500 text-amber-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div className="flex-1">
                <strong className="block font-bold uppercase text-[11px] mb-0.5">
                  {activeWarning.type === 'auto_submit' ? 'Policy Limit Exceeded' : 'Proctoring Notice'}
                </strong>
                <span>{activeWarning.message}</span>
              </div>
              {onDismissWarning && activeWarning.type !== 'auto_submit' && (
                <button
                  type="button"
                  onClick={onDismissWarning}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )}

          {/* Mobile Phone Detection Alert Banner (Phase 16) */}
          {isPhoneVisible && (
            <motion.div
              key="alert-phone-detected"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="bg-red-950/90 border border-red-500/80 rounded-xl px-4 py-2.5 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-red-200 text-xs font-mono max-w-sm text-center"
            >
              <Smartphone className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              <div>
                <strong className="block text-red-300 font-bold uppercase text-[11px]">
                  Visible Mobile Phone Detected
                </strong>
                <span>Please keep all mobile devices out of camera view.</span>
              </div>
            </motion.div>
          )}

          {/* Out of frame alert */}
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

          {/* Multiple faces alert */}
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
                <span>Only one candidate should be visible during the session.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
