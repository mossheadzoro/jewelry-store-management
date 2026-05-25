type TonchQueueItem = {
  id: string              // DB id (hidden)
  queueId: string         // TQ-000123 (shown)
  customerName: string
  customerPhone: string
  description: string
  before: number
  after?: number
  purity?: number
  fine?: number
  remaining?: number
  status: "PENDING" | "PROCESSING" | "TONCHED"
  locked: boolean
}
