import { AutoFocusHeading } from "@/components/AutoFocusHeading";
import { TravelRequestList } from "@/components/TravelRequestList";
import { listRequests } from "@/lib/platformApi";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await listRequests();

  return (
    <>
      <AutoFocusHeading level={1}>Travel Approvals</AutoFocusHeading>

      {result.ok ? (
        <TravelRequestList items={result.data.items} />
      ) : (
        <p role="alert">Could not load travel requests. Please try again shortly.</p>
      )}
    </>
  );
}
