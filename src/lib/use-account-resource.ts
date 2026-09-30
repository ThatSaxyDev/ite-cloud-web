import { useCallback, useEffect, useRef, useState } from "react";

export function accountError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "error" in error) {
    const detail = (error as { error?: { message?: string } | string }).error;
    if (typeof detail === "object" && detail?.message) return detail.message;
  }
  return "Could not connect. Check your connection and try again.";
}

export function useAccountResource<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    try {
      const result = await fetcher();
      if (mounted.current) {
        setData(result);
        setError(null);
      }
    } catch (caught) {
      if (mounted.current) setError(accountError(caught));
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [fetcher]);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(onFocus, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);
  return { data, error, loading, refresh, setData };
}
