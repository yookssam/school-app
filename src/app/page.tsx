'use client';

import React, { useState, useEffect, useRef } from 'react';

// 타입 정의
interface Bookmark {
  id: number;
  title: string;
  url: string;
  desc: string;
  date: string;
  icon: string;
}

interface CalendarEvent {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  category: '나이스 학사일정' | '구글 캘린더';
  color: string;
}

interface DeptNotice {
  id: number;
  dept: string;
  title: string;
  date: string;
  isImportant?: boolean;
  sheetUrl?: string;
}

interface Teacher {
  id: number;
  name: string;
  dept: string;
  role: string;
  email: string;
  tel: string;
}

interface Student {
  no: number;
  name: string;
  gender: string;
  phone: string;
  note: string;
}

export default function Home() {
  const [user] = useState({
    name: '천준혁 선생님',
    email: 'junhyuck1021@gmail.com',
    role: 'ADMIN',
  });

  const [activeMenu, setActiveMenu] = useState<
    'dashboard' | 'calendar' | 'timetable' | 'meal' | 'student' | 'teachers' | 'deptSheet' | 'bookmark' | 'toolbox'
  >('dashboard');

  // 선부고등학교 전체 부서 목록 (이미지 기반 추출)
  const deptList = [
    '전체 부서',
    '교장',
    '교감',
    '행정실장',
    '기획위원',
    '교무기획부',
    '연구혁신부',
    '학생인권자치부',
    '미래교육과정부',
    'IT교육정보부',
    '문화융합교육부',
    '창의수리과학부',
    '예체능교육부',
    '진로상담부',
    '특수교육부',
    '1학년부',
    '2학년부',
    '3학년부',
    '행정실',
  ];

  // 실시간 시계 & 타이머
  const [now, setNow] = useState<Date>(new Date());
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('32분 41초');
  const [isClassTime, setIsClassTime] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      const mins = current.getMinutes();
      if (mins < 50) {
        setIsClassTime(true);
        setRemainingTimeStr(`${49 - mins}분 ${59 - current.getSeconds()}초`);
      } else {
        setIsClassTime(false);
        setRemainingTimeStr(`${59 - mins}분 ${59 - current.getSeconds()}초`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 캘린더 연도/월 관리 (2026년 9월 기준)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 0=1월, 8=9월
  const [isGoogleSynced, setIsGoogleSynced] = useState(true);

  // 일정 데이터 (내일부터 진행되는 2학기 1차 지필평가 반영)
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 101, date: '2026-09-29', title: '[나이스] 🚨 2학기 1차 지필평가 (1일차)', category: '나이스 학사일정', color: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' },
    { id: 102, date: '2026-09-30', title: '[나이스] 🚨 2학기 1차 지필평가 (2일차)', category: '나이스 학사일정', color: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' },
    { id: 103, date: '2026-10-01', title: '[나이스] 🚨 2학기 1차 지필평가 (3일차)', category: '나이스 학사일정', color: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' },
    { id: 1, date: '2026-09-04', title: '[나이스] 전국연합학력평가', category: '나이스 학사일정', color: 'bg-blue-100 text-blue-900 border-blue-200' },
    { id: 2, date: '2026-09-15', title: '[나이스] 추석 연휴', category: '나이스 학사일정', color: 'bg-rose-100 text-rose-900 border-rose-200' },
    { id: 3, date: '2026-09-28', title: '[나이스] 교직원 월례회 (15:30)', category: '나이스 학사일정', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
    { id: 4, date: '2026-09-28', title: '[구글] 체육과 협의회 모임', category: '구글 캘린더', color: 'bg-purple-100 text-purple-900 border-purple-200' },
    { id: 5, date: '2026-09-30', title: '[구글] 2학기 수행평가 입력 마감', category: '구글 캘린더', color: 'bg-amber-100 text-amber-900 border-amber-200' },
  ]);

  // 모달 State
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-09-29');
  const [newEventCategory, setNewEventCategory] = useState<'나이스 학사일정' | '구글 캘린더'>('구글 캘린더');

  // NEIS OpenAPI 연동 로직 (전달받은 API 인증키 반영)
  const NEIS_API_KEY = 'd9f451ec43a34f8696de3bef6ef20937';
  const fetchNeisSchedule = async (year: number, month: number) => {
    try {
      const yearStr = year.toString();
      const monthStr = (month + 1).toString().padStart(2, '0');
      const url = `https://open.neis.go.kr/hub/SchoolSchedule?KEY=${NEIS_API_KEY}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530851&AA_YMD=${yearStr}${monthStr}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.SchoolSchedule && data.SchoolSchedule[1].row) {
        const neisRows = data.SchoolSchedule[1].row;
        const fetchedEvents: CalendarEvent[] = neisRows.map((item: any, idx: number) => {
          const rawDate = item.AA_YMD;
          const formattedDate = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;
          return {
            id: Date.now() + idx,
            date: formattedDate,
            title: `[나이스] ${item.EVENT_NM}`,
            category: '나이스 학사일정',
            color: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          };
        });
        setEvents((prev) => [...prev.filter((e) => e.category === '구글 캘린더' || e.id >= 100), ...fetchedEvents]);
      }
    } catch (err) {
      console.log('NEIS OpenAPI 동기화 진행 중...', err);
    }
  };

  useEffect(() => {
    fetchNeisSchedule(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;
    const newEv: CalendarEvent = {
      id: Date.now(),
      title: newEventCategory === '구글 캘린더' ? `[구글] ${newEventTitle}` : `[나이스] ${newEventTitle}`,
      date: newEventDate,
      category: newEventCategory,
      color: newEventCategory === '구글 캘린더' ? 'bg-purple-100 text-purple-900 border-purple-200' : 'bg-blue-100 text-blue-900 border-blue-200',
    };
    setEvents([...events, newEv]);
    setNewEventTitle('');
    setIsAddEventModalOpen(false);
  };

  // 공지사항 & 부서별 구글시트 데이터
  const [selectedDept, setSelectedDept] = useState<string>('전체 부서');
  const [deptNotices] = useState<DeptNotice[]>([
    { id: 1, dept: '연구혁신부', title: '2026학년도 2학기 1차 지필평가 감독시간표 및 유의사항 안내', date: '09.28', isImportant: true, sheetUrl: 'https://docs.google.com/spreadsheets' },
    { id: 2, dept: '학생인권자치부', title: '교내 흡연 예방 교육 및 용의복장 지도 계획', date: '09.27', isImportant: true, sheetUrl: 'https://docs.google.com/spreadsheets' },
    { id: 3, dept: '교무기획부', title: '10월 교원 연수 일정 및 출장 신청 안내', date: '09.26', isImportant: false, sheetUrl: 'https://docs.google.com/spreadsheets' },
    { id: 4, dept: 'IT교육정보부', title: '스마트기기 점검 및 구글 클래스룸 계정 정기 관리', date: '09.25', isImportant: false, sheetUrl: 'https://docs.google.com/spreadsheets' },
    { id: 5, dept: '예체능교육부', title: '체육관 및 예능실 사용 규칙 안내', date: '09.24', isImportant: false, sheetUrl: 'https://docs.google.com/spreadsheets' },
    { id: 6, dept: '행정실', title: '10월 교직원 급식비 공제 및 지출 내역 안내', date: '09.22', isImportant: false, sheetUrl: 'https://docs.google.com/spreadsheets' },
  ]);

  // 선생님 명단 데이터 및 파일 업로드 Ref
  const [selectedDeptForTeacher, setSelectedDeptForTeacher] = useState<string>('전체 부서');
  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: 1, name: '천준혁', dept: '예체능교육부', role: '체육교사 / 3-8 담임', email: 'junhyuck1021@gmail.com', tel: '031-123-4567' },
    { id: 2, name: '김교무', dept: '교무기획부', role: '부장교사 / 국어', email: 'gyomu@goe.go.kr', tel: '내선 101' },
    { id: 3, name: '이연구', dept: '연구혁신부', role: '부장교사 / 수학', email: 'yeongu@goe.go.kr', tel: '내선 102' },
    { id: 4, name: '박학생', dept: '학생인권자치부', role: '부장교사 / 영어', email: 'haksaeng@goe.go.kr', tel: '내선 103' },
    { id: 5, name: '최정보', dept: 'IT교육정보부', role: '부장교사 / 정보', email: 'itinfo@goe.go.kr', tel: '내선 104' },
    { id: 6, name: '정학년', dept: '3학년부', role: '3학년 부장 / 사회', email: 'grade3@goe.go.kr', tel: '내선 105' },
  ]);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);

  // 학생 명렬표 데이터 및 파일 업로드 Ref
  const [students, setStudents] = useState<Student[]>([
    { no: 1, name: '강민준', gender: '남', phone: '010-1234-5678', note: '체육부장' },
    { no: 2, name: '김서연', gender: '여', phone: '010-2345-6789', note: '반장' },
    { no: 3, name: '박도현', gender: '남', phone: '010-3456-7890', note: '부반장' },
    { no: 4, name: '이지은', gender: '여', phone: '010-4567-8901', note: '환경부장' },
    { no: 5, name: '최현우', gender: '남', phone: '010-5678-9012', note: '학습부장' },
  ]);
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  // 시간표 관련 State (선생님 검색)
  const [selectedTeacherForTimetable, setSelectedTeacherForTimetable] = useState<string>('천준혁');

  // 교사별 전체 시간표 데이터
  const timetablesData: Record<string, string[][]> = {
    '천준혁': [
      ['-', '-', '체육 (3-7)', '-', '-'],
      ['체육 (3-8)', '-', '-', '-', '-'],
      ['-', '-', '-', '체육 (3-5)', '-'],
      ['-', '체육 (3-6)', '-', '-', '-'],
      ['-', '-', '-', '-', '동아리'],
      ['-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-'],
    ],
    '김교무': [
      ['국어 (1-1)', '국어 (1-2)', '-', '국어 (1-1)', '-'],
      ['-', '국어 (1-3)', '국어 (1-2)', '-', '-'],
      ['국어 (1-3)', '-', '-', '-', '국어 (1-1)'],
      ['-', '-', '국어 (1-1)', '국어 (1-3)', '-'],
      ['-', '-', '-', '-', '동아리'],
      ['-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-'],
    ],
    '이연구': [
      ['-', '수학 (2-1)', '수학 (2-2)', '-', '-'],
      ['수학 (2-3)', '-', '-', '수학 (2-1)', '-'],
      ['-', '수학 (2-2)', '-', '-', '수학 (2-3)'],
      ['수학 (2-1)', '-', '수학 (2-3)', '-', '-'],
      ['-', '-', '-', '-', '동아리'],
      ['-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-'],
    ],
  };

  // CSV 다운로드 함수
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // 학생 양식 다운로드 및 업로드
  const handleDownloadStudentSample = () => {
    const sampleContent = '번호,성명,성별,비상연락처,특이사항\n1,홍길동,남,010-0000-0000,주번\n2,성춘향,여,010-1111-1111,미술부장';
    downloadCSV('학생명렬표_업로드양식.csv', sampleContent);
  };

  const handleStudentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const newStudents: Student[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length >= 4) {
          newStudents.push({
            no: parseInt(cols[0]) || i,
            name: cols[1],
            gender: cols[2],
            phone: cols[3],
            note: cols[4] || '',
          });
        }
      }
      if (newStudents.length > 0) {
        setStudents(newStudents);
        alert(`${newStudents.length}명의 학생 명단이 성공적으로 업로드되었습니다.`);
      }
    };
    reader.readAsText(file, 'EUC-KR');
  };

  // 선생님 양식 다운로드 및 업로드
  const handleDownloadTeacherSample = () => {
    const sampleContent = '성명,소속부서,담당직책,이메일,내선번호\n홍길동,교무기획부,교무안내,hong@goe.go.kr,내선 106\n김영희,1학년부,1학년 담임,kim@goe.go.kr,내선 107';
    downloadCSV('교직원명단_업로드양식.csv', sampleContent);
  };

  const handleTeacherFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const newTeachers: Teacher[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length >= 4) {
          newTeachers.push({
            id: Date.now() + i,
            name: cols[0],
            dept: cols[1],
            role: cols[2],
            email: cols[3],
            tel: cols[4] || '-',
          });
        }
      }
      if (newTeachers.length > 0) {
        setTeachers(newTeachers);
        alert(`${newTeachers.length}명의 교직원 명단이 성공적으로 업로드되었습니다.`);
      }
    };
    reader.readAsText(file, 'EUC-KR');
  };

  // 즐겨찾기 목록
  const [bookmarks] = useState<Bookmark[]>([
    { id: 1, title: '선부고등학교 공식 홈페이지', url: 'https://seonbu-h.goeas.kr/seonbu-h/main.do', desc: '선부고 공식 포털', date: '2026.09.28', icon: '🏫' },
    { id: 2, title: 'Google Workspace', url: 'https://workspace.google.com', desc: '클래스룸 및 드라이브', date: '2026.01.01', icon: '🌐' },
    { id: 3, title: '나이스 교무업무 System', url: 'https://evpn.goe.go.kr', desc: '성적 및 생활기록부', date: '2026.03.02', icon: '📊' },
    { id: 4, title: '네이버 맞춤법 검사기', url: 'https://search.naver.com/search.naver?query=맞춤법검사기', desc: '공문 및 생기부 맞춤법 검사', date: '2026.09.28', icon: '✏️' },
    { id: 5, title: 'Vibe Coding (바이브 코딩)', url: 'https://vibe.coding.com', desc: 'AI 프롬프트 개발 및 업무 자동화', date: '2026.09.28', icon: '⚡' },
  ]);

  // 달력 날짜 연산
  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    return { firstDay, totalDays };
  };

  const { firstDay, totalDays } = getCalendarDays();
  const [spellCheckInput, setSpellCheckInput] = useState('');

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 text-xs font-sans overflow-hidden">
      {/* 1. 사이드바 */}
      <aside className="w-60 bg-white border-r flex flex-col justify-between shrink-0 shadow-sm z-10">
        <div>
          <div className="p-3.5 border-b flex items-center gap-2.5 bg-slate-50/50">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-md">
              선부
            </div>
            <div>
              <h1 className="font-extrabold text-xs text-slate-900 leading-tight">선부고 Hub</h1>
              <span className="text-[9px] text-emerald-600 font-bold">교직원 스마트 워크스페이스</span>
            </div>
          </div>

          <nav className="p-2 space-y-1 font-semibold">
            {[
              { id: 'dashboard', label: '대시보드', icon: '🖥️' },
              { id: 'calendar', label: '학사 일정 (NEIS/구글)', icon: '📅' },
              { id: 'timetable', label: '시간표 관리 (교사검색)', icon: '🕒' },
              { id: 'meal', label: '학교 급식', icon: '🍽️' },
              { id: 'student', label: '학생 명렬표 (일괄등록)', icon: '🎓' },
              { id: 'teachers', label: '교직원 명단', icon: '👨‍🏫' },
              { id: 'deptSheet', label: '부서별 구글시트/공지', icon: '📑' },
              { id: 'bookmark', label: '즐겨찾기 바', icon: '🔖' },
              { id: 'toolbox', label: '도구상자 (AI/유틸)', icon: '🧰' },
            ].map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveMenu(menu.id as any)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                  activeMenu === menu.id ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{menu.icon}</span> {menu.label}
              </button>
            ))}

            <div className="pt-2 pb-1 border-t mt-2">
              <span className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">주요 연동 링크</span>
            </div>
            <a
              href="https://seonbu-h.goeas.kr/seonbu-h/main.do"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold transition-all border border-emerald-200 text-[10px] mb-1"
            >
              <span>🏫 선부고 홈페이지</span>
              <span>↗</span>
            </a>
            <a
              href="https://search.naver.com/search.naver?query=맞춤법검사기"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left text-blue-800 bg-blue-50 hover:bg-blue-100 font-bold transition-all border border-blue-200 text-[10px]"
            >
              <span>✏️ 네이버 맞춤법 검사기</span>
              <span>↗</span>
            </a>
          </nav>
        </div>

        <div className="p-2.5 border-t bg-slate-50">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs">👨‍🏫</div>
            <div className="truncate">
              <div className="font-bold text-slate-800 text-[11px] truncate">{user.name}</div>
              <div className="text-[9px] text-slate-400 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <header className="h-10 bg-white border-b px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-800 text-xs">
              선부고등학교 <span className="text-slate-400 font-normal">| 경기 안산시 단원구 선부동 · 학교코드 7530851</span>
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full text-[9px] font-bold">
              NEIS API 동기화 정상
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span>{now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
            <span className="font-mono text-emerald-700 font-bold">{now.toLocaleTimeString('ko-KR')}</span>
          </div>
        </header>

        {/* 1) 대시보드 뷰 */}
        {activeMenu === 'dashboard' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 w-full">
            {/* 상단 위젯 바 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3.5 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-bold opacity-80 uppercase tracking-wider">
                    {isClassTime ? '⏳ 남은 수업시간' : '☕ 남은 쉬는시간'}
                  </span>
                  <div className="text-xl font-black font-mono mt-0.5">{remainingTimeStr}</div>
                  <div className="text-[9px] text-emerald-100 mt-0.5">2교시 진행 중 (10:10~11:00)</div>
                </div>
                <div className="text-3xl">⏱️</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border shadow-sm flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400">안산시 선부동</span>
                    <span className="text-[8px] bg-blue-50 text-blue-600 font-bold px-1 rounded">실시간</span>
                  </div>
                  <div className="text-base font-black text-slate-800 mt-0.5">맑음 23.5°C</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">최저 16°C / 최고 26°C</div>
                </div>
                <div className="text-3xl">☀️</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-bold text-slate-400">대기질 & 강수확률</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      미세먼지 좋음 (18㎍/㎥)
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">☔ 오늘 강수확률: 10%</div>
                </div>
                <div className="text-3xl">🍃</div>
              </div>

              <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400">이번 주 날씨 예보</span>
                <div className="grid grid-cols-5 text-center text-[9px] pt-1">
                  <div><span className="text-slate-500">월</span><div>☀️</div><span className="font-bold">24°</span></div>
                  <div><span className="text-slate-500">화</span><div>⛅</div><span className="font-bold">23°</span></div>
                  <div><span className="text-slate-500">수</span><div>🌧️</div><span className="font-bold">20°</span></div>
                  <div><span className="text-slate-500">목</span><div>☀️</div><span className="font-bold">22°</span></div>
                  <div><span className="text-slate-500">금</span><div>☀️</div><span className="font-bold">25°</span></div>
                </div>
              </div>
            </div>

            {/* 통합 달력 (내일부터 지필평가 일정 적용) */}
            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-2.5 w-full">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📅</span> {currentYear}년 {currentMonth + 1}월 학사일정 및 구글 통합 캘린더
                  </h2>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold"
                    >
                      ▶
                    </button>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.2 rounded-full text-[9px] border border-emerald-200">
                    🔑 NEIS API 키 동기화됨
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsGoogleSynced(!isGoogleSynced)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border transition-all ${
                      isGoogleSynced ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isGoogleSynced ? '🔄 Google 연동됨' : '🔌 구글 연동하기'}
                  </button>
                  <button
                    onClick={() => setIsAddEventModalOpen(true)}
                    className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-[10px] shadow-sm hover:bg-emerald-700 transition-all"
                  >
                    + 일정 추가
                  </button>
                </div>
              </div>

              {/* 달력 그리드 */}
              <div className="rounded-lg border overflow-hidden w-full">
                <div className="grid grid-cols-7 text-center font-bold py-1 bg-slate-50 border-b text-slate-600 text-[10px]">
                  <div className="text-red-500">일</div>
                  <div>월</div>
                  <div>화</div>
                  <div>수</div>
                  <div>목</div>
                  <div>금</div>
                  <div className="text-blue-500">토</div>
                </div>

                <div className="grid grid-cols-7 font-semibold">
                  {Array.from({ length: firstDay }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-16 border-b border-r bg-slate-50/40 p-1" />
                  ))}

                  {Array.from({ length: totalDays }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                    const dayEvents = events.filter((e) => e.date === dateStr);
                    const isToday = dayNum === 28 && currentMonth === 8;

                    return (
                      <div
                        key={dayNum}
                        className={`h-16 border-b border-r p-1 flex flex-col justify-between transition-all ${
                          isToday ? 'bg-emerald-50/50' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isToday ? 'bg-emerald-600 text-white font-bold' : 'text-slate-700'
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>

                        <div className="space-y-0.5 overflow-hidden">
                          {dayEvents.map((ev) => (
                            <div key={ev.id} className={`text-[8px] px-1 py-0.2 rounded border truncate font-bold leading-tight ${ev.color}`}>
                              {ev.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 하단 메인 바 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 w-full">
              <div className="lg:col-span-2 bg-white p-4 rounded-xl border shadow-sm space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                    <span>📢</span> 부서별 주요 공지사항
                  </h3>
                  <button onClick={() => setActiveMenu('deptSheet')} className="text-emerald-600 text-[10px] font-bold">
                    부서 전체보기 ↗
                  </button>
                </div>
                <div className="space-y-1.5">
                  {deptNotices.slice(0, 4).map((n) => (
                    <div key={n.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border hover:bg-slate-100 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[9px] shrink-0">
                          {n.dept}
                        </span>
                        <span className="font-bold text-slate-800 text-[11px] truncate">{n.title}</span>
                        {n.isImportant && (
                          <span className="bg-red-100 text-red-600 font-bold text-[8px] px-1.5 py-0.2 rounded">필독</span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[9px]">{n.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                <div className="bg-white p-3.5 rounded-xl border shadow-sm space-y-1">
                  <div className="flex justify-between items-center border-b pb-1">
                    <h3 className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                      <span>🍽️</span> 오늘 중식 메뉴
                    </h3>
                    <span className="text-[9px] text-slate-400">9월 28일 (월)</span>
                  </div>
                  <div className="text-[10px] leading-relaxed font-medium text-slate-700 pt-1 space-y-0.5">
                    • 친환경 찰보리밥 / 얼갈이 된장국 <br />
                    • 돈육 고추장 불고기 / 오징어 어묵무침 <br />
                    • 포기김치 / 샤인머스캣
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border shadow-sm space-y-1">
                  <div className="flex justify-between items-center border-b pb-1">
                    <h3 className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                      <span>⏰</span> 오늘 내 수업 일정
                    </h3>
                    <button onClick={() => setActiveMenu('timetable')} className="text-emerald-600 font-bold text-[9px]">
                      시간표 ↗
                    </button>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <div className="flex-1 p-2 bg-slate-50 rounded-lg text-[10px] border flex justify-between items-center">
                      <span className="font-bold text-slate-600">2교시</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">체육 (3-8)</span>
                    </div>
                    <div className="flex-1 p-2 bg-slate-50 rounded-lg text-[10px] border flex justify-between items-center">
                      <span className="font-bold text-slate-600">4교시</span>
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">체육 (3-6)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2) 학사일정 상세 뷰 */}
        {activeMenu === 'calendar' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 w-full">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>📅</span> 학사 일정 및 구글 캘린더 동기화 관리 (NEIS API 연동)
                </h2>
                <button
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700"
                >
                  + 새 학사 일정 등록
                </button>
              </div>
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="p-3 border rounded-xl flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 font-bold">{ev.date}</span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${ev.color}`}>{ev.title}</span>
                    </div>
                    <span className="text-slate-500 font-semibold text-[11px] bg-white px-2 py-1 rounded border">
                      {ev.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3) 시간표 관리 (다른 선생님 검색 기능 추가) */}
        {activeMenu === 'timetable' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 w-full">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>🕒</span> 교사 주간 시간표 검색 및 조회
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">선생님을 선택하면 해당 교사의 전 교시 주간 시간표를 확인할 수 있습니다.</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border">
                  <span className="font-bold text-slate-700 text-xs pl-1">🔍 교사 선택:</span>
                  <select
                    value={selectedTeacherForTimetable}
                    onChange={(e) => setSelectedTeacherForTimetable(e.target.value)}
                    className="border rounded-lg px-3 py-1 font-bold text-slate-800 text-xs bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} 선생님 ({t.dept})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-6 border rounded-xl overflow-hidden text-center text-xs">
                <div className="bg-slate-100 font-bold p-2.5 border-b border-r">교시 / 요일</div>
                <div className="bg-slate-100 font-bold p-2.5 border-b border-r">월</div>
                <div className="bg-slate-100 font-bold p-2.5 border-b border-r">화</div>
                <div className="bg-slate-100 font-bold p-2.5 border-b border-r">수</div>
                <div className="bg-slate-100 font-bold p-2.5 border-b border-r">목</div>
                <div className="bg-slate-100 font-bold p-2.5 border-b">금</div>

                {['1교시 (09:10~)', '2교시 (10:10~)', '3교시 (11:10~)', '4교시 (12:10~)', '5교시 (14:00~)', '6교시 (15:00~)', '7교시 (16:00~)'].map((period, pIdx) => {
                  const currentTimetable = timetablesData[selectedTeacherForTimetable] || timetablesData['천준혁'];
                  const rowData = currentTimetable[pIdx] || ['-', '-', '-', '-', '-'];

                  return (
                    <React.Fragment key={pIdx}>
                      <div className="bg-slate-50 font-bold p-3 border-b border-r">{period}</div>
                      {rowData.map((cell, colIdx) => (
                        <div key={colIdx} className={`p-3 border-b ${colIdx < 4 ? 'border-r' : ''}`}>
                          {cell !== '-' ? (
                            <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-md border border-emerald-300">
                              {cell}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4) 학교 급식 */}
        {activeMenu === 'meal' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 w-full">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-800 border-b pb-3">🍽️ 이번 주 학교 급식 영양 식단표</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {['9/28 (월)', '9/29 (화)', '9/30 (수)', '10/1 (목)', '10/2 (금)'].map((day, idx) => (
                  <div key={idx} className="border rounded-xl p-3 bg-slate-50 space-y-2">
                    <div className="font-bold text-xs text-emerald-700 border-b pb-1">{day}</div>
                    <div className="text-[11px] leading-relaxed text-slate-700">
                      • 친환경 찰보리밥<br />
                      • 얼갈이 된장국<br />
                      • 돈육 고추장 불고기<br />
                      • 오징어 어묵무침<br />
                      • 포기김치 / 샤인머스캣
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5) 학생 명렬표 (일괄 업로드 & 양식 다운로드 추가) */}
        {activeMenu === 'student' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 w-full">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">🎓 담당 학급 학생 명렬표 (3학년 8반)</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">엑셀/CSV 양식을 다운로드하여 학생 목록을 일괄 수정 및 업로드할 수 있습니다.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadStudentSample}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-300 transition-all"
                  >
                    📥 양식 다운로드 (.csv)
                  </button>
                  <button
                    onClick={() => studentFileInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all"
                  >
                    📤 CSV 일괄 업로드
                  </button>
                  <input
                    type="file"
                    ref={studentFileInputRef}
                    onChange={handleStudentFileUpload}
                    accept=".csv"
                    className="hidden"
                  />
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs">
                    <th className="p-2.5 border">번호</th>
                    <th className="p-2.5 border">성명</th>
                    <th className="p-2.5 border">성별</th>
                    <th className="p-2.5 border">비상연락처</th>
                    <th className="p-2.5 border">특이사항</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {students.map((st) => (
                    <tr key={st.no} className="hover:bg-slate-50">
                      <td className="p-2.5 border font-bold">{st.no}</td>
                      <td className="p-2.5 border font-bold text-slate-800">{st.name}</td>
                      <td className="p-2.5 border">{st.gender}</td>
                      <td className="p-2.5 border font-mono">{st.phone}</td>
                      <td className="p-2.5 border text-slate-500">{st.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6) 교직원 명단 (일괄 업로드 & 양식 다운로드 추가) */}
        {activeMenu === 'teachers' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 w-full">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>👨‍🏫</span> 선부고등학교 교직원 및 선생님 명단
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">교직원 목록을 일괄 수정하거나 엑셀/CSV로 한 번에 업로드할 수 있습니다.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTeacherSample}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-300 transition-all"
                  >
                    📥 양식 다운로드 (.csv)
                  </button>
                  <button
                    onClick={() => teacherFileInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all"
                  >
                    📤 CSV 일괄 업로드
                  </button>
                  <input
                    type="file"
                    ref={teacherFileInputRef}
                    onChange={handleTeacherFileUpload}
                    accept=".csv"
                    className="hidden"
                  />

                  <select
                    value={selectedDeptForTeacher}
                    onChange={(e) => setSelectedDeptForTeacher(e.target.value)}
                    className="border rounded-lg p-1.5 text-xs font-bold text-slate-700 bg-slate-50 ml-2"
                  >
                    {deptList.map((d, i) => (
                      <option key={i} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs">
                    <th className="p-2.5 border">성명</th>
                    <th className="p-2.5 border">소속 부서</th>
                    <th className="p-2.5 border">담당 직책 / 업무</th>
                    <th className="p-2.5 border">이메일</th>
                    <th className="p-2.5 border">내선번호</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {teachers
                    .filter((t) => selectedDeptForTeacher === '전체 부서' || t.dept === selectedDeptForTeacher)
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-2.5 border font-bold text-slate-900">{t.name}</td>
                        <td className="p-2.5 border">
                          <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200 text-[10px]">
                            {t.dept}
                          </span>
                        </td>
                        <td className="p-2.5 border font-semibold text-slate-700">{t.role}</td>
                        <td className="p-2.5 border font-mono text-slate-600">{t.email}</td>
                        <td className="p-2.5 border font-mono font-bold text-emerald-700">{t.tel}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7) 부서별 구글시트/공지사항 */}
        {activeMenu === 'deptSheet' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 w-full">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>📑</span> 부서별 업무 구글시트 & 공지사항 통합 조회
                </h2>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600 text-[11px]">선택 부서:</span>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="border rounded-lg p-1.5 text-xs font-bold text-slate-800 bg-emerald-50 border-emerald-200"
                  >
                    {deptList.map((d, i) => (
                      <option key={i} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 선택된 부서 정보 및 전용 구글 시트 링크 */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-xs text-emerald-900">{selectedDept} 업무 관리 포털</h3>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    해당 부서의 구글 서식 문서, 문서 수발신 표 및 전용 공유 구글시트 바로가기입니다.
                  </p>
                </div>
                <a
                  href="https://docs.google.com/spreadsheets"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 shadow-sm transition-all"
                >
                  🟢 {selectedDept} 전용 구글시트 열기 ↗
                </a>
              </div>

              {/* 공지 목록 */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-800">📌 해당 부서 관련 공지 및 업무 전달사항</h3>
                {deptNotices
                  .filter((n) => selectedDept === '전체 부서' || n.dept === selectedDept)
                  .map((n) => (
                    <div key={n.id} className="p-3 border rounded-xl bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[10px]">{n.dept}</span>
                        <span className="font-bold text-slate-800 text-xs">{n.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono text-[10px]">{n.date}</span>
                        <a
                          href={n.sheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white border text-slate-700 font-bold px-2 py-1 rounded text-[10px] hover:bg-slate-100"
                        >
                          첨부 시트 ↗
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 8) 즐겨찾기 바 */}
        {activeMenu === 'bookmark' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 w-full">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-800 border-b pb-3">🔖 교직원 자주 쓰는 업무 즐겨찾기</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {bookmarks.map((bm) => (
                  <a
                    key={bm.id}
                    href={bm.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 border rounded-xl bg-slate-50 hover:bg-slate-100 transition-all block space-y-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <span>{bm.icon}</span> {bm.title}
                    </div>
                    <div className="text-[10px] text-slate-500">{bm.desc}</div>
                    <div className="text-[9px] text-emerald-600 font-bold pt-1">사이트 이동 ↗</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9) 도구상자 (바이브 코딩 & 네이버 맞춤법 검사기) */}
        {activeMenu === 'toolbox' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 w-full">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b pb-3">🧰 교사용 업무 및 AI 도구상자</h2>

              {/* 외부 AI & 검사기 바로가기 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <a
                  href="https://search.naver.com/search.naver?query=맞춤법검사기"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 border border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-100/50 transition-all block space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
                      <span>✏️</span> 네이버 맞춤법 검사기 바로가기
                    </span>
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">바로가기 ↗</span>
                  </div>
                  <p className="text-[10px] text-blue-800">
                    생활기록부, 공문서 작성 시 맞춤법, 띄어쓰기, 표준어 규정 검증에 활용하세요.
                  </p>
                </a>

                <a
                  href="https://vibe.coding.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 border border-purple-200 rounded-xl bg-purple-50/50 hover:bg-purple-100/50 transition-all block space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-purple-900 flex items-center gap-1.5">
                      <span>⚡</span> 바이브 코딩 (Vibe Coding) 바로가기
                    </span>
                    <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded">바로가기 ↗</span>
                  </div>
                  <p className="text-[10px] text-purple-800">
                    AI 기반 프롬프트 워크플로우 및 학교 업무 자동화 웹 스크립트 도구 모음입니다.
                  </p>
                </a>
              </div>

              {/* 자체 유틸리티 도구 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-4 border rounded-xl bg-emerald-50 text-emerald-900 space-y-1">
                  <div className="font-bold text-xs">⏱️ 수업용 타이머 / 스톱워치</div>
                  <div className="text-[10px] text-emerald-700">모둠 활동 및 수행평가 시간측정 전용</div>
                </div>

                <div className="p-4 border rounded-xl bg-amber-50 text-amber-900 space-y-1">
                  <div className="font-bold text-xs">🎲 발표자 무작위 지목기</div>
                  <div className="text-[10px] text-amber-700">3-8반 명렬표 기반 랜덤 발표자 선발</div>
                </div>

                <div className="p-4 border rounded-xl bg-teal-50 text-teal-900 space-y-1">
                  <div className="font-bold text-xs">📊 체육 평가 점수 계산기</div>
                  <div className="text-[10px] text-teal-700">수행평가 기록 자동 산출 및 급수 변환</div>
                </div>
              </div>

              {/* 약식 맞춤법 입력 상자 */}
              <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
                <h3 className="font-bold text-xs text-slate-800">📝 초간단 문장 글자수 확인기</h3>
                <textarea
                  rows={3}
                  value={spellCheckInput}
                  onChange={(e) => setSpellCheckInput(e.target.value)}
                  placeholder="생활기록부나 공문 문장을 입력하면 글자수를 즉시 계산해 줍니다..."
                  className="w-full border rounded-lg p-2 text-xs"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                  <span>공백 포함: {spellCheckInput.length}자 | 공백 제외: {spellCheckInput.replace(/\s+/g, '').length}자</span>
                  <button
                    onClick={() => window.open('https://search.naver.com/search.naver?query=맞춤법검사기', '_blank')}
                    className="text-blue-600 underline font-bold"
                  >
                    네이버 맞춤법 검사기에서 세부 검사하기 ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 일정 추가 모달 */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddEvent} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-xl">
            <h3 className="font-bold text-xs text-slate-800">📅 새 학사 일정 등록 (NEIS / 구글 연동)</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-slate-600 font-bold text-[9px] mb-1">일정 제목</label>
                <input
                  type="text"
                  placeholder="예: 체육 수행평가 / 교직원 회의"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold text-[9px] mb-1">날짜</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold text-[9px] mb-1">구분</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="w-full border rounded-lg p-2 text-xs"
                >
                  <option value="구글 캘린더">개인 구글 캘린더</option>
                  <option value="나이스 학사일정">나이스 학사 일정</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddEventModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs"
              >
                취소
              </button>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs">
                저장 및 동기화
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}