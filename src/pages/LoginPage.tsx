import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { authClient } from "@/lib/auth-client";
import { markKnownUser } from "@/lib/browser-state";
import { config } from "@/lib/config";

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
  const [pending, setPending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

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

  function switchMode(nextMode: "sign-in" | "sign-up") {
    if (nextMode === mode) {
      return;
    }

    setError(null);
    setPassword("");
    setVerificationOtp("");
    setVerificationSent(false);

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
    setPending(true);
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
        await sendEmailVerificationOtp(email);
        setMode("verify-email");
        setVerificationSent(true);
        setPending(false);
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
          setPending(false);
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
      setPending(false);
    }
  }

  async function handleResendVerification() {
    setPending(true);
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
      setPending(false);
    }
  }

  async function handleVerifyEmail(event: FormEvent) {
    event.preventDefault();
    setPending(true);
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
                <button className="button" data-magnetic data-ripple disabled={pending || verificationOtp.length < 6} type="submit">
                  <span className="button-text" data-scramble data-scramble-value={pending ? "Verifying..." : "Verify email"}>
                    {pending ? "Verifying..." : "Verify email"}
                  </span>
                  <span className="button-shine" />
                </button>
                <button
                  className="button secondary"
                  data-magnetic
                  disabled={pending}
                  onClick={() => void handleResendVerification()}
                  type="button"
                >
                  {pending ? "Sending..." : "Resend code"}
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
          )}
        </section>
      </section>
    </main>
  );
}
