import { useEffect, useRef } from "react";

type Point = { x: number; y: number; z: number; name: string; kind: "file" | "tool" | "result" };

const POINTS: Point[] = [
  { x: -1.55, y: -.76, z: .44, name: "Your task", kind: "file" },
  { x: -1.12, y: .22, z: -.76, name: "Searched the code", kind: "tool" },
  { x: -.8, y: 1.04, z: .12, name: "", kind: "file" },
  { x: -.42, y: -1.12, z: -.36, name: "Searched the web", kind: "tool" },
  { x: -.08, y: .62, z: .84, name: "Read the files", kind: "tool" },
  { x: .12, y: -.18, z: -.15, name: "", kind: "tool" },
  { x: .52, y: 1.22, z: -.42, name: "", kind: "file" },
  { x: .76, y: -.82, z: .64, name: "Edited files", kind: "tool" },
  { x: 1.16, y: .16, z: .32, name: "Ran the tests", kind: "tool" },
  { x: 1.52, y: -.66, z: -.52, name: "Reviewed the changes", kind: "result" },
  { x: 1.68, y: .82, z: -.06, name: "Your answer", kind: "result" },
  { x: -1.78, y: .78, z: -.2, name: "Loaded SKILL.md", kind: "tool" },
  ...Array.from({ length: 24 }, (_, index): Point => {
    const latitude = 1 - 2 * (index + .5) / 24;
    const radius = Math.sqrt(1 - latitude * latitude);
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    return {
      x: Math.cos(angle) * radius * 2.35,
      y: latitude * 1.9,
      z: Math.sin(angle) * radius * 1.55,
      name: "",
      kind: "file",
    };
  }),
];

const EDGES: [number, number][] = [[0, 1], [1, 2], [1, 4], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7], [6, 8], [7, 8], [8, 9], [8, 10], [11, 2], [11, 1], [9, 10], [0, 3], [3, 7]];
// Stitch the outer field into the same traversable network.
POINTS.slice(12).forEach((point, offset) => {
  const index = offset + 12;
  const nearest = POINTS.slice(0, index)
    .map((other, id) => ({ id, distance: Math.hypot(point.x - other.x, point.y - other.y, point.z - other.z) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2);
  nearest.forEach(other => EDGES.push([index, other.id]));
});
// Follow connected edges through the distributed field. Each stop retains its
// identity while the scene rotates; depth sorting only affects painting.
// Human labels for grep, read_file, apply_patch, run_tests, and git_diff.
// This is a visualization, not a recorded run.
const ACTIVE_PATH = [0, 1, 4, 5, 7, 8, 9, 10];
const DWELL_SECONDS = [1.4, 2.2, 2.5, .5, 2.6, 3.2, 2.1, 4];
const TRAVEL_SECONDS = 1.2;
const TURN_SECONDS = DWELL_SECONDS.reduce((sum, dwell) => sum + dwell, 0)
  + TRAVEL_SECONDS * (ACTIVE_PATH.length - 1);
const FADE_SECONDS = 1.2;
const smoothstep = (value: number) => value * value * (3 - 2 * value);
const NEIGHBORS = POINTS.map((_, index) => EDGES.flatMap(([a, b]) =>
  a === index ? [b] : b === index ? [a] : []));

function rotate(point: Point, yaw: number, pitch: number) {
  const cosYaw = Math.cos(yaw); const sinYaw = Math.sin(yaw);
  const x = point.x * cosYaw - point.z * sinYaw;
  const z = point.x * sinYaw + point.z * cosYaw;
  const cosPitch = Math.cos(pitch); const sinPitch = Math.sin(pitch);
  return { x, y: point.y * cosPitch - z * sinPitch, z: point.y * sinPitch + z * cosPitch };
}

export function AgentConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef(false);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceMotion.matches;
    let width = 1; let height = 1; let dpr = 1;
    let elapsed = 0; let previousTime: number | null = null;
    const pointer = { x: 0, y: 0 };
    let expansion = 0;
    const labelPositions = new Map<string, { x: number; y: number }>();
    // Independent walkers take real edges, with reproducible choices and no
    // immediate backtracking. Coordinates are always projected from node IDs.
    let seed = 173;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const walkers = [
      { from: 16, to: NEIGHBORS[16][0], age: 0, duration: 3.6, color: "237, 179, 111", trail: [] as { from: number; to: number; age: number }[] },
      { from: 30, to: NEIGHBORS[30][0], age: 1.7, duration: 4.3, color: "130, 207, 177", trail: [] as { from: number; to: number; age: number }[] },
    ];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height); dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      start();
    };
    const observer = new ResizeObserver(resize);
    const visibility = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      previousTime = null;
      if (entry.isIntersecting) start();
    }, { threshold: 0.05 });
    const media = () => { reduced = reduceMotion.matches; previousTime = null; start(); };
    reduceMotion.addEventListener("change", media);

    const draw = (timestamp: number) => {
      frameRef.current = null;
      const delta = previousTime === null ? 0 : Math.min((timestamp - previousTime) / 1000, .05);
      previousTime = timestamp;
      if (!reduced) elapsed += delta;
      if (!reduced) walkers.forEach(walker => {
        walker.age += delta;
        walker.trail.forEach(edge => { edge.age += delta; });
        walker.trail = walker.trail.filter(edge => edge.age < 5);
        if (walker.age >= walker.duration) {
          walker.trail.push({ from: walker.from, to: walker.to, age: 0 });
          const candidates = NEIGHBORS[walker.to].filter(index => index !== walker.from);
          const options = candidates.length ? candidates : NEIGHBORS[walker.to];
          walker.from = walker.to;
          walker.to = options[Math.floor(random() * options.length)];
          walker.age = 0;
          const from = POINTS[walker.from]; const to = POINTS[walker.to];
          walker.duration = 1.5 + Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) * 1.1 + random() * .5;
        }
      });
      const time = reduced ? 0 : elapsed;
      // Frame-rate independent damping handles both entry and release.
      const follow = 1 - Math.exp(-delta * 4.5);
      pointer.x += ((reduced ? 0 : pointerRef.current.x) - pointer.x) * follow;
      pointer.y += ((reduced ? 0 : pointerRef.current.y) - pointer.y) * follow;
      expansion += ((hoveredRef.current && !reduced ? 1 : 0) - expansion) * follow;
      context.clearRect(0, 0, width, height);
      const centerX = width * 0.51; const centerY = height * 0.49;
      const scale = Math.min(width, height) * 0.255;
      const yaw = -.32 + time * .075 + pointer.x * .55;
      const pitch = -0.12 + Math.sin(time * .09) * .04 + pointer.y * .32;
      const projected = POINTS.map((point) => {
        const rotated = rotate(point, yaw, pitch);
        const perspective = 1 / (6 - rotated.z);
        return { ...point, ...rotated, px: centerX + rotated.x * scale * perspective * 6.1, py: centerY + rotated.y * scale * perspective * 6.1, size: Math.max(1.5, (point.kind === "result" ? 4.6 : point.name ? 3.15 : 2) * perspective * 5.5) };
      });
      // Fit the larger field within the canvas without changing the core size.
      const reachX = Math.max(...projected.map(point => Math.abs(point.px - centerX)));
      const reachY = Math.max(...projected.map(point => Math.abs(point.py - centerY)));
      const fieldFit = Math.min((width * (.41 + expansion * .065) - 12) / reachX, (height * (.40 + expansion * .07) - 12) / reachY);
      projected.forEach(point => {
        point.px = centerX + (point.px - centerX) * fieldFit;
        point.py = centerY + (point.py - centerY) * fieldFit;
      });
      // Open up projected collisions without changing node identity or routes.
      for (let pass = 0; pass < 5; pass++) {
        projected.forEach((point, index) => {
          const dx = point.px - centerX; const dy = point.py - centerY;
          const radius = Math.hypot(dx, dy) || 1;
          const clearance = point.name ? Math.min(width, height) * .19 : 36;
          if (radius < clearance) {
            point.px += dx / radius * (clearance - radius) * .4;
            point.py += dy / radius * (clearance - radius) * .4;
          }
          projected.slice(index + 1).forEach(other => {
            const x = other.px - point.px; const y = other.py - point.py;
            const distance = Math.hypot(x, y) || 1;
            const spacing = point.name && other.name ? 64 : point.name || other.name ? 27 : 16;
            if (distance < spacing) {
              const push = (spacing - distance) * .25;
              point.px -= x / distance * push; point.py -= y / distance * push;
              other.px += x / distance * push; other.py += y / distance * push;
            }
          });
        });
      }

      const cycle = time % (TURN_SECONDS + FADE_SECONDS * 2);
      let remaining = Math.min(cycle, TURN_SECONDS);
      let step = 0;
      let progress = 0;
      let traveling = false;
      for (; step < ACTIVE_PATH.length - 1; step++) {
        if (remaining <= DWELL_SECONDS[step]) break;
        remaining -= DWELL_SECONDS[step];
        if (remaining < TRAVEL_SECONDS) {
          progress = smoothstep(remaining / TRAVEL_SECONDS);
          traveling = true;
          break;
        }
        remaining -= TRAVEL_SECONDS;
      }
      if (reduced) step = ACTIVE_PATH.length - 1;
      const turnOpacity = reduced ? 1 : cycle > TURN_SECONDS
        ? 1 - smoothstep(Math.min(1, (cycle - TURN_SECONDS) / FADE_SECONDS))
        : smoothstep(Math.min(1, cycle / FADE_SECONDS));
      const fromIndex = ACTIVE_PATH[step];
      const toIndex = ACTIVE_PATH[Math.min(step + 1, ACTIVE_PATH.length - 1)];
      const activeFrom = projected[fromIndex];
      const activeTo = projected[toIndex];
      const orbX = activeFrom.px + (activeTo.px - activeFrom.px) * progress;
      const orbY = activeFrom.py + (activeTo.py - activeFrom.py) * progress;

      const haze = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.52);
      haze.addColorStop(0, "rgba(67, 123, 255, .085)"); haze.addColorStop(.48, "rgba(67, 123, 255, .016)"); haze.addColorStop(1, "rgba(7, 8, 10, 0)");
      context.fillStyle = haze; context.fillRect(0, 0, width, height);

      context.save(); context.setLineDash([2, 8]); context.lineWidth = 1;
      EDGES.forEach(([from, to]) => {
        const a = projected[from]; const b = projected[to]; const depth = Math.max(0.12, (a.z + b.z + 2) / 4);
        context.strokeStyle = `rgba(203, 211, 226, ${0.09 + depth * 0.19})`;
        context.beginPath(); context.moveTo(a.px, a.py); context.lineTo(b.px, b.py); context.stroke();
      }); context.restore();

      // Completed connections remain visible: the turn leaves a readable route.
      context.strokeStyle = `rgba(96, 150, 255, ${.48 * turnOpacity})`;
      context.lineWidth = 1.25;
      context.beginPath();
      context.moveTo(projected[ACTIVE_PATH[0]].px, projected[ACTIVE_PATH[0]].py);
      for (let index = 1; index <= step; index++) {
        const point = projected[ACTIVE_PATH[index]];
        context.lineTo(point.px, point.py);
      }
      if (traveling) context.lineTo(orbX, orbY);
      context.stroke();

      // The physical core: a small rotating wireframe, like a terminal command made tangible.
      const core = { x: 0.13, y: 0.02, z: 0.08, name: "", kind: "tool" as const };
      const cube = [[-.3,-.3,-.3],[.3,-.3,-.3],[.3,.3,-.3],[-.3,.3,-.3],[-.3,-.3,.3],[.3,-.3,.3],[.3,.3,.3],[-.3,.3,.3]];
      const cubeEdges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      const cubePoints = cube.map(([x,y,z]) => {
        const point = rotate({ ...core, x: x + core.x, y: y + core.y, z: z + core.z }, yaw * 1.35, pitch * 1.35);
        const perspective = 1 / (3.6 - point.z);
        return { x: centerX + point.x * scale * perspective * 3.15, y: centerY + point.y * scale * perspective * 3.15 };
      });
      context.strokeStyle = "rgba(80, 136, 255, .8)"; context.lineWidth = 1.15; context.setLineDash([]);
      cubeEdges.forEach(([from, to]) => { context.beginPath(); context.moveTo(cubePoints[from].x, cubePoints[from].y); context.lineTo(cubePoints[to].x, cubePoints[to].y); context.stroke(); });

      // Transparent four-point sparkle: two outlines and sparse depth ribs.
      const cubeCenter = rotate(core, yaw * 1.35, pitch * 1.35);
      const starVertices = Array.from({ length: 32 }, (_, index) => {
        const angle = index / 32 * Math.PI * 2;
        return { x: .25 * Math.cos(angle) ** 3, y: .25 * Math.sin(angle) ** 3, z: .035 };
      });
      starVertices.push(...starVertices.map(vertex => ({ ...vertex, z: -.035 })));
      const star = starVertices.map(vertex => {
        const turned = rotate({ ...core, ...vertex }, .35 - time * .36 + pointer.x * .2, .16 + pointer.y * .15);
        const world = { x: turned.x + cubeCenter.x, y: turned.y + cubeCenter.y, z: turned.z + cubeCenter.z };
        const perspective = 3.15 / (3.6 - world.z);
        return { ...world, px: centerX + world.x * scale * perspective, py: centerY + world.y * scale * perspective };
      });
      context.save();
      const pulse = .7 + Math.sin(time * 1.3) * .12;
      for (let index = 0; index < 64; index++) {
        const layer = index < 32 ? 0 : 32;
        const a = star[index]; const b = star[layer + (index + 1) % 32];
        const hue = (time * 14 + index % 32 * 7 + 175) % 360;
        const color = `hsla(${hue}, 78%, 73%, ${pulse * (layer ? .55 : 1)})`;
        context.strokeStyle = color; context.shadowColor = color;
        context.shadowBlur = reduced ? 3 : 4 + pulse * 3;
        context.lineWidth = layer ? .8 : 1.2;
        context.beginPath(); context.moveTo(a.px, a.py); context.lineTo(b.px, b.py); context.stroke();
        if (index < 32 && index % 8 === 0) {
          context.shadowBlur = 0; context.lineWidth = .7;
          context.beginPath(); context.moveTo(a.px, a.py); context.lineTo(star[index + 32].px, star[index + 32].py); context.stroke();
        }
      }
      context.restore();

      // Sort a copy for depth painting; route indices must retain their identity.
      [...projected].sort((a, b) => a.z - b.z).forEach((point) => {
        const accent = point.kind === "result";
        const active = point === activeFrom;
        const visited = ACTIVE_PATH.slice(0, step + 1).some(index => projected[index] === point);
        context.beginPath(); context.arc(point.px, point.py, point.size, 0, Math.PI * 2);
        context.fillStyle = visited ? `rgba(120, 170, 255, ${.5 + .5 * turnOpacity})` : "rgba(151, 167, 195, .55)";
        context.fill();
      });

      // Lay out text independently, with leaders retaining its node association.
      context.font = `500 ${width < 420 ? 12 : 13}px "DM Mono", monospace`;
      const labels = projected.filter(point => point.name).map(point => {
        const labelWidth = context.measureText(point.name).width;
        const side = point.px < centerX ? -1 : 1;
        const targetX = Math.max(8, Math.min(width - labelWidth - 8, point.px + (side < 0 ? -labelWidth - 12 : 12)));
        const targetY = Math.max(20, Math.min(height - 14, point.py - 12));
        const previous = labelPositions.get(point.name);
        return { point, width: labelWidth, x: previous ? previous.x + (targetX - previous.x) * follow : targetX, y: previous ? previous.y + (targetY - previous.y) * follow : targetY };
      });
      for (let pass = 0; pass < 14; pass++) {
        labels.forEach((a, index) => labels.slice(index + 1).forEach(b => {
          if (a.x < b.x + b.width + 12 && a.x + a.width + 12 > b.x && Math.abs(a.y - b.y) < 25) {
            const direction = a.y <= b.y ? -1 : 1;
            const push = (25 - Math.abs(a.y - b.y)) * .5;
            a.y = Math.max(20, Math.min(height - 14, a.y + direction * push));
            b.y = Math.max(20, Math.min(height - 14, b.y - direction * push));
          }
        }));
      }
      labels.forEach(label => {
        const { point, x, y } = label;
        labelPositions.set(point.name, { x, y });
        const anchorX = Math.max(x, Math.min(x + label.width, point.px));
        context.strokeStyle = "rgba(151, 165, 190, .25)"; context.lineWidth = .7;
        context.beginPath(); context.moveTo(point.px, point.py); context.lineTo(anchorX, y + 3); context.stroke();
        context.lineWidth = 4; context.strokeStyle = "rgba(6, 7, 10, .9)";
        context.strokeText(point.name, x, y);
        context.fillStyle = point === activeFrom ? "rgba(226, 236, 255, .98)" : "rgba(177, 193, 215, .85)";
        context.fillText(point.name, x, y);
      });

      if (!reduced) {
        // Companion signals have independent routes and short-lived trails.
        walkers.forEach(walker => {
          const a = projected[walker.from]; const b = projected[walker.to];
          const amount = smoothstep(Math.min(1, walker.age / walker.duration));
          const x = a.px + (b.px - a.px) * amount;
          const y = a.py + (b.py - a.py) * amount;
          context.save();
          context.lineWidth = 1;
          walker.trail.forEach(edge => {
            context.strokeStyle = `rgba(${walker.color}, ${.25 * (1 - edge.age / 5)})`;
            context.beginPath();
            context.moveTo(projected[edge.from].px, projected[edge.from].py);
            context.lineTo(projected[edge.to].px, projected[edge.to].py);
            context.stroke();
          });
          const tail = Math.max(0, amount - .22);
          const tailX = a.px + (b.px - a.px) * tail;
          const tailY = a.py + (b.py - a.py) * tail;
          if (amount > .001) {
            const trail = context.createLinearGradient(tailX, tailY, x, y);
            trail.addColorStop(0, `rgba(${walker.color}, 0)`);
            trail.addColorStop(1, `rgba(${walker.color}, .7)`);
            context.strokeStyle = trail;
            context.beginPath(); context.moveTo(tailX, tailY); context.lineTo(x, y); context.stroke();
          }
          const halo = context.createRadialGradient(x, y, 0, x, y, 19);
          halo.addColorStop(0, `rgba(${walker.color}, .7)`);
          halo.addColorStop(.25, `rgba(${walker.color}, .2)`);
          halo.addColorStop(1, `rgba(${walker.color}, 0)`);
          context.fillStyle = halo;
          context.beginPath(); context.arc(x, y, 19, 0, Math.PI * 2); context.fill();
          context.fillStyle = `rgb(${walker.color})`;
          context.beginPath(); context.arc(x, y, 2.8, 0, Math.PI * 2); context.fill();
          context.restore();
        });
        const x = orbX; const y = orbY;
        context.save();
        context.globalAlpha = turnOpacity;
        const glow = context.createRadialGradient(x, y, 0, x, y, 24);
        glow.addColorStop(0, "rgba(120, 163, 255, .9)"); glow.addColorStop(.16, "rgba(84, 137, 255, .6)"); glow.addColorStop(1, "rgba(84, 137, 255, 0)");
        context.fillStyle = glow; context.beginPath(); context.arc(x, y, 24, 0, Math.PI * 2); context.fill();
        context.beginPath(); context.arc(x, y, 3.4, 0, Math.PI * 2); context.fillStyle = "rgba(222, 231, 255, 1)"; context.fill();
        if (!traveling) {
          const arrival = Math.min(1, remaining / .9);
          context.strokeStyle = `rgba(133, 180, 255, ${(1 - arrival) * .7})`;
          context.lineWidth = 1;
          context.beginPath(); context.arc(x, y, 7 + arrival * 13, 0, Math.PI * 2); context.stroke();
        }
        context.restore();
      }

      if (!reduced && visibleRef.current) frameRef.current = requestAnimationFrame(draw);
    };
    function start() { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = requestAnimationFrame(draw); }
    observer.observe(canvas);
    resize();
    visibility.observe(canvas);
    start();
    return () => { observer.disconnect(); visibility.disconnect(); reduceMotion.removeEventListener("change", media); if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    hoveredRef.current = event.pointerType !== "touch";
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerRef.current = { x: (event.clientX - bounds.left) / bounds.width - .5, y: (event.clientY - bounds.top) / bounds.height - .5 };
  }
  function resetPointer() { hoveredRef.current = false; pointerRef.current = { x: 0, y: 0 }; }

  return <div className="agent-constellation">
    <canvas aria-label="A moving three-dimensional map of iTE tracing a coding task through files, tool calls, a test result, and an answer." onPointerLeave={resetPointer} onPointerMove={move} ref={canvasRef} role="img" />
  </div>;
}
