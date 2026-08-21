"use client";

import { useEffect, useState } from "react";
import PageHeader from "./page-header";
import CustomerDetails from "./customer-details";
import TonchItemForm from "./tonch-item-form";
import TonchItemsQueue from "./tonch-items-queue";
import AuthorizationPanel from "./authorization-panel";
import SessionSummary from "./session-summary";
import TonchHistoryTab from "./TonchHistoryTab";

import { useUserStore } from "@/lib/store/useUserStore";
import { useActiveMetalExchangeSession } from "@/hooks/useActivbeMetalExchangeSession";

export default function MetalExchangePage() {
  const { user } = useUserStore();

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [items, setItems] = useState<any[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);

  const { session, loading, error, refetchSession } =
    useActiveMetalExchangeSession(user?.id, user?.branchId || 0);

  /* -------------------------------
     FETCH TONCH QUEUE
  -------------------------------- */
  const fetchQueue = async () => {
    setQueueLoading(true);
    try {
      const res = await fetch("/api/metal-exchange/item/tonch");
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to load queue:", err);
    } finally {
      setQueueLoading(false);
    }
  };

  /* -------------------------------
     REFRESH ALL (QUEUE + SESSION)
  -------------------------------- */
  const handleRefreshAll = async () => {
    await fetchQueue();
    if (refetchSession) await refetchSession();
    checkCanClose();
  };

  /* -------------------------------
     CHECK CAN CLOSE (SERVER TRUTH)
  -------------------------------- */
  const checkCanClose = async () => {
    if (!session?.id) return;
    try {
      const res = await fetch(
        `/api/metal-exchange/session/can-close?sessionId=${session.id}`
      );
      const data = await res.json();
      setCanClose(!!data.canClose);
    } catch (e) {
      console.error("Error checking can close:", e);
    }
  };

  useEffect(() => {
    if (session) {
      fetchQueue();
      checkCanClose();
    }
  }, [session]);

  useEffect(() => {
    checkCanClose();
  }, [items]);

  useEffect(() => {
    if (session?.isClosed) {
      setSessionClosed(true);
    }
  }, [session]);

  /* -------------------------------
     UPDATE TONCH ITEM
  -------------------------------- */
  async function handleUpdate(itemId: string, data: any) {
    await fetch("/api/metal-exchange/item/tonch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        weightAfter: data.after,
        purityPercent: data.purity,
        userId: user?.id,
      }),
    });

    await handleRefreshAll();
  }

  return (
    <div className="space-y-6 p-6">
      {/* Top Header with Tab Switcher */}
      <PageHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* RENDER ACTIVE SESSION OR TONCH HISTORY TAB */}
      {activeTab === "history" ? (
        <TonchHistoryTab />
      ) : (
        <>
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Loading active session…
            </div>
          ) : error || !session ? (
            <div className="p-12 text-center rounded-xl bg-card border border-border">
              <p className="text-sm font-semibold text-red-500 mb-1">
                No active metal exchange session found
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                You can switch to the Tonch History tab to review previous sessions.
              </p>
              <button
                onClick={() => setActiveTab("history")}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                View Tonch History
              </button>
            </div>
          ) : session.isClosed ? (
            <div className="p-12 text-center rounded-xl bg-card border border-border">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                Today&apos;s Session is Closed / Reconciled
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                All tonch items for session {session.sessionNumber} have been finalized.
              </p>
              <button
                onClick={() => setActiveTab("history")}
                className="px-4 py-2 bg-[#C9A84C] text-black font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity"
              >
                View in Tonch History
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Selector */}
              <CustomerDetails onCustomerChange={setActiveCustomer} />

              {/* Add Tonch Item Form */}
              <TonchItemForm
                disabled={!activeCustomer}
                sessionId={session.id}
                userId={user!.id}
                customerId={activeCustomer?.id}
                onAddItem={handleRefreshAll}
              />

              {/* Tonch Items Queue */}
              {queueLoading ? (
                <div className="p-4 text-xs text-muted-foreground">
                  Loading tonch queue…
                </div>
              ) : (
                <TonchItemsQueue
                  items={items}
                  onUpdate={handleUpdate}
                  onRefresh={handleRefreshAll}
                />
              )}

              {/* Summary and Authorization Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SessionSummary
                  items={items}
                  session={session}
                  onRefreshSession={handleRefreshAll}
                />

                <AuthorizationPanel
                  session={{ ...session, isClosed: sessionClosed }}
                  canClose={canClose}
                  closing={closing}
                  onCloseDay={async () => {
                    try {
                      setClosing(true);

                      const res = await fetch("/api/metal-exchange/session/close", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          sessionId: session.id,
                          authorizedBy: user!.id,
                        }),
                      });

                      if (!res.ok) {
                        throw new Error("Failed to close session");
                      }

                      setSessionClosed(true);
                      setCanClose(false);

                      await fetchQueue();
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setClosing(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
