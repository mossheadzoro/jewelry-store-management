"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) {
      const session = await (await fetch("/api/auth/session")).json();
      const role = session.user.role;

      if (role === "ADMIN") router.push("/dashboard/admin");
      else if (role === "MANAGER") router.push("/dashboard/manager");
      else if (role === "SALESMAN") router.push("/dashboard/salesman");
      else router.push("/dashboard/viewer");
    } else {
      alert("Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto mt-32 space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border"
      />
      <button type="submit" className="bg-blue-600 text-foreground px-4 py-2">Login</button>
    </form>
  );
}
