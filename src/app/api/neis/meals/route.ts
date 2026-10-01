import { NextRequest, NextResponse } from "next/server";
import { getMealSchedule } from "@/lib/neis";

export async function GET(request: NextRequest) {
  const officeCode = request.nextUrl.searchParams.get("officeCode") ?? "";
  const schoolCode = request.nextUrl.searchParams.get("schoolCode") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";

  if (!officeCode || !schoolCode || !date) {
    return NextResponse.json(
      { error: "학교와 날짜를 선택하세요." },
      { status: 400 }
    );
  }

  try {
    const meals = await getMealSchedule(officeCode, schoolCode, date);
    return NextResponse.json({ meals });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "급식 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}