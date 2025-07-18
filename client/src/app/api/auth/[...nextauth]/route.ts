import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
          id: user.id.toString(), // Include image field
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId?.toString() || "",
          image: user.image || null
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.branchId = (user as any).branchId;
        token.image = (user as any).image; // Include image field
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
