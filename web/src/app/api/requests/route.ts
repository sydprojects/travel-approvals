import { NextRequest, NextResponse } from "next/server";
import { createTravelRequestSchema } from "@/lib/schemas";
import { mapDownstreamError, mapValidationError } from "@/lib/mapError";
import { createRequest, listRequests } from "@/lib/platformApi";

export async function GET() {
  const result = await listRequests();
  if (!result.ok) {
    const mapped = mapDownstreamError(result.status, result.body);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = createTravelRequestSchema.safeParse(json);

  if (!parsed.success) {
    const mapped = mapValidationError(parsed.error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }

  const result = await createRequest(parsed.data);
  if (!result.ok) {
    const mapped = mapDownstreamError(result.status, result.body);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
