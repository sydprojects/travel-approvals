import { AutoFocusHeading } from "@/components/AutoFocusHeading";
import { TravelRequestDetail } from "@/components/TravelRequestDetail";
import { getRequest } from "@/lib/platformApi";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getRequest(Number(id));

  return (
    <>
      <AutoFocusHeading level={1}>Travel request details</AutoFocusHeading>
      <TravelRequestDetail item={result.ok ? result.data : null} onDecided={() => {}} />
    </>
  );
}
