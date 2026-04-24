"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

const emptyFilters = {
  status: "",
  sponsor: "",
  startTime: "",
  endTime: "",
  location: "",
}

const filterKeys = ["status", "sponsor", "startTime", "endTime", "location"]

function normalizeFilters(value = {}) {
  return {
    status: value.status || "",
    sponsor: value.sponsor || "",
    startTime: value.startTime || "",
    endTime: value.endTime || "",
    location: value.location || "",
  }
}

function areFiltersEqual(a, b) {
  return filterKeys.every((key) => (a?.[key] || "") === (b?.[key] || ""))
}

export function ActivityFilter({ onFilterChange = () => {}, initialFilters = emptyFilters }) {
  const [filters, setFilters] = useState(() => normalizeFilters(initialFilters))
  const lastNotifiedFiltersRef = useRef(null)

  useEffect(() => {
    const nextFilters = normalizeFilters(initialFilters)
    setFilters((prev) => (areFiltersEqual(prev, nextFilters) ? prev : nextFilters))
  }, [initialFilters])

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "approved", label: "Approved" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
  ]

  // Notify parent of filter changes after render completes
  useEffect(() => {
    if (!areFiltersEqual(lastNotifiedFiltersRef.current, filters)) {
      lastNotifiedFiltersRef.current = filters
      onFilterChange(filters)
    }
  }, [filters, onFilterChange])

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      if (prev[key] === value) return prev
      const updated = { ...prev, [key]: value }
      return updated
    })
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters((prev) => (areFiltersEqual(prev, emptyFilters) ? prev : emptyFilters))
  }, [])

  const hasActiveFilters = Object.values(filters).some((value) => value !== "")

  return (
    <Card className="bg-secondary/30 border border-muted">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-card-foreground">Filter Activities</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 px-2 text-xs"
              >
                <X className="size-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground uppercase">
                Status
              </Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger id="status-filter" className="h-9 text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sponsor Filter */}
            <div className="space-y-2">
              <Label htmlFor="sponsor-filter" className="text-xs font-medium text-muted-foreground uppercase">
                Sponsor
              </Label>
              <Input
                id="sponsor-filter"
                placeholder="Search sponsor..."
                value={filters.sponsor}
                onChange={(e) => handleFilterChange("sponsor", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Start Time Filter */}
            <div className="space-y-2">
              <Label htmlFor="start-time-filter" className="text-xs font-medium text-muted-foreground uppercase">
                Start Time
              </Label>
              <Input
                id="start-time-filter"
                type="datetime-local"
                value={filters.startTime}
                onChange={(e) => handleFilterChange("startTime", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* End Time Filter */}
            <div className="space-y-2">
              <Label htmlFor="end-time-filter" className="text-xs font-medium text-muted-foreground uppercase">
                End Time
              </Label>
              <Input
                id="end-time-filter"
                type="datetime-local"
                value={filters.endTime}
                onChange={(e) => handleFilterChange("endTime", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label htmlFor="location-filter" className="text-xs font-medium text-muted-foreground uppercase">
                Location
              </Label>
              <Input
                id="location-filter"
                placeholder="Search location..."
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
