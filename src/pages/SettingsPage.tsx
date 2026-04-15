export function SettingsPage() {
  return (
    <section className="account-panel">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Settings</p>
          <h2>Account settings</h2>
        </div>
      </header>

      <div className="detail-stack">
        <article className="detail-card">
          <strong>BYOK lives in the app for now</strong>
          <p className="muted">
            For the current iTE launch, bring-your-own-key setup happens inside the CLI or desktop app with
            <code> /setup </code>
            . This account page is reserved for future profile and linked sign-in controls.
          </p>
        </article>
      </div>
    </section>
  );
}
