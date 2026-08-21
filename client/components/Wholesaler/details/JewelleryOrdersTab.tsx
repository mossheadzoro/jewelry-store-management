"use client";
import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, Truck, RotateCcw, MoreVertical } from "lucide-react";
import { AssignOrderModal } from "./AssignOrderModal";
// We'll assume you have some generic button component or we can use regular buttons
import { WholesalerNewOrderModal } from "./WholesalerNewOrderModal";

interface OrderItem {
  id: string;
  weight?: number;
  category?: { name: string };
  description?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveryDate: string;
  items: OrderItem[];
}

interface Props {
  wholesalerId: string;
}

export function JewelleryOrdersTab({ wholesalerId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wholesalers/${wholesalerId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [wholesalerId]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const updateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch(`/api/wholesalers/${wholesalerId}/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selectedIds), status }),
      });
      if (res.ok) {
        setSelectedIds(newSet => {
          newSet.clear();
          return newSet;
        });
        fetchOrders();
      }
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const formatStatus = (status: string) => status.replace("_", " ");
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "RETURNED": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "CANCELLED": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "IN_PROGRESS": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "ASSIGNED": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default: return "text-muted-foreground bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Actions row */}
      <div className="flex justify-between items-center">
        <div className="flex bg-card border border-border rounded-xl px-4 py-2 w-1/3 items-center gap-2">
          <Search size={18} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by ID, Design..."
            className="bg-transparent outline-none text-foreground w-full text-sm placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-secondary hover:bg-gray-700 text-foreground px-4 py-2 rounded-xl text-sm transition-colors border border-border"
          >
            Assign from OrderBook
          </button>
          
          <button
            onClick={() => updateStatus("DELIVERED")}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 bg-[#1c2e26] hover:bg-[#23382f] text-emerald-400 border border-emerald-900/50 px-4 py-2 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            <Truck size={16} /> Mark Delivered
          </button>
          
          <button
            onClick={() => updateStatus("RETURNED")}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 bg-[#2e1c1c] hover:bg-[#382323] text-red-400 border border-red-900/50 px-4 py-2 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            <RotateCcw size={16} /> Mark Returned
          </button>

          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-foreground px-4 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

        {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mt-2">
        <table className="w-full text-left text-sm text-foreground/80">
          <thead className="bg-[#1a2332] text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="rounded border-border bg-card accent-blue-600"
                  onChange={(e) => {
                    const activeOrders = orders.filter(o => !["DELIVERED", "CANCELLED", "RETURNED", "FINISHED"].includes(o.status));
                    if (e.target.checked) setSelectedIds(new Set(activeOrders.map(o => o.id)));
                    else setSelectedIds(new Set());
                  }}
                  checked={orders.filter(o => !["DELIVERED", "CANCELLED", "RETURNED", "FINISHED"].includes(o.status)).length > 0 && selectedIds.size === orders.filter(o => !["DELIVERED", "CANCELLED", "RETURNED", "FINISHED"].includes(o.status)).length}
                />
              </th>
              <th className="p-4">Order ID</th>
              <th className="p-4">Design</th>
              <th className="p-4">Metal</th>
              <th className="p-4">Weight</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : (() => {
              const activeOrders = orders.filter(o => !["DELIVERED", "CANCELLED", "RETURNED", "FINISHED"].includes(o.status));
              if (activeOrders.length === 0) {
                return <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No active orders found.</td></tr>;
              }
              return activeOrders.map(order => {
                const item = order.items?.[0] || {};
                const design = item.category?.name || "N/A";
                const weight = item.weight || 0;
                const metalDesc = item.description || "Refer to Details";
                const dateObj = new Date(order.createdAt);
                const dueDateObj = new Date(order.deliveryDate);
                
                return (
                  <tr key={order.id} className="hover:bg-[#151e2b] transition-colors">
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-border bg-card accent-blue-600"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelection(order.id)}
                      />
                    </td>
                    <td className="p-4 font-medium text-blue-400">#{order.orderNumber}</td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{design}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{metalDesc}</td>
                    <td className="p-4">{typeof weight === 'number' ? weight.toFixed(2) : weight}g</td>
                    <td className="p-4 line-clamp-2">
                      <div className="text-foreground">{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</div>
                      <div className="text-xs text-muted-foreground">Due: {dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right cursor-pointer text-muted-foreground hover:text-foreground">
                      <MoreVertical size={18} className="inline-block" />
                    </td>
                  </tr>
                )
              });
            })()}
          </tbody>
        </table>

        {/* Footer info */}
        <div className="px-6 py-4 bg-card border-t border-border text-sm text-muted-foreground flex justify-between">
          <span>
            {(() => {
              const activeCount = orders.filter(o => !["DELIVERED", "CANCELLED", "RETURNED", "FINISHED"].includes(o.status)).length;
              return `Showing ${activeCount > 0 ? 1 : 0} to ${activeCount} of ${activeCount} results`;
            })()}
          </span>
          {/* Mock Pagination */}
          <div className="flex gap-1">
             <div className="w-8 h-8 flex items-center justify-center rounded bg-[#1a2332] cursor-not-allowed text-gray-600">{"<"}</div>
             <div className="w-8 h-8 flex items-center justify-center rounded bg-blue-600 text-foreground">1</div>
             <div className="w-8 h-8 flex items-center justify-center rounded bg-card hover:bg-[#1a2332] cursor-pointer">{">"}</div>
          </div>
        </div>
      </div>

      {isAssignModalOpen && (
        <AssignOrderModal 
          wholesalerId={wholesalerId} 
          onClose={() => setIsAssignModalOpen(false)} 
          onSuccess={fetchOrders} 
        />
      )}
      {isNewOrderModalOpen && (
        <WholesalerNewOrderModal 
          wholesalerId={wholesalerId} 
          onClose={() => setIsNewOrderModalOpen(false)} 
          onSuccess={fetchOrders} 
        />
      )}
    </div>
  );
}
