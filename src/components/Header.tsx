'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Header() {
    const { data: session, status } = useSession()
    const router = useRouter()

    if (status === 'loading' || !session) {
        return null
    }

    return (
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-400 transition">
                    <span className="text-xl font-bold">📚 날두독서</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="text-white/70 text-sm hidden sm:inline">{session.user?.name}</span>
                    <button
                        onClick={() => router.push('/settings')}
                        className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                    >
                        ⚙️ 설정
                    </button>
                    <button
                        onClick={() => signOut()}
                        className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                    >
                        로그아웃
                    </button>
                </div>
            </div>
        </header>
    )
}
