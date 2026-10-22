import { useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useLogs } from '@/hooks/useApi'
import { LogType } from '@/types'
import { useTranslation } from "@/i18n";
import type { TranslationKey } from "@/i18n";

const MAX_ENTRIES = 100

type FilterLevel = 'ALL' | LogType

function getLogIcon(type: LogType) {
  switch (type) {
    case LogType.Critical:
      return <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />
    case LogType.Warning:
      return <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
    case LogType.Info:
      return <Info className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
    default:
      return <Info className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
  }
}

function getLogTextColor(type: LogType) {
  switch (type) {
    case LogType.Critical:
      return 'text-destructive'
    case LogType.Warning:
      return 'text-yellow-500'
    default:
      return ''
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString()
}

const filters: { labelKey: TranslationKey; value: FilterLevel; className: string }[] = [
  { labelKey: 'logs.all', value: 'ALL', className: '' },
  { labelKey: 'logs.normal', value: LogType.Normal, className: '' },
  { labelKey: 'logs.info', value: LogType.Info, className: 'text-blue-400' },
  { labelKey: 'logs.warning', value: LogType.Warning, className: 'text-yellow-500' },
  { labelKey: 'logs.critical', value: LogType.Critical, className: 'text-destructive' },
]

export function LogsView() {
  const { t } = useTranslation()
  const { data: logs, isLoading } = useLogs()
  const [filter, setFilter] = useState<FilterLevel>('ALL')

  // The API returns entries oldest first: show the most recent ones on top.
  const filtered = useMemo(
    () =>
      (logs ?? [])
        .filter((log) => filter === 'ALL' || log.type === filter)
        .sort((a, b) => b.id - a.id)
        .slice(0, MAX_ENTRIES),
    [logs, filter],
  )

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">{t("logs.loading")}</div>
  }

  if (!logs || logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{t("logs.empty")}</div>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>{t("logs.title")}</CardTitle>
          <div className="flex items-center gap-1 flex-wrap">
            {filters.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filter === f.value ? 'secondary' : 'ghost'}
                className={`h-7 text-xs ${f.className}`}
                onClick={() => setFilter(f.value)}
              >
                {t(f.labelKey)}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("logs.showingLast", { count: MAX_ENTRIES })}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="p-4 space-y-1">
            {filtered.map((log) => (
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
              <p className="text-center text-muted-foreground py-4">{t("logs.emptyLevel")}</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
