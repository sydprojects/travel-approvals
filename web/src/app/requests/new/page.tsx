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
        onCreated={() => {
          // TODO(eduardo) - decision 1 (docs/requirements.md, REQ-CREATE-5):
          // navigating home is a placeholder so the flow is usable end to
          // end. It does not confirm which request was just created, and
          // no focus target has been deliberately chosen for this specific
          // step - the generic route-focus in AutoFocusHeading will land on
          // the home page's heading, not on anything referencing this item.
          router.push("/");
        }}
      />
    </>
  );
}
