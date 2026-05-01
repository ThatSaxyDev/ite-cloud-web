export const INSTALL_COMMANDS = {
  pipx: "pipx install ite-agent",
  uv: "uv tool install ite-agent"
} as const;

export const INSTALL_REEL_DURATION_MS = 420;

const INSTALL_REEL_CHARSET = " abcdefghijklmnopqrstuvwxyz0123456789-./".split("");

export type InstallMethod = keyof typeof INSTALL_COMMANDS;

export type InstallReelSlot = {
  chars: string[];
  delay: number;
  duration: number;
  direction: "up" | "down";
};

function normalizeInstallReelChar(char: string) {
  const normalized = char.toLowerCase();
  return INSTALL_REEL_CHARSET.includes(normalized) ? normalized : " ";
}

function getInstallReelCharAt(index: number) {
  const size = INSTALL_REEL_CHARSET.length;
  return INSTALL_REEL_CHARSET[((index % size) + size) % size];
}

function buildInstallWheelPath(fromChar: string, toChar: string, index: number) {
  if (fromChar === toChar) {
    return {
      chars: [toChar],
      direction: "up" as const
    };
  }

  const fromIndex = INSTALL_REEL_CHARSET.indexOf(normalizeInstallReelChar(fromChar));
  const toIndex = INSTALL_REEL_CHARSET.indexOf(normalizeInstallReelChar(toChar));
  const seed = index * 17 + fromIndex * 7 + toIndex * 13;
  const direction = seed % 2 === 0 ? "up" as const : "down" as const;
  const size = INSTALL_REEL_CHARSET.length;
  const distance =
    direction === "up"
      ? (toIndex - fromIndex + size) % size
      : (fromIndex - toIndex + size) % size;
  const steps = Math.max(2, distance + 1);
  const chars = Array.from({ length: steps }, (_, stepIndex) => {
    if (stepIndex === 0) {
      return fromChar;
    }
    if (stepIndex === steps - 1) {
      return toChar;
    }

    const nextIndex = direction === "up" ? fromIndex + stepIndex : fromIndex - stepIndex;
    return getInstallReelCharAt(nextIndex);
  });

  return { chars, direction };
}

export function buildInstallReelSlots(from: string, to: string): InstallReelSlot[] {
  const length = Math.max(from.length, to.length);

  return Array.from({ length }, (_, index) => {
    const fromChar = from[index] ?? " ";
    const toChar = to[index] ?? " ";
    const wheel = buildInstallWheelPath(fromChar, toChar, index);

    return {
      chars: wheel.chars,
      direction: wheel.direction,
      delay: (index * 11) % 46,
      duration: 180 + (wheel.chars.length - 1) * 14
    };
  });
}

export function buildStaticInstallReelSlots(command: string): InstallReelSlot[] {
  return command.split("").map((char) => ({
    chars: [char],
    direction: "up" as const,
    delay: 0,
    duration: 0
  }));
}
