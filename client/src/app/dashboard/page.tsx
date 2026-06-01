// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions);
   console.log(session?.user.role)
   
  if (session?.user?.role === "ADMIN") {
    redirect("/dashboard/admin");
  } else if (session?.user?.role === "MANAGER") {
    redirect("/dashboard/manager");
  } else {
    redirect("/unauthorized");
  }
}
