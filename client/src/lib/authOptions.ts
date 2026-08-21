import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../libs/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.systemRole,
            branchId: user.branchId?.toString() || "",
            image: user.image || null,
          };
        } catch (error) {
          console.error("NextAuth authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          const u = user as { id?: string; role?: string; branchId?: string; image?: string | null };
          token.id = u.id || "";
          token.role = u.role || "";
          token.branchId = u.branchId || "";
          token.image = u.image || null;
        }
      } catch (err) {
        console.error("NextAuth JWT callback error:", err);
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session && session.user && token) {
          session.user.id = (token.id as string) || "";
          session.user.role = (token.role as any) || "SALESMAN";
          session.user.branchId = (token.branchId as string) || "";
          session.user.image = (token.image as string | null) || null;
        }
      } catch (err) {
        console.error("NextAuth Session callback error:", err);
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET || "jewelry_store_management_secret_key_2026_default",
};
