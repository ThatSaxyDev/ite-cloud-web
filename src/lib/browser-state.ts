const KNOWN_USER_KEY = "ite-known-user";
const SEEN_BROWSER_KEY = "ite-seen-browser";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function markBrowserSeen(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(SEEN_BROWSER_KEY, "1");
}

export function hasSeenBrowser(): boolean {
  if (!canUseStorage()) {
    return false;
  }
  return window.localStorage.getItem(SEEN_BROWSER_KEY) === "1";
}

export function markKnownUser(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(KNOWN_USER_KEY, "1");
  window.localStorage.setItem(SEEN_BROWSER_KEY, "1");
}

export function hasKnownUser(): boolean {
  if (!canUseStorage()) {
    return false;
  }
  return window.localStorage.getItem(KNOWN_USER_KEY) === "1";
}
