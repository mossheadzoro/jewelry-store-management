"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";

export default function AddBranchForm() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/branch/create", formData);
       console.log(response)
      if (response.status === 201) {
        alert(`✅ Branch "${formData.name}" created!`);
        setFormData({
          name: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          phone: "",
          email: "",
        });
      } else {
        alert(`❌ Unexpected response: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Error:", err);
      alert(`❌ ${err.response?.data?.error || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded shadow space-y-4 mb-2"
    >
      {Object.entries(formData).map(([key, value]) => (
        <input
          key={key}
          name={key}
          value={value}
          onChange={handleChange}
          placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
          className="border p-2 w-full"
          required={key === "name" || key === "email"}
        />
      ))}
      <Button
        type="submit"
        disabled={loading}
        className="bg-gray-300 text-gray-950 px-4  rounded disabled:opacity-50  mx-50 my-1 "
      >
        {loading ? "Creating..." : "Create Branch"}
      </Button>
    </form>
  );
}
