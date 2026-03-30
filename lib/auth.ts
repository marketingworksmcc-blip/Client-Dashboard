import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.clientIds = (user as { clientIds: string[] }).clientIds;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        // Always refresh name + clientIds from DB so stale JWTs never show stale data
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, clientUsers: { select: { clientId: true } } },
        });
        if (user) {
          session.user.name = user.name;
          session.user.clientIds = user.clientUsers.map((cu) => cu.clientId);
        } else {
          session.user.clientIds = token.clientIds as string[] ?? [];
        }
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            clientUsers: { select: { clientId: true } },
          },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientIds: user.clientUsers.map((cu: { clientId: string }) => cu.clientId),
        };
      },
    }),
  ],
});
