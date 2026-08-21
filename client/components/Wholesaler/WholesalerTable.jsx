import { formatCurrency } from "@/lib/format";
import StatusBadge from "./StatusBadge";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function WholesalerTable({ wholesalers }) {
  const router = useRouter();
  return (
    <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_0.5fr] px-6 py-3 border-b border-[#1a1a1a]">
        {[
          "WHOLESALER",
          "PHONE",
          "GOLD BAL",
          "SILVER BAL",
          "MONEY BAL",
          "ACTIVE ORDERS",
          "STATUS",
          "",
        ].map((h) => (
          <p key={h} className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em]">
            {h}
          </p>
        ))}
      </div>

      <div className="flex flex-col">
        {wholesalers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#555]">
            <p className="text-[13px]">No wholesalers found.</p>
          </div>
        ) : (
          wholesalers.map((ws) => (
            <div
              key={ws.id}
              onClick={() => router.push(`/wholesaler/${ws.id}`)}
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_0.5fr] px-6 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors items-center group cursor-pointer"
            >
              <div>
                <p className="text-[14px] font-bold text-white">{ws.name}</p>
                <p className="text-[11px] text-[#555] font-mono mt-0.5">ID: {ws.id}</p>
              </div>
              
              <div className="text-[13px] text-[#888]">{ws.phone}</div>
              
              <div className={`text-[13px] font-semibold ${(ws.goldBal || 0) < 0 ? "text-red-400" : "text-[#D4A843]"}`}>
                {(ws.goldBal || 0).toFixed(3)} g
              </div>
              
              <div className={`text-[13px] font-semibold ${(ws.silverBal || 0) < 0 ? "text-red-400" : "text-[#E5E7EB]"}`}>
                {(ws.silverBal || 0).toFixed(3)} g
              </div>
              
              <div className={`text-[13px] font-semibold ${(ws.moneyBal || 0) < 0 ? "text-red-400" : "text-emerald-400"}`}>
                ₹{formatCurrency(ws.moneyBal || 0)}
              </div>
              
              <div className="text-[13px] text-[#888]">{ws.activeOrders}</div>
              
              <div>
                <StatusBadge status={ws.status} />
              </div>
              
              <div className="flex justify-end pr-2">
                <ArrowRight className="w-4 h-4 text-[#444] group-hover:text-white transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
