"use client"

import { useEffect, useState, useCallback } from "react"

export function useActiveMetalExchangeSession(
  userId?: number,
  branchId?: number
) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    if (!userId || !branchId) return
    try {
      const res = await fetch(
        "/api/metal-exchange/session/active",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, branchId }),
        }
      )

      if (!res.ok) throw new Error("Session fetch failed")

      const data = await res.json()
      setSession(data)
    } catch (err) {
      setError("Unable to load session")
    } finally {
      setLoading(false)
    }
  }, [userId, branchId])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  return { session, loading, error, refetchSession: loadSession, setSession }
}
