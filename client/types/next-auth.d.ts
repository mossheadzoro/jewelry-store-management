import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      image?: string | null; // Optional image field
      name: string;
      email: string;
      role: "ADMIN" | "MANAGER" | "SALESMAN" | "VIEWER";
      branchId: string;
    };
  }

  interface User {
    id: string;
    image?: string | null; // Optional image field
    name: string;
    email: string;
    role: "ADMIN" | "MANAGER" | "SALESMAN" | "VIEWER";
    branchId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    branchId: string;
    image?: string | null;
    email?: string;
  }
}

declare module "qrcode";

