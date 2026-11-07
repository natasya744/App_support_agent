import { useEffect, useState } from "react"
import { BookOpen, Check, FileText, Folder, Save, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import type { Entry } from "@/lib/types"

export function KnowledgeBasePage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api<Entry[]>("/knowledge-base").then((data) => {
      setEntries(data)
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].id)
        setTitle(data[0].title)
        setContent(data[0].content)
      }
    })
  }, [])

  const filteredEntries = entries.filter((entry) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.section.toLowerCase().includes(q) ||
      entry.content.toLowerCase().includes(q)
    )
  })

  const sections = [...new Set(filteredEntries.map((entry) => entry.section))]

  function select(entry: Entry) {
    setSelectedId(entry.id)
    setTitle(entry.title)
    setContent(entry.content)
    setSaved(false)
  }

  async function save() {
    if (selectedId === null) return
    setSaving(true)
    try {
      const updated = await api<Entry>(`/knowledge-base/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({ title, content }),
      })
      setEntries(entries.map((entry) => (entry.id === updated.id ? updated : entry)))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const selectedEntry = entries.find((e) => e.id === selectedId)

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr] items-start">
      {/* Sidebar List */}
      <Card className="flex flex-col h-[750px] shadow-sm">
        <CardHeader className="p-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Articles</CardTitle>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {entries.length} docs
            </span>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-3 overflow-y-auto flex-1 space-y-4">
          {sections.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              No matching knowledge articles found.
            </p>
          ) : (
            sections.map((section) => {
              const sectionEntries = filteredEntries.filter((entry) => entry.section === section)
              return (
                <div key={section} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    <Folder className="h-3 w-3" />
                    <span>{section}</span>
                    <span className="text-[10px] opacity-60">({sectionEntries.length})</span>
                  </div>
                  <div className="space-y-0.5">
                    {sectionEntries.map((entry) => {
                      const isSelected = entry.id === selectedId
                      return (
                        <button
                          key={entry.id}
                          onClick={() => select(entry)}
                          className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-medium shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <FileText
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-primary-foreground" : "text-muted-foreground/70"
                            }`}
                          />
                          <span className="truncate">{entry.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Editor Main Content */}
      <Card className="flex flex-col h-[750px] shadow-sm">
        {selectedEntry ? (
          <>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                    {selectedEntry.section}
                  </span>
                  <span className="text-xs text-muted-foreground">• ID #{selectedEntry.id}</span>
                </div>
                <CardTitle className="text-lg font-bold">Edit Knowledge Entry</CardTitle>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saved && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Document Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document Title"
                  className="font-medium"
                />
              </div>

              <div className="flex-1 flex flex-col space-y-1.5 min-h-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Content (Markdown)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {content.length} characters
                  </span>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write documentation and instructions here..."
                  className="flex-1 font-mono text-xs leading-relaxed resize-none p-4"
                />
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 stroke-[1.5] mb-2 opacity-50" />
            <CardTitle className="text-base font-medium">No document selected</CardTitle>
            <CardDescription className="text-xs mt-1">
              Choose an article from the sidebar to inspect or modify its contents.
            </CardDescription>
          </div>
        )}
      </Card>
    </div>
  )
}
