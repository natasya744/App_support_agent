import { useEffect, useState } from "react"
import { Activity, AlertCircle, CheckCircle2, Clock, Inbox, RefreshCw } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { formatDate, type SupportEvent } from "@/lib/types"

export function EventsPage() {
  const [events, setEvents] = useState<SupportEvent[]>([])
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api<SupportEvent[]>("/events")
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function checkInbox() {
    setChecking(true)
    try {
      await api("/poll", { method: "POST" })
      await load()
    } finally {
      setChecking(false)
    }
  }

  const successCount = events.filter((e) => e.status === "completed" || e.status === "replied").length
  const failedCount = events.filter((e) => e.status === "failed" || e.status === "escalated").length

  return (
    <div className="space-y-4">
      {/* Top summary & actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            <span>Total Events: {events.length}</span>
          </div>
          {successCount > 0 && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{successCount} handled</span>
            </div>
          )}
          {failedCount > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{failedCount} flagged</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={checkInbox}
            disabled={checking}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking inbox..." : "Check inbox now"}
          </Button>
        </div>
      </div>

      {/* Events table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2 border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Background Poller &amp; Gmail Ingestion Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-xs">No support events logged yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 text-xs font-semibold">ID</TableHead>
                  <TableHead className="w-32 text-xs font-semibold">Status</TableHead>
                  <TableHead className="w-24 text-xs font-semibold">Attempts</TableHead>
                  <TableHead className="text-xs font-semibold">Error / Details</TableHead>
                  <TableHead className="w-48 text-right text-xs font-semibold">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{event.id}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell className="text-xs font-mono">{event.attempts}</TableCell>
                    <TableCell className="text-xs max-w-sm truncate text-muted-foreground">
                      {event.error ? (
                        <span className="text-destructive font-medium">{event.error}</span>
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(event.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
