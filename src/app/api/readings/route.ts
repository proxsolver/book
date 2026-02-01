import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { getKSTToday, getKSTTomorrow, getKSTDateOnly } from '@/lib/date'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const bookId = searchParams.get('bookId')

    try {
        const where: Record<string, unknown> = {
            book: { userId: session.user.id },
        }

        if (date) {
            const targetDate = new Date(date)
            targetDate.setHours(0, 0, 0, 0)
            const nextDate = new Date(targetDate)
            nextDate.setDate(nextDate.getDate() + 1)

            where.date = {
                gte: targetDate,
                lt: nextDate,
            }
        }

        if (bookId) {
            where.bookId = bookId
        }

        const logs = await prisma.readingLog.findMany({
            where,
            include: {
                book: true,
            },
            orderBy: { date: 'desc' },
        })

        return NextResponse.json(logs)
    } catch (error) {
        console.error('Readings fetch error:', error)
        return NextResponse.json(
            { error: '독서 기록을 불러오는데 실패했습니다.' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const { bookId, date, startPage, endPage, memo } = await request.json()

        if (!bookId || !date || startPage === undefined || endPage === undefined) {
            return NextResponse.json(
                { error: '필수 필드가 누락되었습니다.' },
                { status: 400 }
            )
        }

        const book = await prisma.book.findFirst({
            where: { id: bookId, userId: session.user.id },
        })

        if (!book) {
            return NextResponse.json({ error: '책을 찾을 수 없습니다.' }, { status: 404 })
        }

        const logDate = new Date(date)
        logDate.setHours(0, 0, 0, 0)

        const log = await prisma.readingLog.upsert({
            where: {
                bookId_date: {
                    bookId,
                    date: logDate,
                },
            },
            update: {
                startPage: Number(startPage),
                endPage: Number(endPage),
                memo: memo || null,
            },
            create: {
                bookId,
                date: logDate,
                startPage: Number(startPage),
                endPage: Number(endPage),
                memo: memo || null,
            },
        })

        return NextResponse.json(log, { status: 201 })
    } catch (error) {
        console.error('Reading log create error:', error)
        return NextResponse.json(
            { error: '독서 기록 저장에 실패했습니다.' },
            { status: 500 }
        )
    }
}
