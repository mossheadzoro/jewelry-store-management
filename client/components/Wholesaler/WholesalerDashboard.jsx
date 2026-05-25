"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import SummaryCard from "./SummaryCard";
import WholesalerTable from "./WholesalerTable";
import CreateWholesalerModal from "./CreateWholesalerModel";

const WholesalerDashboard = () => {
  const [search, setSearch] = useState("");
  const [open,setOpen] = useState(false);


const [wholesalers, setWholesalers] = useState([]);
const [summary, setSummary] = useState(null);


 useEffect(() => {
  async function fetchWholesalers() {
    try {
      const res = await fetch("/api/wholesalers?branchId=1");

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      if (data.table && data.summary) {
        setWholesalers(data.table);
        setSummary(data.summary);
      } else {
        setWholesalers([]);
        setSummary(null);
      }
    } catch (error) {
      console.error(error);
      setWholesalers([]);
      setSummary(null);
    }
  }

  fetchWholesalers();
}, []);


 
  return (
    <div className="min-h-screen bg-[#030508] text-white p-8 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Wholesaler Management</h1>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-lg" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Add New Wholesaler
        </button>
      </div>
 <CreateWholesalerModal
        isOpen={open}
        onClose={() => setOpen(false)}
      />
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
  <SummaryCard
    title="Total Wholesalers"
    value={summary?.totalWholesalers ?? 0}
  />

  <SummaryCard
    title="Gold Due (g)"
    value={`${summary?.goldDue?.toFixed(3) ?? "0.000"} g`}
    accent="gold"
  />

  <SummaryCard
    title="Silver Due (g)"
    value={`${summary?.silverDue?.toFixed(3) ?? "0.000"} g`}
    accent="silver"
  />

  <SummaryCard
    title="Money Due (₹)"
    value={`₹${summary?.moneyDue?.toLocaleString("en-IN") ?? "0"}`}
    accent="money"
  />

  <SummaryCard
    title="Money Deposited (₹)"
    value={`₹${summary?.moneyDeposit?.toLocaleString("en-IN") ?? "0"}`}
    accent="deposit"
  />
</div>


      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-[#111827] px-4 py-2 rounded-xl w-full md:w-1/2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by wholesaler name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none ml-2 w-full text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button className="bg-[#111827] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#1F2937]">
            <Filter size={16} />
            Filter
          </button>
          <button className="bg-blue-600 px-4 py-2 rounded-xl">Has Due</button>
          <button className="bg-[#111827] px-4 py-2 rounded-xl hover:bg-[#1F2937]">
            Has Deposit
          </button>
          <button className="bg-[#111827] px-4 py-2 rounded-xl hover:bg-[#1F2937]">
            Active Orders
          </button>
        </div>
      </div>

      {/* Table */}
      <WholesalerTable wholesalers={wholesalers} />

      {/* Pagination */}
      <div className="flex justify-end mt-6 gap-2">
        <button className="px-4 py-2 bg-[#111827] rounded-lg">1</button>
        <button className="px-4 py-2 bg-[#111827] rounded-lg">2</button>
        <button className="px-4 py-2 bg-[#111827] rounded-lg">3</button>
      </div>
    </div>
  );
}

export default WholesalerDashboard;
