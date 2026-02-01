import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// 인증 텍스트 생성
export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeMemo = searchParams.get('includeMemo') === 'true'

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // 전체 독서 일수 계산
        const habitStartDate = new Date(user.habitStartDate)
        habitStartDate.setHours(0, 0, 0, 0)
        const totalDays = Math.floor((today.getTime() - habitStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

        // 활성 책과 오늘 독서 기록 조회
        const books = await prisma.book.findMany({
            where: {
                userId: session.user.id,
                isActive: true,
            },
            include: {
                readingLogs: {
                    where: {
                        date: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                },
            },
        })

        // 날짜 포맷 (YYMMDD + 요일)
        const days = ['일', '월', '화', '수', '목', '금', '토']
        const year = String(today.getFullYear()).slice(-2)
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const dayOfWeek = days[today.getDay()]
        const dateStr = `${year}${month}${day}(${dayOfWeek})`

        // 인증 텍스트 생성
        let certText = `${user.name}의 날두독서 습관 ${totalDays}일째 ${dateStr}\n\n`

        let hasMemo = false
        let memoText = ''

        for (const book of books) {
            const bookStartDate = new Date(book.startDate)
            bookStartDate.setHours(0, 0, 0, 0)
            const bookDays = Math.floor((today.getTime() - bookStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

            const log = book.readingLogs[0]
            if (log) {
                certText += `${bookDays}일차 <${book.title}> ${log.startPage}-${log.endPage} 독서완료!\n`
                if (log.memo && includeMemo) {
                    hasMemo = true
                    memoText += `[메모] ${log.memo}\n`
                }
            } else {
                // 오늘 읽어야 할 페이지 계산
                const startPage = book.startPage + (bookDays - 1) * 2
                const endPage = startPage + 1
                certText += `${bookDays}일차 <${book.title}> ${startPage}-${endPage} (미완료)\n`
            }
        }

        if (hasMemo) {
            certText += memoText
        }

        certText += '\n성장에 성공!'

        return NextResponse.json({
            text: certText,
            totalDays,
            books: books.map((book: any) => ({
                id: book.id,
                title: book.title,
                hasLog: book.readingLogs.length > 0,
            })),
        })
    } catch (error) {
        console.error('Certification text error:', error)
        return NextResponse.json(
            { error: '인증 텍스트 생성에 실패했습니다.' },
            { status: 500 }
        )
    }
}
