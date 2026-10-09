import { useCallback, useEffect, useRef, useState } from "react";
import { MetalLogo3D } from "@/components/MetalLogo3D";

export function StartupPreloader({
  onComplete
}: {
  onComplete: () => void;
}) {
  const [logoReady, setLogoReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const readyRef = useRef(false);

  const handleReady = useCallback(() => {
    readyRef.current = true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function wait(ms: number) {
      await new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    async function run() {
      // Let "Initializing" hold on its own before anything else.
      await wait(550);
      if (cancelled) {
        return;
      }

      // Wait for the 3D renderer to actually be available (bounded so a
      // WebGL-less browser still gets through), then crossfade it in.
      const startedAt = performance.now();
      while (!readyRef.current && performance.now() - startedAt < 2500) {
        await wait(50);
        if (cancelled) {
          return;
        }
      }

      setLogoReady(true);
      // Let the logo spin on its own before leaving.
      await wait(2200);
      if (cancelled) {
        return;
      }

      setHidden(true);
      await wait(600);
      if (!cancelled) {
        onComplete();
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  return (
    <div className={`preloader ${hidden ? "hidden" : ""}`}>
      <div className="preloader-content">
        <div className="preloader-stage">
          <div className={`preloader-logo ${logoReady ? "is-ready" : ""}`} aria-hidden={!logoReady}>
            <MetalLogo3D spinSeconds={3.2} interactive={false} immediate continuous onReady={handleReady} />
          </div>
          <div className={`preloader-status ${logoReady ? "is-hidden" : ""}`}>
            <span className="status-text">Initializing</span>
            <span className="status-dots">...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
