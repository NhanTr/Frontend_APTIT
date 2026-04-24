"use client"

import { useMemo, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const filterKeys = ["status", "sponsor", "startTime", "endTime", "location"]

export function normalizeFilters(value = {}) {
  return {
    status: value.status || "",
    sponsor: value.sponsor || "",
    startTime: value.startTime || "",
    endTime: value.endTime || "",
    location: value.location || "",
  }
}

export function areFiltersEqual(a, b) {
  return filterKeys.every((key) => (a?.[key] || "") === (b?.[key] || ""))
}

export function useUrlFilterSync() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialFilters = useMemo(() => {
    return normalizeFilters({
      status: searchParams.get("status"),
      sponsor: searchParams.get("sponsor"),
      startTime: searchParams.get("startTime"),
      endTime: searchParams.get("endTime"),
      location: searchParams.get("location"),
    })
  }, [searchParams])

  const updateUrlFilters = useCallback((nextFilters) => {
    const normalized = normalizeFilters(nextFilters)
    const nextParams = new URLSearchParams(searchParams.toString())

    for (const key of filterKeys) {
      const value = normalized[key]
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    }

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()
    if (nextQuery === currentQuery) return

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, searchParams])

  return {
    initialFilters,
    updateUrlFilters,
  }
}
