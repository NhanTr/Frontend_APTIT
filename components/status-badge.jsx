import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusStyles = {
  approved: "bg-success/10 text-success border-success/20",
  upcoming: "bg-primary/10 text-primary border-primary/20",
  ongoing: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
}

const statusLabels = {
  approved: "Đã duyệt",
  upcoming: "Sắp diễn ra",
  ongoing: "Đang diễn ra",
  closed: "Kết thúc",
  completed: "Kết thúc",
  cancelled: "Đã hủy",
}

const categoryStyles = {
  sports: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  academic: "bg-primary/10 text-primary border-primary/20",
  cultural: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  technology: "bg-success/10 text-success border-success/20",
  community: "bg-chart-5/10 text-chart-5 border-chart-5/20",
}

export function StatusBadge({ status }) {
  const key = String(status || "").trim().toLowerCase()
  return (
    <Badge variant="outline" className={cn("capitalize", statusStyles[key])}>
      {statusLabels[key] || status}
    </Badge>
  )
}

export function CategoryBadge({ category }) {
  return (
    <Badge variant="outline" className={cn("capitalize", categoryStyles[category])}>
      {category}
    </Badge>
  )
}
