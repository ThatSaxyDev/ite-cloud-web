import { useEffect, useRef, useState } from "react";
import iteImage from "@/assets/ite-image.png";

const VERTEX_SHADER = `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform vec3 rotation;
uniform float aspect;
uniform float sceneScale;
varying vec2 texcoord;
varying vec3 surfaceNormal;
varying vec3 worldPosition;
mat3 turn(vec3 a) {
  float cx=cos(a.x), sx=sin(a.x), cy=cos(a.y), sy=sin(a.y), cz=cos(a.z), sz=sin(a.z);
  mat3 rx=mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);
  mat3 ry=mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy);
  mat3 rz=mat3(cz,sz,0.,-sz,cz,0.,0.,0.,1.);
  return rz*rx*ry;
}
void main() {
  mat3 transform=turn(rotation);
  vec3 p=transform*position;
  float perspective=3.8/(3.8-p.z);
  gl_Position=vec4(p.x*perspective*sceneScale/aspect,p.y*perspective*sceneScale,-p.z/5.,1.);
  texcoord=uv;
  surfaceNormal=transform*normal;
  worldPosition=p;
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D artwork;
uniform sampler2D silhouette;
varying vec2 texcoord;
varying vec3 surfaceNormal;
varying vec3 worldPosition;
void main() {
  vec4 original=texture2D(artwork,texcoord);
  bool face=texcoord.x>=0.;
  if(face && texture2D(silhouette,texcoord).r<.5) discard;
  vec3 n=normalize(surfaceNormal);
  vec3 light=normalize(vec3(-.5,.8,1.2));
  vec3 view=normalize(vec3(0.,0.,3.8)-worldPosition);
  float diffuse=max(0.,dot(n,light));
  float specular=pow(max(0.,dot(n,normalize(light+view))),42.);
  float rim=pow(1.-abs(dot(n,view)),3.);
  vec3 base=face ? max(original.rgb,vec3(.32)) : vec3(.46,.48,.52);
  vec3 color=base*(.62+diffuse*.5)+vec3(.85,.91,1.)*specular*.3+vec3(.18,.23,.3)*rim;
  gl_FragColor=vec4(color,1.);
}`;

function compile(gl: WebGLRenderingContext, kind: number, source: string) {
  const shader = gl.createShader(kind);
  if (!shader) throw new Error("Shader unavailable");
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader); throw new Error("Shader compilation failed");
  }
  return shader;
}

// Extrude the asset's silhouette, retaining its actual plates, rails and texture.
function buildGeometry(image: HTMLImageElement) {
  const sample = document.createElement("canvas");
  sample.width = 384; sample.height = Math.round(384 * image.naturalHeight / image.naturalWidth);
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image sampling unavailable");
  context.drawImage(image, 0, 0, sample.width, sample.height);
  const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
  const width = sample.width; const height = sample.height;
  const mask = new Uint8Array(width * height);
  for (let index = 0; index < mask.length; index++) {
    const offset = index * 4;
    mask[index] = pixels[offset + 3] > 24 && Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) > 65 ? 255 : 0;
  }
  // Texture scratches are surface detail, never holes through the metal.
  const seen = new Uint8Array(mask.length);
  for (let start = 0; start < mask.length; start++) {
    if (mask[start] || seen[start]) continue;
    const region = [start]; seen[start] = 1;
    let exterior = false;
    for (let cursor = 0; cursor < region.length; cursor++) {
      const index = region[cursor]; const x = index % width; const y = Math.floor(index / width);
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) exterior = true;
      for (const next of [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, y > 0 ? index - width : -1, y < height - 1 ? index + width : -1]) {
        if (next >= 0 && !mask[next] && !seen[next]) { seen[next] = 1; region.push(next); }
      }
    }
    if (!exterior && region.length < 75) region.forEach(index => { mask[index] = 255; });
  }
  const occupied = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return mask[y * width + x] > 0;
  };
  const halfWidth = 1.12; const halfHeight = halfWidth * height / width;
  const depth = .075;
  const vertices: number[] = [];
  const quad = (corners: number[][], normal: number[], textured = false) => {
    for (const index of [0, 1, 2, 0, 2, 3]) {
      const [x, y, z] = corners[index];
      vertices.push(x, y, z, ...normal,
        textured ? (x / halfWidth + 1) / 2 : -1,
        textured ? (1 - y / halfHeight) / 2 : -1);
    }
  };
  quad([[-halfWidth,halfHeight,depth],[-halfWidth,-halfHeight,depth],[halfWidth,-halfHeight,depth],[halfWidth,halfHeight,depth]], [0,0,1], true);
  quad([[halfWidth,halfHeight,-depth],[halfWidth,-halfHeight,-depth],[-halfWidth,-halfHeight,-depth],[-halfWidth,halfHeight,-depth]], [0,0,-1], true);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!occupied(x, y)) continue;
    const left = (x / width * 2 - 1) * halfWidth;
    const right = ((x + 1) / width * 2 - 1) * halfWidth;
    const top = (1 - y / height * 2) * halfHeight;
    const bottom = (1 - (y + 1) / height * 2) * halfHeight;
    if (!occupied(x - 1, y)) quad([[left,top,-depth],[left,bottom,-depth],[left,bottom,depth],[left,top,depth]], [-1,0,0]);
    if (!occupied(x + 1, y)) quad([[right,top,depth],[right,bottom,depth],[right,bottom,-depth],[right,top,-depth]], [1,0,0]);
    if (!occupied(x, y - 1)) quad([[left,top,-depth],[left,top,depth],[right,top,depth],[right,top,-depth]], [0,1,0]);
    if (!occupied(x, y + 1)) quad([[left,bottom,depth],[left,bottom,-depth],[right,bottom,-depth],[right,bottom,depth]], [0,-1,0]);
  }
  return { vertices: new Float32Array(vertices), mask, width, height, radius: Math.hypot(halfWidth, halfHeight, depth) };
}

export function MetalLogo3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef({ yaw: -.15, pitch: -.1, yawVelocity: 0, pitchVelocity: 0, dragging: false, pointerId: -1, x: 0, y: 0, stamp: 0, lastInput: 0 });
  const wakeRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;
    let disposed = false; let frame: number | null = null; let visible = false;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    let maskTexture: WebGLTexture | null = null;
    let shaders: WebGLShader[] = [];
    let count = 0; let idleTime = 0; let last: number | null = null;
    let modelRadius = 1.4;
    let renderedYaw = -.15; let renderedPitch = -.1;
    let autoBase: number | null = null; let autoStart = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const draw = (timestamp: number) => {
      frame = null;
      if (!program || disposed) return;
      const delta = last === null ? 0 : Math.min(.05, (timestamp - last) / 1000);
      last = timestamp;
      const motion = motionRef.current;
      if (!reduced.matches) {
        idleTime += delta;
        if (motion.dragging || timestamp - motion.lastInput < 1400) autoBase = null;
        if (!motion.dragging) {
          const friction = Math.exp(-delta * 1.55);
          motion.yawVelocity *= friction; motion.pitchVelocity *= friction;
          // A quicker full rotation with a front-facing reading pause each lap.
          if (timestamp - motion.lastInput > 1400 && (autoBase !== null || Math.abs(motion.yawVelocity) < .35)) {
            if (autoBase === null) {
              autoBase = Math.round((motion.yaw + .15) / (Math.PI * 2)) * Math.PI * 2 - .15;
              autoStart = idleTime;
            }
            const clock = idleTime - autoStart;
            const lap = Math.floor(clock / 14);
            const progress = Math.max(0, Math.min(1, (clock % 14 - 2) / 12));
            const eased = progress * progress * (3 - 2 * progress);
            const target = autoBase + (lap + eased) * Math.PI * 2;
            motion.yawVelocity += ((target - motion.yaw) * 9 - motion.yawVelocity * 3) * delta;
            motion.pitchVelocity += ((-.1 - motion.pitch) * 5 - motion.pitchVelocity * 2.2) * delta;
          }
          motion.yaw += motion.yawVelocity * delta;
          motion.pitch = Math.max(-.7, Math.min(.7, motion.pitch + motion.pitchVelocity * delta));
        }
        const follow = 1 - Math.exp(-delta * 15);
        renderedYaw += (motion.yaw - renderedYaw) * follow;
        renderedPitch += (motion.pitch - renderedPitch) * follow;
      } else { renderedYaw = motion.yaw; renderedPitch = motion.pitch; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform3f(gl.getUniformLocation(program, "rotation"), renderedPitch, renderedYaw, -.06);
      const aspect = canvas.width / canvas.height;
      gl.uniform1f(gl.getUniformLocation(program, "aspect"), aspect);
      // Fit the whole bounding sphere, including perspective, for every angle.
      // Keeping this constant avoids distracting zoom changes during a drag.
      const projectedRadius = modelRadius * 3.8 / Math.sqrt(3.8 ** 2 - modelRadius ** 2);
      gl.uniform1f(gl.getUniformLocation(program, "sceneScale"), .9 * Math.min(1, aspect) / projectedRadius);
      gl.drawArrays(gl.TRIANGLES, 0, count);
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(draw);
    };
    const wake = () => {
      if (disposed || !program) return;
      if (frame !== null) cancelAnimationFrame(frame);
      last = null; frame = requestAnimationFrame(draw);
    };
    wakeRef.current = wake;
    const resize = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      wake();
    });
    resize.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    }, { threshold: .05 });
    intersection.observe(canvas);
    reduced.addEventListener("change", wake);
    document.addEventListener("visibilitychange", wake);
    const lost = (event: Event) => { event.preventDefault(); setReady(false); };
    canvas.addEventListener("webglcontextlost", lost);
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      try {
        const geometry = buildGeometry(image);
        modelRadius = geometry.radius;
        shaders = [compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER), compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)];
        program = gl.createProgram();
        if (!program) throw new Error("WebGL unavailable");
        shaders.forEach(shader => gl.attachShader(program!, shader));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program link failed");
        gl.useProgram(program);
        buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
        for (const [name, size, offset] of [["position",3,0],["normal",3,3],["uv",2,6]] as const) {
          const location = gl.getAttribLocation(program, name);
          gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 32, offset * 4);
        }
        texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(gl.getUniformLocation(program, "artwork"), 0);
        maskTexture = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, maskTexture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, geometry.width, geometry.height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, geometry.mask);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.uniform1i(gl.getUniformLocation(program, "silhouette"), 1);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.BLEND);
        count = geometry.vertices.length / 8;
        setReady(true); wake();
      } catch { setReady(false); }
    };
    image.src = iteImage;
    return () => {
      disposed = true; image.onload = null; wakeRef.current = null;
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect(); intersection.disconnect();
      reduced.removeEventListener("change", wake); document.removeEventListener("visibilitychange", wake);
      canvas.removeEventListener("webglcontextlost", lost);
      shaders.forEach(shader => gl.deleteShader(shader));
      gl.deleteBuffer(buffer); gl.deleteTexture(texture); gl.deleteTexture(maskTexture); gl.deleteProgram(program);
    };
  }, []);

  function release(event: React.PointerEvent<HTMLDivElement>) {
    const motion = motionRef.current;
    if (!motion.dragging || event.pointerId !== motion.pointerId) return;
    motion.dragging = false; setDragging(false);
    if (performance.now() - motion.stamp > 100 || event.type === "pointercancel") { motion.yawVelocity = 0; motion.pitchVelocity = 0; }
    motion.lastInput = performance.now();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    wakeRef.current?.();
  }

  return <div className="metal-logo-3d" data-dragging={dragging} tabIndex={ready ? 0 : -1} role="group" aria-label="Interactive 3D iTE logo. Drag to rotate, or use the arrow keys. Press Home to reset."
    onPointerDown={event => {
      if (!ready || event.button !== 0) return;
      event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
      const motion = motionRef.current;
      Object.assign(motion, { dragging: true, pointerId: event.pointerId, x: event.clientX, y: event.clientY, stamp: performance.now(), lastInput: performance.now(), yawVelocity: 0, pitchVelocity: 0 });
      setDragging(true); wakeRef.current?.();
    }}
    onPointerMove={event => {
      const motion = motionRef.current;
      if (!motion.dragging || event.pointerId !== motion.pointerId) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const now = performance.now(); const dt = Math.max(.008, (now - motion.stamp) / 1000);
      const dx = (event.clientX - motion.x) / bounds.width * Math.PI * 2;
      const dy = (event.clientY - motion.y) / bounds.height * 1.8;
      motion.yaw += dx; motion.pitch = Math.max(-.7, Math.min(.7, motion.pitch + dy));
      motion.yawVelocity = Math.max(-6, Math.min(6, motion.yawVelocity * .4 + dx / dt * .6));
      motion.pitchVelocity = Math.max(-2, Math.min(2, motion.pitchVelocity * .5 + dy / dt * .5));
      Object.assign(motion, { x: event.clientX, y: event.clientY, stamp: now, lastInput: now });
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) wakeRef.current?.();
    }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={event => {
      if (motionRef.current.dragging) release(event);
    }}
    onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return;
      event.preventDefault();
      const motion = motionRef.current;
      if (event.key === "Home") { motion.yaw = -.15; motion.pitch = -.1; }
      if (event.key === "ArrowLeft") motion.yaw -= .25;
      if (event.key === "ArrowRight") motion.yaw += .25;
      if (event.key === "ArrowUp") motion.pitch = Math.max(-.7, motion.pitch - .15);
      if (event.key === "ArrowDown") motion.pitch = Math.min(.7, motion.pitch + .15);
      motion.yawVelocity = 0; motion.pitchVelocity = 0; motion.lastInput = performance.now();
      wakeRef.current?.();
    }}>
    <canvas aria-label="Solid metallic iTE plates and rails in three dimensions." ref={canvasRef} role="img" style={{ opacity: ready ? 1 : 0 }} />
    {!ready ? <img alt="iTE" src={iteImage} /> : null}
  </div>;
}
