import { useEffect, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Inbox,
  Mail,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Sparkles,
  User,
} from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { formatDate, type Message, type Ticket } from "@/lib/types"

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const loadTickets = async () => {
    setLoading(true)
    try {
      const data = await api<Ticket[]>("/tickets")
      setTickets(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  async function open(ticket: Ticket) {
    setSelected(ticket)
    setLoadingMessages(true)
    try {
      const msgs = await api<Message[]>(`/tickets/${ticket.id}/messages`)
      setMessages(msgs)
    } finally {
      setLoadingMessages(false)
    }
  }

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      !search.trim() ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div
      className={`grid gap-6 items-start transition-all duration-200 ${
        expanded ? "grid-cols-1" : "lg:grid-cols-[1.1fr_0.9fr]"
      }`}
    >
      {/* Left column: Ticket table */}
      <Card className="flex flex-col h-[750px] shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Support Tickets</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                {filteredTickets.length} of {tickets.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadTickets}
                className="h-7 w-7"
                title="Refresh tickets"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-7 px-2 text-xs gap-1.5 cursor-pointer"
                title={expanded ? "Show split preview view" : "Expand ticket table full width"}
              >
                {expanded ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Split view</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Expand table</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search subject, email or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </CardHeader>

        {/* Scrollable table container both horizontally and vertically */}
        <CardContent className="p-0 overflow-auto flex-1">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-xs">No tickets match your filters.</p>
            </div>
          ) : (
            <div className="min-w-[560px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10 shadow-xs">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[38%] min-w-[160px] text-xs">Subject</TableHead>
                    <TableHead className="w-[30%] min-w-[150px] text-xs">Customer</TableHead>
                    <TableHead className="w-[18%] min-w-[100px] text-xs">Category</TableHead>
                    <TableHead className="w-[14%] min-w-[110px] text-right pr-4 text-xs">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const isSelected = ticket.id === selected?.id
                    return (
                      <TableRow
                        key={ticket.id}
                        onClick={() => open(ticket)}
                        data-state={isSelected ? "selected" : undefined}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-muted/80 font-medium" : "hover:bg-muted/40"
                        }`}
                      >
                        <TableCell className="py-2.5 font-medium text-xs max-w-[220px] truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground truncate max-w-[160px]">
                          {ticket.customer_email}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs">
                          {ticket.category ? (
                            <span className="inline-block rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground truncate max-w-[120px]">
                              {ticket.category}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-right pr-4 whitespace-nowrap">
                          <StatusBadge status={ticket.status} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right column: Conversation / Thread Details */}
      {(!expanded || selected) && (
        <Card className="flex flex-col h-[750px] shadow-sm">
          {selected ? (
            <>
              <CardHeader className="p-4 border-b space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    Ticket #{selected.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.status} />
                    {expanded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(false)}
                        className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Back to split
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-base font-semibold leading-snug">
                  {selected.subject}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                    {selected.customer_email}
                  </span>
                  {selected.updated_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                      {formatDate(selected.updated_at)}
                    </span>
                  )}
                </div>

                {selected.proposed_action && (
                  <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-primary">Proposed AI Action:</span>{" "}
                      <span className="text-foreground">{selected.proposed_action}</span>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-4 overflow-y-auto flex-1 space-y-3 bg-muted/15">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading conversation thread...
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center py-10 text-xs text-muted-foreground">
                    No messages found for this ticket.
                  </p>
                ) : (
                  messages.map((message) => {
                    const isOut = message.direction === "out"
                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col max-w-[85%] rounded-lg p-3 text-xs shadow-xs transition-shadow ${
                          isOut
                            ? "ml-auto bg-primary text-primary-foreground border border-primary"
                            : "mr-auto bg-card text-card-foreground border border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1.5 opacity-80 text-[11px] pb-1 border-b border-current/10">
                          <span className="font-semibold flex items-center gap-1">
                            {isOut ? (
                              <>
                                <ArrowUpRight className="h-3 w-3" /> Support Agent
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft className="h-3 w-3" /> {message.from_address}
                              </>
                            )}
                          </span>
                          <span className="text-[10px]">{formatDate(message.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Mail className="h-10 w-10 stroke-[1.5] mb-2 opacity-50" />
              <CardTitle className="text-base font-medium">No ticket selected</CardTitle>
              <CardDescription className="text-xs mt-1">
                Select a support ticket from the list on the left to view the thread and AI recommendations.
              </CardDescription>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
