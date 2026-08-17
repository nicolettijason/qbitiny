import { useState } from 'react'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useLogs } from '@/hooks/useApi'
import type { LogEntry } from '@/types'

type FilterLevel = 'ALL' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

function getLogIcon(type: FilterLevel | string) {
  switch (type) {
    case 'CRITICAL':
    case 'ERROR':
      return <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />
    case 'WARNING':
      return <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-warning" />
    default:
      return <Info className="h-3.5 w-3.5 flex-shrink-0 text-info" />
  }
}

function getLogTextColor(type: string) {
  switch (type) {
    case 'CRITICAL':
    case 'ERROR':
      return 'text-destructive'
    case 'WARNING':
      return 'text-warning'
    default:
      return ''
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString()
}

export function LogsView() {
  const { data: logs, isLoading } = useLogs()
  const [filter, setFilter] = useState<FilterLevel>('ALL')

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
  }

  if (!logs || logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No logs</div>
  }

  const filtered =
    filter === 'ALL'
      ? logs.slice(0, 100)
      : (logs as LogEntry[])
          .filter((l) => l.type === filter)
          .slice(0, 100)

  const filters: { label: string; value: FilterLevel; className: string }[] = [
    { label: 'All', value: 'ALL', className: '' },
    { label: 'Info', value: 'INFO', className: 'text-info' },
    { label: 'Warning', value: 'WARNING', className: 'text-warning' },
    { label: 'Error', value: 'ERROR', className: 'text-destructive' },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Logs</CardTitle>
          <div className="flex items-center gap-1">
            {filters.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filter === f.value ? 'secondary' : 'ghost'}
                className={`h-7 text-xs ${f.className}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Showing last 100 entries</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="p-4 space-y-1">
            {(logs.slice(0, 100) as LogEntry[])
              .filter((log) => filter === 'ALL' || log.type === filter)
              .map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2 py-1 text-xs ${getLogTextColor(log.type)}`}
              >
                {getLogIcon(log.type)}
                <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No logs for this level</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
