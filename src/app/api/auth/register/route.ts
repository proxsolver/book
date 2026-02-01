import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { email, password, name, habitStartDate } = await request.json()

        // Validate required fields
        if (!email || !password || !name || !habitStartDate) {
            return NextResponse.json(
                { error: '모든 필드를 입력해주세요.' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: '이미 등록된 이메일입니다.' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                habitStartDate: new Date(habitStartDate),
            },
        })

        return NextResponse.json(
            {
                message: '회원가입이 완료되었습니다.',
                user: { id: user.id, email: user.email, name: user.name }
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json(
            { error: '회원가입 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
