import { NextResponse } from 'next/server';
// @ts-ignore
import Comcigan from 'comcigan-parser';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0', 10);

    const comcigan = new Comcigan();
    await comcigan.init();

    const schoolList = await comcigan.search('선부고');
    const targetSchool = schoolList.find((s: any) => s.name.includes('선부고'));

    if (!targetSchool) {
      return NextResponse.json({ success: false, message: '학교를 찾을 수 없습니다.' }, { status: 404 });
    }

    await comcigan.setSchool(targetSchool.code);
    const timetableData = await comcigan.getTimetable();

    // 컴시간 교사 풀네임 매핑 처리
    const rawTeachers: string[] = comcigan.teacherList || comcigan.teachers || [];
    const teacherSet = new Set<string>();

    if (Array.isArray(rawTeachers)) {
      rawTeachers.forEach((t: any) => {
        const name = typeof t === 'string' ? t : t?.name;
        if (name && name.trim().length > 0) {
          teacherSet.add(name.trim());
        }
      });
    }

    for (const grade in timetableData) {
      if (!isNaN(Number(grade))) {
        for (const cls in timetableData[grade]) {
          const days = timetableData[grade][cls];
          if (Array.isArray(days)) {
            days.forEach((day: any) => {
              if (Array.isArray(day)) {
                day.forEach((period: any) => {
                  if (period && period.teacher) {
                    const cleanTeacher = period.teacher.replace(/\*/g, '').trim();
                    const matched = Array.from(teacherSet).find(t => t.startsWith(cleanTeacher));
                    period.teacherFullName = matched || (cleanTeacher.length === 2 ? cleanTeacher + ' 선생님' : cleanTeacher);
                    teacherSet.add(period.teacherFullName);
                  }
                });
              }
            });
          }
        }
      }
    }

    const teacherList = Array.from(teacherSet).filter(t => t.length > 0).sort();

    return NextResponse.json({
      success: true,
      schoolName: targetSchool.name,
      timetable: timetableData,
      teachers: teacherList,
      weekOffset
    });
  } catch (error: any) {
    console.error('컴시간 API 에러:', error);
    return NextResponse.json(
      { success: false, message: '컴시간 데이터 조회 실패', error: error.toString() },
      { status: 500 }
    );
  }
}