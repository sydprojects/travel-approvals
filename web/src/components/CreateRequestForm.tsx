"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { MESSAGES } from "@/lib/messages";
import type { TravelRequest } from "@/lib/types";
import styles from "./CreateRequestForm.module.css";

type FieldName = "requesterName" | "destination" | "startDate" | "endDate" | "reason";
type FieldErrors = Partial<Record<FieldName, string>>;

// Visual order, per REQ-CREATE-5: on an invalid submit, focus moves to the
// first field with an error in this order, not just the first key in
// whatever object the errors happen to be built in.
const FIELD_ORDER: FieldName[] = ["requesterName", "destination", "startDate", "endDate", "reason"];

type Props = {
  onCreated: (item: TravelRequest) => void;
};

function validate(values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  if (values.requesterName.trim().length < 2) errors.requesterName = MESSAGES.requesterName.required;
  if (values.destination.trim().length < 2) errors.destination = MESSAGES.destination.required;
  if (!values.startDate || Number.isNaN(Date.parse(values.startDate))) errors.startDate = MESSAGES.startDate.invalid;
  if (!values.endDate || Number.isNaN(Date.parse(values.endDate))) errors.endDate = MESSAGES.endDate.invalid;
  if (
    !errors.startDate &&
    !errors.endDate &&
    Date.parse(values.startDate) > Date.parse(values.endDate)
  ) {
    errors.endDate = MESSAGES.endDate.beforeStart;
  }
  if (values.reason.trim().length < 10) errors.reason = MESSAGES.reason.tooShort;
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

  // Individually typed so each ref matches the real element it's attached
  // to (input vs textarea); only widened to a common HTMLElement lookup
  // below, since focusFirstError only ever needs .focus().
  const requesterNameRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const fieldRefs: Record<FieldName, React.RefObject<HTMLElement | null>> = {
    requesterName: requesterNameRef,
    destination: destinationRef,
    startDate: startDateRef,
    endDate: endDateRef,
    reason: reasonRef,
  };

  // REQ-CREATE-5: after errors render, focus moves to the first invalid
  // field in visual order - works for client-side errors and for
  // server-returned field errors alike, since both end up in `errors`.
  function focusFirstError(fieldErrors: FieldErrors) {
    for (const field of FIELD_ORDER) {
      if (fieldErrors[field]) {
        fieldRefs[field].current?.focus();
        return;
      }
    }
  }

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
      focusFirstError(fieldErrors);
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      const res = await fetch(`${BASE_PATH}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json();
      if (!res.ok) {
        // Merge server-returned per-field errors (REQ-BFF-2) on top of
        // whatever client-side validation already found - this is what
        // makes the BFF's own zod validation actually visible to the user
        // instead of only existing to protect the API.
        const mergedFields: FieldErrors = body?.fields ? { ...errors, ...body.fields } : errors;
        if (body?.fields) {
          setErrors(mergedFields);
        }
        setStatus(body?.error || "Could not create the request.");
        focusFirstError(mergedFields);
        return;
      }
      // Decision 1 (REQ-CREATE-5) resolved: the caller navigates to the
      // new request's own page, not home, so focus lands on a heading
      // that confirms *this* request specifically (see requests/new/page
      // and requests/[id]/page). The success announcement itself lives on
      // that destination page (a persistent role="status" region there),
      // not here - this component's own node unmounts on navigation and
      // would never actually be announced by assistive tech.
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
          ref={requesterNameRef}
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
          ref={destinationRef}
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
            ref={startDateRef}
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
            ref={endDateRef}
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
          ref={reasonRef}
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

      <button type="submit" disabled={submitting} className={styles.submit}>
        {submitting ? "Submitting…" : "Submit request"}
      </button>

      <p aria-live="polite" className={styles.status}>
        {status}
      </p>
    </form>
  );
}
