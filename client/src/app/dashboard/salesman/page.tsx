import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "../../../../libs/prisma";


export default async function SalesmanDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SALESMAN") {
    redirect("/login");
  }

  const salesman = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      branch: true,
    },
  });

  if (!salesman) {
    return <div className="text-red-500">User not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-xl font-bold mb-2">👋 Welcome, {salesman.name}</h1>
        <p className="text-gray-600">Email: {salesman.email}</p>
        <p className="text-gray-600">Branch: {salesman.branch?.name ?? "Unassigned"}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">📊 Your Tasks (Coming Soon)</h2>
        <p>You'll soon be able to manage sales, orders, billing & more.</p>
      </div>
    </div>
  );
}
