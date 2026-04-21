import { useEffect } from "react";

function lerp(start: number, end: number, factor: number) {
  return start + (end - start) * factor;
}

function scrambleText(element: HTMLElement, duration = 400) {
  if (element.dataset.scrambling === "true") {
    return;
  }

  const original = element.dataset.scrambleValue || element.textContent || "";
  element.dataset.scrambling = "true";

  const chars = "!<>-_\\/[]{}=+*^?#________";
  const frameRate = 30;
  const totalFrames = (duration / 1000) * frameRate;
  let frame = 0;

  const interval = window.setInterval(() => {
    const targetText = element.dataset.scrambleValue || original;
    let output = "";
    const progress = frame / totalFrames;

    for (let i = 0; i < targetText.length; i += 1) {
      if (i < progress * targetText.length) {
        output += targetText[i];
      } else if (targetText[i] === " ") {
        output += " ";
      } else {
        output += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    element.textContent = output;
    frame += 1;

    if (frame > totalFrames) {
      window.clearInterval(interval);
      element.textContent = element.dataset.scrambleValue || targetText;
      element.dataset.scrambling = "false";
    }
  }, 1000 / frameRate);
}

export function GlobalInteractionEffects() {
  /* 
  // Custom cursor disabled for performance
  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      return;
    }

    document.body.classList.add("has-custom-cursor");

    const dot = document.querySelector<HTMLElement>(".cursor-dot");
    const ring = document.querySelector<HTMLElement>(".cursor-ring");
    const trail = document.querySelector<HTMLElement>(".cursor-trail");
    const illumination = document.querySelector<HTMLElement>(".mouse-illumination");
    if (!dot || !ring || !trail || !illumination) {
      return;
    }
    const cursorDot = dot;
    const cursorRing = ring;
    const cursorTrail = trail;
    const cursorIllumination = illumination;

    let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let posDot = { ...pos };
    let posRing = { ...pos };
    let posTrail = { ...pos };
    let activeMagnetic: HTMLElement | null = null;
    let magneticCurrent = { x: 0, y: 0 };
    let magneticTarget = { x: 0, y: 0 };
    let magneticEase = 0.16;
    let magneticEngagement = 0;
    let magneticEngagementTarget = 0;
    let frame = 0;

    function clearMagnetic(element: HTMLElement | null) {
      if (!element) {
        return;
      }
      magneticCurrent = { x: 0, y: 0 };
      magneticTarget = { x: 0, y: 0 };
      magneticEngagement = 0;
      magneticEngagementTarget = 0;
      element.style.transform = "translate(0, 0)";
    }

    function releaseMagnetic() {
      magneticTarget = { x: 0, y: 0 };
      magneticEngagementTarget = 0;
    }

    function animate() {
      posDot.x = lerp(posDot.x, pos.x, 0.2);
      posDot.y = lerp(posDot.y, pos.y, 0.2);
      posRing.x = lerp(posRing.x, pos.x, 0.08);
      posRing.y = lerp(posRing.y, pos.y, 0.08);
      posTrail.x = lerp(posTrail.x, pos.x, 0.045);
      posTrail.y = lerp(posTrail.y, pos.y, 0.045);

      cursorDot.style.left = `${posDot.x}px`;
      cursorDot.style.top = `${posDot.y}px`;
      cursorRing.style.left = `${posRing.x}px`;
      cursorRing.style.top = `${posRing.y}px`;
      cursorTrail.style.left = `${posTrail.x}px`;
      cursorTrail.style.top = `${posTrail.y}px`;
      cursorIllumination.style.left = `${posRing.x}px`;
      cursorIllumination.style.top = `${posRing.y}px`;

      if (activeMagnetic) {
        magneticEngagement = lerp(magneticEngagement, magneticEngagementTarget, 0.09);
        magneticCurrent.x = lerp(magneticCurrent.x, magneticTarget.x, magneticEase);
        magneticCurrent.y = lerp(magneticCurrent.y, magneticTarget.y, magneticEase);
        activeMagnetic.style.transform = `translate(${magneticCurrent.x * magneticEngagement}px, ${magneticCurrent.y * magneticEngagement}px)`;

        if (
          magneticEngagementTarget === 0 &&
          Math.abs(magneticEngagement) < 0.02 &&
          Math.abs(magneticCurrent.x) < 0.1 &&
          Math.abs(magneticCurrent.y) < 0.1
        ) {
          activeMagnetic.style.transform = "translate(0, 0)";
          activeMagnetic = null;
          magneticCurrent = { x: 0, y: 0 };
          magneticTarget = { x: 0, y: 0 };
          magneticEngagement = 0;
        }
      }

      frame = window.requestAnimationFrame(animate);
    }

    function handleMove(event: MouseEvent) {
      pos = { x: event.clientX, y: event.clientY };

      const target = event.target instanceof HTMLElement ? event.target : null;
      const magnetic = target?.closest<HTMLElement>("[data-magnetic]") || null;

      if (activeMagnetic && activeMagnetic !== magnetic) {
        clearMagnetic(activeMagnetic);
      }
      activeMagnetic = magnetic;

      if (magnetic) {
        const strength = Number(magnetic.dataset.magneticStrength || "0.3");
        const ease = Number(magnetic.dataset.magneticEase || "0.16");
        const rect = magnetic.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        magneticEase = Number.isFinite(ease) ? ease : 0.16;
        magneticEngagementTarget = 1;
        magneticTarget = {
          x: x * (Number.isFinite(strength) ? strength : 0.3),
          y: y * (Number.isFinite(strength) ? strength : 0.3)
        };
      } else {
        magneticEase = 0.16;
        magneticEngagementTarget = 0;
        magneticTarget = { x: 0, y: 0 };
      }
    }

    function handleOver(event: MouseEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
        const interactive = target?.closest<HTMLElement>("[data-magnetic], a, button");
      if (interactive) {
        cursorRing.classList.add("hovering");
      }

      const scramble = target?.closest<HTMLElement>("[data-scramble]");
      if (scramble) {
        scrambleText(scramble);
      }
    }

    function handleOut(event: MouseEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const related = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
      const interactive = target?.closest<HTMLElement>("[data-magnetic], a, button");
      const nextInteractive = related?.closest<HTMLElement>("[data-magnetic], a, button");
      const currentMagnetic = target?.closest<HTMLElement>("[data-magnetic]") || null;
      const nextMagnetic = related?.closest<HTMLElement>("[data-magnetic]") || null;

      if (interactive && !nextInteractive) {
        cursorRing.classList.remove("hovering");
      }

      if (currentMagnetic && currentMagnetic !== nextMagnetic) {
        releaseMagnetic();
      }
    }

    function handleClick(event: MouseEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const rippleHost = target?.closest<HTMLElement>("[data-ripple]");
      if (!rippleHost) {
        return;
      }

      const rect = rippleHost.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      rippleHost.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 600);
    }

    function handleLeaveDocument() {
      cursorRing.classList.remove("hovering");
    }

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);
    document.addEventListener("click", handleClick);
    document.addEventListener("mouseleave", handleLeaveDocument);
    frame = window.requestAnimationFrame(animate);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mouseleave", handleLeaveDocument);
      window.cancelAnimationFrame(frame);
      clearMagnetic(activeMagnetic);
    };
  }, []);
  */

  // Keep only text scramble effect
  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      return;
    }

    function handleOver(event: MouseEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const scramble = target?.closest<HTMLElement>("[data-scramble]");
      if (scramble) {
        scrambleText(scramble);
      }
    }

    document.addEventListener("mouseover", handleOver);

    return () => {
      document.removeEventListener("mouseover", handleOver);
    };
  }, []);

  /* 
  // Cursor elements disabled
  return (
    <>
      <div className="cursor-container" aria-hidden="true">
        <div className="cursor-dot" />
        <div className="cursor-ring" />
        <div className="cursor-trail" />
      </div>
      <div className="mouse-illumination" aria-hidden="true" />
    </>
  );
  */

  return null;
}
