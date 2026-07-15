import { CalendarRange, ChevronLeft, ChevronRight, FilterX, Search } from "lucide-react";

export interface BookingFilters {
  status: string;
  keyword: string;
  fromDate: string;
  toDate: string;
}

interface FilterProps {
  value: BookingFilters;
  statusOptions: { value: string; label: string }[];
  resultCount: number;
  searchPlaceholder: string;
  onChange: (value: BookingFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

export function BookingListFilters({ value, statusOptions, resultCount, searchPlaceholder, onChange, onApply, onClear }: FilterProps) {
  const hasFilter = Boolean(value.status || value.keyword || value.fromDate || value.toDate);

  return (
    <form
      onSubmit={(event) => { event.preventDefault(); onApply(); }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_160px_160px_auto]">
        <label className="relative">
          <span className="sr-only">Tìm kiếm</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={value.keyword}
            onChange={(event) => onChange({ ...value, keyword: event.target.value })}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value })}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          aria-label="Lọc trạng thái"
        >
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label className="relative">
          <span className="sr-only">Từ ngày</span>
          <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={value.fromDate}
            max={value.toDate || undefined}
            onChange={(event) => onChange({ ...value, fromDate: event.target.value })}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            title="Từ ngày"
          />
        </label>
        <label>
          <span className="sr-only">Đến ngày</span>
          <input
            type="date"
            value={value.toDate}
            min={value.fromDate || undefined}
            onChange={(event) => onChange({ ...value, toDate: event.target.value })}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            title="Đến ngày"
          />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
            Lọc
          </button>
          {hasFilter && (
            <button type="button" onClick={onClear} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50" title="Xóa bộ lọc">
              <FilterX className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">Tìm thấy <span className="font-semibold text-slate-700">{resultCount}</span> kết quả</p>
    </form>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BookingPagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const candidates = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...candidates].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3" aria-label="Phân trang">
      <p className="text-sm text-slate-500">Trang <span className="font-semibold text-slate-800">{page}</span> / {totalPages}</p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Trang trước">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((item, index) => (
          <span key={item} className="contents">
            {index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
            <button type="button" onClick={() => onPageChange(item)} aria-current={item === page ? "page" : undefined} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold ${item === page ? "bg-brand-700 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              {item}
            </button>
          </span>
        ))}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Trang sau">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
