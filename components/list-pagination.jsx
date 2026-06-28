"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const pageSizeOptions = [5, 10, 20, 50]

export function usePagination(items = [], resetKeys = []) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const resetKey = resetKeys.join("|")

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  useEffect(() => {
    setPage((current) => Math.min(Math.max(current, 1), totalPages))
  }, [totalPages])

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return {
    items: pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize: (value) => {
      setPageSize(Number(value))
      setPage(1)
    },
    canPrevious: page > 1,
    canNext: page < totalPages,
  }
}

export function ListPagination({ pagination }) {
  if (!pagination || pagination.totalItems === 0) return null

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <span>
          Trang <span className="font-medium text-card-foreground">{pagination.page}</span> /{" "}
          <span className="font-medium text-card-foreground">{pagination.totalPages}</span>
        </span>
        <span className="hidden sm:inline">•</span>
        <span>Tổng: {pagination.totalItems}</span>
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <Select value={String(pagination.pageSize)} onValueChange={pagination.setPageSize}>
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>/ trang</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!pagination.canPrevious}
          onClick={() => pagination.setPage(pagination.page - 1)}
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!pagination.canNext}
          onClick={() => pagination.setPage(pagination.page + 1)}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  )
}
