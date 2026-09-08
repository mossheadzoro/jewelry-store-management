import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ─── In-memory session verification cache ───────────────────────────────────
// Prevents the jwt callback from hitting the database on every single request.
// Each session is cached for SESSION_CACHE_TTL_MS after verification.
const SESSION_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const SESSION_CACHE_MAX_SIZE = 500;

interface SessionCacheEntry {
  isValid: boolean;
  checkedAt: number;
}

const sessionCache = new Map<string, SessionCacheEntry>();

function getSessionFromCache(sessionId: string): boolean | null {
  const entry = sessionCache.get(sessionId);
  if (!entry) return null;
  if (Date.now() - entry.checkedAt > SESSION_CACHE_TTL_MS) {
    sessionCache.delete(sessionId);
    return null; // expired
  }
  return entry.isValid;
}

function setSessionCache(sessionId: string, isValid: boolean) {
  // Evict oldest entries if cache is too large
  if (sessionCache.size >= SESSION_CACHE_MAX_SIZE) {
    const firstKey = sessionCache.keys().next().value;
    if (firstKey) sessionCache.delete(firstKey);
  }
  sessionCache.set(sessionId, { isValid, checkedAt: Date.now() });
}

/** Call this when a session is explicitly revoked to invalidate it immediately */
export function invalidateSessionCache(sessionId: string) {
  sessionCache.delete(sessionId);
}

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
          // On subsequent requests, verify session record has not been revoked.
          // Use in-memory cache to avoid hitting the DB on every single request.
          const sid = token.sessionId as string;
          const cached = getSessionFromCache(sid);

          if (cached === false) {
            // Cached as invalid — reject immediately without DB query
            return {} as any;
          }

          if (cached === null) {
            // Not in cache or cache expired — query DB and cache the result
            const sess = await prisma.userSessionRecord.findUnique({
              where: { id: sid },
              select: { isRevoked: true, expiresAt: true },
            }).catch(() => null);

            if (!sess || sess.isRevoked || new Date(sess.expiresAt) < new Date()) {
              setSessionCache(sid, false);
              return {} as any;
            }

            setSessionCache(sid, true);
          }
          // cached === true means session is valid and recently verified — skip DB query
        }
      } catch (err) {
        console.error("NextAuth JWT callback error:", err);
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (!token || !token.id) {
          return {} as any;
        }
        if (session) {
          if (!session.user) {
            session.user = {} as any;
          }
          session.user.id = (token.id as string) || "";
          session.user.role = (token.role as any) || "SALESMAN";
          session.user.branchId = (token.branchId as string) || "";
          session.user.image = (token.image as string | null) || null;
          (session.user as any).sessionId = token.sessionId as string;
        }
        return session;
      } catch (err) {
        console.error("NextAuth Session callback error:", err);
        return {} as any;
      }
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
