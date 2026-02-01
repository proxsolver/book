'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('이메일 또는 비밀번호가 올바르지 않습니다.')
            } else {
                router.push(callbackUrl)
                router.refresh()
            }
        } catch {
            setError('로그인 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 text-sm text-red-300 bg-red-500/20 rounded-lg border border-red-500/30">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                    이메일
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
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
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
                {loading ? '로그인 중...' : '로그인'}
            </button>
        </form>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
            <div className="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">📚 날두독서</h1>
                    <p className="text-white/70">매일 2장, 독서 습관 만들기</p>
                </div>

                <Suspense fallback={<div className="text-white/50 text-center">로딩 중...</div>}>
                    <LoginForm />
                </Suspense>

                <p className="text-center text-white/60 text-sm">
                    계정이 없으신가요?{' '}
                    <Link href="/register" className="text-pink-400 hover:text-pink-300 font-medium">
                        회원가입
                    </Link>
                </p>
            </div>
        </div>
    )
}
