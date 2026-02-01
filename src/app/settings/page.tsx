'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const [name, setName] = useState('')
    const [habitStartDate, setHabitStartDate] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            fetchUserInfo()
        }
    }, [status, router])

    async function fetchUserInfo() {
        try {
            const response = await fetch('/api/user')
            const data = await response.json()
            if (response.ok) {
                setName(data.user.name)
                setHabitStartDate(new Date(data.user.habitStartDate).toISOString().split('T')[0])
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error)
        }
    }

    async function handleProfileUpdate(e: React.FormEvent) {
        e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            const response = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, habitStartDate }),
            })
            const data = await response.json()
            if (!response.ok) {
                setMessage(data.error || '수정에 실패했습니다.')
            } else {
                setMessage('프로필이 수정되었습니다.')
                if (session?.user) {
                    session.user.name = name
                }
            }
        } catch {
            setMessage('수정 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    async function handlePasswordUpdate(e: React.FormEvent) {
        e.preventDefault()
        setMessage('')
        if (newPassword !== confirmNewPassword) {
            setMessage('새 비밀번호가 일치하지 않습니다.')
            return
        }
        if (newPassword.length < 6) {
            setMessage('새 비밀번호는 6자 이상이어야 합니다.')
            return
        }
        setLoading(true)
        try {
            const response = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            })
            const data = await response.json()
            if (!response.ok) {
                setMessage(data.error || '비밀번호 변경에 실패했습니다.')
            } else {
                setMessage('비밀번호가 변경되었습니다.')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmNewPassword('')
            }
        } catch {
            setMessage('비밀번호 변경 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="text-white text-xl">로딩 중...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">⚙️ 설정</h1>
                    <p className="text-white/70">회원정보를 관리하세요</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg border \${
                        message.includes('실패') || message.includes('일치하지 않') || message.includes('6자')
                            ? 'bg-red-500/20 border-red-500/30 text-red-300'
                            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    }`}>
                        {message}
                    </div>
                )}

                <div className="mb-8 p-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                    <h2 className="text-2xl font-semibold text-white mb-6">프로필 수정</h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">이메일 (변경 불가)</label>
                            <input type="email" value={session?.user?.email || ''} disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">이름</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">독서습관 시작일 📅</label>
                            <input type="date" value={habitStartDate} onChange={(e) => setHabitStartDate(e.target.value)} required className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50">{loading ? '저장 중...' : '프로필 저장'}</button>
                    </form>
                </div>

                <div className="mb-8 p-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                    <h2 className="text-2xl font-semibold text-white mb-6">비밀번호 변경</h2>
                    <form onSubmit={handlePasswordUpdate} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">현재 비밀번호</label>
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">새 비밀번호</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">새 비밀번호 확인</label>
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} minLength={6} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50">{loading ? '변경 중...' : '비밀번호 변경'}</button>
                    </form>
                </div>

                <div className="p-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                    <h2 className="text-2xl font-semibold text-white mb-6">계정</h2>
                    <div className="space-y-4">
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20">로그아웃</button>
                        <a href="/books" className="block w-full py-3 px-4 text-center text-white/70 hover:text-white rounded-lg border border-white/20 hover:bg-white/5">독서 기록으로 돌아가기</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
