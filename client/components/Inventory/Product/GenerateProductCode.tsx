"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Hash } from "lucide-react"; // Lucide icons
import { generateProductCode } from "@/lib/actions/generateCodes"; // Your existing function

type Props = {
  branchCode: string; // First three letters of branch name
  branchId: number;
  categoryType: string; // GLD, SLV, etc.
  categoryName: string; // Full category name
};

const GenerateProductCodeButton: React.FC<Props> = ({
  branchCode,
  branchId,
  categoryType,
  categoryName,
}) => {
  const [loading, setLoading] = useState(false);
  const [productCode, setProductCode] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const code = await generateProductCode(
        branchCode,
        branchId,
        categoryType,
        categoryName
      );
      setProductCode(code);
    } catch (error) {
      console.error("Error generating product code:", error);
      setProductCode(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleGenerate}
        variant="outline"
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Hash className="w-4 h-4" />
        )}
        Generate Code
      </Button>

      {productCode && (
        <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
          {productCode}
        </span>
      )}
    </div>
  );
};

export default GenerateProductCodeButton;
