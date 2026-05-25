"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type MetalType = "GOLD" | "SILVER";

export default function TonchItemForm({
  sessionId,
  userId,
  customerId,
  onAddItem,
  disabled,
}: {
  sessionId: string;
  userId: number;
  customerId: number;
  disabled: boolean;
  onAddItem: (item: any) => void;
}) {
  const [metalType, setMetalType] = useState<MetalType>("GOLD");
  const [description, setDescription] = useState("");
  const [weightBefore, setWeightBefore] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAddItem() {
    if (!customerId) {
      toast.error("Please select customer first");
      return;
    }

    if (!weightBefore || Number(weightBefore) <= 0) {
      toast.error("Weight must be greater than zero");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/metal-exchange/item/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          customerId,
          metalType,
          description,
          weightBefore: Number(weightBefore),
          notes,
          userId,
        }),
      });

      if (!res.ok) throw new Error("Failed to add item");

      const item = await res.json();

      onAddItem(item);

      // Reset form
      setDescription("");
      setWeightBefore("");
      setNotes("");

      toast.success("Tonch item added");
    } catch (err) {
      toast.error("Could not add item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Tonch Item Creation</CardTitle>
        <Badge variant="outline">AUTO</Badge>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        {/* Metal Type */}
        <div>
          <Label>Metal Type</Label>
          <Tabs
            value={metalType.toLowerCase()}
            onValueChange={(v) =>
              setMetalType(v === "gold" ? "GOLD" : "SILVER")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="gold" disabled={disabled || loading}>
                Gold
              </TabsTrigger>
              <TabsTrigger value="silver" disabled={disabled || loading}>
                Silver
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Field
          label="Item Description"
          value={description}
          disabled={disabled || loading}
          onChange={(e: any) => setDescription(e.target.value)}
        />

        <Field
          label="Weight (g)"
          type="number"
          value={weightBefore}
          disabled={disabled || loading}
          onChange={(e: any) => setWeightBefore(e.target.value)}
        />

        <Field
          label="Notes"
          value={notes}
          disabled={disabled || loading}
          onChange={(e: any) => setNotes(e.target.value)}
        />

        {disabled && (
          <p className="text-xs text-muted-foreground col-span-full">
            Please select a customer to add tonch items
          </p>
        )}

        <Button
  size="icon"
  onClick={handleAddItem}
  disabled={disabled || loading}
>

          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, ...props }: any) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}
