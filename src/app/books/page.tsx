'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Book {
    id: string
    title: string
    startDate: string
    startPage: number
    totalPages: number
    isActive: boolean
}

export default function BooksPage() {
    const { status } = useSession()
    const router = useRouter()
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)

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
            } catch (err) {
                console.error('Failed to fetch books:', err)
            } finally {
                setLoading(false)
            }
        }

        if (status === 'authenticated') {
            fetchBooks()
        }
    }, [status])

    async function handleToggleActive(bookId: string, currentStatus: boolean) {
        try {
            const res = await fetch(`/api/books/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            })

            if (res.ok) {
                setBooks(prev =>
                    prev.map(book =>
                        book.id === bookId ? { ...book, isActive: !currentStatus } : book
                    )
                )
            }
        } catch (err) {
            console.error('Failed to toggle book status:', err)
        }
    }

    async function handleDelete(bookId: string, title: string) {
        if (!confirm(`"${title}" 책을 삭제하시겠습니까?\n모든 독서 기록도 함께 삭제됩니다.`)) {
            return
        }

        try {
            const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })

            if (res.ok) {
                setBooks(prev => prev.filter(book => book.id !== bookId))
            }
        } catch (err) {
            console.error('Failed to delete book:', err)
        }
    }

    function getProgress(book: Book) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const bookStart = new Date(book.startDate)
        bookStart.setHours(0, 0, 0, 0)
        const bookDays = Math.floor((today.getTime() - bookStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const currentPage = book.startPage + bookDays * 2 - 1
        return Math.min(100, Math.round(((currentPage - book.startPage) / (book.totalPages - book.startPage)) * 100))
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
                <div className="text-white text-xl">로딩 중...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-white/70 hover:text-white text-2xl">←</Link>
                        <h1 className="text-2xl font-bold text-white">📚 책 관리</h1>
                    </div>
                    <button
                        onClick={() => router.push('/books/new')}
                        className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition shadow-lg"
                    >
                        + 책 추가
                    </button>
                </header>

                {/* Book List */}
                {books.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/20">
                        <p className="text-white/70 mb-4">등록된 책이 없습니다.</p>
                        <button
                            onClick={() => router.push('/books/new')}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg shadow-lg"
                        >
                            첫 번째 책 추가하기
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {books.map(book => {
                            const progress = getProgress(book)
                            const startDate = new Date(book.startDate).toLocaleDateString('ko-KR')

                            return (
                                <div
                                    key={book.id}
                                    className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border transition-all ${book.isActive ? 'border-white/20' : 'border-white/10 opacity-60'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                {book.title}
                                                {!book.isActive && (
                                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">비활성</span>
                                                )}
                                            </h3>
                                            <p className="text-white/60 text-sm mt-1">
                                                시작: {startDate} · {book.startPage}p ~ {book.totalPages}p
                                            </p>
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

                                    {/* Actions */}
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleToggleActive(book.id, book.isActive)}
                                            className={`px-4 py-2 rounded-lg text-sm transition ${book.isActive
                                                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                }`}
                                        >
                                            {book.isActive ? '비활성화' : '활성화'}
                                        </button>
                                        <button
                                            onClick={() => router.push(`/books/${book.id}/edit`)}
                                            className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-lg text-sm transition"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => handleDelete(book.id, book.title)}
                                            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
