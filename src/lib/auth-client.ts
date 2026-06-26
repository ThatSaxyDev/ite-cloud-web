import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";

import { config } from "@/lib/config";

const noCacheFetch: typeof fetch = (input, init) => {
  const next: RequestInit = { ...init, cache: "no-store" };
  if (!next.headers) {
    next.headers = {};
  }
  next.headers = { ...next.headers, "cache-control": "no-cache", pragma: "no-cache" };
  return fetch(input, next);
};

export const authClient = createAuthClient({
  baseURL: config.apiUrl,
  fetch: noCacheFetch,
  plugins: [emailOTPClient()],
});