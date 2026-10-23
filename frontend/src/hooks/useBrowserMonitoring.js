import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook for real-time browser tab visibility, window focus,
 * fullscreen tracking, grace periods, and configurable proctoring policy enforcement.
 */
export function useBrowserMonitoring(options = {}) {
  const {
    isActive = false,
    policy = {},
    onProctoringEvent = null,
    onPolicyViolation = null,
  } = options;

  const {
    tabMonitoringEnabled = true,
    fullscreenEnforcementEnabled = false,
    policyMode = 'warning_only',
    maxTabDepartures = 2,
    gracePeriodSeconds = 10.0,
    autoSubmissionEnabled = false,
  } = policy;

  // ─── Monitoring Telemetry State ───────────────────────────────────────────
  const [departureCount, setDepartureCount] = useState(0);
  const [isInGracePeriod, setIsInGracePeriod] = useState(false);
  const [gracePeriodRemainingSec, setGracePeriodRemainingSec] = useState(gracePeriodSeconds);
  const [activeWarning, setActiveWarning] = useState(null); // { type, message, departureCount, maxAllowed }
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [isFullscreenExited, setIsFullscreenExited] = useState(false);

  // ─── Internal Refs for Lifecycle & Safe Event Handlers ────────────────────
  const departureCountRef = useRef(0);
  const tabHiddenStartTimeRef = useRef(null);
  const graceTimerIntervalRef = useRef(null);
  const graceTimerTimeoutRef = useRef(null);
  const lastVisibilityEventTimeRef = useRef(0);
  const isTerminalRef = useRef(false);

  // Callback refs to avoid effect recreation
  const onProctoringEventRef = useRef(onProctoringEvent);
  useEffect(() => {
    onProctoringEventRef.current = onProctoringEvent;
  }, [onProctoringEvent]);

  const onPolicyViolationRef = useRef(onPolicyViolation);
  useEffect(() => {
    onPolicyViolationRef.current = onPolicyViolation;
  }, [onPolicyViolation]);

  // Safe proctoring event dispatcher
  const emitEvent = useCallback((eventType, details = {}) => {
    if (typeof onProctoringEventRef.current === 'function') {
      try {
        onProctoringEventRef.current({
          event_type: eventType,
          timestamp: new Date().toISOString(),
          ...details,
        });
      } catch (err) {
        console.warn('[InterviewIQ] Monitoring event emission error:', err);
      }
    }
  }, []);

  // Dismiss warning banner
  const dismissWarning = useCallback(() => {
    setActiveWarning(null);
  }, []);

  // ─── Main Browser Event Monitoring Effect ─────────────────────────────────
  useEffect(() => {
    if (!isActive || !tabMonitoringEnabled || isTerminalRef.current) {
      setIsInGracePeriod(false);
      if (graceTimerIntervalRef.current) clearInterval(graceTimerIntervalRef.current);
      if (graceTimerTimeoutRef.current) clearTimeout(graceTimerTimeoutRef.current);
      return;
    }

    // ── 1. Visibility Change Handler (Tab Departure / Return) ──
    const handleVisibilityChange = () => {
      if (!isActive || isTerminalRef.current) return;

      const now = Date.now();
      lastVisibilityEventTimeRef.current = now;

      if (document.visibilityState === 'hidden') {
        // Tab hidden -> Candidate switched away from interview
        setIsTabHidden(true);
        tabHiddenStartTimeRef.current = now;

        departureCountRef.current += 1;
        const newCount = departureCountRef.current;
        setDepartureCount(newCount);

        emitEvent('tab_hidden', {
          metadata: { departure_count: newCount, max_allowed: maxTabDepartures },
        });

        // Auto-submit after reaching maxTabDepartures (default: 2)
        if (newCount >= maxTabDepartures) {
          isTerminalRef.current = true;
          setActiveWarning({
            type: 'auto_submit',
            message: `Maximum allowed tab departures (${newCount}/${maxTabDepartures}) exceeded. Auto-submitting interview for proctoring violation...`,
            departureCount: newCount,
            maxAllowed: maxTabDepartures,
          });

          if (typeof onPolicyViolationRef.current === 'function') {
            onPolicyViolationRef.current({
              reason: 'proctoring_tab_departures',
              departureCount: newCount,
              maxAllowed: maxTabDepartures,
              explanation: `Auto-submitted due to proctoring policy violation: Exceeded maximum allowed tab departures (${newCount}/${maxTabDepartures} tab switches detected).`,
            });
          }
          return;
        }

        // First switch warning (e.g. 1 of 2)
        setActiveWarning({
          type: 'tab_warning',
          message: `Warning: Tab switch ${newCount} of ${maxTabDepartures} recorded! One more tab departure will automatically terminate and submit your interview.`,
          departureCount: newCount,
          maxAllowed: maxTabDepartures,
        });

      } else if (document.visibilityState === 'visible') {
        // Candidate returned to tab
        setIsTabHidden(false);
        const awayDurationSec = tabHiddenStartTimeRef.current
          ? (now - tabHiddenStartTimeRef.current) / 1000
          : 0;

        emitEvent('tab_visible', {
          duration_seconds: Math.round(awayDurationSec * 10) / 10,
          metadata: {
            away_duration_seconds: awayDurationSec,
            departure_count: departureCountRef.current,
          },
        });

        // Remind candidate of recorded tab switches
        if (!isTerminalRef.current && departureCountRef.current > 0) {
          setActiveWarning({
            type: 'tab_warning',
            message: `Warning: Tab switch ${departureCountRef.current} of ${maxTabDepartures} recorded! Leaving this screen one more time will automatically terminate and submit your interview.`,
            departureCount: departureCountRef.current,
            maxAllowed: maxTabDepartures,
          });
        }
      }
    };

    // ── 2. Window Blur / Focus Handlers ──
    const handleWindowBlur = () => {
      if (!isActive || isTerminalRef.current) return;
      // Do not duplicate if visibility change already marked document as hidden
      if (document.visibilityState === 'hidden') return;

      setIsWindowBlurred(true);
      emitEvent('window_blur', {
        metadata: { note: 'window_lost_focus_while_visible' },
      });
    };

    const handleWindowFocus = () => {
      if (!isActive || isTerminalRef.current) return;
      setIsWindowBlurred(false);
      emitEvent('window_focus', {
        metadata: { note: 'window_regained_focus' },
      });
    };

    // ── 3. Fullscreen Change Handler ──
    const handleFullscreenChange = () => {
      if (!isActive || isTerminalRef.current) return;

      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs) {
        setIsFullscreenExited(true);
        emitEvent('fullscreen_exited', {
          metadata: { enforcement_enabled: fullscreenEnforcementEnabled },
        });

        if (fullscreenEnforcementEnabled) {
          setActiveWarning({
            type: 'fullscreen_warning',
            message: 'Fullscreen mode was exited. Please re-enter fullscreen mode to continue.',
            departureCount: departureCountRef.current,
            maxAllowed: maxTabDepartures,
          });
        }
      } else {
        setIsFullscreenExited(false);
        emitEvent('fullscreen_restored');
      }
    };

    // Register event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);

      if (graceTimerIntervalRef.current) clearInterval(graceTimerIntervalRef.current);
      if (graceTimerTimeoutRef.current) clearTimeout(graceTimerTimeoutRef.current);
    };
  }, [
    isActive,
    tabMonitoringEnabled,
    fullscreenEnforcementEnabled,
    policyMode,
    maxTabDepartures,
    gracePeriodSeconds,
    autoSubmissionEnabled,
    emitEvent,
  ]);

  return {
    departureCount,
    isInGracePeriod,
    gracePeriodRemainingSec,
    activeWarning,
    isTabHidden,
    isWindowBlurred,
    isFullscreenExited,
    dismissWarning,
  };
}
