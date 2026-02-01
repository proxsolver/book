import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Number(searchParams.get('limit')) || 50

        const posts = await prisma.certificationPost.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        })

        return NextResponse.json(posts)
    } catch (error) {
        console.error('Leaderboard fetch error:', error)
        return NextResponse.json(
            { error: '리더보드를 불러오는데 실패했습니다.' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const { userId, userName, certText } = await request.json()

        if (!userId || !userName || !certText) {
            return NextResponse.json(
                { error: '필수 필드가 누락되었습니다.' },
                { status: 400 }
            )
        }

        const post = await prisma.certificationPost.create({
            data: {
                userId,
                userName,
                certText,
            },
        })

        return NextResponse.json(post, { status: 201 })
    } catch (error) {
        console.error('Certification post create error:', error)
        return NextResponse.json(
            { error: '인증 게시글 작성에 실패했습니다.' },
            { status: 500 }
        )
    }
}
