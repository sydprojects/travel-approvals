import Link from "next/link";
import type { TravelRequest, TravelRequestStatus } from "@/lib/types";
import styles from "./TravelRequestList.module.css";

const STATUS_LABEL: Record<TravelRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function formatDateRange(startDate: string, endDate: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  return `${fmt(startDate)} - ${fmt(endDate)}`;
}

type Props = {
  items: TravelRequest[];
};

export function TravelRequestList({ items }: Props) {
  return (
    <section aria-labelledby="travel-requests-heading" className={styles.section}>
      <h2 id="travel-requests-heading">Travel requests</h2>

      {items.length === 0 ? (
        // Decision 3 (REQ-STATE-2) resolved: a CTA over a plain message.
        // It's worth the small extra UX surface here because "no requests
        // yet" on a page whose only real action is "create one" reads as
        // a dead end otherwise, not a landing page in normal working use.
        <p className={styles.empty}>
          No travel requests yet. <Link href="/requests/new">Create your first request</Link>.
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <Link href={`/requests/${item.id}`} className={styles.link}>
                <div>
                  <p className={styles.requester}>{item.requesterName}</p>
                  <p className={styles.destination}>{item.destination}</p>
                  <p className={styles.dates}>{formatDateRange(item.startDate, item.endDate)}</p>
                </div>
                <span className={`${styles.status} ${styles[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
