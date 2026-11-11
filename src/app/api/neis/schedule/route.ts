import { getSchoolSchedule } from "@/lib/neis";

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? "";
  if (!/^20\d{2}(0[1-9]|1[0-2])$/.test(month)) {
    return Response.json({ error: "조회할 연월을 확인하세요." }, { status: 400 });
  }

  try {
    const events = await getSchoolSchedule(month);
    if (events === null) {
      return Response.json({ error: "학사일정 서비스가 아직 연결되지 않았습니다." }, { status: 503 });
    }
    return Response.json({ events });
  } catch {
    return Response.json({ error: "학사일정을 불러오지 못했습니다." }, { status: 502 });
  }
}
