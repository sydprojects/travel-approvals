"use client";

import { useRouter } from "next/navigation";
import { AutoFocusHeading } from "@/components/AutoFocusHeading";
import { CreateRequestForm } from "@/components/CreateRequestForm";

export default function NewRequestPage() {
  const router = useRouter();

  return (
    <>
      <AutoFocusHeading level={1}>New travel request</AutoFocusHeading>
      <CreateRequestForm
        onCreated={(item) => {
          // Decision 1 (REQ-CREATE-5) resolved: navigate to the new
          // request's own page rather than home. Its heading includes the
          // requester's name (see requests/[id]/page.tsx), so the
          // route-change focus in AutoFocusHeading lands somewhere that
          // concretely confirms *this* request was created, not just "a
          // list that now has one more item somewhere in it."
          router.push(`/requests/${item.id}`);
        }}
      />
    </>
  );
}
