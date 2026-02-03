import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { parseKSTDate } from '@/lib/date'

// 사용자의 모든 책 조회
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const books = await prisma.book.findMany({
            where: { userId: session.user.id },
            include: {
                readingLogs: {
                    orderBy: { date: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(books)
    } catch (error) {
        console.error('Books fetch error:', error)
        return NextResponse.json(
            { error: '책 목록을 불러오는데 실패했습니다.' },
            { status: 500 }
        )
    }
}

// 새 책 추가
export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const { title, startDate, startPage, totalPages } = await request.json()

        if (!title || !startDate || startPage === undefined || !totalPages) {
            return NextResponse.json(
                { error: '모든 필드를 입력해주세요.' },
                { status: 400 }
            )
        }

        const book = await prisma.book.create({
            data: {
                userId: session.user.id,
                title,
                startDate: parseKSTDate(startDate),  // KST 날짜를 UTC로 변환하여 저장
                startPage: Number(startPage),
                totalPages: Number(totalPages),
            },
        })

        return NextResponse.json(book, { status: 201 })
    } catch (error) {
        console.error('Book create error:', error)
        return NextResponse.json(
            { error: '책 추가에 실패했습니다.' },
            { status: 500 }
        )
    }
}
