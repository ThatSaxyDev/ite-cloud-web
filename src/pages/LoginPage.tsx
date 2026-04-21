import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { authClient } from "@/lib/auth-client";
import { markKnownUser } from "@/lib/browser-state";
import { config } from "@/lib/config";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M10.6 6.4A10.3 10.3 0 0 1 12 6c6.5 0 10 6 10 6a18.8 18.8 0 0 1-3.2 3.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M6.7 6.7C4 8.3 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M9.9 9.9A3 3 0 0 0 14.1 14.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/account/sessions";
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "verify-email">(params.get("mode") === "sign-up" ? "sign-up" : "sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationOtp, setVerificationOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [githubPending, setGithubPending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    async function resumeIfAlreadySignedIn() {
      const session = await authClient.getSession();
      if (!session.data?.session) {
        return;
      }
      markKnownUser();
      navigate(redirectTo, { replace: true });
    }

    void resumeIfAlreadySignedIn();
  }, [navigate, redirectTo]);

  useEffect(() => {
    setGithubPending(false);
    setFormPending(false);
  }, [location.key, location.search]);

  function switchMode(nextMode: "sign-in" | "sign-up") {
    if (nextMode === mode) {
      return;
    }

    setError(null);
    setPassword("");
    setVerificationOtp("");
    setVerificationSent(false);
    setPasswordVisible(false);
    setFormPending(false);
    setGithubPending(false);

    if (nextMode === "sign-in") {
      setName("");
    }

    setMode(nextMode);
  }

  async function sendEmailVerificationOtp(targetEmail: string) {
    const result = await authClient.emailOtp.sendVerificationOtp({
      email: targetEmail,
      type: "email-verification",
    });

    if (result.error) {
      throw result.error;
    }
  }

  async function handleGithubSignIn() {
    setGithubPending(true);
    setError(null);

    try {
      const callbackURL = `${window.location.origin}${redirectTo}`;
      const errorCallbackURL = `${window.location.origin}/login?redirect=${encodeURIComponent(redirectTo)}&mode=${mode}`;
      const query = new URLSearchParams({
        provider: "github",
        callbackURL,
        errorCallbackURL
      });

      if (mode === "sign-up") {
        query.set("requestSignUp", "true");
      }

      window.location.assign(`${config.apiUrl}/api/auth/sign-in/social?${query.toString()}`);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "message" in caught
          ? String((caught as { message?: string }).message)
          : "GitHub sign-in failed."
      );
      setGithubPending(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormPending(true);
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
        await sendEmailVerificationOtp(email);
        setMode("verify-email");
        setVerificationSent(true);
        setFormPending(false);
        return;
      }

      const result = await authClient.signIn.email({
        email,
        password
      });
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          await sendEmailVerificationOtp(email);
          setMode("verify-email");
          setVerificationSent(true);
          setFormPending(false);
          return;
        }
        throw result.error;
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
      setFormPending(false);
    }
  }

  async function handleResendVerification() {
    setFormPending(true);
    setError(null);
    try {
      await sendEmailVerificationOtp(email);
      setVerificationSent(true);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "message" in caught
          ? String((caught as { message?: string }).message)
          : "Failed to resend verification code."
      );
    } finally {
      setFormPending(false);
    }
  }

  async function handleVerifyEmail(event: FormEvent) {
    event.preventDefault();
    setFormPending(true);
    setError(null);

    try {
      const verification = await authClient.emailOtp.verifyEmail({
        email,
        otp: verificationOtp,
      });

      if (verification.error) {
        throw verification.error;
      }

      if (!password) {
        setMode("sign-in");
        setVerificationOtp("");
        setVerificationSent(false);
        return;
      }

      const signInResult = await authClient.signIn.email({
        email,
        password,
      });

      if (signInResult.error) {
        throw signInResult.error;
      }

      markKnownUser();
      navigate(redirectTo);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "message" in caught
          ? String((caught as { message?: string }).message)
          : "Email verification failed."
      );
    } finally {
      setFormPending(false);
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
            <h1>{mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Check your email"}</h1>
            <p className="auth-flow-copy">
              {mode === "verify-email"
                ? `We sent a 6-digit verification code to ${email}. Enter it here to verify your account.`
                : "Sign in here, then we will send you back to finish terminal access."}
            </p>
          </div>
        </div>

        <section className="auth-surface">
          {mode === "verify-email" ? (
            <form className="form-surface" onSubmit={handleVerifyEmail}>
              {verificationSent && (
                <p className="success" style={{ color: "#10b981", marginBottom: 16 }}>
                  Verification code sent.
                </p>
              )}
              {error ? <p className="error">{error}</p> : null}
              <label className="stack">
                <span>Verification code</span>
                <input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationOtp}
                  onChange={(event) => setVerificationOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </label>
              <div className="auth-actions">
                <button className="button" data-magnetic data-ripple disabled={formPending || verificationOtp.length < 6} type="submit">
                  <span className="button-text" data-scramble data-scramble-value={formPending ? "Verifying..." : "Verify email"}>
                    {formPending ? "Verifying..." : "Verify email"}
                  </span>
                  <span className="button-shine" />
                </button>
                <button
                  className="button secondary"
                  data-magnetic
                  disabled={formPending}
                  onClick={() => void handleResendVerification()}
                  type="button"
                >
                  {formPending ? "Sending..." : "Resend code"}
                </button>
              </div>
              <div className="auth-mode-switch">
                <span>Use a different account?</span>
                <button
                  className="auth-mode-link"
                  data-magnetic
                  onClick={() => switchMode("sign-in")}
                  type="button"
                >
                  Sign in
                </button>
              </div>
            </form>
          ) : (
            <form className="form-surface" onSubmit={handleSubmit}>
              <>
                <button className="button secondary" data-magnetic disabled={githubPending || formPending} onClick={() => void handleGithubSignIn()} type="button">
                  {githubPending ? "Connecting GitHub..." : "Continue with GitHub"}
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
                <div className="password-field">
                  <input
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    className="password-toggle"
                    onClick={() => setPasswordVisible((value) => !value)}
                    type="button"
                  >
                    <EyeIcon open={passwordVisible} />
                  </button>
                </div>
              </label>
              {error ? <p className="error">{error}</p> : null}
              <div className="auth-actions">
                <button className="button" data-magnetic data-ripple disabled={formPending || githubPending} type="submit">
                  <span
                    className="button-text"
                    data-scramble
                    data-scramble-value={formPending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
                  >
                    {formPending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
                  </span>
                  <span className="button-shine" />
                </button>
              </div>
              <div className="auth-mode-switch">
                <span>{mode === "sign-in" ? "New to iTE?" : "Already have an account?"}</span>
                <button
                  className="auth-mode-link"
                  data-magnetic
                  disabled={formPending || githubPending}
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
          )}
        </section>
      </section>
    </main>
  );
}
