"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Pencil, RefreshCw } from "lucide-react";
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

const canFinalize =
  items.length > 0 &&
  items.every((i) => i.status === "PROCESSING");

  return (
    <>
      <Card>
        <div className="flex gap-2 items-center">
  <Badge variant="secondary">Pending</Badge>
  <Badge className="bg-green-600">Tonched</Badge>

  <Button
    size="sm"
    variant="default"
    disabled={!canFinalize}
    onClick={() => setShowFinalize(true)}
  >
    Finalize Tonch
  </Button>

  <Button
    size="icon"
    variant="ghost"
    onClick={onRefresh}
    title="Refresh queue"
  >
    <RefreshCw className="h-4 w-4" />
  </Button>
</div>


        <CardContent>
          <table className="w-full text-sm table-fixed border-collapse">
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
                <Th className="w-12 text-center" children={undefined}></Th>
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
                      <Badge className="bg-yellow-500 text-black">GOLD</Badge>
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
                    {item.fine ?? "-"}
                  </Td>

                  <Td className="text-center">
                    <StatusBadge status={item.status} />
                  </Td>

                  <Td className="text-center">
                    {item.locked ? (
                      <Lock size={16} />
                    ) : (
                      <button onClick={() => setEditingItem(item)}>
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
      <Dialog open={showFinalize} onOpenChange={setShowFinalize}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Finalize Tonch</DialogTitle>
    </DialogHeader>

    {!canFinalize && (
      <div className="text-sm text-red-600">
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
          setFinalizing(true);

          for (const item of items) {
            await fetch("/api/metal-exchange/item/tonch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemId: item.id,
                weightBefore: item.before,
                weightAfter: item.after,
                purityPercent: item.purity,
              }),
            });
          }

          await onRefresh();
          setFinalizing(false);
          setShowFinalize(false);
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

