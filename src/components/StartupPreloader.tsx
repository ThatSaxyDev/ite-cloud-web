import { useEffect, useState } from "react";

export function StartupPreloader({
  onComplete
}: {
  onComplete: () => void;
}) {
  const [status, setStatus] = useState("Initializing");
  const [text, setText] = useState("iTE");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const finalText = "iTE";

    async function wait(ms: number) {
      await new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    async function run() {
      for (let i = 0; i < 20; i += 1) {
        if (cancelled) {
          return;
        }

        let output = "";
        for (let j = 0; j < finalText.length; j += 1) {
          if (i / 20 > j / finalText.length) {
            output += finalText[j];
          } else {
            output += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        setText(output);
        await wait(50);
      }

      if (cancelled) {
        return;
      }

      setText(finalText);
      setStatus("Loading modules");
      await wait(800);
      if (cancelled) {
        return;
      }

      setStatus("Initializing");
      await wait(600);
      if (cancelled) {
        return;
      }

      setStatus("Ready");
      await wait(350);
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
        <div className="preloader-logo">
          <span className="bracket">[</span>
          <span className="text">{text}</span>
          <span className="bracket">]</span>
        </div>
        <div className="preloader-bar">
          <div className="preloader-progress" />
        </div>
        <div className="preloader-status">
          <span className="status-text">{status}</span>
          <span className="status-dots">...</span>
        </div>
      </div>
    </div>
  );
}
