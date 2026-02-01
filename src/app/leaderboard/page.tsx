'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Post {
  id: string
  userId: string
  userName: string
  certText: string
  createdAt: string
}

export default function LeaderboardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/leaderboard?limit=100')
        const data = await res.json()
        setPosts(data)
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return diffMins + '분 전'
    if (diffHours < 24) return diffHours + '시간 전'
    if (diffDays < 7) return diffDays + '일 전'
    
    return date.toLocaleDateString('ko-KR')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">인증 리더보드</h1>
          <p className="text-white/70">매일 독서 습관을 함께하는 사람들</p>
        </div>

        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
          >
            홈으로
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/20">
            <p className="text-white/70">아직 인증글이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className={index < 3 ? 'text-2xl' : 'text-lg text-white/50'}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="text-white font-semibold">{post.userName}</span>
                  </div>
                  <span className="text-white/50 text-sm">{formatDate(post.createdAt)}</span>
                </div>
                <pre className="w-full p-4 bg-black/30 rounded-lg text-white/80 text-sm whitespace-pre-wrap font-mono">
                  {post.certText}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
