"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export function StudentAnnouncements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Announcements</CardTitle>
        <CardDescription>Latest news and updates from your institution</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <AlertCircle className="size-10 opacity-50" />
          <p className="text-sm">No announcements available</p>
        </div>
      </CardContent>
    </Card>
  )
}
