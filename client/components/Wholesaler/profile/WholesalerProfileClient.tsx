"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, User, Phone, MapPin, Scale, Diamond, IndianRupee, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, ListChecks, CheckSquare, X, Eye, FileText, Calendar, Clock, Sparkles, Info, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WholesalerProfileClient({ wholesalerId }: { wholesalerId: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State for Depth View
  const [selectedTxModal, setSelectedTxModal] = useState<any | null>(null);

  // External Data States
  const [freeFineWeight, setFreeFineWeight] = useState(0);
  const [purities, setPurities] = useState<string[]>(["24K", "22K", "18K"]); // Default fallback

  // Order States
  const [unassignedOrders, setUnassignedOrders] = useState<any[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [showAssignOrders, setShowAssignOrders] = useState(false);
  const [showReceiveOrders, setShowReceiveOrders] = useState(false);
  const [selectedIssueOrders, setSelectedIssueOrders] = useState<string[]>([]);
  const [selectedReceiveOrders, setSelectedReceiveOrders] = useState<string[]>([]);

  // Forms State
  const [issueForm, setIssueForm] = useState({ metalType: "GOLD", weight: "", purity: "24K" });
  const [receiveForm, setReceiveForm] = useState({ metalType: "GOLD", netWeight: "", fineWeight: "", wastage: "2", laborCharge: "", remarks: "" });

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Profile
      const res = await fetch(`/api/wholesalers/${wholesalerId}`);
      if (res.ok) setData(await res.json());

      // 2. Fetch Live Free Fine Weight
      const ledgerRes = await fetch('/api/inventory/ledger?branchId=1');
      if (ledgerRes.ok) {
        const ledgerData = await ledgerRes.json();
        setFreeFineWeight(ledgerData.summary?.freeFineWeight || 0);
      }

      // 3. Fetch Product Settings for Purities
      const settingsRes = await fetch('/api/settings/product?branchId=1');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const goldPurities = settingsData.metalConfig?.goldPurities?.map((p: any) => p.name) || ["24K", "22K", "18K"];
        setPurities(goldPurities);
        setIssueForm(prev => ({ ...prev, purity: goldPurities[0] }));
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedOrders = async () => {
    try {
      const res = await fetch('/api/order/fetch?branchId=1&wholesalerId=none&status=CREATED');
      if (res.ok) {
        const d = await res.json();
        setUnassignedOrders(d.orders || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchAssignedOrders = async () => {
    try {
      const res = await fetch(`/api/order/fetch?branchId=1&wholesalerId=${wholesalerId}&limit=100`);
      if (res.ok) {
        const d = await res.json();
        // filter out completed orders
        setAssignedOrders((d.orders || []).filter((o: any) => !["COMPLETED", "DONE", "DELIVERED", "RETURNED", "CANCELLED", "FINISHED"].includes(o.status)));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchProfileData();
    fetchAssignedOrders();
  }, [wholesalerId]);

  useEffect(() => {
    if (showAssignOrders) fetchUnassignedOrders();
  }, [showAssignOrders]);

  useEffect(() => {
    if (showReceiveOrders) fetchAssignedOrders();
  }, [showReceiveOrders]);

  // Per-order receive inputs state { [orderId]: { netWeight, wastage, laborCharge } }
  const [receiveInputs, setReceiveInputs] = useState<Record<string, {
    netWeight: string;
    wastage: string;
    laborCharge: string;
  }>>({});

  const handleAssignToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShowAssignOrders(checked);
    if (!checked) {
      setSelectedIssueOrders([]);
    }
  };

  const handleReceiveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShowReceiveOrders(checked);
    if (!checked) {
      setSelectedReceiveOrders([]);
    }
  };

  const updateReceiveInput = (orderId: string, field: 'netWeight' | 'wastage' | 'laborCharge', value: string) => {
    setReceiveInputs(prev => ({
      ...prev,
      [orderId]: {
        netWeight: field === 'netWeight' ? value : (prev[orderId]?.netWeight ?? ''),
        wastage: field === 'wastage' ? value : (prev[orderId]?.wastage ?? '2'),
        laborCharge: field === 'laborCharge' ? value : (prev[orderId]?.laborCharge ?? ''),
      }
    }));
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(issueForm.weight) || 0;
    const assignedIds = showAssignOrders ? selectedIssueOrders : [];

    if (w === 0 && assignedIds.length === 0) {
      alert("Please enter metal weight or select at least one order to assign.");
      return;
    }

    if (w > freeFineWeight) {
      alert(`Cannot issue ${w}g. Only ${freeFineWeight.toFixed(3)}g Free Fine Weight is available.`);
      return;
    }

    try {
      const res = await fetch(`/api/wholesalers/${wholesalerId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ISSUE_METAL",
          metalType: issueForm.metalType,
          purityLabel: issueForm.purity,
          weight: w,
          orderIds: assignedIds,
        }),
      });

      if (res.ok) {
        alert("Metal Issued / Orders Assigned Successfully! ✅");
        setIssueForm({ metalType: "GOLD", weight: "", purity: purities[0] || "24K" });
        setSelectedIssueOrders([]);
        fetchProfileData();
        fetchAssignedOrders();
        if (showAssignOrders) fetchUnassignedOrders();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit issue transaction.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting transaction.");
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If receiving checked assigned orders
    if (showReceiveOrders && selectedReceiveOrders.length > 0) {
      const receiveOrderDetails = selectedReceiveOrders.map(orderId => {
        const o = assignedOrders.find(x => x.id === orderId);
        const orderTotalWeight = (o?.items || []).reduce((sum: number, it: any) => sum + (Number(it.weight) || 0), 0);
        
        const netWeight = parseFloat(receiveInputs[orderId]?.netWeight ?? String(orderTotalWeight)) || 0;
        const wastage = parseFloat(receiveInputs[orderId]?.wastage ?? "2") || 0;
        const purityLabel = "22K"; // Standard 22K (92%)
        const purityPct = 92;
        const fineWeight = Number(((netWeight * (purityPct + wastage)) / 100).toFixed(2));
        const laborCharge = parseFloat(receiveInputs[orderId]?.laborCharge ?? "0") || 0;

        return {
          orderId,
          netWeight,
          wastage,
          purityLabel,
          fineWeight,
          laborCharge
        };
      });

      const totalBatchWeight = receiveOrderDetails.reduce((sum, r) => sum + r.netWeight, 0);
      const totalBatchFineWeight = Number(receiveOrderDetails.reduce((sum, r) => sum + r.fineWeight, 0).toFixed(2));
      const cashItems = receiveOrderDetails
        .filter(r => r.laborCharge > 0)
        .map(r => ({
          itemName: `Labor Charge for Order #${assignedOrders.find(x => x.id === r.orderId)?.orderNumber || r.orderId}`,
          cost: r.laborCharge
        }));

      try {
        const res = await fetch(`/api/wholesalers/${wholesalerId}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "RECEIVE_JEWELLERY",
            metalType: "GOLD",
            purityLabel: "22K",
            weight: totalBatchWeight,
            fineWeight: totalBatchFineWeight,
            wastage: 2,
            cashItems,
            receiveOrderDetails,
          }),
        });

        if (res.ok) {
          alert(`Successfully received ${selectedReceiveOrders.length} Order(s)! ✅`);
          setSelectedReceiveOrders([]);
          setReceiveInputs({});
          fetchProfileData();
          if (showReceiveOrders) fetchAssignedOrders();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to receive orders.");
        }
      } catch (err) {
        console.error(err);
        alert("Error receiving orders.");
      }
      return;
    }

    // Readymade / Manual Item Receive fallback
    const netW = parseFloat(receiveForm.netWeight) || 0;
    const fineW = parseFloat(receiveForm.fineWeight) || 0;
    const labor = parseFloat(receiveForm.laborCharge) || 0;

    if (netW === 0 && fineW === 0) {
      alert("Please select at least one order to receive or enter batch weights.");
      return;
    }

    try {
      const res = await fetch(`/api/wholesalers/${wholesalerId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RECEIVE_JEWELLERY",
          metalType: "GOLD",
          purityLabel: "22K",
          weight: netW,
          fineWeight: fineW,
          wastage: parseFloat(receiveForm.wastage) || 0,
          cashItems: labor > 0 ? [{ itemName: "Labor Charge", cost: labor }] : [],
          remarks: receiveForm.remarks,
        }),
      });

      if (res.ok) {
        alert("Received jewellery batch successfully! ✅");
        setReceiveForm({ metalType: "GOLD", netWeight: "", fineWeight: "", wastage: "2", laborCharge: "", remarks: "" });
        fetchProfileData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to receive jewellery.");
      }
    } catch (err) {
      console.error(err);
      alert("Error receiving jewellery.");
    }
  };

  const toggleIssueOrder = (id: string) => {
    setSelectedIssueOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleReceiveOrder = (id: string) => {
    setSelectedReceiveOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Helper to calculate individual item fine weight based on item purity (defaults to 22K / 91.66%)
  const getItemFineWeight = (item: any) => {
    const w = Number(item.weight) || 0;
    if (w <= 0) return 0;
    const text = `${item.category?.name || ""} ${item.description || ""}`.toUpperCase();
    if (text.includes("18K") || text.includes("18 K") || text.includes("750")) return w * 0.750;
    if (text.includes("14K") || text.includes("14 K") || text.includes("585")) return w * 0.585;
    if (text.includes("24K") || text.includes("24 K") || text.includes("995")) return w * 0.995;
    return w * 0.9166; // Standard 22K (91.66%)
  };

  // Calculate Net Weight and Total Fine Weight for Selected Issue Orders
  const selectedNetWeight = unassignedOrders
    .filter((o: any) => selectedIssueOrders.includes(o.id))
    .reduce((acc: number, o: any) => {
      const orderWeight = (o.items || []).reduce((iAcc: number, item: any) => iAcc + (Number(item.weight) || 0), 0);
      return acc + orderWeight;
    }, 0);

  // Sum of fine weights across all purities in selected orders
  const selectedFineWeight = unassignedOrders
    .filter((o: any) => selectedIssueOrders.includes(o.id))
    .reduce((acc: number, o: any) => {
      const orderFine = (o.items || []).reduce((iAcc: number, item: any) => iAcc + getItemFineWeight(item), 0);
      return acc + orderFine;
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030508] p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) return <div className="text-foreground p-8">Not found</div>;

  return (
    <div className="min-h-screen bg-[#030508] text-foreground p-6 md:p-8 w-full font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push("/wholesaler")} className="p-2 rounded-xl bg-card hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {data.phone}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {data.city}, {data.state}</span>
            <span className="flex items-center gap-1.5 font-mono bg-secondary/50 px-2 py-0.5 rounded-md text-foreground/90">{data.code}</span>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-secondary to-background border border-yellow-900/30 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-yellow-500/80 text-sm font-medium mb-1">Gold Balance Due</p>
            <p className="text-2xl font-semibold text-yellow-500">{data.goldBal.toFixed(3)} <span className="text-sm font-normal text-yellow-600">g</span></p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-xl"><Scale className="w-6 h-6 text-yellow-500" /></div>
        </div>
        <div className="bg-gradient-to-br from-secondary to-background border border-border p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Silver Balance Due</p>
            <p className="text-2xl font-semibold text-foreground/90">{data.silverBal.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">g</span></p>
          </div>
          <div className="p-3 bg-secondary/50 rounded-xl"><Diamond className="w-6 h-6 text-muted-foreground" /></div>
        </div>
        <div className="bg-gradient-to-br from-secondary to-background border border-emerald-900/30 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-emerald-500/80 text-sm font-medium mb-1">Money Balance (Ledger)</p>
            <p className="text-2xl font-semibold text-emerald-500">
              ₹{Math.abs(data.moneyBal).toLocaleString("en-IN")}
              <span className="text-sm font-normal ml-2">{data.moneyBal < 0 ? "(Deposit)" : data.moneyBal > 0 ? "(Due)" : ""}</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl"><IndianRupee className="w-6 h-6 text-emerald-500" /></div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 mb-8 flex justify-between items-center">
        <p className="text-blue-200 text-sm">Branch Live Free Fine Weight (Available to Issue)</p>
        <p className="text-xl font-bold text-blue-400">{freeFineWeight.toFixed(3)} g</p>
      </div>

      {/* ACTIVE ASSIGNED ORDERS SECTION */}
      <div className="bg-[#0B1210] border border-[#1A382F] rounded-3xl p-6 mb-8 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Active Assigned Orders to this Wholesaler</h2>
              <p className="text-xs text-emerald-500/70">Currently pending completion with this karigar/wholesaler</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            {assignedOrders.length} Order(s) Assigned
          </span>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground bg-[#06100D] rounded-2xl border border-[#142B24]">
            No active assigned orders for this wholesaler at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedOrders.map((o: any) => {
              const orderTotalWeight = (o.items || []).reduce((sum: number, it: any) => sum + (Number(it.weight) || 0), 0);
              return (
                <div key={o.id} className="bg-[#0D1E19] border border-[#1A382F] hover:border-emerald-500/40 transition-all rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-bold text-emerald-200">{o.orderNumber}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{o.customerName}</p>
                      </div>
                      <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                        {o.status}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between bg-[#06100D] p-2 rounded-lg border border-emerald-950">
                      <span>Purity / Est. Weight:</span>
                      <span className="font-mono text-emerald-300 font-bold">22K • {orderTotalWeight > 0 ? `${orderTotalWeight.toFixed(2)}g` : "Custom"}</span>
                    </div>

                    {/* Products List */}
                    <div className="mt-2 space-y-1">
                      {o.items && o.items.length > 0 ? (
                        o.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-[11px] bg-[#091512] px-2 py-1 rounded border border-[#1A382F]">
                            <span className="text-emerald-300 font-medium">{item.category?.name || "Item"}</span>
                            <span className="text-muted-foreground font-mono">{item.weight ? `${Number(item.weight).toFixed(2)}g` : ""} {item.description ? `- ${item.description}` : ""}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">No products listed</p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShowReceiveOrders(true);
                      if (!selectedReceiveOrders.includes(o.id)) {
                        setSelectedReceiveOrders(prev => [...prev, o.id]);
                      }
                    }}
                    className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-foreground border border-emerald-500/40 text-xs py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Receive This Order
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Split Workflow UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        {/* SIDE A: Issue Raw Metal / Assign Orders */}
        <div className="bg-[#0B0E14] border border-[#1E293B] rounded-3xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ArrowUpFromLine className="w-32 h-32" />
          </div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ArrowUpFromLine className="w-4 h-4 text-orange-400" />
            </div>
            Issue Raw Metal & Assign Orders
          </h2>
          <form onSubmit={handleIssueSubmit} className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Metal Type</label>
                <select 
                  value={issueForm.metalType} onChange={e => setIssueForm({...issueForm, metalType: e.target.value})}
                  className="w-full bg-card border border-[#374151] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/50"
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Purity</label>
                <select 
                  value={issueForm.purity} onChange={e => setIssueForm({...issueForm, purity: e.target.value})}
                  className="w-full bg-card border border-[#374151] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/50"
                >
                  {purities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Weight (g) {showAssignOrders ? <span className="text-muted-foreground font-normal">(Optional if assigning order)</span> : "*"}
              </label>
              <input 
                type="number" step="0.001"
                value={issueForm.weight} onChange={e => setIssueForm({...issueForm, weight: e.target.value})}
                className="w-full bg-card border border-[#374151] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/50"
                placeholder="0.000"
              />
            </div>
            
            {/* Assign Order Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-card border border-border hover:border-orange-500/30 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showAssignOrders} 
                  onChange={handleAssignToggle}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900 bg-gray-700 border-gray-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground/90">Assign Orders to this Wholesaler</span>
              </label>
            </div>

            {/* Unassigned Orders Panel */}
            {showAssignOrders && (
              <div className="mt-2 bg-card border border-border rounded-xl p-3 max-h-72 overflow-y-auto space-y-2.5">
                {unassignedOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No unassigned orders available.</p>
                ) : (
                  unassignedOrders.map((o: any) => {
                    const orderTotalWeight = (o.items || []).reduce((sum: number, it: any) => sum + (Number(it.weight) || 0), 0);
                    return (
                      <div 
                        key={o.id} 
                        onClick={() => toggleIssueOrder(o.id)} 
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedIssueOrders.includes(o.id) 
                            ? 'bg-orange-500/10 border-orange-500/50 shadow-md' 
                            : 'bg-[#0B0E14] border-border hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-foreground tracking-wide">{o.orderNumber}</p>
                              <span className="text-[11px] font-mono text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                {orderTotalWeight > 0 ? `${orderTotalWeight.toFixed(2)}g` : "No Weight"}
                              </span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-0.5">{o.customerName} • <span className="text-[10px] text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</span></p>
                            
                            {/* Product Details in Short */}
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {o.items && o.items.length > 0 ? (
                                o.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1 bg-[#161D2A] text-foreground/90 text-[11px] px-2 py-1 rounded-md border border-border/50">
                                    <span className="font-medium text-orange-300">{item.category?.name || "Item"}</span>
                                    {item.weight ? <span className="text-zinc-200 font-mono font-medium">({Number(item.weight).toFixed(2)}g)</span> : null}
                                    {item.description ? <span className="text-muted-foreground truncate max-w-[100px]">- {item.description}</span> : null}
                                  </div>
                                ))
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">No products listed</span>
                              )}
                            </div>
                          </div>
                          {selectedIssueOrders.includes(o.id) && <CheckSquare className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Total Net Weight & Fine Weight Summary Box before Submit */}
            {selectedIssueOrders.length > 0 && (
              <div className="bg-[#16130B] border border-orange-500/30 rounded-xl p-3.5 mt-3">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-muted-foreground font-medium">Selected Orders ({selectedIssueOrders.length}):</span>
                  <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    Sum of Purities (Multi-Item)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-500/20">
                  <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Est. Total Net Weight</p>
                    <p className="text-base font-bold text-foreground font-mono mt-0.5">
                      {selectedNetWeight.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">g</span>
                    </p>
                  </div>
                  <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-orange-500/30">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Estimated 24k Required without Wastage</p>
                    <p className="text-base font-bold text-orange-400 font-mono mt-0.5">
                      {selectedFineWeight.toFixed(3)} <span className="text-xs font-normal text-orange-500/80">g</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-foreground py-3 rounded-xl font-medium shadow-lg shadow-orange-900/20 transition-all flex justify-center items-center gap-2">
              Issue Metal {selectedIssueOrders.length > 0 && `& Assign ${selectedIssueOrders.length} Order(s)`}
            </button>
          </form>
        </div>

        {/* SIDE B: Receive Finished Jewellery */}
        <div className="bg-[#0A1210] border border-[#132A24] rounded-3xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ArrowDownToLine className="w-32 h-32" />
          </div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            </div>
            Receive Orders & Ready Items
          </h2>
          <form onSubmit={handleReceiveSubmit} className="space-y-4 relative z-10">
            {/* Receive Order Cart Toggle */}
            <div className="pb-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#0F1C18] border border-[#1A382F] hover:border-emerald-500/30 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showReceiveOrders} 
                  onChange={handleReceiveToggle}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900 bg-gray-700 border-gray-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-emerald-100">Receive Assigned Orders</span>
              </label>
            </div>

            {/* Assigned Orders Cart Panel */}
            {showReceiveOrders && (
              <div className="bg-[#0F1C18] border border-[#1A382F] rounded-xl p-3 max-h-[380px] overflow-y-auto space-y-3">
                {assignedOrders.length === 0 ? (
                  <p className="text-xs text-emerald-900 text-center py-4">No active orders assigned to this wholesaler.</p>
                ) : (
                  assignedOrders.map((o: any) => {
                    const orderTotalWeight = (o.items || []).reduce((sum: number, it: any) => sum + (Number(it.weight) || 0), 0);
                    const isChecked = selectedReceiveOrders.includes(o.id);
                    const currentInputs = receiveInputs[o.id] || {};
                    const netW = parseFloat(currentInputs.netWeight ?? String(orderTotalWeight)) || 0;
                    const wastageVal = parseFloat(currentInputs.wastage ?? "2") || 0;
                    const purityPct = 92; // 22K (91.66% / 92%)
                    const calcFineWeight = Number(((netW * (purityPct + wastageVal)) / 100).toFixed(2));
                    const laborVal = parseFloat(currentInputs.laborCharge ?? "0") || 0;

                    return (
                      <div 
                        key={o.id} 
                        className={`p-3 rounded-xl border transition-all ${
                          isChecked 
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md' 
                            : 'bg-[#0B1210] border-[#1A382F]'
                        }`}
                      >
                        {/* Order Header / Checkbox row */}
                        <div 
                          onClick={() => toggleReceiveOrder(o.id)}
                          className="flex justify-between items-start gap-2 cursor-pointer select-none"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-emerald-100 flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => {}} 
                                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900 bg-gray-700 border-gray-600 cursor-pointer"
                                />
                                {o.orderNumber}
                              </p>
                              <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                22K • {orderTotalWeight > 0 ? `${orderTotalWeight.toFixed(2)}g` : "No Est. Weight"}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-500/70 mt-1 pl-6">
                              <span className="text-emerald-200 font-medium">{o.customerName}</span> • <span className="text-[10px] text-emerald-600">{new Date(o.createdAt).toLocaleDateString()}</span>
                            </p>
                            
                            {/* Product Details in Short */}
                            <div className="mt-2 pl-6 flex flex-wrap gap-1.5">
                              {o.items && o.items.length > 0 ? (
                                o.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1 bg-[#0A1A15] text-emerald-200 text-[11px] px-2 py-1 rounded-md border border-emerald-800/50">
                                    <span className="font-medium text-emerald-300">{item.category?.name || "Item"}</span>
                                    {item.weight ? <span className="text-emerald-100 font-mono font-medium">({Number(item.weight).toFixed(2)}g)</span> : null}
                                    {item.description ? <span className="text-emerald-400 truncate max-w-[120px]">- {item.description}</span> : null}
                                  </div>
                                ))
                              ) : (
                                <span className="text-[11px] text-emerald-600 italic">No products listed</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Per-Order Receiving Inputs (Shown when checked) */}
                        {isChecked && (
                          <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#06100D] p-2.5 rounded-lg">
                            <div>
                              <label className="block text-[10px] font-semibold text-emerald-400/80 mb-1">Final Net Wt (g)</label>
                              <input 
                                type="number" 
                                step="0.001"
                                value={currentInputs.netWeight ?? String(orderTotalWeight)} 
                                onChange={e => updateReceiveInput(o.id, 'netWeight', e.target.value)}
                                className="w-full bg-[#0F1C18] border border-emerald-500/30 rounded-md px-2 py-1 text-xs text-foreground outline-none focus:border-emerald-400"
                                placeholder={String(orderTotalWeight)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-emerald-400/80 mb-1">Wastage %</label>
                              <input 
                                type="number" 
                                step="0.1"
                                value={currentInputs.wastage ?? "2"} 
                                onChange={e => updateReceiveInput(o.id, 'wastage', e.target.value)}
                                className="w-full bg-[#0F1C18] border border-emerald-500/30 rounded-md px-2 py-1 text-xs text-foreground outline-none focus:border-emerald-400"
                                placeholder="2"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-emerald-400/80 mb-1">Fine Wt (g)</label>
                              <div className="w-full bg-emerald-950/60 border border-emerald-500/40 rounded-md px-2 py-1 text-xs text-emerald-300 font-mono font-bold">
                                {calcFineWeight.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-emerald-400/80 mb-1">Labor Charge (₹)</label>
                              <input 
                                type="number" 
                                step="1"
                                value={currentInputs.laborCharge ?? ""} 
                                onChange={e => updateReceiveInput(o.id, 'laborCharge', e.target.value)}
                                className="w-full bg-[#0F1C18] border border-emerald-500/30 rounded-md px-2 py-1 text-xs text-foreground outline-none focus:border-emerald-400"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Batch Receive Summary Card */}
                {selectedReceiveOrders.length > 0 && (
                  <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                      Batch Summary ({selectedReceiveOrders.length} Order(s) Selected)
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#0A1A15] p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-400/70 block">Total Net Wt</span>
                        <span className="text-sm font-bold text-emerald-200 font-mono">
                          {selectedReceiveOrders.reduce((sum, id) => {
                            const o = assignedOrders.find(x => x.id === id);
                            const defaultW = (o?.items || []).reduce((s: number, it: any) => s + (Number(it.weight) || 0), 0);
                            return sum + (parseFloat(receiveInputs[id]?.netWeight ?? String(defaultW)) || 0);
                          }, 0).toFixed(2)}g
                        </span>
                      </div>
                      <div className="bg-[#0A1A15] p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-400/70 block">Total Fine Wt</span>
                        <span className="text-sm font-bold text-emerald-300 font-mono">
                          {selectedReceiveOrders.reduce((sum, id) => {
                            const o = assignedOrders.find(x => x.id === id);
                            const defaultW = (o?.items || []).reduce((s: number, it: any) => s + (Number(it.weight) || 0), 0);
                            const netW = parseFloat(receiveInputs[id]?.netWeight ?? String(defaultW)) || 0;
                            const wastageVal = parseFloat(receiveInputs[id]?.wastage ?? "2") || 0;
                            const fineW = Number(((netW * (92 + wastageVal)) / 100).toFixed(2));
                            return sum + fineW;
                          }, 0).toFixed(2)}g
                        </span>
                      </div>
                      <div className="bg-[#0A1A15] p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-400/70 block">Total Labor</span>
                        <span className="text-sm font-bold text-emerald-100 font-mono">
                          ₹{selectedReceiveOrders.reduce((sum, id) => {
                            return sum + (parseFloat(receiveInputs[id]?.laborCharge ??"0") || 0);
                          }, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Readymade / Direct Batch Receive Inputs (if no assigned orders selected) */}
            {(!showReceiveOrders || selectedReceiveOrders.length === 0) && (
              <>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-emerald-500/70 mb-1.5">Batch Net Weight (g) *</label>
                    <input 
                      type="number" step="0.001"
                      value={receiveForm.netWeight} onChange={e => {
                        const nw = parseFloat(e.target.value) || 0;
                        const w = parseFloat(receiveForm.wastage) || 0;
                        setReceiveForm({...receiveForm, netWeight: e.target.value, fineWeight: ((nw * (92 + w)) / 100).toFixed(3)});
                      }}
                      className="w-full bg-[#0F1C18] border border-[#1A382F] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50 text-foreground"
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-emerald-500/70 mb-1.5">Wastage % *</label>
                    <input 
                      type="number" step="0.01"
                      value={receiveForm.wastage} onChange={e => {
                        const w = parseFloat(e.target.value) || 0;
                        const nw = parseFloat(receiveForm.netWeight) || 0;
                        setReceiveForm({...receiveForm, wastage: e.target.value, fineWeight: ((nw * (92 + w)) / 100).toFixed(3)});
                      }}
                      className="w-full bg-[#0F1C18] border border-[#1A382F] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50 text-foreground"
                      placeholder="2.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-emerald-500/70 mb-1.5">Calculated Fine (g) *</label>
                    <input 
                      type="number" step="0.001"
                      value={receiveForm.fineWeight} onChange={e => setReceiveForm({...receiveForm, fineWeight: e.target.value})}
                      className="w-full bg-[#0F1C18] border border-[#1A382F] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50 text-foreground"
                      placeholder="0.000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-500/70 mb-1.5">Labor Charge (₹)</label>
                  <input 
                    type="number" step="0.01"
                    value={receiveForm.laborCharge} onChange={e => setReceiveForm({...receiveForm, laborCharge: e.target.value})}
                    className="w-full bg-[#0F1C18] border border-[#1A382F] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50 text-foreground"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-500/70 mb-1.5">Remarks / Details</label>
                  <textarea 
                    value={receiveForm.remarks} onChange={e => setReceiveForm({...receiveForm, remarks: e.target.value})}
                    className="w-full bg-[#0F1C18] border border-[#1A382F] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50 resize-none h-16 text-foreground"
                    placeholder="Include readymade items here if any..."
                  />
                </div>
              </>
            )}

            <button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-foreground py-3 rounded-xl font-medium shadow-lg shadow-emerald-900/20 transition-all flex justify-center items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Receive {selectedReceiveOrders.length > 0 ? `${selectedReceiveOrders.length} Order(s)` : "Items"}
            </button>
          </form>
        </div>
      </div>

      {/* Recent Transactions & Order History */}
      <div className="bg-card border border-border rounded-3xl p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              Recent Transactions & Order History
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Detailed ledger audit trail, linked orders, and gold/cash balances.</p>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary/80 px-3 py-1.5 rounded-full border border-border font-mono">
            {data.ledgerEntries?.length || 0} Record(s) Loaded
          </span>
        </div>
        
        {data.ledgerEntries && data.ledgerEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider bg-[#0B0E14]">
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Transaction Type</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Gold / Metal Wt</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Labor / Cash</th>
                  <th className="py-3.5 px-4 font-semibold">Order Details & Product Breakdown</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {data.ledgerEntries.map((entry: any, i: number) => {
                  const tx = entry.transaction || {};
                  const createdAt = new Date(entry.createdAt);
                  const formattedDate = createdAt.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
                  const formattedTime = createdAt.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });

                  // Match orders referenced in transaction description or cash items
                  const matchedOrders = (data.orders || []).filter((o: any) => 
                    entry.description?.includes(o.orderNumber) || 
                    tx.remarks?.includes(o.orderNumber) ||
                    (tx.cashItems || []).some((ci: any) => ci.itemName?.includes(o.orderNumber))
                  );

                  return (
                    <tr 
                      key={i} 
                      onClick={() => setSelectedTxModal({ entry, tx, matchedOrders })}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    >
                      {/* Date & Time */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-zinc-200">{formattedDate}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 inline" /> {formattedTime}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Transaction Type */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide w-fit ${
                            entry.entryType.includes('ISSUE') || entry.entryType.includes('CREDIT')
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
                              : entry.entryType.includes('RECEIVE') || entry.entryType.includes('DEBIT')
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-secondary text-foreground/90 border border-border'
                          }`}>
                            {entry.entryType.includes('ISSUE') ? <ArrowUpFromLine className="w-3 h-3" /> : <ArrowDownToLine className="w-3 h-3" />}
                            {entry.entryType.replace(/_/g, ' ')}
                          </span>
                          {tx.purityLabel && (
                            <span className="text-[10px] text-amber-400/80 font-mono font-medium pl-1">
                              {tx.purityLabel} {tx.wastage ? `(+${tx.wastage}% Wastage)` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gold / Metal Wt */}
                      <td className="py-4 px-4 text-right whitespace-nowrap font-mono">
                        {entry.metalAmount !== 0 ? (
                          <div>
                            <p className={`text-sm font-bold ${entry.metalAmount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {entry.metalAmount > 0 ? "+" : ""}{entry.metalAmount.toFixed(3)} <span className="text-xs font-normal">g</span>
                            </p>
                            {tx.weight > 0 && tx.weight !== Math.abs(entry.metalAmount) && (
                              <p className="text-[10px] text-muted-foreground">Gross: {tx.weight.toFixed(3)}g</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">-</span>
                        )}
                      </td>

                      {/* Cash / Labor */}
                      <td className="py-4 px-4 text-right whitespace-nowrap font-mono">
                        {entry.cashAmount !== 0 ? (
                          <div>
                            <p className={`text-sm font-bold ${entry.cashAmount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {entry.cashAmount > 0 ? "+" : "-"}₹{Math.abs(entry.cashAmount).toLocaleString()}
                            </p>
                            {(tx.cashItems || []).length > 0 && (
                              <p className="text-[10px] text-amber-400/80">({tx.cashItems.length} charge item)</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">-</span>
                        )}
                      </td>

                      {/* Order Details & Product Breakdown (Horizontal) */}
                      <td className="py-4 px-4 min-w-[280px]">
                        <div className="space-y-1.5">
                          <p className="text-xs text-foreground/90 font-medium line-clamp-1">{entry.description}</p>

                          {/* Horizontal Order & Item Badges */}
                          {matchedOrders.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {matchedOrders.map((ord: any) => {
                                const totalW = (ord.items || []).reduce((s: number, it: any) => s + (Number(it.weight) || 0), 0);
                                return (
                                  <div key={ord.id} className="flex items-center gap-1.5 bg-[#08121E] border border-blue-500/30 text-blue-200 px-2 py-1 rounded-md text-[11px]">
                                    <span className="font-semibold text-blue-300">{ord.orderNumber}</span>
                                    <span className="text-muted-foreground">({ord.customerName})</span>
                                    {totalW > 0 && <span className="font-mono text-amber-400">[{totalW.toFixed(2)}g]</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            tx.remarks && tx.remarks !== entry.description && (
                              <p className="text-[11px] text-muted-foreground italic line-clamp-1">{tx.remarks}</p>
                            )
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button className="inline-flex items-center gap-1 bg-secondary group-hover:bg-amber-500 group-hover:text-foreground text-foreground/90 text-xs px-3 py-1.5 rounded-lg border border-border group-hover:border-amber-400 font-medium transition-all shadow-sm">
                          <Eye className="w-3.5 h-3.5" /> View Depth
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ListChecks className="w-8 h-8 opacity-50" />
            <p className="text-sm">No transaction history found for this wholesaler.</p>
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* TRANSACTION DEPTH POPUP MODAL             */}
      {/* ========================================= */}
      {selectedTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B1210] border border-[#1A382F] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-secondary via-[#0D1C17] to-background border-b border-[#1A382F] flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">Transaction Audit & Depth View</h3>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                      ID: {selectedTxModal.tx?.id || selectedTxModal.entry?.id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Logged on {new Date(selectedTxModal.entry?.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTxModal(null)}
                className="w-8 h-8 rounded-full bg-secondary/80 hover:bg-zinc-700 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Section 1: Transaction Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0F1C18] border border-[#1A382F] p-3 rounded-xl">
                  <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider block">Entry Type</span>
                  <span className="text-sm font-bold text-emerald-200 mt-0.5 block">
                    {selectedTxModal.entry?.entryType?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="bg-[#0F1C18] border border-[#1A382F] p-3 rounded-xl">
                  <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider block">Wholesaler</span>
                  <span className="text-sm font-bold text-foreground mt-0.5 block truncate">
                    {data?.name || "N/A"}
                  </span>
                </div>
                <div className="bg-[#0F1C18] border border-[#1A382F] p-3 rounded-xl">
                  <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider block">Metal Delta</span>
                  <span className={`text-sm font-bold font-mono mt-0.5 block ${selectedTxModal.entry?.metalAmount > 0 ? "text-emerald-400" : selectedTxModal.entry?.metalAmount < 0 ? "text-rose-400" : "text-muted-foreground"}`}>
                    {selectedTxModal.entry?.metalAmount > 0 ? "+" : ""}{(selectedTxModal.entry?.metalAmount || 0).toFixed(3)}g
                  </span>
                </div>
                <div className="bg-[#0F1C18] border border-[#1A382F] p-3 rounded-xl">
                  <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider block">Money Balance Delta</span>
                  <span className={`text-sm font-bold font-mono mt-0.5 block ${selectedTxModal.entry?.cashAmount > 0 ? "text-emerald-400" : selectedTxModal.entry?.cashAmount < 0 ? "text-rose-400" : "text-muted-foreground"}`}>
                    {selectedTxModal.entry?.cashAmount > 0 ? "+" : ""}₹{Math.abs(selectedTxModal.entry?.cashAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Section 2: Weight & Purity Metrics (if transaction record exists) */}
              {selectedTxModal.tx && (
                <div className="bg-[#091512] border border-[#142B24] rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-4 h-4" /> Gold Weight & Purity Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#0D1E19] p-2.5 rounded-xl border border-[#1A382F]">
                      <span className="text-muted-foreground block text-[10px]">Gross Weight</span>
                      <span className="text-sm font-bold text-foreground font-mono">{(selectedTxModal.tx.weight || 0).toFixed(3)} g</span>
                    </div>
                    <div className="bg-[#0D1E19] p-2.5 rounded-xl border border-[#1A382F]">
                      <span className="text-muted-foreground block text-[10px]">Purity Label</span>
                      <span className="text-sm font-bold text-amber-300">{selectedTxModal.tx.purityLabel || "24K"}</span>
                    </div>
                    <div className="bg-[#0D1E19] p-2.5 rounded-xl border border-[#1A382F]">
                      <span className="text-muted-foreground block text-[10px]">Wastage %</span>
                      <span className="text-sm font-bold text-orange-400">{selectedTxModal.tx.wastage || 0}%</span>
                    </div>
                    <div className="bg-[#0D1E19] p-2.5 rounded-xl border border-[#1A382F]">
                      <span className="text-muted-foreground block text-[10px]">Calculated Fine Weight</span>
                      <span className="text-sm font-bold text-emerald-300 font-mono">{(selectedTxModal.tx.fineWeight || 0).toFixed(3)} g</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Cash & Labor Itemization */}
              {selectedTxModal.tx?.cashItems && selectedTxModal.tx.cashItems.length > 0 && (
                <div className="bg-[#091512] border border-[#142B24] rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4" /> Cash & Labor Charge Itemization
                  </h4>
                  <div className="bg-[#0D1E19] rounded-xl border border-[#1A382F] overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0F221C] text-muted-foreground border-b border-[#1A382F]">
                        <tr>
                          <th className="py-2 px-3">Item / Description</th>
                          <th className="py-2 px-3 text-right">Cost (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A382F]">
                        {selectedTxModal.tx.cashItems.map((ci: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-zinc-200 font-medium">{ci.itemName}</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-300 font-semibold">₹{ci.cost.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section 4: Associated Orders & Product Breakdown */}
              {selectedTxModal.matchedOrders && selectedTxModal.matchedOrders.length > 0 && (
                <div className="bg-[#091512] border border-[#142B24] rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Linked Orders & Jewellery Products
                  </h4>
                  <div className="space-y-3">
                    {selectedTxModal.matchedOrders.map((ord: any) => (
                      <div key={ord.id} className="bg-[#0D1E19] border border-[#1A382F] rounded-xl p-3.5 space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-bold text-blue-300">{ord.orderNumber}</span>
                            <span className="text-xs text-muted-foreground ml-2">Customer: <strong className="text-zinc-200">{ord.customerName}</strong></span>
                          </div>
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-semibold uppercase">
                            {ord.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {ord.items && ord.items.length > 0 ? (
                            ord.items.map((item: any, idx: number) => (
                              <div key={idx} className="bg-[#06100D] border border-emerald-900/40 p-2 rounded-lg text-xs flex justify-between items-center">
                                <div>
                                  <span className="font-semibold text-emerald-300">{item.category?.name || "Product"}</span>
                                  {item.description && <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{item.description}</p>}
                                </div>
                                {item.weight && (
                                  <span className="font-mono text-emerald-200 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                                    {Number(item.weight).toFixed(2)}g
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No specific product items listed.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5: Description & Remarks */}
              <div className="bg-[#091512] border border-[#142B24] rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Description Log</span>
                <p className="text-xs text-zinc-200 leading-relaxed font-mono bg-[#0D1E19] p-3 rounded-xl border border-[#1A382F]">
                  {selectedTxModal.entry?.description}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#091512] border-t border-[#1A382F] flex justify-end">
              <button 
                onClick={() => setSelectedTxModal(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-foreground px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-all"
              >
                Close Audit View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
