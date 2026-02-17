
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Book, UserProfile, AppState } from './types';
import { 
  calculateDayCount, 
  formatNalDuDate, 
  calculatePageRange, 
  getTodayStr 
} from './utils';
import { 
  Plus, 
  Settings, 
  BookOpen, 
  Copy, 
  CheckCircle, 
  Trash2, 
  Edit3,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  Cloud,
  CloudOff,
  CloudSync,
  Info,
  Quote,
  Sparkles
} from 'lucide-react';
// Fix: Import subDays and format from their respective sub-modules to resolve import errors
import format from 'date-fns/format';
import subDays from 'date-fns/subDays';

const STORAGE_KEY = 'nal_du_reading_data_v2';

const DAILY_QUOTES = [
  "독서는 마음의 양식이며, 지혜의 샘입니다.",
  "오늘의 독서가 내일의 나를 만듭니다.",
  "책 속에 길이 있고, 그 길 끝에 내가 있습니다.",
  "한 권의 책이 당신의 인생을 바꿀 수 있습니다.",
  "천천히 읽는 것을 두려워 말고, 멈추는 것을 두려워하세요.",
  "독서는 완성된 사람을 만들고, 담소는 재치 있는 사람을 만듭니다.",
  "성공한 사람들의 유일한 공통점은 바로 독서 습관입니다.",
  "책을 읽는다는 것은 과거의 가장 훌륭한 사람들과 대화하는 것입니다.",
  "독서는 영혼을 위한 운동입니다.",
  "나를 만든 것은 마을의 작은 도서관이었다. - 빌 게이츠",
  "책은 가장 조용하고 변함없는 친구입니다.",
  "어제보다 더 나은 내가 되는 가장 쉬운 방법, 독서입니다.",
  "한 문장이라도 좋습니다. 오늘의 꾸준함이 위대함을 만듭니다.",
  "독서는 앉아서 하는 여행이며, 여행은 서서 하는 독서입니다.",
  "좋은 책을 읽지 않는 사람은 글을 읽지 못하는 사람보다 나을 게 없습니다.",
  "독서의 즐거움을 아는 사람은 결코 혼자가 아닙니다.",
  "책은 세상이라는 바다를 건너게 해주는 등대입니다.",
  "오늘 읽은 페이지가 내일의 통찰력이 됩니다.",
  "가장 적은 비용으로 가장 큰 세계를 만나는 방법, 독서.",
  "독서 습관은 당신의 인생을 지키는 가장 튼튼한 성벽입니다.",
  "책은 펼치기 전까지는 종이 뭉치에 불과하지만, 펼치면 마법이 됩니다.",
  "지혜는 학교에서 배우는 것이 아니라, 평생의 독서로 얻는 것입니다.",
  "독서는 정신의 빛입니다.",
  "하루라도 책을 읽지 않으면 입안에 가시가 돋는다. - 안중근",
  "책은 당신을 더 넓은 세상으로 데려다주는 티켓입니다.",
  "독서의 목적은 지식을 쌓는 것이 아니라, 생각하는 힘을 기르는 것입니다.",
  "위대한 독자가 위대한 지도자를 만듭니다.",
  "책 읽는 습관은 인생의 모든 시련을 이겨낼 힘을 줍니다.",
  "당신의 서재가 당신이 누구인지 말해줍니다.",
  "꾸준함이 실력을 이기고, 독서가 인생을 이깁니다."
];

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncFileHandleRef = useRef<FileSystemFileHandle | null>(null);

  // --- 초기 데이터 설정 ---
  const getDefaultState = (): AppState => {
    const today = new Date();
    const habitStart = format(subDays(today, 1023), 'yyyy-MM-dd');
    const book1Start = format(subDays(today, 292), 'yyyy-MM-dd');
    const book2Start = format(subDays(today, 47), 'yyyy-MM-dd');

    return {
      profile: { 
        name: '이현우', 
        habitStartDate: habitStart 
      },
      books: [
        {
          id: '1',
          title: '서양미술사',
          startDate: book1Start,
          startPage: 4,
          pagesPerDay: 2
        },
        {
          id: '2',
          title: '나는 어떤 인생을 살고 싶은가',
          startDate: book2Start,
          startPage: 4,
          pagesPerDay: 2
        }
      ]
    };
  };

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return getDefaultState();
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);

  // 날짜 기반으로 초기 문장 선택 로직
  const getDailyQuote = useCallback(() => {
    const today = new Date();
    const index = (today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate()) % DAILY_QUOTES.length;
    return DAILY_QUOTES[index];
  }, []);

  const [currentQuote, setCurrentQuote] = useState(getDailyQuote());
  const [isQuoteRefreshing, setIsQuoteRefreshing] = useState(false);

  const refreshQuote = useCallback(() => {
    setIsQuoteRefreshing(true);
    setTimeout(() => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * DAILY_QUOTES.length);
      } while (DAILY_QUOTES[nextIndex] === currentQuote);
      setCurrentQuote(DAILY_QUOTES[nextIndex]);
      setIsQuoteRefreshing(false);
    }, 400);
  }, [currentQuote]);

  // --- 자동 저장 및 동기화 로직 ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    if (syncEnabled && syncFileHandleRef.current) {
      saveToSyncFile(state);
    }
  }, [state, syncEnabled]);

  const saveToSyncFile = async (data: AppState) => {
    if (!syncFileHandleRef.current) return;
    try {
      setIsSyncing(true);
      const writable = await syncFileHandleRef.current.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      setTimeout(() => setIsSyncing(false), 800);
    } catch (err) {
      console.error('파일 동기화 실패:', err);
      setIsSyncing(false);
      setSyncEnabled(false);
    }
  };

  const enableSync = async () => {
    try {
      // @ts-ignore: File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName: 'naldu_sync_data.json',
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      syncFileHandleRef.current = handle;
      setSyncEnabled(true);
      saveToSyncFile(state);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        alert('동기화 설정을 취소했습니다.');
      }
    }
  };

  // --- 도서 및 프로필 핸들러 ---
  const handleAddOrUpdateBook = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBook: Book = {
      id: editingBook?.id || crypto.randomUUID(),
      title: formData.get('title') as string,
      startDate: formData.get('startDate') as string,
      startPage: parseInt(formData.get('startPage') as string, 10),
      pagesPerDay: parseInt(formData.get('pagesPerDay') as string, 10),
    };

    setState(prev => ({
      ...prev,
      books: editingBook 
        ? prev.books.map(b => b.id === editingBook.id ? newBook : b)
        : [...prev.books, newBook]
    }));
    
    setIsAddModalOpen(false);
    setEditingBook(null);
  };

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setState(prev => ({
      ...prev,
      profile: {
        name: formData.get('userName') as string,
        habitStartDate: formData.get('habitStartDate') as string
      }
    }));
    setIsSettingsOpen(false);
  };

  const deleteBook = (id: string) => {
    if (confirm('이 도서를 삭제하시겠습니까?')) {
      setState(prev => ({ ...prev, books: prev.books.filter(b => b.id !== id) }));
    }
  };

  const copyToClipboard = useCallback(() => {
    const today = new Date();
    const habitDays = calculateDayCount(state.profile.habitStartDate, today);
    const dateFormatted = formatNalDuDate(today);

    let text = `${state.profile.name}의 날두독서 습관을 실행한지 ${habitDays.toLocaleString()}일째 ${dateFormatted}\n\n`;

    state.books.forEach(book => {
      const bookDays = calculateDayCount(book.startDate, today);
      const { start, end } = calculatePageRange(book.startPage, bookDays, book.pagesPerDay);
      text += `${bookDays}일차 <${book.title}> ${start}~${end}p 독서완료\n`;
    });

    text += `\n성장에 성공!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [state]);

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `naldu_backup_${getTodayStr()}.json`);
    linkElement.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        if (importedState.profile && importedState.books) {
          if (confirm('데이터를 불러오시겠습니까? 현재 데이터가 덮어씌워집니다.')) {
            setState(importedState);
            setIsSettingsOpen(false);
          }
        }
      } catch (err) {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    fileReader.readAsText(file);
  };

  const today = new Date();
  const globalHabitDays = calculateDayCount(state.profile.habitStartDate, today);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-24 font-sans text-slate-900">
      <div className="w-full max-w-xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">날두독서 관리</h1>
              <p className="text-slate-400 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                Reading Tracker
                {syncEnabled && (
                  <span className="flex items-center gap-1 text-emerald-500 lowercase">
                    <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isSyncing ? 'animate-ping' : ''}`}></span>
                    {isSyncing ? 'Syncing...' : 'Synced'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-white rounded-xl shadow-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              {syncEnabled ? <Cloud className="text-emerald-500" size={18} /> : <CloudOff className="text-slate-300" size={18} />}
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Global Progress Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-100/80 mb-3">
              <Calendar size={16} />
              <span className="text-sm font-bold tracking-wide">SINCE {state.profile.habitStartDate}</span>
            </div>
            <div className="text-sm font-medium text-indigo-200 mb-1">꾸준함의 기록</div>
            <h2 className="text-5xl font-black tracking-tighter mb-4">
              {globalHabitDays.toLocaleString()}<span className="text-xl font-bold ml-2 text-indigo-200">일째</span>
            </h2>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-100 mb-2">
                <span>오늘의 성취도</span>
                <span>{state.books.length > 0 ? '진행 중' : '도서 없음'}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 w-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
              </div>
            </div>
          </div>
          <div className="absolute -right-16 -bottom-16 text-white/5 rotate-12">
            <BookOpen size={280} />
          </div>
        </div>

        {/* Daily Quote Card */}
        <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm mb-8 flex items-start gap-4 relative overflow-hidden group">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all cursor-pointer" onClick={refreshQuote}>
            <Quote size={20} className={`text-indigo-500 group-hover:text-white transition-all ${isQuoteRefreshing ? 'rotate-180 scale-75' : ''}`} />
          </div>
          <div className="relative z-10 flex-1">
            <div className="flex justify-between items-start">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Sparkles size={10} /> 오늘의 문장
              </div>
              <button onClick={refreshQuote} className="p-1 text-indigo-200 hover:text-indigo-400 transition-colors rounded-lg">
                <RefreshCw size={12} className={isQuoteRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className={`text-slate-700 font-bold leading-relaxed text-sm italic transition-all duration-300 ${isQuoteRefreshing ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}`}>
              "{currentQuote}"
            </p>
          </div>
          <div className="absolute top-0 right-0 p-4 text-indigo-50 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
            <Quote size={60} />
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            내 서재
            <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full">{state.books.length}</span>
          </h3>
          <button 
            onClick={() => { setEditingBook(null); setIsAddModalOpen(true); }}
            className="flex items-center gap-2 text-sm bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus size={18} /> 도서 추가
          </button>
        </div>

        {/* Book List */}
        <div className="space-y-4">
          {state.books.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-slate-200" size={32} />
              </div>
              <p className="text-slate-400 font-bold">읽고 싶은 책을 등록하고<br/>오늘의 분량을 확인하세요!</p>
            </div>
          ) : (
            state.books.map(book => {
              const bookDays = calculateDayCount(book.startDate, today);
              const { start, end } = calculatePageRange(book.startPage, bookDays, book.pagesPerDay);
              return (
                <div key={book.id} className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">Active</span>
                        <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{book.startDate} 시작</span>
                      </div>
                      <h4 className="font-bold text-xl text-slate-900 leading-tight">
                        &lt;{book.title}&gt;
                      </h4>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingBook(book); setIsAddModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => deleteBook(book.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">독서 진행</div>
                      <div className="text-2xl font-black text-indigo-600">{bookDays}<span className="text-xs font-bold text-indigo-400 ml-1">일차</span></div>
                    </div>
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">오늘의 목표</div>
                      <div className="text-lg font-black text-indigo-900">{start}~{end}<span className="text-xs font-bold ml-1 text-indigo-400">p</span></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Copy Button */}
      {state.books.length > 0 && (
        <div className="fixed bottom-8 w-full max-w-xl px-4 z-40">
          <button 
            onClick={copyToClipboard}
            disabled={copied}
            className={`w-full py-5 rounded-[1.5rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
              copied 
                ? 'bg-emerald-500 text-white shadow-emerald-200' 
                : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'
            }`}
          >
            {copied ? <CheckCircle size={24} /> : <Copy size={24} />}
            {copied ? '클립보드 복사 완료!' : '기록 복사하고 성장에 성공!'}
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 text-slate-900">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tight">환경 설정 및 데이터</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">닫기</button>
            </div>

            <div className="space-y-6 pb-4">
              {/* Today's Quote Refresh Section */}
              <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                    <Sparkles size={16} /> 오늘의 문장 관리
                  </h4>
                  <button 
                    onClick={refreshQuote}
                    disabled={isQuoteRefreshing}
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-xs font-black text-indigo-600 shadow-sm hover:shadow-md transition-all active:scale-95"
                  >
                    <RefreshCw size={14} className={isQuoteRefreshing ? 'animate-spin' : ''} />
                    새로고침
                  </button>
                </div>
                <div className="bg-white rounded-xl p-4 text-xs text-slate-500 italic border border-indigo-100">
                  "{currentQuote}"
                </div>
              </div>

              {/* Profile Section */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} /> 개인 정보
                  </h4>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">사용자 이름</label>
                    <input name="userName" defaultValue={state.profile.name} required className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">전체 습관 시작일</label>
                    <input name="habitStartDate" type="date" defaultValue={state.profile.habitStartDate} required className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">프로필 저장</button>
                </div>
              </form>

              {/* Sync Guide & Action */}
              <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                    <Cloud size={18} /> 구글 드라이브 연동
                  </h4>
                  <button 
                    onClick={syncEnabled ? () => setSyncEnabled(false) : enableSync}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${syncEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${syncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                <div className="bg-white/50 rounded-2xl p-4 mb-4">
                  <div className="flex gap-3 text-xs text-emerald-900 leading-relaxed">
                    <Info size={28} className="shrink-0 text-emerald-600" />
                    <p>
                      <strong>자동 동기화 방법:</strong><br/>
                      PC의 <strong>'구글 드라이브 데스크톱'</strong> 폴더 내에 파일을 생성해두면, 앱에서 저장할 때마다 클라우드에 즉시 백업됩니다.
                    </p>
                  </div>
                </div>

                {syncEnabled && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    <CheckCircle size={14} /> 현재 실시간 파일 동기화 중
                  </div>
                )}
              </div>

              {/* Backup Actions */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">수동 데이터 관리</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={exportData} className="flex flex-col items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm">
                    <Download size={18} /> 백업 받기
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm">
                    <Upload size={18} /> 백업 복구
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 text-slate-900">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black mb-8 tracking-tight">{editingBook ? '도서 정보 수정' : '새 도서 등록'}</h3>
            <form onSubmit={handleAddOrUpdateBook} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">도서 제목</label>
                <input name="title" defaultValue={editingBook?.title} required placeholder="서양미술사" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">독서 시작일</label>
                  <input name="startDate" type="date" defaultValue={editingBook?.startDate || getTodayStr()} required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">시작 페이지</label>
                  <input name="startPage" type="number" min="1" defaultValue={editingBook?.startPage || 1} required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">일일 독서량 (페이지)</label>
                <input name="pagesPerDay" type="number" min="1" defaultValue={editingBook?.pagesPerDay || 2} required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-colors">취소</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100">저장 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;