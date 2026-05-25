import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, AlertTriangle, Lock } from "lucide-react"

export default function AuthorizationPanel({
  session,
  canClose,
  closing,
  onCloseDay,
}: {
  session: { isClosed: boolean }
  canClose: boolean
  closing: boolean
  onCloseDay: () => void
}) {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-600" />
          Authorization
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!session.isClosed && !canClose && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <AlertTriangle size={16} />
            Complete all tonch items before closing the day
          </div>
        )}

        {canClose && !session.isClosed && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 size={16} />
            All items tonched and verified
          </div>
        )}

        <Button
          className="w-full"
          disabled={!canClose || closing || session.isClosed}
          onClick={onCloseDay}
        >
          {closing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Closing Session…
            </>
          ) : (
            "Close Day & Submit"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
