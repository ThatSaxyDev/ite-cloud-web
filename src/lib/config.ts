export const config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://127.0.0.1:4000",
  devAuthBypass: import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS !== "0"
};
