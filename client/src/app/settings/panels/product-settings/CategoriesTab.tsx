import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoriesTab({ branchId }: { branchId: number | undefined }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);

  // form state
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [subs, setSubs] = useState<string[]>([]);
  const [subInput, setSubInput] = useState("");

  useEffect(() => {
    if (branchId) fetchCategories();
  }, [branchId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/settings/categories?branchId=${branchId}`);
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat?: any) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setDesc(cat.description || "");
      setSubs(cat.subCategories.map((s: any) => s.name));
    } else {
      setEditingCat(null);
      setName("");
      setDesc("");
      setSubs([]);
    }
    setSubInput("");
    setIsModalOpen(true);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (subInput.trim() && !subs.includes(subInput.trim())) {
      setSubs([...subs, subInput.trim()]);
      setSubInput("");
    }
  };

  const handleRemoveSub = (subName: string) => {
    setSubs(subs.filter(s => s !== subName));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCat ? `/api/settings/categories/${editingCat.id}` : `/api/settings/categories`;
      const method = editingCat ? "PUT" : "POST";
      const body = { name, description: desc, branchId, subCategories: subs };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        alert("Failed to save category");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this category? This might fail if products are linked to it.")) {
      const res = await fetch(`/api/settings/categories/${id}`, { method: "DELETE" });
      if (res.ok) fetchCategories();
      else alert("Cannot delete category in use.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum">Product Categories</h3>
          <p className="text-[13px] text-platinum-muted">Manage global product categories and sub-categories.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-onyx rounded-xl" />
          <div className="h-16 bg-onyx rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-onyx border border-onyx-border rounded-xl p-5 hover:border-gold/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <Tags className="w-4 h-4 text-gold" />
                  </div>
                  <h4 className="text-[14px] font-medium text-platinum">{cat.name}</h4>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(cat)} className="text-platinum-muted hover:text-gold transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="text-platinum-muted hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-[12px] text-platinum-muted mb-4 truncate">{cat.description || "No description"}</p>
              <div className="flex flex-wrap gap-2">
                {cat.subCategories.slice(0, 3).map((sub: any) => (
                  <span key={sub.id} className="text-[11px] bg-onyx-elevated px-2 py-1 rounded text-platinum-muted">{sub.name}</span>
                ))}
                {cat.subCategories.length > 3 && (
                  <span className="text-[11px] bg-onyx-elevated px-2 py-1 rounded text-platinum-muted">+{cat.subCategories.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
          <div className="bg-onyx-surface border border-onyx-border rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-onyx-border">
              <h2 className="text-[16px] font-semibold text-platinum">{editingCat ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-platinum-muted hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] text-platinum-muted mb-1.5">Category Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
              </div>
              <div>
                <label className="block text-[12px] text-platinum-muted mb-1.5">Description</label>
                <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" />
              </div>
              <div className="border-t border-onyx-border pt-4 mt-4">
                <label className="block text-[12px] text-platinum-muted mb-2">Sub-Categories</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={subInput} onChange={e => setSubInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSub(e as any); } }} className="flex-1 bg-onyx px-3 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum" placeholder="Add sub-category and press enter..." />
                  <button type="button" onClick={handleAddSub} className="bg-onyx-elevated px-4 rounded-lg text-platinum hover:text-gold transition-colors text-[13px]">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subs.map(s => (
                    <div key={s} className="flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold px-3 py-1.5 rounded-lg text-[12px]">
                      {s}
                      <button type="button" onClick={() => handleRemoveSub(s)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-onyx-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-platinum hover:bg-onyx">Cancel</button>
                <button type="submit" className="bg-gold text-onyx px-6 py-2 rounded-lg text-[13px] font-medium hover:bg-gold/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
