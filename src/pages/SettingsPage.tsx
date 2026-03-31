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
          <strong>Coming next</strong>
          <p className="muted">
            Account preferences, linked sign-in methods, and profile controls will live here.
          </p>
        </article>
      </div>
    </section>
  );
}
