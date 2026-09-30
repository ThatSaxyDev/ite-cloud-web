import { type CSSProperties, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";

import { AmbientTriangles } from "@/components/AmbientTriangles";
import { AgentConstellation } from "@/components/AgentConstellation";
import { AccountLayout } from "@/components/AccountLayout";
import { GlobalInteractionEffects } from "@/components/GlobalInteractionEffects";
import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { StartupPreloader } from "@/components/StartupPreloader";
import { authClient } from "@/lib/auth-client";
import { hasKnownUser, markBrowserSeen, markKnownUser } from "@/lib/browser-state";
import { getDevAuthUser } from "@/lib/dev-auth";
import { buildInstallReelSlots, buildStaticInstallReelSlots, detectDefaultInstallMethod, getInstallMethodLabel, INSTALL_COMMANDS, INSTALL_REEL_DURATION_MS, isWindowsOS, type InstallMethod, type InstallReelSlot } from "@/lib/install-command";
import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { ActivityPage } from "@/pages/ActivityPage";
import { BillingPage } from "@/pages/BillingPage";
import { CliAuthPage } from "@/pages/CliAuthPage";
import { DocsPage } from "@/pages/DocsPage";
import { LoginPage } from "@/pages/LoginPage";
import { PricingPage } from "@/pages/PricingPage";
import { SettingsPage } from "@/pages/SettingsPage";

const PRELOADER_SEEN_KEY = "ite-web-preloader-seen";

function InstallLine() {
  const [method, setMethod] = useState<InstallMethod>(() => detectDefaultInstallMethod());
  const [copied, setCopied] = useState(false);
  const [transition, setTransition] = useState<{ slots: InstallReelSlot[] } | null>(null);
  const command = INSTALL_COMMANDS[method];
  const methods: InstallMethod[] = isWindowsOS() ? ["curl", "windows", "pipx", "uv"] : ["curl", "pipx", "uv"];
  useEffect(() => {
    if (!transition) return;
    const timer = window.setTimeout(() => setTransition(null), INSTALL_REEL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [transition]);
  function choose(next: InstallMethod) {
    if (next === method) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTransition(reduced ? null : { slots: buildInstallReelSlots(command, INSTALL_COMMANDS[next]) });
    setMethod(next);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(command); setCopied(true); window.setTimeout(() => setCopied(false), 1400); } catch { setCopied(false); }
  }
  const slots = transition?.slots ?? buildStaticInstallReelSlots(command);
  return <section className="line-install" aria-label="Install iTE">
    <div className="line-install__choices" role="tablist" aria-label="Choose install method">
      {methods.map((item) => <button aria-selected={method === item} data-active={method === item} key={item} onClick={() => choose(item)} role="tab" type="button">{getInstallMethodLabel(item)}</button>)}
      <button className="line-install__copy" onClick={() => void copy()} type="button">{copied ? "Copied" : "Copy"}</button>
    </div>
    <div className="line-install__command"><span aria-hidden="true">$</span><code aria-live="polite"><span className="sr-only">{command}</span><span aria-hidden="true" className="line-install__reels">{slots.map((slot, index) => <span className="line-install__slot" key={`${index}-${slot.chars.join("")}`}><span className="line-install__track" data-animate={Boolean(transition)} style={{ "--slot-end": transition && slot.direction === "up" ? `calc(-100% * ${(slot.chars.length - 1) / slot.chars.length})` : "0%", animationDelay: `${slot.delay}ms`, animationDuration: `${slot.duration}ms`, transform: transition && slot.direction === "down" ? `translateY(calc(-100% * ${(slot.chars.length - 1) / slot.chars.length}))` : "translateY(0)" } as CSSProperties}>{slot.chars.map((char, charIndex) => <span key={`${char}-${charIndex}`}>{char}</span>)}</span></span>)}</span></code></div>
  </section>;
}

function WorkRecord() {
  const [open, setOpen] = useState(false);
  return <section className="work-record" aria-labelledby="record-title">
    <div className="work-record__lead"><p>AN AGENT SHOULD LEAVE THE WORK CLEARER THAN IT FOUND IT.</p><h2 id="record-title">One change.<br />Nothing hidden.</h2></div>
    <article className="record" data-open={open}>
      <header><span>iTE / WORKING</span><span>workspace cache</span></header>
      <div className="record__ask"><span>YOU</span><p>“A renamed workspace sometimes shows stale data. Find the path and fix it.”</p></div>
      <div className="record__reply"><span>iTE</span><p>I traced the rename handler to the cache key. The key survived the rename, so the old workspace state was still returned.</p></div>
      {open ? <div className="record__evidence"><p><span>READ</span>src/workspaces/rename.ts</p><p><span>FOLLOWED</span>workspaceCache.invalidate</p><p><span>CHANGED</span>invalidate previous key after rename</p><p><span>CHECKED</span>workspace-cache.test.ts · 8 passed</p></div> : null}
      <footer><button aria-expanded={open} onClick={() => setOpen((value) => !value)} type="button">{open ? "Close the trace" : "Open the trace"}<span>{open ? "−" : "+"}</span></button><p>{open ? "Change made. Outcome checked." : "The answer is waiting for its evidence."}</p></footer>
    </article>
  </section>;
}

function HomePage() {
  const [accountLabel, setAccountLabel] = useState("Create account");
  const [accountHref, setAccountHref] = useState("/login?mode=sign-up");
  useEffect(() => {
    let cancelled = false; markBrowserSeen();
    async function resolve() {
      if (getDevAuthUser()) { markKnownUser(); setAccountLabel("Account"); setAccountHref("/account/settings"); return; }
      const session = await authClient.getSession(); if (cancelled) return;
      if (session.data?.session) { markKnownUser(); setAccountLabel("Account"); setAccountHref("/account/settings"); return; }
      if (hasKnownUser()) { setAccountLabel("Sign in"); setAccountHref("/login?mode=sign-in"); }
    }
    void resolve(); return () => { cancelled = true; };
  }, []);
  return <main className="record-page">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="record-nav"><Link aria-label="iTE home" to="/"><GlitchImageLogo /></Link><div><Link to="/docs">Docs</Link><Link className="record-nav__account" to={accountHref}>{accountLabel}<span>→</span></Link></div></header>
    <section className="record-hero" id="main-content"><div className="record-hero__copy"><p>iTE / CODING AGENT</p><h1>Hand it off.<br /><em>Stay close.</em></h1><p>iTE works through the task in your codebase, then gives you the answer with the work still in view.</p></div><AgentConstellation /><div className="record-hero__install"><p>INSTALL ITE</p><InstallLine /></div></section>
    <WorkRecord />
    <section className="proof-record" id="proof"><div><p>THE PRODUCT IS THE PROOF.</p><h2>Watch it work.</h2></div><video autoPlay controls loop muted playsInline preload="metadata" poster="/ite-prev.png" src="/demo.mp4" /><p className="proof-record__note">A session in the terminal. Nothing staged around it.</p></section>
    <section className="record-close"><div className="record-close__logo"><GlitchImageLogo /></div><div><p>KEEP THE THREAD.</p><h2>Open the terminal.</h2><InstallLine /><div><Link to="/docs">Documentation ↗</Link><Link to={accountHref}>{accountLabel} ↗</Link></div></div></section>
    <footer className="record-footer"><p>© {new Date().getFullYear()} iTE</p><a href="https://kiishi.space" rel="noreferrer" target="_blank">Kiishi David ↗</a></footer>
  </main>;
}

export function App() {
  const [showPreloader, setShowPreloader] = useState(() => typeof window === "undefined" || window.sessionStorage.getItem(PRELOADER_SEEN_KEY) !== "1");
  function doneLoading() { window.sessionStorage.setItem(PRELOADER_SEEN_KEY, "1"); setShowPreloader(false); }
  return <>{showPreloader ? <StartupPreloader onComplete={doneLoading} /> : null}<GlobalInteractionEffects /><div className="app-ambient" aria-hidden="true"><AmbientTriangles className="triangle-field-global" /></div><Routes><Route path="/" element={<HomePage />} /><Route path="/docs" element={<DocsPage />} /><Route path="/pricing" element={<PricingPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/auth/cli" element={<CliAuthPage />} /><Route path="/account" element={<AccountLayout />}><Route index element={<Navigate to="/account/settings" replace />} /><Route path="billing" element={<BillingPage />} /><Route path="sessions" element={<AccountSessionsPage />} /><Route path="usage" element={<ActivityPage />} /><Route path="activity" element={<Navigate to="/account/usage" replace />} /><Route path="settings" element={<SettingsPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></>;
}
