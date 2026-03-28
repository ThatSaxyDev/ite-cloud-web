import { createAuthClient } from "better-auth/client";

import { config } from "@/lib/config";

export const authClient = createAuthClient({
  baseURL: config.apiUrl
});

