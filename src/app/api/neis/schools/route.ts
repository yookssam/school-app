import { NextRequest, NextResponse } from "next/server";
import { searchSchools } from "@/lib/neis";

export async function GET(request: NextRequest) {
  const officeCode = request.nextUrl.searchParams.get("officeCode") ?? "";
  const schoolName = request.nextUrl.searchParams.get("schoolName") ?? "";

  try {
    const schools = await searchSchools({ officeCode, schoolName });
    return NextResponse.json({ schools });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "학교 검색에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
