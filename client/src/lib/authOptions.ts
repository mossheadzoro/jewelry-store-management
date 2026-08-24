import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
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

          // Update user lastLogin timestamp and record session
          if (u.id) {
            const uId = parseInt(u.id, 10);
            await prisma.user.update({
              where: { id: uId },
              data: { lastLogin: new Date() },
            }).catch(() => {});

            // Create UserSessionRecord and store sessionId in token
            const sessionToken = (token.id || "") + "_" + Date.now();
            const { SecurityCrypto } = await import("./security/SecurityCrypto");
            const sessionTokenHash = SecurityCrypto.hashToken(sessionToken);

            const sessionRecord = await prisma.userSessionRecord.create({
              data: {
                tenantId: "default-tenant",
                userId: uId,
                sessionTokenHash,
                device: "Web Browser",
                browser: "Desktop App",
                os: "Windows",
                ipAddress: "127.0.0.1",
                expiresAt: new Date(Date.now() + 480 * 60000), // 8 hours
              },
            }).catch(() => null);

            if (sessionRecord) {
              token.sessionId = sessionRecord.id;
            }
          }
        } else if (token?.sessionId) {
          // On subsequent requests, verify session record has not been revoked
          const sess = await prisma.userSessionRecord.findUnique({
            where: { id: token.sessionId as string },
            select: { isRevoked: true, expiresAt: true },
          }).catch(() => null);

          if (!sess || sess.isRevoked || new Date(sess.expiresAt) < new Date()) {
            // Session revoked or expired - invalidate JWT token
            return {} as any;
          }
        }
      } catch (err) {
        console.error("NextAuth JWT callback error:", err);
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (!token || !token.id) {
          return null as any;
        }
        if (session && session.user) {
          session.user.id = (token.id as string) || "";
          session.user.role = (token.role as any) || "SALESMAN";
          session.user.branchId = (token.branchId as string) || "";
          session.user.image = (token.image as string | null) || null;
          (session.user as any).sessionId = token.sessionId as string;
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
