import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api } from "@/lib/api";

export function DevicePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState((params.get("user_code") || "").toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (userCode) {
      setUserCode(userCode.toUpperCase());
    }
  }, [userCode]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api.inspectDevice(userCode.trim().toUpperCase());
      navigate(`/device/approve?user_code=${encodeURIComponent(userCode.trim().toUpperCase())}`);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "error" in caught
          ? String((caught as { error?: { message?: string } }).error?.message || "Invalid device code.")
          : "Invalid device code."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="center-shell">
      <section className="center-stage">
        <div className="page-block">
          <span className="eyebrow">Fallback</span>
          <h1>Enter your code</h1>
          <p className="muted">Use this only if iTE did not open the browser for you.</p>
          <form className="form-surface" onSubmit={handleSubmit}>
            <label className="stack">
              <span>Code</span>
              <input
                maxLength={16}
                value={userCode}
                onChange={(event) => setUserCode(event.target.value.toUpperCase())}
                placeholder="ITE-XXXX"
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <div className="auth-actions">
              <button className="button" disabled={pending} type="submit">
                {pending ? "Checking..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
