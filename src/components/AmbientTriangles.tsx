import type { CSSProperties } from "react";

const TRI_COUNT = 72;

type TriangleSpec = {
  delay: string;
  duration: string;
  opacity: number;
  rotate: string;
  size: string;
  tx: string;
  ty: string;
};

const triangles: TriangleSpec[] = Array.from({ length: TRI_COUNT }, (_, index) => {
  const step = index + 1;
  const size = 10 + ((step * 17) % 34);
  const rotate = (step * 29) % 360;
  const tx = -360 + ((step * 73) % 720);
  const ty = -280 + ((step * 47) % 560);
  const delay = (step * -0.14).toFixed(2);
  const duration = (7.6 + (step % 9) * 0.18).toFixed(2);
  const opacity = 0.08 + (step % 5) * 0.035;

  return {
    delay: `${delay}s`,
    duration: `${duration}s`,
    opacity,
    rotate: `${rotate}deg`,
    size: `${size}px`,
    tx: `${tx}px`,
    ty: `${ty}px`
  };
});

export function AmbientTriangles({
  className = ""
}: {
  className?: string;
}) {
  return (
    <div className={`triangle-field ${className}`.trim()} aria-hidden="true">
      <div className="triangle-vortex">
        <div className="triangle-core-glow" />
        <div className="triangle-core-ring" />
        {triangles.map((triangle, index) => (
          <span
            key={index}
            className="triangle-shard"
            style={
              {
                "--tri-delay": triangle.delay,
                "--tri-duration": triangle.duration,
                "--tri-opacity": triangle.opacity,
                "--tri-rotate": triangle.rotate,
                "--tri-size": triangle.size,
                "--tri-tx": triangle.tx,
                "--tri-ty": triangle.ty
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
