import React, { useState } from "react";
import { BaseModal } from "../../ui/BaseModal";

interface Props {
  wholesalerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function IssueMetalModal({ wholesalerId, onClose, onSuccess }: Props) {
  const [metalType, setMetalType] = useState<"GOLD" | "SILVER">("GOLD");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  const weightNum = parseFloat(weight) || 0;
  const fineOutput = weightNum; // Issue Metal is strictly 24K pure with 0 wastage

  const handleSubmit = async () => {
    if (!weight) return;
    setLoading(true);

    const payload = {
      type: "ISSUE_METAL",
      metalType,
      purityLabel: "", // Ignored by API
      weight: weightNum,
      wastage: 0,
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
    <BaseModal title="Issue Metal" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-4">
          {(['GOLD', 'SILVER'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMetalType(type)}
              className={`flex-1 py-2 rounded-lg font-medium border ${metalType === type ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#111827] border-gray-700 text-gray-400'}`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="bg-[#111827] p-4 rounded-xl border border-gray-700 mt-4 flex justify-between items-center text-sm text-gray-400">
          <span>Purity Level</span>
          <span className="font-semibold text-gray-200">24K (Pure {metalType})</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Gross Weight (g)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-[#111827] border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="bg-[#111827] p-4 rounded-xl border border-blue-900/50 mt-4 flex justify-between items-center">
          <span className="text-gray-400 font-medium whitespace-nowrap mr-4">Fine {metalType} Deducted:</span>
          <span className="text-xl font-bold text-blue-400 tracking-wide">{fineOutput.toFixed(3)} g</span>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mt-6 transition-colors shadow-lg disabled:opacity-50"
          disabled={!weight || loading}
        >
          {loading ? "Processing..." : "Confirm Issue (24K)"}
        </button>
      </div>
    </BaseModal>
  );
}
