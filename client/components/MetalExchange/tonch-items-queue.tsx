"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Pencil, RefreshCw, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconLoader2 } from "@tabler/icons-react";
import { roundFineGold } from "@/lib/fineGold";
import OldGoldSlipModal from "./OldGoldSlipModal";
import { useUserStore } from "@/lib/store/useUserStore";
import { toast } from "sonner";

export default function TonchItemsQueue({
  items,
  onUpdate,
  onRefresh,
}: {
  items: any[];
  onUpdate: (id: string, data: any) => void;
  onRefresh: () => void;
}) {
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showFinalize, setShowFinalize] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [selectedSlipItem, setSelectedSlipItem] = useState<any | null>(null);

  const pendingItems = items.filter((i) => i.status !== "TONCHED" && !i.locked);

  const canFinalize =
    pendingItems.length > 0 &&
    pendingItems.every(
      (i) => i.after != null && i.purity != null && Number(i.after) > 0 && Number(i.purity) > 0
    );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Tonch Queue</CardTitle>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>

            <Button
              size="sm"
              disabled={!canFinalize}
              onClick={() => setShowFinalize(true)}
            >
              Finalize Tonch
            </Button>
          </div>
        </CardHeader>

        <CardContent className="max-h-[400px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b">
                <Th className="w-36">Queue ID</Th>
                <Th className="w-36">Customer</Th>
                <Th className="w-28">Phone</Th>
                <Th className="w-[220px]">Description</Th>
                <Th className="w-20 text-center">Metal</Th>
                <Th className="w-20 text-right">Before</Th>
                <Th className="w-20 text-right">After</Th>
                <Th className="w-24 text-right">Loss</Th>
                <Th className="w-20 text-right">Purity</Th>
                <Th className="w-24 text-right">Fine</Th>
                <Th className="w-28 text-center">Status</Th>
                <Th className="w-20 text-center">Action</Th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id ?? item.queueId} className="border-b">
                  <Td className="font-medium">{item.queueId}</Td>
                  <Td>{item.customerName}</Td>
                  <Td>{item.customerPhone}</Td>
                  <Td className="truncate">{item.description}</Td>
                  <Td className="text-center font-medium">
                    {item.metalType === "GOLD" ? (
                      <Badge className="bg-yellow-500 text-foreground">GOLD</Badge>
                    ) : (
                      <Badge variant="secondary">SILVER</Badge>
                    )}
                  </Td>

                  <Td className="text-right tabular-nums">{item.before}</Td>

                  <Td className="text-right tabular-nums">
                    {item.after ?? "-"}
                  </Td>

                  <Td className="text-right tabular-nums text-orange-600">
                    {item.remaining ?? "-"}
                  </Td>

                  <Td className="text-right tabular-nums">
                    {item.purity ?? "-"}
                  </Td>

                  <Td className="text-right tabular-nums font-medium text-green-600">
                    {item.fine != null ? roundFineGold(item.fine).toFixed(3) : "-"}
                  </Td>

                  <Td className="text-center">
                    <StatusBadge status={item.status} />
                  </Td>

                  <Td className="text-center flex justify-center gap-1.5 pt-3">
                    <button
                      onClick={() => setSelectedSlipItem(item)}
                      title="Print 2-Page Old Gold Slip"
                      className="p-1 rounded text-[#C9943A] hover:bg-[#C9943A]/10 transition-colors"
                    >
                      <Printer size={16} />
                    </button>

                    {item.locked ? (
                      <Lock size={16} className="text-muted-foreground mt-0.5" />
                    ) : (
                      <button onClick={() => setEditingItem(item)} title="Edit draft">
                        <Pencil size={16} />
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* EDIT MODAL */}
      <EditTonchItemDialog
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={onUpdate}
      />

      {/* PRINT OLD GOLD SLIP MODAL */}
      {selectedSlipItem && (
        <OldGoldSlipModal
          open={!!selectedSlipItem}
          onClose={() => setSelectedSlipItem(null)}
          item={selectedSlipItem}
        />
      )}

      <Dialog open={showFinalize} onOpenChange={setShowFinalize}>
        <DialogContent className="max-w-md bg-[#111113] border-[#2A2A30] text-[#F0EBE0]">
          <DialogHeader>
            <DialogTitle className="text-[#F0EBE0]">Finalize Tonch</DialogTitle>
          </DialogHeader>
          {!canFinalize && (
            <div className="text-sm text-red-600 mb-2">
              All items must be in PROCESSING state before finalizing.
            </div>
          )}

    <div className="text-sm text-muted-foreground">
      This action will permanently:
      <ul className="list-disc ml-5 mt-2">
        <li>Lock all items</li>
        <li>Mark them as TONCHED</li>
        <li>Accumulate fine gold into the session</li>
      </ul>
    </div>

    <div className="flex justify-end gap-2 mt-4">
      <Button variant="outline" onClick={() => setShowFinalize(false)}>
        Cancel
      </Button>

      <Button
        disabled={!canFinalize || finalizing}
        onClick={async () => {
          try {
            setFinalizing(true);

            for (const item of pendingItems) {
              const res = await fetch("/api/metal-exchange/item/tonch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  itemId: item.id,
                  weightBefore: item.before,
                  weightAfter: item.after,
                  purityPercent: item.purity,
                  userId: user?.id,
                }),
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Failed to finalize item ${item.queueId}`);
              }
            }

            toast.success("All tonch items finalized successfully!");
            await onRefresh();
            setShowFinalize(false);
          } catch (err: any) {
            console.error("Finalize tonch error:", err);
            toast.error(err.message || "Failed to finalize tonch items");
          } finally {
            setFinalizing(false);
          }
        }}
      >
        {finalizing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Confirm Finalize
      </Button>
    </div>
  </DialogContent>
</Dialog>

    </>
  );
}
function EditTonchItemDialog({
  item,
  onClose,
  onSave,
}: {
  item: any;
  onClose: () => void;
  onSave: (id: string, data: any) => void;
}) {
  const [form, setForm] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setForm({
        after: item.after ?? "",
        purity: item.purity ?? "",
        fine: item.fine ?? "",
        remaining:
          item.after != null ? (item.before - item.after).toFixed(3) : "",
      });
      setError(null);
    }
  }, [item]);

  if (!item || !form) return null;

  /* -----------------------------
     AFTER WEIGHT HANDLER
  ----------------------------- */
  const handleAfterChange = (value: string) => {
    const after = Number(value);
    const before = Number(item.before);

    if (after > before) {
      setError(`After weight cannot be greater than Before weight (${before})`);
      return;
    }

    setError(null);

    setForm((prev: any) => ({
      ...prev,
      after: value,
      remaining: (before - after).toFixed(3),
    }));
  };

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Tonch Item — {item.queueId}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <ReadOnly label="Customer" value={item.customerName} />
          <ReadOnly label="Phone" value={item.customerPhone} />

          <ReadOnly label="Before Weight" value={item.before} />

          <Field label="After Weight">
            <Input
              type="number"
              step="0.001"
              value={form.after}
              onChange={(e) => handleAfterChange(e.target.value)}
            />
          </Field>

          <ReadOnly label="Remaining / Loss" value={form.remaining} />

          <Field label="Purity (%)">
            <Input
              type="number"
              step="0.01"
              value={form.purity}
              onChange={(e) =>
                setForm((prev: any) => ({
                  ...prev,
                  purity: e.target.value,
                }))
              }
            />
          </Field>
        </div>

        {/* 🔴 Validation Error */}
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            disabled={!!error}
            onClick={() => {
              onSave(item.id, {
                after: Number(form.after),
                purity: Number(form.purity),
              });
              onClose();
            }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      key={status}
      className={
        status === "TONCHED"
          ? "bg-green-600"
          : status === "PROCESSING"
            ? ""
            : "variant-secondary"
      }
    >
      {status === "TONCHED"
        ? "Tonched"
        : status === "PROCESSING"
          ? "Processing"
          : "Pending"}
    </Badge>
  );
}

const Th = ({
  children,
  className = "",
}: {
  children: any;
  className?: string;
}) => (
  <th
    className={`p-2 text-left font-medium text-muted-foreground ${className}`}
  >
    {children}
  </th>
);

const Td = ({
  children,
  className = "",
}: {
  children: any;
  className?: string;
}) => <td className={`p-2 truncate ${className}`}>{children}</td>;

const Field = ({ label, children }: any) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

const ReadOnly = ({ label, value }: any) => (
  <div>
    <Label>{label}</Label>
    <Input value={value} disabled />
  </div>
);

