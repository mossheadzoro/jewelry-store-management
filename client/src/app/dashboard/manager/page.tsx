'use client'
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";


import { prisma } from "../../../../libs/prisma";
import AddUserForm from "../../../../components/AddUserForm";
import { useUserStore } from "@/lib/store/useUserStore";

// export default async function ManagerDashboard() {
//   const session = await getServerSession(authOptions);

//   if (!session || session.user.role !== "MANAGER") {
//     return redirect("/login");
//   }

//   const manager = await prisma.user.findUnique({
//     where: { email: session.user.email! },
//     include: {
//       branch: true,
//       createdUsers: {
//         where: { role: "SALESMAN" },
//       },
//     },
//   });

//   if (!manager) return <div className="text-red-500">Manager not found.</div>;

// // 1. Get current logged-in user
// const currentUser = await prisma.user.findUnique({
//   where: { email: session.user.email! },
// });

// // 2. Then query all Salesmen in the same branch
// const salesmen = await prisma.user.findMany({
//   where: {
//     role: "SALESMAN",
//     branchId: currentUser?.branchId,
//   },
// });


//   return(
//     <div className="max-w-2xl mx-auto p-6 space-y-8">
//       <div className=" p-4 rounded shadow">
//         <h1 className="text-xl font-bold mb-2">🏢 Branch: {manager.branch?.name}</h1>
//         <p>👤 Logged in as Manager: {manager.name} ({manager.email})</p>
//       </div>

//       <div className=" p-4 rounded shadow">
//         <h2 className="text-lg font-semibold mb-4">➕ Add Salesman</h2>
//         <AddUserForm branches={[manager.branch]} creator="MANAGER" />
//       </div>

//       <div className=" p-4 rounded shadow">
//         <h2 className="text-lg font-semibold mb-4">📋 Salesman in {manager.branch?.name}</h2>
//         {salesmen.length === 0 ? (
//         <p>No salesmen found in this branch.</p>
//       ) : (
//         <ul className="list-disc pl-6">
//           {salesmen.map((s) => (
//             <li key={s.id}>
//               <h3>Name: {s.name} &nbsp; Email: &nbsp; ({s.email}) &nbsp; Role: &nbsp; {s.role} &nbsp; BranchId: &nbsp; {s.branchId}</h3>
              
//             </li>
//           ))}
//         </ul>
//       )}
//       </div>
//     </div>
//   );
// }






// app/dashboard/page.tsx


import { useEffect, useState } from 'react';

import { fetchDashboardData } from '@/lib/actions/fetchDashboardData';



export default function Dashboard() {
  const { user, branch, salesmen } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData()
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className=" p-4 rounded shadow">
        <h1 className="text-xl font-bold mb-2">🏢 Branch: {branch?.name}</h1>
        <p>👤 Logged in as Manager: {user?.name} ({user?.email})</p>
      </div>

      <div className=" p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">➕ Add Salesman</h2>
        <AddUserForm branches={[branch?.name]} creator="MANAGER" />
      </div>

      <div className=" p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">📋 Salesman in {branch?.name}</h2>
        {salesmen.length === 0 ? (
        <p>No salesmen found in this branch.</p>
      ) : (
        <ul className="list-disc pl-6">
          {salesmen.map((s) => (
            <li key={s.id}>
              <h3>Name: {s.name} &nbsp; Email: &nbsp; ({s.email}) &nbsp; Role: &nbsp; {s.role} &nbsp; BranchId: &nbsp; {s.branchId}</h3>
              
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );

}
