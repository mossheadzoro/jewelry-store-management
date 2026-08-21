import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BaseModal } from "../../ui/BaseModal";

const GOLD_PURITIES = ["22K", "20K", "18K", "14K", "9K"];

interface Props {
  wholesalerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceiveJewelleryModal({ wholesalerId, onClose, onSuccess }: Props) {
  const [metalType, setMetalType] = useState<"GOLD" | "SILVER" | "DIAMOND">("GOLD");
  const [purityLabel, setPurityLabel] = useState("");
  const [weight, setWeight] = useState("");
  const [wastage, setWastage] = useState("");
  const [cashItems, setCashItems] = useState<{ itemName: string; cost: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const weightNum = parseFloat(weight) || 0;
  const wastageNum = parseFloat(wastage) || 0;

  let fineOutput = 0;
  if (metalType === "GOLD" && purityLabel) {
    const purityMap: Record<string, number> = {
      "22K": 92,
      "20K": 83,
      "18K": 75,
      "14K": 58,
      "9K": 37,
    };
    const purityPct = purityMap[purityLabel] || 0;
    fineOutput = weightNum * (purityPct + wastageNum) / 100;
  } else if (metalType === "SILVER" && purityLabel) {
    const purityPct = parseFloat(purityLabel) || 0;
    fineOutput = weightNum * (purityPct + wastageNum) / 100;
  }

  const totalCashAmount = cashItems.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);

  const addCashItem = () => setCashItems([...cashItems, { itemName: "", cost: "" }]);
  const removeCashItem = (index: number) => setCashItems(cashItems.filter((_, i) => i !== index));
  const updateCashItem = (index: number, field: "itemName" | "cost", value: string) => {
    const newItems = [...cashItems];
    newItems[index][field] = value;
    setCashItems(newItems);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (metalType !== "DIAMOND" && (!purityLabel || !weight)) return;

    setLoading(true);
    const payload = {
      type: "RECEIVE_JEWELLERY",
      metalType,
      purityLabel,
      weight: weightNum,
      wastage: wastageNum,
      cashItems: cashItems.filter(i => i.itemName && i.cost),
    };

    try {
      const res = await fetch(`/api/wholesalers/${wholesalerId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        console.error("Transation failed", await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal title="Receive Jewellery" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-4">
          {(['GOLD', 'SILVER', 'DIAMOND'] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setMetalType(type); setPurityLabel(""); }}
              className={`flex-1 py-1.5 text-sm rounded-lg font-medium border ${metalType === type ? 'bg-purple-600 border-purple-500 text-foreground' : 'bg-card border-border text-muted-foreground'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {metalType !== "DIAMOND" && (
          <div className="space-y-4">
            {metalType === "GOLD" && (
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Purity</label>
                <div className="flex gap-2 flex-wrap">
                  {GOLD_PURITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPurityLabel(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${purityLabel === p ? 'bg-yellow-600 border-yellow-500 text-foreground' : 'bg-secondary border-border text-muted-foreground'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {metalType === "SILVER" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Purity (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 92.50"
                  step="0.01"
                  value={purityLabel}
                  onChange={(e) => setPurityLabel(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Gross Weight (g)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Wastage (%)</label>
                <input
                  type="number"
                  value={wastage}
                  onChange={(e) => setWastage(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-blue-900/50 mt-4 flex justify-between items-center">
              <span className="text-muted-foreground font-medium whitespace-nowrap mr-4">Fine {metalType}:</span>
              <span className="text-xl font-bold text-blue-400 tracking-wide">{fineOutput.toFixed(3)} g</span>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-foreground/80 font-medium text-sm">Additional Charges (Cash)</h3>
            <button onClick={addCashItem} className="text-blue-400 hover:text-blue-300 flex items-center text-xs font-semibold bg-blue-900/20 px-2 py-1 rounded">
              <Plus size={14} className="mr-1" /> Add
            </button>
          </div>
          
          <div className="space-y-2">
            {cashItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="e.g. Stone Charge, Making"
                  value={item.itemName}
                  onChange={(e) => updateCashItem(index, "itemName", e.target.value)}
                  className="flex-1 bg-card border border-border rounded-lg p-2 text-foreground outline-none text-sm"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={item.cost}
                  onChange={(e) => updateCashItem(index, "cost", e.target.value)}
                  className="w-28 bg-card border border-border rounded-lg p-2 text-foreground outline-none text-sm"
                />
                <button onClick={() => removeCashItem(index)} className="text-red-400 hover:text-red-300 p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {cashItems.length > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-900/10 border border-green-900/30 rounded-lg mt-2">
                <span className="text-muted-foreground text-sm">Total Cash Amount:</span>
                <span className="font-semibold text-green-400">₹{totalCashAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700 text-foreground font-semibold py-3 rounded-xl mt-6 transition-colors shadow-lg disabled:opacity-50"
          disabled={loading || (metalType !== "DIAMOND" && (!purityLabel || !weight))}
        >
          {loading ? "Processing..." : "Confirm Receive"}
        </button>
      </div>
    </BaseModal>
  );
}
