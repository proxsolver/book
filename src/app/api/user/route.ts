import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// GET - 현재 사용자 정보 조회
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                habitStartDate: true,
                createdAt: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
        }

        return NextResponse.json({ user })
    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { error: '사용자 정보 조회에 실패했습니다.' },
            { status: 500 }
        )
    }
}

// PATCH - 사용자 정보 수정
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const { name, currentPassword, newPassword, habitStartDate } = await request.json()

        // 사용자 조회
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
        }

        // 수정할 데이터 객체
        const updateData: any = {}

        // 이름 수정
        if (name !== undefined && name.trim()) {
            updateData.name = name.trim()
        }

        // 독서 습관 시작일 수정
        if (habitStartDate !== undefined) {
            updateData.habitStartDate = new Date(habitStartDate)
        }

        // 비밀번호 수정 (현재 비밀번호 확인 필요)
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: '현재 비밀번호를 입력해주세요.' },
                    { status: 400 }
                )
            }

            const { compare } = await import('bcryptjs')
            const isPasswordValid = await compare(currentPassword, user.password)

            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: '현재 비밀번호가 올바르지 않습니다.' },
                    { status: 400 }
                )
            }

            updateData.password = await hash(newPassword, 12)
        }

        // 수정할 데이터가 없는 경우
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: '수정할 정보가 없습니다.' },
                { status: 400 }
            )
        }

        // 사용자 정보 업데이트
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                habitStartDate: true,
            }
        })

        return NextResponse.json({
            message: '회원정보가 수정되었습니다.',
            user: updatedUser
        })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json(
            { error: '회원정보 수정에 실패했습니다.' },
            { status: 500 }
        )
    }
}
