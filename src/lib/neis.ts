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
    const apiKey = process.env.NEXT_PUBLIC_NEIS_API_KEY || '';
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${apiKey}&Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${date}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.mealServiceDietInfo?.[1]?.row || [];
  } catch (error) {
    console.error('NEIS Meal API Error:', error);
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
    const apiKey = process.env.NEXT_PUBLIC_NEIS_API_KEY || '';
    let endpoint = 'hisTimetable';
    if (schoolKind === 'mis') endpoint = 'misTimetable';
    if (schoolKind === 'els') endpoint = 'elsTimetable';

    const url = `https://open.neis.go.kr/hub/${endpoint}?KEY=${apiKey}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&ALL_TI_YMD=${date}&GRADE=${grade}&CLASS_NM=${className}`;
    const res = await fetch(url);
    const data = await res.json();
    
    return data[endpoint]?.[1]?.row || [];
  } catch (error) {
    console.error('NEIS Timetable API Error:', error);
    return [];
  }
}