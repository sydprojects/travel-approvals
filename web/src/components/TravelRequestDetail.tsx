"use client";

import { useState } from "react";
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
      const res = await fetch(`/api/requests/${item!.id}`, {
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

      <p aria-live="polite" className={styles.liveStatus}>
        {status}
      </p>
    </article>
  );
}
