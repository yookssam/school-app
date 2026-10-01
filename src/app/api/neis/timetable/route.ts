import { NextRequest, NextResponse } from "next/server";
import { getTimetable } from "@/lib/neis";

export async function GET(request: NextRequest) {
  const officeCode = request.nextUrl.searchParams.get("officeCode") ?? "";
  const schoolCode = request.nextUrl.searchParams.get("schoolCode") ?? "";
  const schoolKind = request.nextUrl.searchParams.get("schoolKind") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const grade = request.nextUrl.searchParams.get("grade") ?? "";
  const className = request.nextUrl.searchParams.get("className") ?? "";

  if (!officeCode || !schoolCode || !date || !grade || !className) {
    return NextResponse.json(
      { error: "학교, 날짜, 학년, 반을 입력하세요." },
      { status: 400 },
    );
  }

  try {
    const periods = await getTimetable({
      officeCode,
      schoolCode,
      schoolKind,
      date,
      grade,
      className,
    });
    return NextResponse.json({ periods });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "시간표 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
