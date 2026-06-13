import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ROLE_LABELS: Record<string, string> = {
  etudiant:   "Étudiant",
  enseignant: "Enseignant",
  admin:      "Administrateur",
  jury:       "Jury",
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error:  "/auth/login",
  },
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",        type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(String(credentials.password), user.password);
        if (!valid) return null;

        return {
          id:          user.id,
          email:       user.email,
          name:        `${user.firstName} ${user.lastName}`,
          firstName:   user.firstName,
          lastName:    user.lastName,
          role:        user.role,
          roleLabel:   ROLE_LABELS[user.role] ?? user.role,
          avatarColor: user.avatarColor,
          school:      user.school ?? "",
          level:       user.level  ?? "",
          initials:    `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) Object.assign(token, user);
      return token;
    },
    async session({ session, token }) {
      session.user = token as any;
      return session;
    },
  },
});

export async function hashPassword(p: string) {
  return bcrypt.hash(p, 12);
}
