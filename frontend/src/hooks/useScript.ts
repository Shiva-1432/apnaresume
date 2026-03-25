'use client';

import { useEffect } from 'react';

export function useScript(src: string) {
  useEffect(() => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [src]);
}
