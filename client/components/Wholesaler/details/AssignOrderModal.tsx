"use client";
import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

interface OrderItem {
  id: string;
  weight?: number;
  category?: { name: string };
  description?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  items: OrderItem[];
}

interface Props {
  wholesalerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignOrderModal({ wholesalerId, onClose, onSuccess }: Props) {
  const [unassignedOrders, setUnassignedOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/wholesalers/${wholesalerId}/orders`);
        if (res.ok) {
          const data = await res.json();
          setUnassignedOrders(data);
        }
      } catch (error) {
        console.error("Failed to fetch unassigned orders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [wholesalerId]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/wholesalers/${wholesalerId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (e) {
      console.error("Failed to assign", e);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Assign Orders from OrderBook</h2>
            <p className="text-sm text-muted-foreground mt-1">Select unassigned orders to send to this wholesaler.</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 bg-background/30 border border-border rounded-xl px-4 py-2 mb-6">
            <Search size={18} className="text-muted-foreground" />
            <input type="text" placeholder="Search orders..." className="bg-transparent border-none outline-none text-sm text-foreground w-full" />
          </div>

          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading unassigned orders...</div>
          ) : unassignedOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No unassigned orders found in OrderBook.</div>
          ) : (
            <div className="grid gap-3">
              {unassignedOrders.map(order => {
                const item = order.items?.[0];
                const isSelected = selectedIds.has(order.id);
                return (
                  <div 
                    key={order.id} 
                    onClick={() => toggleSelection(order.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                      isSelected ? "border-blue-500 bg-blue-500/10" : "border-border bg-card/50 hover:border-border hover:bg-secondary"
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      className="rounded border-border bg-card accent-blue-600 w-5 h-5"
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          #{order.orderNumber}
                          <span className="text-xs font-normal text-muted-foreground">({order.customerName})</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item?.category?.name || "Unknown Design"} - {item?.weight || 0}g
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3 bg-card/50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-foreground/80 hover:bg-secondary transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleAssign}
            disabled={selectedIds.size === 0 || assigning}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-foreground shadow-lg shadow-blue-900/20 transition-colors disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            {assigning ? "Assigning..." : `Assign Selected (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
