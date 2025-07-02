import { useEffect } from 'react';

export default function useScannerDetection({ onComplete, minLength = 3, timeout = 100 } = {}) {
  useEffect(() => {
    let buffer = '';
    let lastTime = Date.now();

    const handleKeyPress = (e) => {
      const now = Date.now();

      // Clear buffer if too slow
      if (now - lastTime > timeout) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        if (buffer.length >= minLength) {
          onComplete?.(buffer);
        }
        buffer = '';
      } else {
        buffer += e.key;
      }

      lastTime = now;
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [onComplete, minLength, timeout]);
}
