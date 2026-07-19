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
        console.log("Authorizing user with credentials:", credentials);
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        console.log(`User found: ${user}`);

        if (
          !user ||
          !(await bcrypt.compare(credentials.password, user.password))
        ) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.systemRole,
          branchId: user.branchId?.toString() || "",
          image: user.image || null
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; role?: string; branchId?: string; image?: string | null };
        token.id = u.id || "";
        token.role = u.role || "";
        token.branchId = u.branchId || "";
        token.image = u.image || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "ADMIN"
          | "MANAGER"
          | "SALESMAN"
          | "VIEWER";
        session.user.branchId = token.branchId as string;
        session.user.image = token.image as string | null;
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

  secret: process.env.NEXTAUTH_SECRET,
};
