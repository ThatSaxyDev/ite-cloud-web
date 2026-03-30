import iteImage from "@/assets/ite-image.png";

export function GlitchImageLogo({
  alt = "iTE",
  className = ""
}: {
  alt?: string;
  className?: string;
}) {
  return (
    <span className={`glitch-logo ${className}`.trim()}>
      <img alt="" aria-hidden="true" className="glitch-logo-clone glitch-logo-clone-a" src={iteImage} />
      <img alt="" aria-hidden="true" className="glitch-logo-clone glitch-logo-clone-b" src={iteImage} />
      <img alt={alt} className="glitch-logo-base" src={iteImage} />
    </span>
  );
}
