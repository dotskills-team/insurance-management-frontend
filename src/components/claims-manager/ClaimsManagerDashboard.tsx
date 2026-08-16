/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { useGetAllClaimsQuery } from "@/redux/features/claim/claim.api";
import { IClaim, ClaimStatus } from "@/types/claim.types";

import { PageHeader } from "../shared/PageHeader";
import { Pagination } from "../pagination/Pagination";
import { ViewToggle, ViewMode } from "../shared/dashboard/ViewToggle";
import { ClaimStatCard } from "./ClaimStatCard";
import { ClaimManagerCard } from "./ClaimManagerCard";
import { ClaimManagerTable, ClaimSortField, SortDir } from "./ClaimManagerTable";
import { ClaimDetailsModal } from "../claim/ClaimDetailsModal";
import { ReviewClaimModal } from "../claim/ReviewClaim";

const STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.PENDING]: "Pending",
  [ClaimStatus.APPROVED]: "Approved",
  [ClaimStatus.REJECTED]: "Rejected",
  [ClaimStatus.ALL]: "All",
};

export default function ClaimsManagementForClaimManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [sortField, setSortField] = useState<ClaimSortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const [viewingClaim, setViewingClaim] = useState<IClaim | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [managingClaim, setManagingClaim] = useState<IClaim | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setPage(1);
    }, 100);
  }, [searchTerm, statusFilter, startDate, endDate, sortField, sortDir]);

  const sortParam =
    sortField && sortDir ? (sortDir === "asc" ? sortField : `-${sortField}`) : undefined;

  const { data, isLoading, isFetching, refetch } = useGetAllClaimsQuery({
    searchTerm: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit,
    sort: sortParam,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const claims: IClaim[] = useMemo(() => data?.data ?? [], [data]);
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;
  const totalCount = meta?.total ?? claims.length;

  const hasActiveFilters = statusFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  const clearFilters = () => setStatusFilter("all");
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleSort = (field: ClaimSortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }
    setSortField(null);
    setSortDir(null);
  };

  const openDetails = (claim: IClaim) => {
    setViewingClaim(claim);
    setIsDetailsOpen(true);
  };
  const openManage = (claim: IClaim) => {
    setManagingClaim(claim);
    setIsManageOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims Dashboard"
        description="Review, manage, and resolve customer claim submissions"
        breadcrumbs={[{ label: "Claims Dashboard" }]}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : (
          <>
            <ClaimStatCard
              label="Total Claims"
              value={stats?.total ?? 0}
              sub="in the system"
              icon={FileText}
              color="blue"
            />
            <ClaimStatCard
              label="Pending"
              value={stats?.pending ?? 0}
              sub="awaiting review"
              icon={Clock}
              color="amber"
            />
            <ClaimStatCard
              label="Approved"
              value={stats?.approved ?? 0}
              sub="claims approved"
              icon={CheckCircle2}
              color="emerald"
            />
            <ClaimStatCard
              label="Rejected"
              value={stats?.rejected ?? 0}
              sub="claims rejected"
              icon={XCircle}
              color="red"
            />
          </>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by claim title..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter as any}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
              <span>
                {statusFilter === "all" ? "All Status" : STATUS_LABELS[statusFilter]}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={ClaimStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ClaimStatus.APPROVED}>Approved</SelectItem>
              <SelectItem value={ClaimStatus.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearFilters}
              className="shrink-0"
              title="Clear status filter"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Filter by date:</p>
          <Input
            type="date"
            className="h-9 w-40 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-slate-400 text-sm">to</span>
          <Input
            type="date"
            className="h-9 w-40 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {hasDateFilter && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={clearDateFilter}
              title="Clear date filter"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Section header: live count + view toggle ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {isLoading || isFetching
            ? "Loading claims…"
            : `${totalCount} claim${totalCount !== 1 ? "s" : ""}${
                hasActiveFilters || hasDateFilter || searchTerm ? " (filtered)" : ""
              }`}
        </p>
        <ViewToggle view={viewMode} onChange={setViewMode} />
      </div>

      {/* ── Table View ── */}
      {viewMode === "table" && (
        <ClaimManagerTable
          claims={claims}
          isLoading={isLoading}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onViewDetails={openDetails}
          onManage={openManage}
        />
      )}

      {/* ── Grid View ── */}
      {viewMode === "grid" && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-12 h-12 mb-4 opacity-30" />
              {searchTerm || hasActiveFilters || hasDateFilter ? (
                <>
                  <p className="text-base font-medium">No results found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </>
              ) : (
                <>
                  <p className="text-base font-medium">No claims submitted yet</p>
                  <p className="text-sm mt-1">Customer claims will appear here</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {claims.map((claim) => (
                <ClaimManagerCard
                  key={String(claim._id)}
                  claim={claim}
                  onViewDetails={openDetails}
                  onManage={openManage}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Pagination — shared by both views, always visible once there's more than one page ── */}
      {!isLoading && claims.length > 0 && totalPage > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page <span className="font-semibold text-slate-700 dark:text-slate-300">{page}</span> of{" "}
            {totalPage}
          </p>
          <Pagination page={page} totalPage={totalPage} onPageChange={setPage} />
        </div>
      )}

      {/* ── Modals ── */}
      {viewingClaim && (
        <ClaimDetailsModal open={isDetailsOpen} onOpenChange={setIsDetailsOpen} item={viewingClaim} />
      )}
      {managingClaim && (
        <ReviewClaimModal
          open={isManageOpen}
          onOpenChange={setIsManageOpen}
          item={managingClaim}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}