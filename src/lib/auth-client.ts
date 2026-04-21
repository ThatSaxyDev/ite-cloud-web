import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";

import { config } from "@/lib/config";

export const authClient = createAuthClient({
  baseURL: config.apiUrl,
  plugins: [emailOTPClient()],
});
