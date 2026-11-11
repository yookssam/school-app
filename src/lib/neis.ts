import "server-only";

export interface MealItem {
  dishName: string;
  calInfo: string;
  ntrInfo: string;
}

export interface TimetableItem {
  period: string;
  subject: string;
  teacherName?: string;
  grade?: string;
  className?: string;
}

// 급식 정보 조회
export async function getMealSchedule(officeCode: string, schoolCode: string, date: string) {
  try {
    const apiKey = process.env.NEIS_API_KEY || '';
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${apiKey}&Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${date}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.mealServiceDietInfo?.[1]?.row || [];
  } catch {
    console.error('NEIS meal lookup failed.');
    return [];
  }
}

// 학급/교사 시간표 조회
export async function getTimetable(
  officeCode: string,
  schoolCode: string,
  date: string,
  grade: string,
  className: string,
  schoolKind: string = 'his' // his: 고등학교, mis: 중학교, els: 초등학교
) {
  try {
    const apiKey = process.env.NEIS_API_KEY || '';
    let endpoint = 'hisTimetable';
    if (schoolKind === 'mis') endpoint = 'misTimetable';
    if (schoolKind === 'els') endpoint = 'elsTimetable';

    const url = `https://open.neis.go.kr/hub/${endpoint}?KEY=${apiKey}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&ALL_TI_YMD=${date}&GRADE=${grade}&CLASS_NM=${className}`;
    const res = await fetch(url);
    const data = await res.json();
    
    return data[endpoint]?.[1]?.row || [];
  } catch {
    console.error('NEIS timetable lookup failed.');
    return [];
  }
}

export async function getSchoolSchedule(month: string) {
  const apiKey = process.env.NEIS_API_KEY?.trim();
  if (!apiKey) return null;

  const url = new URL('https://open.neis.go.kr/hub/SchoolSchedule');
  url.search = new URLSearchParams({
    KEY: apiKey,
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: 'J10',
    SD_SCHUL_CODE: '7530851',
    AA_YMD: month,
  }).toString();

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error('NEIS schedule lookup failed.');
  const data = await response.json();
  if (data.RESULT?.CODE === 'INFO-200') return [];
  const rows: unknown = data.SchoolSchedule?.[1]?.row;
  if (!Array.isArray(rows)) throw new Error('Invalid NEIS schedule response.');

  return rows.flatMap((row: unknown) => {
    if (typeof row !== 'object' || row === null || !('AA_YMD' in row) || !('EVENT_NM' in row)) return [];
    const { AA_YMD, EVENT_NM } = row;
    if (typeof AA_YMD !== 'string' || !/^\d{8}$/.test(AA_YMD) || !AA_YMD.startsWith(month) || typeof EVENT_NM !== 'string') return [];
    return [{ date: `${AA_YMD.slice(0, 4)}-${AA_YMD.slice(4, 6)}-${AA_YMD.slice(6, 8)}`, title: EVENT_NM }];
  });
}
