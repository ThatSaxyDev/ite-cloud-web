import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authClient } from "@/lib/auth-client";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/account/sessions";
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("iTE User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isCliRedirect = redirectTo.startsWith("/auth/cli");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          name,
          email,
          password
        });
        if (result.error) {
          throw result.error;
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password
        });
        if (result.error) {
          throw result.error;
        }
      }
      navigate(redirectTo);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "message" in caught
          ? String((caught as { message?: string }).message)
          : "Authentication failed."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="shell stack">
      <section className="panel stack">
        <span className="eyebrow">{isCliRedirect ? "Continue to iTE" : "Browser auth"}</span>
        <h1>
          {isCliRedirect
            ? mode === "sign-in"
              ? "Sign in to continue in the terminal"
              : "Create your iTE account"
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </h1>
        <p className="muted">
          {isCliRedirect
            ? "After this step, your terminal session will complete automatically."
            : "Use this browser session to manage iTE Cloud access."}
        </p>
        <div className="meta-chip-row">
          <span className="meta-chip">Browser session</span>
          <span className="meta-chip">Better Auth</span>
        </div>
        <form className="stack" onSubmit={handleSubmit}>
          {mode === "sign-up" ? (
            <label className="stack">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
          ) : null}
          <label className="stack">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="stack">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="row">
            <button className="button" disabled={pending} type="submit">
              {pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
            </button>
            <button
              className="button secondary"
              disabled={pending}
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              type="button"
            >
              {mode === "sign-in" ? "Need an account?" : "Have an account?"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
