'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditBookPage() {
    const { status } = useSession()
    const router = useRouter()
    const params = useParams()
    const bookId = params.id as string

    const [book, setBook] = useState<Book | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        async function fetchBook() {
            try {
                const res = await fetch(`/api/books/${bookId}`)
                if (res.ok) {
                    const data = await res.json()
                    setBook(data)
                } else {
                    setError('책을 찾을 수 없습니다.')
                }
            } catch (err) {
                console.error('Failed to fetch book:', err)
                setError('책 정보를 불러오는데 실패했습니다.')
            } finally {
                setLoading(false)
            }
        }

        if (status === 'authenticated' && bookId) {
            fetchBook()
        }
    }, [status, bookId])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setSaving(true)

        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const startDate = formData.get('startDate') as string
        const startPage = formData.get('startPage') as string
        const totalPages = formData.get('totalPages') as string

        try {
            const res = await fetch(`/api/books/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    startDate,
                    startPage: Number(startPage),
                    totalPages: Number(totalPages),
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || '책 수정에 실패했습니다.')
            } else {
                router.push('/books')
            }
        } catch {
            setError('책 수정 중 오류가 발생했습니다.')
        } finally {
            setSaving(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
                <div className="text-white text-xl">로딩 중...</div>
            </div>
        )
    }

    if (!book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
                <div className="text-center">
                    <p className="text-white text-xl mb-4">{error || '책을 찾을 수 없습니다.'}</p>
                    <Link href="/books" className="text-pink-400 hover:text-pink-300">
                        책 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        )
    }

    const startDate = new Date(book.startDate).toISOString().split('T')[0]

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 py-8 px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                <div className="flex items-center gap-4">
                    <Link href="/books" className="text-white/70 hover:text-white text-2xl">←</Link>
                    <h1 className="text-2xl font-bold text-white">책 수정</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-red-300 bg-red-500/20 rounded-lg border border-red-500/30">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-white/80 mb-2">
                            책 제목
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            required
                            defaultValue={book.title}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-white/80 mb-2">
                            시작일 📅
                        </label>
                        <input
                            id="startDate"
                            name="startDate"
                            type="date"
                            required
                            defaultValue={startDate}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition [color-scheme:dark]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startPage" className="block text-sm font-medium text-white/80 mb-2">
                                시작 페이지
                            </label>
                            <input
                                id="startPage"
                                name="startPage"
                                type="number"
                                required
                                min={1}
                                defaultValue={book.startPage}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="totalPages" className="block text-sm font-medium text-white/80 mb-2">
                                총 페이지
                            </label>
                            <input
                                id="totalPages"
                                name="totalPages"
                                type="number"
                                required
                                min={1}
                                defaultValue={book.totalPages}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/books')}
                            className="flex-1 py-3 px-4 bg-white/10 text-white/70 font-semibold rounded-lg hover:bg-white/20 transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {saving ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
