import { useEffect, useRef } from "react";

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stars = Array.from({ length: 180 }, () => {
      const depth = Math.random() ** 2;
      return {
        x: Math.random(), y: Math.random(), depth,
        radius: .35 + depth * 1.25,
        brightness: .18 + depth * .45,
        next: Math.random() * 16000,
        start: -10000,
        duration: 1000,
      };
    });
    let width = 1; let height = 1;
    let frame: number | null = null;
    let previous = -Infinity;
    let elapsed = 0; let last: number | null = null;
    let scroll = window.scrollY;
    const draw = (timestamp: number) => {
      frame = null;
      if (timestamp - previous >= 1000 / 30 || reduced.matches) {
        const delta = last === null ? 0 : Math.min(timestamp - last, 100);
        last = timestamp; previous = timestamp;
        if (!reduced.matches) elapsed += delta;
        scroll += (window.scrollY - scroll) * .08;
        context.clearRect(0, 0, width, height);
        for (const star of stars) {
          if (!reduced.matches && elapsed >= star.next) {
            star.start = elapsed;
            star.duration = 900 + Math.random() * 1800;
            // Resample each interval, so each sparkle has independent timing.
            star.next = elapsed + star.duration + 4000 + Math.random() * 22000;
          }
          const phase = (elapsed - star.start) / star.duration;
          const sparkle = !reduced.matches && phase >= 0 && phase <= 1
            ? Math.sin(phase * Math.PI) ** 4 : 0;
          const x = ((star.x * width + elapsed * .00045 * star.depth) % width + width) % width;
          const y = ((star.y * height - scroll * (.015 + star.depth * .065)) % height + height) % height;
          const radius = star.radius + sparkle * star.depth * .65;
          const alpha = Math.min(1, star.brightness + sparkle * .65);
          if (star.depth > .5) {
            const haloRadius = 5 + sparkle * 8;
            const halo = context.createRadialGradient(x, y, 0, x, y, haloRadius);
            halo.addColorStop(0, `rgba(215, 227, 246, ${alpha * .2})`);
            halo.addColorStop(1, "rgba(215, 227, 246, 0)");
            context.fillStyle = halo;
            context.fillRect(x - haloRadius, y - haloRadius, haloRadius * 2, haloRadius * 2);
            if (sparkle > .2) {
              const reach = 2 + sparkle * 5;
              context.strokeStyle = `rgba(232, 239, 252, ${sparkle * .4})`;
              context.lineWidth = .6;
              context.beginPath();
              context.moveTo(x - reach, y); context.lineTo(x + reach, y);
              context.moveTo(x, y - reach); context.lineTo(x, y + reach);
              context.stroke();
            }
          }
          context.fillStyle = `rgba(220, 230, 246, ${alpha})`;
          context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
        }
      }
      if (!reduced.matches && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const wake = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      last = null; previous = -Infinity;
      frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      wake();
    });
    resize.observe(canvas);
    reduced.addEventListener("change", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect();
      reduced.removeEventListener("change", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);

  return <canvas className="record-starfield" aria-hidden="true" ref={canvasRef} />;
}
