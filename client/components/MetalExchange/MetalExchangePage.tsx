// "use client";

// import { useEffect, useState } from "react";
// import PageHeader from "./page-header";
// import CustomerDetails from "./customer-details";
// import TonchItemForm from "./tonch-item-form";
// import TonchItemsQueue from "./tonch-items-queue";
// import AuthorizationPanel from "./authorization-panel";
// import SessionSummary from "./session-summary";

// import { useUserStore } from "@/lib/store/useUserStore";
// import { useActiveMetalExchangeSession } from "@/hooks/useActivbeMetalExchangeSession";

// export default function MetalExchangePage() {
//   const { user } = useUserStore();

//   const [items, setItems] = useState<any[]>([]);
//   const [activeCustomer, setActiveCustomer] = useState<any>(null);
//   const [queueLoading, setQueueLoading] = useState(true);
// const [closing, setClosing] = useState(false)


//   const { session, loading, error } = useActiveMetalExchangeSession(
//     user?.id,
//     user?.branchId || 0,
//   );

//   /* -------------------------------
//      FETCH TONCH QUEUE
//   -------------------------------- */
//   const fetchQueue = async () => {
//     setQueueLoading(true);
//     try {
//       const res = await fetch("/api/metal-exchange/item/tonch");
//       if (!res.ok) throw new Error("Failed to load tonch queue");
//       const data = await res.json();
//       setItems(data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setQueueLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (session) fetchQueue();
//   }, [session]);

//   /* -------------------------------
//      HANDLE PENCIL UPDATE
//   -------------------------------- */
//   async function handleUpdate(itemId: string, data: any) {
//     setItems((prev) =>
//       prev.map((item) => {
//         if (item.id !== itemId) return item;

//         const before = Number(item.before);
//         const after = Number(data.after);
//         const purity = Number(data.purity);

//         const remaining = Number((before - after).toFixed(3));

//         const fine =
//           !isNaN(after) && !isNaN(purity)
//             ? Number(((after * purity) / 100).toFixed(3))
//             : item.fine;

//         return {
//           ...item,
//           after,
//           purity,
//           remaining,
//           fine,
//           status: "PROCESSING",
//         };
//       }),
//     );

//     // persist to backend
//     await fetch("/api/metal-exchange/item/tonch", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         itemId,
//         weightBefore: data.before,
//         weightAfter: data.after,
//         purityPercent: data.purity,
//         userId: user?.id,
//       }),
//     });
//     await fetchQueue();
//   }

//   /* -------------------------------
//      GUARDS (UNCHANGED)
//   -------------------------------- */
//   if (loading) return <div className="p-6">Loading session...</div>;
//   if (error || !session)
//     return <div className="p-6 text-red-500">Session error</div>;
//   if (session.isClosed)
//     return <div className="p-6 text-red-500">Session closed</div>;
// const hasItems = items.length > 0

// const hasUnprocessedItems = items.some(
//   (item) => item.status !== "TONCHED"
// )

// const canCloseSession =
//   !session.isClosed &&
//   hasItems &&
//   !hasUnprocessedItems

//   return (
//     <div className="space-y-6 p-6">
//       <PageHeader />

//       {/* 🔑 Customer selection */}
//       <CustomerDetails
//         onCustomerChange={(customer) => {
//           setActiveCustomer(customer);
//         }}
//       />

//       {/* ➕ Add tonch item */}
//       <TonchItemForm
//         disabled={!activeCustomer}
//         sessionId={session.id}
//         userId={user!.id}
//         customerId={activeCustomer?.id}
//         onAddItem={async () => {
//           await fetchQueue(); // ✅ gets real queueId immediately
//         }}
//       />

//       {/* 📋 TONCH QUEUE */}
//       {queueLoading ? (
//         <div className="p-4 text-sm text-muted-foreground">
//           Loading tonch queue…
//         </div>
//       ) : (
//         <TonchItemsQueue
//           items={items}
//           onUpdate={handleUpdate}
//           onRefresh={fetchQueue}
//         />
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <SessionSummary items={items} session={session} />
      
// <AuthorizationPanel
//   session={session}
//   canClose={canCloseSession}
//   closing={closing}
//   onCloseDay={async () => {
//     try {
//       setClosing(true)

//       const res = await fetch(
//         "/api/metal-exchange/session/close",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             sessionId: session.id,
//             authorizedById: user!.id,
//           }),
//         }
//       )

//       if (!res.ok) {
//         throw new Error("Failed to close session")
//       }

//       await fetchQueue()
//     } catch (err) {
//       console.error(err)
//     } finally {
//       setClosing(false)
//     }
//   }}
// />



//       </div>
//     </div>
//   );
// }
"use client"

import { useEffect, useState } from "react"
import PageHeader from "./page-header"
import CustomerDetails from "./customer-details"
import TonchItemForm from "./tonch-item-form"
import TonchItemsQueue from "./tonch-items-queue"
import AuthorizationPanel from "./authorization-panel"
import SessionSummary from "./session-summary"

import { useUserStore } from "@/lib/store/useUserStore"
import { useActiveMetalExchangeSession } from "@/hooks/useActivbeMetalExchangeSession"

export default function MetalExchangePage() {
  const { user } = useUserStore()

  const [items, setItems] = useState<any[]>([])
  const [activeCustomer, setActiveCustomer] = useState<any>(null)
  const [queueLoading, setQueueLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [canClose, setCanClose] = useState(false)
const [sessionClosed, setSessionClosed] = useState(false)

  const { session, loading, error } =
    useActiveMetalExchangeSession(user?.id, user?.branchId || 0)

  /* -------------------------------
     FETCH TONCH QUEUE
  -------------------------------- */
  const fetchQueue = async () => {
    setQueueLoading(true)
    try {
      const res = await fetch("/api/metal-exchange/item/tonch")
      const data = await res.json()
      setItems(data)
    } finally {
      setQueueLoading(false)
    }
  }

  /* -------------------------------
     CHECK CAN CLOSE (SERVER TRUTH)
  -------------------------------- */
  const checkCanClose = async () => {
    if (!session?.id) return
    const res = await fetch(
      `/api/metal-exchange/session/can-close?sessionId=${session.id}`
    )
    const data = await res.json()
    setCanClose(data.canClose)
  }

  useEffect(() => {
    if (session) {
      fetchQueue()
      checkCanClose()
    }
  }, [session])

  useEffect(() => {
    checkCanClose()
  }, [items])
useEffect(() => {
  if (session?.isClosed) {
    setSessionClosed(true)
  }
}, [session])

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
    })

    await fetchQueue()
  }

  /* -------------------------------
     GUARDS
  -------------------------------- */
  if (loading) return <div className="p-6">Loading session…</div>
  if (error || !session) return <div className="p-6">Session error</div>
  if (session.isClosed) return <div className="p-6">Session closed</div>

  return (
    <div className="space-y-6 p-6">
      <PageHeader />

      <CustomerDetails onCustomerChange={setActiveCustomer} />

      <TonchItemForm
        disabled={!activeCustomer}
        sessionId={session.id}
        userId={user!.id}
        customerId={activeCustomer?.id}
        onAddItem={fetchQueue}
      />

      {queueLoading ? (
        <div>Loading tonch queue…</div>
      ) : (
        <TonchItemsQueue
          items={items}
          onUpdate={handleUpdate}
          
          onRefresh={fetchQueue}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SessionSummary items={items} session={session} />

       <AuthorizationPanel
  session={{ ...session, isClosed: sessionClosed }}
  canClose={canClose}
  closing={closing}
  onCloseDay={async () => {
    try {
      setClosing(true)

      const res = await fetch(
        "/api/metal-exchange/session/close",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            authorizedBy: user!.id,
          }),
        }
      )

      if (!res.ok) {
        throw new Error("Failed to close session")
      }

      // ✅ HARD UI LOCK — THIS IS THE KEY
      setSessionClosed(true)
      setCanClose(false)

      await fetchQueue()
    } catch (err) {
      console.error(err)
    } finally {
      setClosing(false)
    }
  }}
/>


    
      </div>
    </div>
  )
}
