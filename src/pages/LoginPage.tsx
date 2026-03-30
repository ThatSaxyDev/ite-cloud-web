import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { authClient } from "@/lib/auth-client";
import { markKnownUser } from "@/lib/browser-state";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/account/sessions";
  const [mode, setMode] = useState<"sign-in" | "sign-up">(params.get("mode") === "sign-up" ? "sign-up" : "sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isCliRedirect = redirectTo.startsWith("/auth/cli");

  function switchMode(nextMode: "sign-in" | "sign-up") {
    if (nextMode === mode) {
      return;
    }

    setError(null);
    setPassword("");

    if (nextMode === "sign-in") {
      setName("");
    }

    setMode(nextMode);
  }

  async function handleGithubSignIn() {
    setPending(true);
    setError(null);

    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: `${window.location.origin}${redirectTo}`
      });

      if (result.error) {
        throw result.error;
      }
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "message" in caught
          ? String((caught as { message?: string }).message)
          : "GitHub sign-in failed."
      );
      setPending(false);
    }
  }

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
      markKnownUser();
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
        <Link className="overlay-header-brand" data-magnetic to="/">
          <GlitchImageLogo className="overlay-header-brand-image" />
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
            <>
              <button className="button secondary" data-magnetic disabled={pending} onClick={() => void handleGithubSignIn()} type="button">
                Continue with GitHub
              </button>
              <div className="auth-divider" aria-hidden="true">
                <span />
                <em>or</em>
                <span />
              </div>
            </>
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
              <button className="button" data-magnetic data-ripple disabled={pending} type="submit">
                <span
                  className="button-text"
                  data-scramble
                  data-scramble-value={pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
                >
                  {pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
                </span>
                <span className="button-shine" />
              </button>
            </div>
            <div className="auth-mode-switch">
              <span>{mode === "sign-in" ? "New to iTE?" : "Already have an account?"}</span>
              <button
                className="auth-mode-link"
                data-magnetic
                disabled={pending}
                onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
                type="button"
              >
                <span
                  className="auth-mode-link-text"
                  data-scramble
                  data-scramble-value={mode === "sign-in" ? "Create account" : "Sign in"}
                >
                  {mode === "sign-in" ? "Create account" : "Sign in"}
                </span>
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
