'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { mockRecentActivity } from '@/src/shared/lib/mock-data'
import { Activity, Users, DollarSign, Settings, BookOpen } from 'lucide-react'

const typeIcons = {
  user: Users,
  class: BookOpen,
  payment: DollarSign,
  system: Settings,
}

const typeColors = {
  user: 'bg-chart-3/20 text-chart-3',
  class: 'bg-primary/20 text-primary',
  payment: 'bg-success/20 text-success',
  system: 'bg-muted text-muted-foreground',
}

export function ActivityFeed() {
  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5 text-primary" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          <div className="flex flex-col gap-4">
            {mockRecentActivity.map((activity) => {
              const Icon = typeIcons[activity.type]
              const colorClass = typeColors[activity.type]

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      colorClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.action}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{activity.user}</span>
                      <span className="text-border">|</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
