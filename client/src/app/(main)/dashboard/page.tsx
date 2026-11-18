// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toUpperCase();
   
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "OWNER") {
    redirect("/dashboard/admin");
  } else if (role === "MANAGER") {
    redirect("/dashboard/manager");
  } else if (role === "SALESMAN") {
    redirect("/dashboard/salesman");
  } else {
    redirect("/unauthorized");
  }
}
