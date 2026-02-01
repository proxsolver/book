'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'

interface Book {
  id: string
  title: string
  startDate: string
  startPage: number
  totalPages: number
  isActive: boolean
  readingLogs: { id: string; date: string; startPage: number; endPage: number; memo: string | null }[]
}

function getKSTDate() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const kst = new Date(utc + 540 * 60000)
  return kst
}

function getKSTToday() {
  const kst = getKSTDate()
  kst.setHours(0, 0, 0, 0)
  return kst
}

function getKSTDateOnly() {
  return getKSTToday().toISOString().split('T')[0]
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [certText, setCertText] = useState('')
  const [loading, setLoading] = useState(true)
  const [todayReadingStatus, setTodayReadingStatus] = useState<Record<string, boolean>>({})
  const [memos, setMemos] = useState<Record<string, string>>({})
  const [includeMemo, setIncludeMemo] = useState(true)
  const [copied, setCopied] = useState(false)
  const currentDateRef = useRef<string>(getKSTDateOnly())

  const fetchCertification = useCallback(async () => {
    try {
      const res = await fetch('/api/certification?includeMemo=' + includeMemo)
      const data = await res.json()
      if (data.text) {
        setCertText(data.text)
      }
    } catch (err) {
      console.error('Failed to fetch certification:', err)
    }
  }, [includeMemo])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchData = useCallback(async () => {
    try {
      const todayKST = getKSTDateOnly()

      const [booksRes, readingsRes, certRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/readings?date=' + todayKST),
        fetch('/api/certification?includeMemo=' + includeMemo)
      ])

      const [booksData, readingsData, certData] = await Promise.all([
        booksRes.json(),
        readingsRes.json(),
        certRes.json()
      ])

      setBooks(booksData)

      const status: Record<string, boolean> = {}
      const memoData: Record<string, string> = {}
      for (const log of readingsData) {
        status[log.bookId] = true
        if (log.memo) memoData[log.bookId] = log.memo
      }
      setTodayReadingStatus(status)
      setMemos(memoData)

      if (certData.text) {
        setCertText(certData.text)
      }

      currentDateRef.current = todayKST
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [includeMemo])

  useEffect(() => {
    if (status !== 'authenticated') return

    fetchData()

    const interval = setInterval(() => {
      const todayKST = getKSTDateOnly()
      if (todayKST !== currentDateRef.current) {
        fetchData()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [status, includeMemo, fetchData])

  async function handleReadingComplete(bookId: string, startPage: number, endPage: number) {
    const todayKST = getKSTDateOnly()
    const memo = memos[bookId] || ''

    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, date: todayKST, startPage, endPage, memo }),
      })

      if (res.ok) {
        setTodayReadingStatus(prev => ({ ...prev, [bookId]: true }))

        const certRes = await fetch('/api/certification?includeMemo=' + includeMemo)
        const certData = await certRes.json()
        if (certData.text) {
          setCertText(certData.text)

          if (session?.user?.id && session?.user?.name) {
            fetch('/api/leaderboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.user.id,
                userName: session.user.name,
                certText: certData.text,
              }),
            }).catch(err => console.error('Failed to post to leaderboard:', err))
          }
        }
      }
    } catch (err) {
      console.error('Failed to save reading:', err)
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(certText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  function getTodayPages(book: Book) {
    const today = getKSTToday()
    const bookStart = new Date(book.startDate)
    bookStart.setHours(0, 0, 0, 0)
    const bookDays = Math.floor((today.getTime() - bookStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const startPage = book.startPage + (bookDays - 1) * 2
    const endPage = startPage + 1
    return { bookDays, startPage, endPage }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">오늘 읽을 책</h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/books')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                📋 책 관리
              </button>
              <button
                onClick={() => router.push('/books/new')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition shadow-lg"
              >
                + 책 추가
              </button>
            </div>
          </div>

          {books.filter(b => b.isActive).length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/20">
              <p className="text-white/70">등록된 책이 없습니다. 책을 추가해주세요.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {books.filter(b => b.isActive).map(book => {
                const { bookDays, startPage, endPage } = getTodayPages(book)
                const isCompleted = todayReadingStatus[book.id]
                const progress = Math.min(100, Math.round(((startPage - book.startPage) / (book.totalPages - book.startPage)) * 100))

                return (
                  <div
                    key={book.id}
                    className={isCompleted ? 'bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-emerald-500/50 bg-emerald-500/10 transition-all' : 'bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-white/20 transition-all'}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          {book.title}
                          {isCompleted && <span className="text-emerald-400">✓</span>}
                        </h3>
                        <p className="text-white/60 text-sm">{bookDays}일차 · {startPage}-{endPage}p</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-400">{progress}%</span>
                        <p className="text-white/50 text-xs">진행률</p>
                      </div>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: progress + '%' }}
                      />
                    </div>

                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="메모 (선택사항)"
                        value={memos[book.id] || ''}
                        onChange={e => setMemos(prev => ({ ...prev, [book.id]: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <button
                      onClick={() => handleReadingComplete(book.id, startPage, endPage)}
                      disabled={isCompleted}
                      className={isCompleted ? 'w-full py-3 rounded-lg font-semibold bg-emerald-500/20 text-emerald-400 cursor-default transition-all' : 'w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all'}
                    >
                      {isCompleted ? '✓ 완료!' : '독서 완료'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/leaderboard')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              🏆 인증 리더보드
            </button>
          </div>
        </section>

        <section className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">인증 텍스트</h2>
            <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeMemo}
                onChange={e => setIncludeMemo(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              메모 포함
            </label>
          </div>

          <pre className="w-full p-4 bg-black/30 rounded-lg text-white/90 text-sm whitespace-pre-wrap mb-4 font-mono">
            {certText || '책을 추가하고 독서를 완료하면 인증 텍스트가 생성됩니다.'}
          </pre>

          <button
            onClick={copyToClipboard}
            className={copied ? 'w-full py-3 rounded-lg font-semibold bg-emerald-500 text-white transition-all' : 'w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all'}
          >
            {copied ? '✓ 복사됨!' : '📋 클립보드에 복사'}
          </button>
        </section>
      </div>
    </div>
  )
}
