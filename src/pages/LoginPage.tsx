import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import iteImage from "@/assets/ite-image.png";
import { authClient } from "@/lib/auth-client";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/account/sessions";
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
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
    <main className="auth-page">
      <header className="overlay-header">
        <Link className="overlay-header-brand" to="/">
          <img alt="iTE" className="overlay-header-brand-image" src={iteImage} />
        </Link>
      </header>
      <section className="auth-stage">
        <div className="auth-heading">
          <div className="auth-copy">
            <h1>{mode === "sign-in" ? "Sign in" : "Create account"}</h1>
          </div>
        </div>

        <section className="auth-surface">
          <form className="form-surface" onSubmit={handleSubmit}>
            {mode === "sign-up" ? (
              <label className="stack">
                <span>Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
            ) : null}
            <label className="stack">
              <span>Email</span>
              <input
                autoComplete="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="stack">
              <span>Password</span>
              <input
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <div className="auth-actions">
              <button className="button" disabled={pending} type="submit">
                {pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
              <button
                className="button secondary"
                disabled={pending}
                onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
                type="button"
              >
                {mode === "sign-in" ? "Create account" : "Back"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
