"use client"

import { useCallback, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  FileX2,
  Info,
  Loader2,
  Sparkles,
  UploadCloud,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const CSV_TEMPLATE_HEADER =
  "username,password,email,fullName,studentCode,className,department,phone,role"
const CSV_TEMPLATE_SAMPLE =
  "sv001,password123,sv001@ptit.edu.vn,Nguyen Van A,B21DCCN001,D21CNPM1,Khoa CNTT,0900000001,STUDENT\n" +
  "gv001,password123,gv001@ptit.edu.vn,Le Van C,,,,0900000002,ORGANIZER"
const CSV_GUIDE_ROWS = [
  { column: "username", required: true, note: "Tên đăng nhập duy nhất" },
  { column: "password", required: true, note: "Tối thiểu 8 ký tự" },
  { column: "email", required: true, note: "Email hợp lệ, không trùng" },
  { column: "fullName", required: true, note: "Họ và tên đầy đủ" },
  { column: "studentCode", required: "Sinh viên", note: "Mã SV — bắt buộc với STUDENT" },
  { column: "className", required: "Sinh viên", note: "Lớp — bắt buộc với STUDENT" },
  { column: "department", required: "SV/Organizer", note: "Khoa / đơn vị" },
  { column: "phone", required: false, note: "Số điện thoại (tùy chọn)" },
  { column: "role", required: true, note: "STUDENT / ORGANIZER / MANAGER / ADMIN" },
]

const ACCEPTED_TYPES = ".csv,text/csv,application/vnd.ms-excel"
const MAX_FILE_BYTES = 5 * 1024 * 1024

function formatBytes(bytes) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, exponent)).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function ImportUsersDialog({
  open,
  onOpenChange,
  api,
  onImported,
}) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  const reset = useCallback(() => {
    setFile(null)
    setError("")
    setResult(null)
    setDragOver(false)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const handleOpenChange = useCallback(
    (next) => {
      if (busy) return
      if (!next) reset()
      onOpenChange(next)
    },
    [busy, onOpenChange, reset],
  )

  const pickFile = useCallback((picked) => {
    if (!picked) return
    const name = picked.name?.toLowerCase() || ""
    if (!name.endsWith(".csv")) {
      setFile(null)
      setError("Chỉ chấp nhận file CSV (.csv). Vui lòng chọn lại.")
      return
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFile(null)
      setError(`File vượt quá ${formatBytes(MAX_FILE_BYTES)}. Vui lòng chọn file nhỏ hơn.`)
      return
    }
    if (picked.size === 0) {
      setFile(null)
      setError("File rỗng. Vui lòng chọn file CSV có nội dung.")
      return
    }
    setError("")
    setResult(null)
    setFile(picked)
  }, [])

  const onInputChange = (event) => {
    pickFile(event.target.files?.[0])
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    if (busy) return
    pickFile(event.dataTransfer.files?.[0])
  }

  const onDragOver = (event) => {
    event.preventDefault()
    if (!dragOver) setDragOver(true)
  }

  const onDragLeave = (event) => {
    event.preventDefault()
    setDragOver(false)
  }

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + CSV_TEMPLATE_HEADER + "\n" + CSV_TEMPLATE_SAMPLE], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "users_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const submit = async () => {
    if (!file || busy) return
    setBusy(true)
    setError("")
    setResult(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const response = await api.request("/api/admin/users/bulk-import", {
        method: "POST",
        body: fd,
      })
      const payload = response?.result ?? response ?? null
      setResult(payload)
      onImported?.()
    } catch (err) {
      const message =
        err?.message?.trim() ||
        "Không thể import file. Vui lòng kiểm tra định dạng CSV và thử lại."
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setError("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const successCount = result?.successCount ?? 0
  const failureCount = result?.failureCount ?? 0
  const totalRows = result?.totalRows ?? 0
  const failures = Array.isArray(result?.failures) ? result.failures : []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <FileSpreadsheet className="size-5" />
            </div>
            <div className="flex-1 space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                Import người dùng từ CSV
                <Badge variant="secondary" className="gap-1 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  <Sparkles className="size-3" /> Hàng loạt
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Tải lên file CSV với header cố định — mỗi dòng là một tài khoản.
                Hệ thống sẽ tự động bỏ qua các dòng không hợp lệ và báo cáo chi tiết.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <div
            role="button"
            tabIndex={0}
            aria-disabled={busy}
            onClick={() => !busy && inputRef.current?.click()}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !busy) {
                event.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
              dragOver
                ? "border-sky-500 bg-sky-500/10 shadow-inner"
                : "border-border bg-muted/30 hover:border-sky-400 hover:bg-sky-500/5",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <input
              ref={inputRef}
              id="csv-file"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={onInputChange}
              className="sr-only"
              disabled={busy}
            />
            {!file ? (
              <>
                <div className="grid size-12 place-items-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300">
                  <UploadCloud className="size-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    Kéo thả file CSV vào đây, hoặc{" "}
                    <span className="font-semibold text-sky-600 underline-offset-4 hover:underline dark:text-sky-300">
                      chọn file
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ .csv — tối đa {formatBytes(MAX_FILE_BYTES)}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex w-full items-center gap-3 text-left">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  <FileUp className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} • sẵn sàng để import
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeFile()
                  }}
                  disabled={busy}
                  aria-label="Xóa file đã chọn"
                >
                  <XCircle className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="size-3.5" />
              <span>
                Dòng tiêu đề bắt buộc, mỗi dòng sau đó tương ứng một người dùng.
              </span>
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto gap-1 px-0 text-sky-600 hover:text-sky-700 dark:text-sky-300"
              onClick={downloadTemplate}
            >
              <Download className="size-3.5" /> Tải file mẫu
            </Button>
          </div>

          <details className="group rounded-lg border bg-muted/20 p-3 text-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-sky-600" />
                Cấu trúc file CSV
              </span>
              <span className="text-xs text-muted-foreground transition group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="mt-3 grid gap-2">
              {CSV_GUIDE_ROWS.map((row) => (
                <div
                  key={row.column}
                  className="grid grid-cols-[140px,1fr] items-center gap-3 text-xs"
                >
                  <code className="rounded bg-background px-2 py-1 font-mono text-[11px] ring-1 ring-border">
                    {row.column}
                  </code>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-1.5 py-0 text-[10px]",
                        row.required === true
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-600"
                          : row.required
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                            : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {row.required === true ? "Bắt buộc" : row.required ? row.required : "Tùy chọn"}
                    </Badge>
                    <span>{row.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1 space-y-0.5">
                <p className="font-medium">Import thất bại</p>
                <p className="text-destructive/90">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div
              className={cn(
                "grid gap-3 rounded-lg border p-3 text-sm",
                failureCount > 0
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-emerald-500/30 bg-emerald-500/10",
              )}
            >
              <div className="flex items-center gap-2">
                {failureCount > 0 ? (
                  <AlertTriangle className="size-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
                <span className="font-medium">
                  Kết quả: {successCount}/{totalRows} thành công
                </span>
                {failureCount > 0 && (
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/15 text-amber-700">
                    {failureCount} lỗi
                  </Badge>
                )}
              </div>
              {failureCount > 0 && (
                <details className="rounded-md bg-background/60 p-2 text-xs">
                  <summary className="cursor-pointer font-medium">
                    Xem chi tiết các dòng lỗi
                  </summary>
                  <ul className="mt-2 grid gap-1 text-muted-foreground">
                    {failures.slice(0, 50).map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <FileX2 className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
                        <span>
                          Dòng {f.rowNumber}
                          {f.username ? ` (${f.username})` : ""}: {f.reason}
                        </span>
                      </li>
                    ))}
                    {failures.length > 50 && (
                      <li className="text-muted-foreground/80">
                        … và {failures.length - 50} dòng lỗi khác.
                      </li>
                    )}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
          >
            Đóng
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={busy || !file}
            className="min-w-32 gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-700 hover:to-indigo-700"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Đang import…
              </>
            ) : (
              <>
                <UploadCloud className="size-4" /> Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportUsersDialog