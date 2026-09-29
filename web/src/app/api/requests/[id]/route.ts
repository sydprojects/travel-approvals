import { NextRequest, NextResponse } from "next/server";
import { decisionSchema } from "@/lib/schemas";
import { mapDownstreamError, mapValidationError } from "@/lib/mapError";
import { decideRequest, getRequest } from "@/lib/platformApi";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const result = await getRequest(Number(id));
  if (!result.ok) {
    const mapped = mapDownstreamError(result.status, result.body);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
  return NextResponse.json(result.data);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = decisionSchema.safeParse(json);

  if (!parsed.success) {
    const mapped = mapValidationError(parsed.error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }

  const result = await decideRequest(Number(id), parsed.data);
  if (!result.ok) {
    const mapped = mapDownstreamError(result.status, result.body);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
  return NextResponse.json(result.data);
}
