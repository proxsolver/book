import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { getKSTToday, getKSTTomorrow, formatKSTDate } from '@/lib/date'

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

        const today = getKSTToday()
        const tomorrow = getKSTTomorrow()

        console.log('DEBUG certification:', {
            today: today.toISOString(),
            tomorrow: tomorrow.toISOString()
        })

        // habitStartDate는 DB에서 가져온 Date 객체 (이미 KST 자정을 나타내는 UTC 시간)
        // 시간 정보를 명확히 하기 위해 UTC 기준 0시로 설정 후 9시간 뺌
        const habitStartDate = user.habitStartDate
        const utcHabitStart = new Date(Date.UTC(
            habitStartDate.getUTCFullYear(),
            habitStartDate.getUTCMonth(),
            habitStartDate.getUTCDate(),
            0, 0, 0
        ))
        utcHabitStart.setTime(utcHabitStart.getTime() - 540 * 60000)
        const totalDays = Math.floor((today.getTime() - utcHabitStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

        console.log('DEBUG certification days:', {
            habitStartOriginal: habitStartDate.toISOString(),
            habitStartAdjusted: utcHabitStart.toISOString(),
            totalDays
        })

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

        const dateStr = formatKSTDate(today)

        let certText = `${user.name}의 날두독서 습관 ${totalDays}일째 ${dateStr}\n\n`

        let hasMemo = false
        let memoText = ''

        for (const book of books) {
            // book.startDate도 DB에서 가져온 Date 객체
            const bookStartDate = book.startDate
            const utcBookStart = new Date(Date.UTC(
                bookStartDate.getUTCFullYear(),
                bookStartDate.getUTCMonth(),
                bookStartDate.getUTCDate(),
                0, 0, 0
            ))
            utcBookStart.setTime(utcBookStart.getTime() - 540 * 60000)
            const bookDays = Math.floor((today.getTime() - utcBookStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

            console.log('DEBUG book days:', {
                bookTitle: book.title,
                startDateOriginal: book.startDate.toISOString(),
                startDateAdjusted: utcBookStart.toISOString(),
                bookDays
            })

            const log = book.readingLogs[0]
            if (log) {
                certText += `${bookDays}일차 <${book.title}> ${log.startPage}-${log.endPage} 독서완료!\n`
                if (log.memo && includeMemo) {
                    hasMemo = true
                    memoText += `[메모] ${log.memo}\n`
                }
            } else {
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
