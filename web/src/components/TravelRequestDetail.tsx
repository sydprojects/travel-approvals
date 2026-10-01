"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BASE_PATH } from "@/lib/basePath";
import type { TravelRequest, TravelRequestStatus } from "@/lib/types";
import styles from "./TravelRequestDetail.module.css";

const STATUS_LABEL: Record<TravelRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type Props = {
  item: TravelRequest | null;
  onDecided?: (item: TravelRequest) => void;
};

export function TravelRequestDetail({ item: initialItem, onDecided }: Props) {
  const [item, setItem] = useState(initialItem);
  const [deciding, setDeciding] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // REQ-CREATE-5: a persistent role="status" region, empty on first
    // paint. If we arrived via create's ?created=1, announce it, then
    // strip the param with replace so a refresh doesn't repeat the
    // announcement. Deliberately a one-shot effect (mount only): re-firing
    // on every searchParams change would announce "Request created." again
    // after the replace re-triggers this effect if created were a dep.
    // This genuinely needs to run as an effect, not during render: it
    // synchronizes with the URL (an external source) and also performs a
    // real side effect (router.replace) as a result.
    if (searchParams.get("created") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("Request created.");
      router.replace(pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!item) {
    return (
      <div role="alert" className={styles.notFound}>
        Travel request not found.
      </div>
    );
  }

  async function decide(next: "approved" | "rejected") {
    setDeciding(true);
    setStatus("");
    try {
      const res = await fetch(`${BASE_PATH}/api/requests/${item!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus(body?.error || "Could not update the request.");
        return;
      }
      setStatus(`Request ${body.status}.`);
      setItem(body);
      onDecided?.(body);
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setDeciding(false);
    }
  }

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <h2>{item.requesterName}</h2>
        <span className={`${styles.status} ${styles[item.status]}`}>{STATUS_LABEL[item.status]}</span>
      </header>

      <dl className={styles.fields}>
        <dt>Destination</dt>
        <dd>{item.destination}</dd>
        <dt>Dates</dt>
        <dd>
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </dd>
        <dt>Reason</dt>
        <dd>{item.reason}</dd>
        {item.decisionNote && (
          <>
            <dt>Decision note</dt>
            <dd>{item.decisionNote}</dd>
          </>
        )}
      </dl>

      {item.status === "pending" && (
        <div className={styles.actions}>
          <button type="button" onClick={() => decide("approved")} disabled={deciding}>
            Approve
          </button>
          <button type="button" onClick={() => decide("rejected")} disabled={deciding} className={styles.reject}>
            Reject
          </button>
        </div>
      )}

      <p role="status" aria-live="polite" className={styles.liveStatus}>
        {status}
      </p>
    </article>
  );
}
