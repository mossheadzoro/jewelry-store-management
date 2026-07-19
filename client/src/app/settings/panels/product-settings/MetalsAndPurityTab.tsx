import React, { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";

export default function MetalsAndPurityTab({ config, onSave, isAdmin }: { config: any, onSave: (d: any, applyToAllBranches: boolean) => Promise<boolean>, isAdmin: boolean }) {
  const migratePurities = (metals: any[]) => {
    if (!metals) return [];
    return metals.map((metal) => {
      return {
        ...metal,
        purities: (metal.purities || []).map((p: any) => {
          if (typeof p === "string") {
            return { carat: p, purityPercent: 0 };
          }
          return p;
        })
      };
    });
  };

  const defaultMetals = [
    { id: "1", name: "Gold", active: true, purities: [{carat: "18K", purityPercent: 75}, {carat: "20K", purityPercent: 83.3}, {carat: "22K", purityPercent: 91.6}, {carat: "24K", purityPercent: 99.9}] },
    { id: "2", name: "Silver", active: true, purities: [{carat: "925", purityPercent: 92.5}, {carat: "999", purityPercent: 99.9}] },
    { id: "3", name: "Platinum", active: true, purities: [{carat: "950", purityPercent: 95.0}] },
  ];

  const [metals, setMetals] = useState<any[]>(config?.metals ? migratePurities(config.metals) : defaultMetals);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const handleSave = async (applyToAllBranches = false) => {
    if (applyToAllBranches) setSavingAll(true);
    else setSaving(true);
    
    await onSave({ metals }, applyToAllBranches);
    
    setSavingAll(false);
    setSaving(false);
  };

  const addMetal = () => {
    setMetals([...metals, { id: Date.now().toString(), name: "New Metal", active: true, purities: [] }]);
  };

  const removeMetal = (id: string) => {
    setMetals(metals.filter(m => m.id !== id));
  };

  const updateMetal = (id: string, field: string, val: any) => {
    setMetals(metals.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const addPurity = (metalId: string) => {
    setMetals(metals.map(m => {
      if (m.id === metalId) {
        return { ...m, purities: [...m.purities, { carat: "", purityPercent: 0 }] };
      }
      return m;
    }));
  };

  const updatePurity = (metalId: string, idx: number, field: string, val: any) => {
    setMetals(metals.map(m => {
      if (m.id === metalId) {
        const newPurities = [...m.purities];
        newPurities[idx] = { ...newPurities[idx], [field]: val };
        return { ...m, purities: newPurities };
      }
      return m;
    }));
  };

  const removePurity = (metalId: string, idx: number) => {
    setMetals(metals.map(m => {
      if (m.id === metalId) {
        const newPurities = [...m.purities];
        newPurities.splice(idx, 1);
        return { ...m, purities: newPurities };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum">Metals & Purity</h3>
          <p className="text-[13px] text-platinum-muted">Define the metals your store trades and their standard purities.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => handleSave(true)} disabled={saving || savingAll} className="bg-onyx-surface border border-onyx-border text-platinum px-4 py-2 rounded-lg text-[13px] font-medium hover:text-gold transition-colors flex items-center gap-2">
              {savingAll ? "Saving..." : "Save for All Branches"}
            </button>
            <button onClick={() => handleSave(false)} disabled={saving || savingAll} className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {metals.map((metal, idx) => (
          <div key={metal.id} className="bg-onyx border border-onyx-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-platinum-muted mb-1.5">Metal Name</label>
                  <input 
                    type="text" 
                    value={metal.name} 
                    onChange={e => updateMetal(metal.id, 'name', e.target.value)}
                    disabled={!isAdmin} 
                    className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum disabled:opacity-50" 
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-platinum-muted mb-1.5">Status</label>
                  <select 
                    value={metal.active ? "true" : "false"} 
                    onChange={e => updateMetal(metal.id, 'active', e.target.value === "true")}
                    disabled={!isAdmin}
                    className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum disabled:opacity-50"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 border-t border-onyx-border pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[12px] font-medium text-platinum">Supported Purities</label>
                    {isAdmin && (
                      <button onClick={() => addPurity(metal.id)} className="text-[11px] text-gold hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Purity
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {metal.purities.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-onyx-surface/50 p-2 rounded-lg border border-onyx-border">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Carat/Name (e.g. 22K)"
                            value={p.carat}
                            onChange={(e) => updatePurity(metal.id, i, 'carat', e.target.value)}
                            disabled={!isAdmin}
                            className="w-full bg-onyx-surface px-3 py-1.5 rounded border border-onyx-border focus:border-gold outline-none text-[12px] text-platinum disabled:opacity-50"
                          />
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="Purity %"
                            value={p.purityPercent || ''}
                            onChange={(e) => updatePurity(metal.id, i, 'purityPercent', parseFloat(e.target.value))}
                            disabled={!isAdmin}
                            className="w-full bg-onyx-surface px-3 py-1.5 rounded border border-onyx-border focus:border-gold outline-none text-[12px] text-platinum disabled:opacity-50"
                          />
                          <span className="text-[12px] text-platinum-muted">%</span>
                        </div>
                        {isAdmin && (
                          <button onClick={() => removePurity(metal.id, i)} className="p-1.5 text-platinum-muted hover:text-red-400 hover:bg-onyx rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {metal.purities.length === 0 && (
                      <p className="text-[12px] text-platinum-muted italic py-2">No purities defined for this metal.</p>
                    )}
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <button onClick={() => removeMetal(metal.id)} className="text-platinum-muted hover:text-red-400 mt-7">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <button onClick={addMetal} className="w-full py-3 border-2 border-dashed border-onyx-border rounded-xl text-[13px] font-medium text-platinum hover:text-gold hover:border-gold/50 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Metal Type
        </button>
      )}
    </div>
  );
}
