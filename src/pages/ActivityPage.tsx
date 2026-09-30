import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAccountResource } from "@/lib/use-account-resource";

const windows = [
  ["fiveHour", "5 hours", "The short stretch"],
  ["sevenDay", "7 days", "The week in motion"],
  ["thirtyDay", "30 days", "The longer run"],
] as const;

export function ActivityPage() {
  const { data, error, loading, refresh } = useAccountResource(
    api.billingUsage,
  );
  return (
    <section className="workspace-page">
      <header className="workspace-pagehead">
        <div>
          <p className="workspace-kicker">USAGE / CLOUD INFERENCE</p>
          <h1>
            Room to
            <br />
            <span>keep going.</span>
          </h1>
          <p>Your rolling usage windows. Updated from your account.</p>
        </div>
        <button
          className="workspace-textlink"
          disabled={loading}
          onClick={() => void refresh()}
        >
          {loading ? "Checking…" : "Refresh ↻"}
        </button>
      </header>
      {error && (
        <p className="workspace-error" role="alert">
          {error}{" "}
          <button onClick={() => void refresh()} disabled={loading}>
            Try again
          </button>
        </p>
      )}
      {!data && loading && <p role="status">Loading your usage…</p>}
      {data &&
        (data.entitlements.proAccess ? (
          <>
            <div className="usage-windows">
              {windows.map(([key, title, caption]) => {
                const quota = data.quotas[key];
                const used =
                  quota.capUsdCents > 0
                    ? Math.max(
                        0,
                        Math.min(
                          100,
                          (quota.usedUsdCents / quota.capUsdCents) * 100,
                        ),
                      )
                    : 100;
                const reset = quota.fullWindowClearAt ?? quota.nextResetAt;
                return (
                  <article className="usage-window" key={key}>
                    <div className="usage-window-label">
                      <h2>{title}</h2>
                      <p>{caption}</p>
                    </div>
                    <div className="usage-window-number">
                      <strong>
                        {Math.max(0, 100 - used).toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}
                        <span>%</span>
                      </strong>
                      <p>remaining</p>
                    </div>
                    <div
                      className="usage-meter"
                      role="progressbar"
                      aria-label={`${title} usage consumed`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(used)}
                    >
                      <span style={{ transform: `scaleX(${used / 100})` }} />
                    </div>
                    <p className="usage-reset">
                      {reset
                        ? `Window clears ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(reset))}`
                        : "No usage waiting to reset"}
                    </p>
                  </article>
                );
              })}
            </div>
            <div className="workspace-footnote">
              <p>
                These are rolling windows, not calendar resets. Capacity returns
                as earlier usage leaves each window.
              </p>
              <Link className="workspace-textlink" to="/account/billing">
                Your plan ↗
              </Link>
            </div>
          </>
        ) : (
          <div className="workspace-empty">
            <p className="workspace-kicker">YOUR PROVIDER. YOUR PACE.</p>
            <h2>No bundled cloud usage.</h2>
            <p>
              Local models and your own provider run outside these windows. Pro
              adds bundled cloud inference.
            </p>
            <Link className="workspace-action" to="/account/billing">
              Explore iTE Pro ↗
            </Link>
            <Link className="workspace-textlink" to="/docs#configure">
              Configure your provider ↗
            </Link>
          </div>
        ))}
    </section>
  );
}
