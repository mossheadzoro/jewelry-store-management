"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateWholesalerModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    phone: "",
    whatsapp: "",
    email: "",
    gstNumber: "",
    panNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/wholesalers", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          branchId: 1, // replace with session branch
        }),
      });

      if (!res.ok) throw new Error("Failed");

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      alert("Error creating wholesaler");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card w-full max-w-2xl rounded-2xl p-6 border border-border shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Create Wholesaler
          </h2>
          <button onClick={onClose}>
            <X className="text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Input label="Wholesaler Name *" name="name" onChange={handleChange} />
          <Input label="Owner Name" name="ownerName" onChange={handleChange} />
          <Input label="Phone *" name="phone" onChange={handleChange} />
          <Input label="WhatsApp" name="whatsapp" onChange={handleChange} />
          <Input label="Email" name="email" onChange={handleChange} />
          <Input label="GST Number" name="gstNumber" onChange={handleChange} />
          <Input label="PAN Number" name="panNumber" onChange={handleChange} />
          <Input label="City *" name="city" onChange={handleChange} />
          <Input label="State *" name="state" onChange={handleChange} />
          <Input label="Pincode *" name="pincode" onChange={handleChange} />

          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Address *</label>
            <textarea
              name="address"
              onChange={handleChange}
              className="w-full mt-1 bg-input border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  onChange,
}: {
  label: string;
  name: string;
  onChange: any;
}) {
  return (
    <div>
      <label className="text-sm text-muted-foreground">{label}</label>
      <input
        type="text"
        name={name}
        onChange={onChange}
        className="w-full mt-1 bg-input border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}
