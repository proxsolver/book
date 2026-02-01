'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewBookPage() {
    const router = useRouter()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const startDate = formData.get('startDate') as string
        const startPage = formData.get('startPage') as string
        const totalPages = formData.get('totalPages') as string

        try {
            const res = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, startDate, startPage: Number(startPage), totalPages: Number(totalPages) }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || '책 추가에 실패했습니다.')
            } else {
                router.push('/')
            }
        } catch {
            setError('책 추가 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-white/70 hover:text-white text-2xl">←</Link>
                    <h1 className="text-2xl font-bold text-white">새 책 추가</h1>
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
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="서양미술사"
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
                            defaultValue={today}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition [color-scheme:dark]"
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
                                defaultValue={1}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="300"
                            />
                        </div>
                    </div>

                    <p className="text-white/50 text-sm">
                        💡 매일 2장씩 자동으로 페이지가 계산됩니다
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {loading ? '추가 중...' : '책 추가'}
                    </button>
                </form>
            </div>
        </div>
    )
}
