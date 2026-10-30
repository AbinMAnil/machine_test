import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

/**
 * Format seconds into days, hours, minutes, seconds object
 */
function formatRemaining(totalSeconds) {
  if (totalSeconds <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isZero: true };
  }
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, isZero: false };
}

function pad(num) {
  return String(num).padStart(2, '0');
}

export function CountdownWidget({ shop, productId, collectionIds, apiUrl }) {
  const [timerConfig, setTimerConfig] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'expired' | 'none'
  const timerIdRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadTimer() {
      try {
        const base = apiUrl || '';
        const params = new URLSearchParams({ shop });
        if (productId) params.set('productId', productId);
        if (collectionIds) params.set('collectionIds', collectionIds);

        const res = await fetch(`${base}/api/storefront/timer?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          setStatus('none');
          return;
        }

        const data = await res.json();
        if (isCancelled) return;

        if (!data || !data.timer) {
          setStatus('none');
          return;
        }

        const timer = data.timer;
        timerIdRef.current = timer.id;
        setTimerConfig(timer);

        // Deduplicate impression tracking per browser session
        try {
          const sessionKey = `cda_imp_${shop}_${timer.id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            fetch(`${base}/api/storefront/impression`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shop, timerId: timer.id }),
            }).catch(() => {});
            sessionStorage.setItem(sessionKey, '1');
          }
        } catch {
          // Gracefully continue if sessionStorage is blocked
        }

        // Calculate initial remaining seconds
        const nowMs = Date.now();
        let targetEndMs = null;

        if (timer.type === 'fixed') {
          if (timer.endAt) {
            targetEndMs = new Date(timer.endAt).getTime();
          }
        } else if (timer.type === 'evergreen') {
          const durationSec = timer.evergreenDurationSeconds || 3600;
          const storageKey = `cda_eg_${shop}_${timer.id}`;
          let storedExpiry = null;

          try {
            storedExpiry = localStorage.getItem(storageKey);
          } catch {
            // LocalStorage inaccessible
          }

          const parsedExpiry = storedExpiry ? Number(storedExpiry) : NaN;
          if (!Number.isNaN(parsedExpiry) && parsedExpiry > nowMs) {
            targetEndMs = parsedExpiry;
          } else {
            targetEndMs = nowMs + durationSec * 1000;
            try {
              localStorage.setItem(storageKey, String(targetEndMs));
            } catch {
              // LocalStorage write failed
            }
          }
        }

        if (!targetEndMs || targetEndMs <= nowMs) {
          setStatus('expired');
          setRemainingSeconds(0);
          return;
        }

        const initialDiff = Math.max(0, Math.floor((targetEndMs - nowMs) / 1000));
        setRemainingSeconds(initialDiff);
        setStatus('ready');

        // Tick local countdown every second without API polling
        const intervalId = setInterval(() => {
          const currentDiff = Math.max(0, Math.floor((targetEndMs - Date.now()) / 1000));
          setRemainingSeconds(currentDiff);
          if (currentDiff <= 0) {
            clearInterval(intervalId);
            setStatus('expired');
          }
        }, 1000);

        return () => clearInterval(intervalId);
      } catch (err) {
        if (!isCancelled) {
          setStatus('none');
        }
      }
    }

    const cleanupFn = loadTimer();
    return () => {
      isCancelled = true;
      if (typeof cleanupFn === 'function') cleanupFn();
    };
  }, [shop, productId, collectionIds, apiUrl]);

  if (status === 'none' || status === 'loading') {
    return null;
  }

  if (status === 'expired') {
    return null; // Gracefully hides expired timer on storefront
  }

  if (!timerConfig || remainingSeconds === null) {
    return null;
  }

  const { days, hours, minutes, seconds } = formatRemaining(remainingSeconds);
  const appearance = timerConfig.appearance || {};
  const isUrgent =
    appearance.urgencyThresholdSeconds &&
    remainingSeconds <= appearance.urgencyThresholdSeconds &&
    remainingSeconds > 0;

  const bgStyle = appearance.backgroundColor || '#111827';
  const textStyle = appearance.textColor || '#ffffff';
  const rawText = appearance.text || 'Sale ends in {time}!';

  const formattedTimeStr = `${days > 0 ? `${days}d ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const hasToken = rawText.includes('{time}') || rawText.includes('{countdown}');
  const displayText = hasToken
    ? rawText.replace('{time}', formattedTimeStr).replace('{countdown}', formattedTimeStr)
    : rawText;

  return (
    <div
      className={`cda-countdown-wrapper ${isUrgent ? 'cda-countdown-urgent' : ''}`}
      style={{
        backgroundColor: bgStyle,
        color: textStyle,
      }}
      role="timer"
      aria-live="polite"
      aria-label="Promotional countdown timer"
    >
      <div className="cda-countdown-header">
        {hasToken ? (
          <span className="cda-countdown-message">{displayText}</span>
        ) : (
          <span className="cda-countdown-message">{displayText}</span>
        )}
        {isUrgent && <span className="cda-urgency-badge">⚡ Ending Soon!</span>}
      </div>

      {!hasToken && (
        <div className="cda-countdown-digits" aria-hidden="true">
          {days > 0 && (
            <div className="cda-time-box">
              <span className="cda-time-num">{pad(days)}</span>
              <span className="cda-time-label">Days</span>
            </div>
          )}
          <div className="cda-time-box">
            <span className="cda-time-num">{pad(hours)}</span>
            <span className="cda-time-label">Hours</span>
          </div>
          <span className="cda-time-colon">:</span>
          <div className="cda-time-box">
            <span className="cda-time-num">{pad(minutes)}</span>
            <span className="cda-time-label">Mins</span>
          </div>
          <span className="cda-time-colon">:</span>
          <div className="cda-time-box">
            <span className="cda-time-num">{pad(seconds)}</span>
            <span className="cda-time-label">Secs</span>
          </div>
        </div>
      )}
    </div>
  );
}
