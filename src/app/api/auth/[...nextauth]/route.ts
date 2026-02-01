import NextAuth, { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Extend the built-in session types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            habitStartDate: Date
        }
    }
    interface User {
        id: string
        habitStartDate: Date
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        habitStartDate: Date
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                })

                if (!user) {
                    return null
                }

                const isPasswordValid = await compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    habitStartDate: user.habitStartDate,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.habitStartDate = user.habitStartDate
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.habitStartDate = token.habitStartDate
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
