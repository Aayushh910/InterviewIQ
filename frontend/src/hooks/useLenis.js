import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export const useLenis = (options = {}) => {
  const lenisRef = useRef(null);
  const wrapperOption = options.wrapper;

  useEffect(() => {
    let targetWrapper = null;

    if (wrapperOption) {
      if (wrapperOption.current && wrapperOption.current instanceof Element) {
        targetWrapper = wrapperOption.current;
      } else if (wrapperOption instanceof Element) {
        targetWrapper = wrapperOption;
      } else {
        // Wrapper was passed but element is not mounted yet; wait for DOM mount
        return;
      }
    }

    // Strip custom ref wrapper/content options before passing to Lenis constructor
    const cleanOptions = { ...options };
    delete cleanOptions.wrapper;
    delete cleanOptions.content;

    const lenisOptions = {
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      ...cleanOptions,
    };

    if (targetWrapper) {
      lenisOptions.wrapper = targetWrapper;
      if (targetWrapper.firstElementChild instanceof Element) {
        lenisOptions.content = targetWrapper.firstElementChild;
      }
    }

    const lenis = new Lenis(lenisOptions);
    lenisRef.current = lenis;

    let animId;
    function raf(time) {
      lenis.raf(time);
      animId = requestAnimationFrame(raf);
    }

    animId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [wrapperOption?.current, wrapperOption]);

  return lenisRef;
};


