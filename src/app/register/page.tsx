'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string
        const name = formData.get('name') as string
        const habitStartDate = formData.get('habitStartDate') as string

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, habitStartDate }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || '회원가입에 실패했습니다.')
            } else {
                router.push('/login?registered=true')
            }
        } catch {
            setError('회원가입 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // Get today's date in YYYY-MM-DD format for default value
    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">📚 날두독서</h1>
                    <p className="text-white/70">새로운 독서 습관을 시작하세요</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-red-300 bg-red-500/20 rounded-lg border border-red-500/30">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                            이름
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="홍길동"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                            이메일
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                            비밀번호
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="6자 이상"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                            비밀번호 확인
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="비밀번호 재입력"
                        />
                    </div>

                    <div>
                        <label htmlFor="habitStartDate" className="block text-sm font-medium text-white/80 mb-2">
                            독서습관 시작일 📅
                        </label>
                        <input
                            id="habitStartDate"
                            name="habitStartDate"
                            type="date"
                            required
                            defaultValue={today}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition [color-scheme:dark]"
                        />
                        <p className="mt-1 text-xs text-white/50">
                            이 날짜부터 독서 일수가 계산됩니다
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {loading ? '가입 중...' : '회원가입'}
                    </button>
                </form>

                <p className="text-center text-white/60 text-sm">
                    이미 계정이 있으신가요?{' '}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                        로그인
                    </Link>
                </p>
            </div>
        </div>
    )
}
