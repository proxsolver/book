'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

interface Book {
  id: string
  title: string
  startDate: string
  startPage: number
  totalPages: number
  isActive: boolean
  readingLogs: { id: string; date: string; startPage: number; endPage: number; memo: string | null }[]
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

  const fetchCertification = useCallback(async () => {
    try {
      const res = await fetch(`/api/certification?includeMemo=${includeMemo}`)
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

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await fetch('/api/books')
        const data = await res.json()
        setBooks(data)

        // Check today's reading status
        const today = new Date().toISOString().split('T')[0]
        const res2 = await fetch(`/api/readings?date=${today}`)
        const logs = await res2.json()
        const status: Record<string, boolean> = {}
        const memoData: Record<string, string> = {}
        for (const log of logs) {
          status[log.bookId] = true
          if (log.memo) memoData[log.bookId] = log.memo
        }
        setTodayReadingStatus(status)
        setMemos(memoData)
      } catch (err) {
        console.error('Failed to fetch books:', err)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchBooks()
      fetchCertification()
    }
  }, [status, fetchCertification])

  async function handleReadingComplete(bookId: string, startPage: number, endPage: number) {
    const today = new Date().toISOString().split('T')[0]
    const memo = memos[bookId] || ''

    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, date: today, startPage, endPage, memo }),
      })

      if (res.ok) {
        setTodayReadingStatus(prev => ({ ...prev, [bookId]: true }))
        await fetchCertification()
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

  // 오늘 읽어야 할 페이지 계산
  function getTodayPages(book: Book) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const bookStart = new Date(book.startDate)
    bookStart.setHours(0, 0, 0, 0)
    const bookDays = Math.floor((today.getTime() - bookStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const startPage = book.startPage + (bookDays - 1) * 2
    const endPage = startPage + 1
    return { bookDays, startPage, endPage }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">📚 날두독서</h1>
          <div className="flex items-center gap-4">
            <span className="text-white/70">{session?.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              로그아웃
            </button>
          </div>
        </header>

        {/* Today's Reading */}
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
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition shadow-lg"
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
                    className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border transition-all ${isCompleted ? 'border-green-500/50 bg-green-500/10' : 'border-white/20'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          {book.title}
                          {isCompleted && <span className="text-green-400">✓</span>}
                        </h3>
                        <p className="text-white/60 text-sm">{bookDays}일차 · {startPage}-{endPage}p</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-pink-400">{progress}%</span>
                        <p className="text-white/50 text-xs">진행률</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Memo input */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="메모 (선택사항)"
                        value={memos[book.id] || ''}
                        onChange={e => setMemos(prev => ({ ...prev, [book.id]: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>

                    {/* Complete button */}
                    <button
                      onClick={() => handleReadingComplete(book.id, startPage, endPage)}
                      disabled={isCompleted}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${isCompleted
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg'
                        }`}
                    >
                      {isCompleted ? '✓ 완료!' : '독서 완료'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Certification Text */}
        <section className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">인증 텍스트</h2>
            <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeMemo}
                onChange={e => setIncludeMemo(e.target.checked)}
                className="w-4 h-4 rounded accent-pink-500"
              />
              메모 포함
            </label>
          </div>

          <pre className="w-full p-4 bg-black/30 rounded-lg text-white/90 text-sm whitespace-pre-wrap mb-4 font-mono">
            {certText || '책을 추가하고 독서를 완료하면 인증 텍스트가 생성됩니다.'}
          </pre>

          <button
            onClick={copyToClipboard}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${copied
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg'
              }`}
          >
            {copied ? '✓ 복사됨!' : '📋 클립보드에 복사'}
          </button>
        </section>
      </div>
    </div>
  )
}
