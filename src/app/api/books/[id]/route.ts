import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { parseKSTDate } from '@/lib/date'

interface RouteParams {
    params: Promise<{ id: string }>
}

// 특정 책 조회
export async function GET(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const book = await prisma.book.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
            include: {
                readingLogs: {
                    orderBy: { date: 'desc' },
                },
            },
        })

        if (!book) {
            return NextResponse.json({ error: '책을 찾을 수 없습니다.' }, { status: 404 })
        }

        return NextResponse.json(book)
    } catch (error) {
        console.error('Book fetch error:', error)
        return NextResponse.json(
            { error: '책 정보를 불러오는데 실패했습니다.' },
            { status: 500 }
        )
    }
}

// 책 정보 수정
export async function PUT(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const { title, startDate, startPage, totalPages, isActive } = await request.json()

        // Check ownership
        const existingBook = await prisma.book.findFirst({
            where: { id, userId: session.user.id },
        })

        if (!existingBook) {
            return NextResponse.json({ error: '책을 찾을 수 없습니다.' }, { status: 404 })
        }

        const book = await prisma.book.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(startDate && { startDate: parseKSTDate(startDate) }),
                ...(startPage !== undefined && { startPage: Number(startPage) }),
                ...(totalPages && { totalPages: Number(totalPages) }),
                ...(isActive !== undefined && { isActive }),
            },
        })

        return NextResponse.json(book)
    } catch (error) {
        console.error('Book update error:', error)
        return NextResponse.json(
            { error: '책 수정에 실패했습니다.' },
            { status: 500 }
        )
    }
}

// 책 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        // Check ownership
        const existingBook = await prisma.book.findFirst({
            where: { id, userId: session.user.id },
        })

        if (!existingBook) {
            return NextResponse.json({ error: '책을 찾을 수 없습니다.' }, { status: 404 })
        }

        await prisma.book.delete({ where: { id } })

        return NextResponse.json({ message: '책이 삭제되었습니다.' })
    } catch (error) {
        console.error('Book delete error:', error)
        return NextResponse.json(
            { error: '책 삭제에 실패했습니다.' },
            { status: 500 }
        )
    }
}
