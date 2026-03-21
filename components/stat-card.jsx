import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({ title, value, icon, description, trend, className }) {
  return (
    <Card className={cn("bg-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">{title}</CardTitle>
        <div className="text-muted-foreground shrink-0 [&>svg]:size-4 sm:[&>svg]:size-5">{icon}</div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xl sm:text-2xl font-bold text-card-foreground">{value}</div>
        {(description || trend) && (
          <div className="flex flex-wrap items-center gap-1 mt-0.5 sm:mt-1">
            {trend && (
              <span className={cn("text-[10px] sm:text-xs font-medium", trend.positive ? "text-success" : "text-destructive")}>
                {trend.value}
              </span>
            )}
            {description && <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
