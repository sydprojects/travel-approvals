"use client";

import { useId, useState, type FormEvent } from "react";
import type { TravelRequest } from "@/lib/types";
import styles from "./CreateRequestForm.module.css";

type FieldErrors = Partial<Record<"requesterName" | "destination" | "startDate" | "endDate" | "reason", string>>;

type Props = {
  onCreated: (item: TravelRequest) => void;
};

function validate(values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  if (values.requesterName.trim().length < 2) errors.requesterName = "Enter the requester's name.";
  if (values.destination.trim().length < 2) errors.destination = "Enter a destination.";
  if (!values.startDate || Number.isNaN(Date.parse(values.startDate))) errors.startDate = "Enter a valid start date.";
  if (!values.endDate || Number.isNaN(Date.parse(values.endDate))) errors.endDate = "Enter a valid end date.";
  if (
    !errors.startDate &&
    !errors.endDate &&
    Date.parse(values.startDate) > Date.parse(values.endDate)
  ) {
    errors.endDate = "End date must be on or after the start date.";
  }
  if (values.reason.trim().length < 10) errors.reason = "Reason must be at least 10 characters.";
  return errors;
}

export function CreateRequestForm({ onCreated }: Props) {
  const ids = {
    requesterName: useId(),
    destination: useId(),
    startDate: useId(),
    endDate: useId(),
    reason: useId(),
  };

  const [values, setValues] = useState({
    requesterName: "",
    destination: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");

  function setField(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(values);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      setStatus("The form has errors. Please review the highlighted fields.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus(body?.error || "Could not create the request.");
        return;
      }
      setStatus(`Request created for ${body.requesterName}.`);
      // TODO(eduardo) - decision 1 (see docs/requirements.md, REQ-CREATE-5):
      // what happens next (focus target, whether the form resets) is not
      // decided here on purpose. onCreated() just hands the new item up;
      // the caller currently does nothing further with focus.
      onCreated(body);
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <div className={styles.field}>
        <label htmlFor={ids.requesterName}>Requester name</label>
        <input
          id={ids.requesterName}
          type="text"
          value={values.requesterName}
          onChange={setField("requesterName")}
          aria-invalid={Boolean(errors.requesterName)}
          aria-describedby={errors.requesterName ? `${ids.requesterName}-error` : undefined}
        />
        {errors.requesterName && (
          <p id={`${ids.requesterName}-error`} className={styles.error}>
            {errors.requesterName}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={ids.destination}>Destination</label>
        <input
          id={ids.destination}
          type="text"
          value={values.destination}
          onChange={setField("destination")}
          aria-invalid={Boolean(errors.destination)}
          aria-describedby={errors.destination ? `${ids.destination}-error` : undefined}
        />
        {errors.destination && (
          <p id={`${ids.destination}-error`} className={styles.error}>
            {errors.destination}
          </p>
        )}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={ids.startDate}>Start date</label>
          <input
            id={ids.startDate}
            type="date"
            value={values.startDate}
            onChange={setField("startDate")}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? `${ids.startDate}-error` : undefined}
          />
          {errors.startDate && (
            <p id={`${ids.startDate}-error`} className={styles.error}>
              {errors.startDate}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={ids.endDate}>End date</label>
          <input
            id={ids.endDate}
            type="date"
            value={values.endDate}
            onChange={setField("endDate")}
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={errors.endDate ? `${ids.endDate}-error` : undefined}
          />
          {errors.endDate && (
            <p id={`${ids.endDate}-error`} className={styles.error}>
              {errors.endDate}
            </p>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={ids.reason}>Reason</label>
        <textarea
          id={ids.reason}
          value={values.reason}
          onChange={setField("reason")}
          rows={3}
          aria-invalid={Boolean(errors.reason)}
          aria-describedby={errors.reason ? `${ids.reason}-error` : undefined}
        />
        {errors.reason && (
          <p id={`${ids.reason}-error`} className={styles.error}>
            {errors.reason}
          </p>
        )}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit request"}
      </button>

      <p aria-live="polite" className={styles.status}>
        {status}
      </p>
    </form>
  );
}
