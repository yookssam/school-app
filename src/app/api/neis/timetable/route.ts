import { NextRequest, NextResponse } from "next/server";
import { getTimetable } from "@/lib/neis";

export async function GET(request: NextRequest) {
  const officeCode = request.nextUrl.searchParams.get("officeCode") ?? "";
  const schoolCode = request.nextUrl.searchParams.get("schoolCode") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const grade = request.nextUrl.searchParams.get("grade") ?? "";
  const classNum = request.nextUrl.searchParams.get("classNum") ?? "";

  if (!officeCode || !schoolCode || !date) {
    return NextResponse.json(
      { error: "필수 정보가 누락되었습니다." },
      { status: 400 }
    );
  }

  try {
    const timetable = await getTimetable(officeCode, schoolCode, date, grade, classNum);
    return NextResponse.json({ timetable });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "시간표 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}