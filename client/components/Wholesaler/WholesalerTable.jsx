import { formatCurrency } from "@/lib/format";
import StatusBadge from "./StatusBadge";
import { useRouter } from "next/navigation";

export default function WholesalerTable({ wholesalers }) {
  const router = useRouter();
  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1F2937] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0F172A] text-gray-400 uppercase text-xs">
          <tr>
            <th className="px-6 py-4 text-left">Wholesaler</th>
            <th className="px-6 py-4 text-left">Phone</th>
            <th className="px-6 py-4 text-left">Gold Bal (g)</th>
            <th className="px-6 py-4 text-left">Silver Bal (g)</th>
            <th className="px-6 py-4 text-left">Money Bal (₹)</th>
            <th className="px-6 py-4 text-left">Active Orders</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          {wholesalers.map((ws) => (
            <tr
              key={ws.id}
              className="border-t border-[#1F2937] hover:bg-[#1E293B]"
            >
              <td className="px-6 py-4">
                <div className="font-medium">{ws.name}</div>
                <div className="text-gray-500 text-xs">ID: {ws.id}</div>
              </td>
              <td className="px-6 py-4 text-gray-400">{ws.phone}</td>
              <td
                className={`px-6 py-4 ${
                  ws.goldBal < 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                {ws.goldBal.toFixed(3)}
              </td>
              <td
                className={`px-6 py-4 ${
                  ws.silverBal < 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                {ws.silverBal.toFixed(3)}
              </td>
              <td
                className={`px-6 py-4 ${
                  ws.moneyBal < 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                ₹{formatCurrency(ws.moneyBal)}

              </td>
              <td className="px-6 py-4">{ws.activeOrders}</td>
              <td className="px-6 py-4">
                <StatusBadge status={ws.status} />
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-blue-400 hover:underline" onClick={() => router.push(`/wholesaler/${ws.id}`)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
