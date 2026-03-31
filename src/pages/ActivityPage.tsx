import { useEffect, useState } from "react";

import { api } from "@/lib/api";

type ActivityEvent = {
  id: string;
  actorType: string;
  eventType: string;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function describeEvent(event: ActivityEvent) {
  switch (event.eventType) {
    case "billing.checkout_started":
      return "Started checkout";
    case "billing.subscription_updated":
      return "Subscription updated";
    case "billing.subscription_synced":
      return "Billing synced";
    case "billing.portal_opened":
      return "Opened billing portal";
    case "billing.plan_downgraded":
      return "Moved to Free";
    case "auth.cli_approved":
      return "Approved terminal sign-in";
    case "session.terminal_created":
      return "Created terminal session";
    case "session.terminal_signed_out":
      return "Signed out terminal session";
    case "session.revoked":
      return "Revoked device session";
    case "auth.terminal_refreshed":
      return "Refreshed terminal session";
    case "usage.request_succeeded":
      return "Used bundled model";
    case "usage.request_blocked_quota":
      return "Bundled usage blocked";
    case "usage.request_failed":
      return "Bundled request failed";
    case "usage.request_unavailable":
      return "Bundled model unavailable";
    default:
      return event.eventType.replaceAll(".", " ");
  }
}

function detailText(event: ActivityEvent) {
  const model = typeof event.metadata.model === "string" ? event.metadata.model : null;
  const window = typeof event.metadata.window === "string" ? event.metadata.window : null;
  const planKey = typeof event.metadata.planKey === "string" ? event.metadata.planKey : null;
  const status = typeof event.metadata.status === "string" ? event.metadata.status : null;

  if (model && window) {
    return `${model} · ${window}`;
  }
  if (model) {
    return model;
  }
  if (planKey && status) {
    return `${planKey} · ${status}`;
  }
  if (planKey) {
    return planKey;
  }
  return event.source.replaceAll(".", " ");
}

export function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await api.activity();
        if (cancelled) {
          return;
        }
        setEvents(payload.events);
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not load activity.")
            : "Could not load activity."
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="account-panel">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Activity</p>
          <h2>Recent account activity</h2>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="detail-stack">
        <article className="detail-card">
          {events.length ? (
            <div className="activity-list">
              {events.map((event) => (
                <div className="activity-row" key={event.id}>
                  <div className="activity-copy">
                    <strong>{describeEvent(event)}</strong>
                    <p className="muted">{detailText(event)}</p>
                  </div>
                  <time className="activity-time">{formatTimestamp(event.createdAt)}</time>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No recent activity yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}

