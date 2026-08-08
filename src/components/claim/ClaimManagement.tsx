/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Edit2,
  Trash2,
  Search,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useGetAllClaimsQuery,
  useSoftDeleteClaimMutation,
} from "@/redux/features/claim/claim.api";

import { PageHeader } from "../shared/PageHeader";
import { Pagination } from "../pagination/Pagination";
import { IClaim, ClaimStatus } from "@/types/claim.types";
import { ReviewClaimModal } from "./ReviewClaim";
import { ClaimDetailsModal } from "./ClaimDetailsModal";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortField = "claimTitle" | "status" | "createdAt";
type SortDir = "asc" | "desc" | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.PENDING]: "Pending",
  [ClaimStatus.APPROVED]: "Approved",
  [ClaimStatus.REJECTED]: "Rejected",
  [ClaimStatus.ALL]: "All",
};

const formatDate = (iso?: string | Date) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getCustomerName = (claim: IClaim) =>
  typeof claim.customer === "object" ? claim?.customer?.name : "—";

const getCustomerPhone = (claim: IClaim) =>
  typeof claim.customer === "object" ? claim?.customer?.phone : "—";

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ClaimRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="flex gap-1.5 justify-end">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

type StatColor = "blue" | "emerald" | "slate" | "violet" | "amber" | "red";

const STAT_COLOR_MAP: Record<
  StatColor,
  { gradient: string; iconWrap: string; shadow: string }
> = {
  blue: {
    gradient: "from-blue-700 via-cyan-700 to-blue-600",
    iconWrap: "bg-white/15",
    shadow: "shadow-blue-900/25",
  },
  emerald: {
    gradient: "from-emerald-600 via-green-600 to-emerald-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-emerald-900/25",
  },
  slate: {
    gradient: "from-slate-700 via-indigo-600 to-slate-700",
    iconWrap: "bg-white/10",
    shadow: "shadow-slate-900/25",
  },
  violet: {
    gradient: "from-violet-700 via-purple-600 to-violet-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-violet-900/25",
  },
  amber: {
    gradient: "from-amber-600 via-yellow-600 to-amber-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-amber-900/25",
  },
  red: {
    gradient: "from-red-600 via-rose-600 to-red-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-red-900/25",
  },
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: StatColor;
}) {
  const c = STAT_COLOR_MAP[color];
  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-linear-to-br ${c.gradient} p-5 shadow-lg ${c.shadow} transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
    >
      {/* Decorative wash */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl transition-opacity duration-300 group-hover:opacity-80" />

      <div className="relative flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <div
          className={`p-2 rounded-lg ${c.iconWrap} backdrop-blur-sm transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="relative text-2xl font-bold text-white tabular-nums">
        {value}
      </p>
      {sub && <p className="relative text-xs mt-1 text-white/70">{sub}</p>}
    </div>
  );
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ChevronsUpDown className="w-3.5 h-3.5 ml-1 text-slate-400" />;
  return sortDir === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 ml-1 text-blue-500" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-500" />
  );
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  const map: Record<ClaimStatus, string> = {
    [ClaimStatus.PENDING]:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
    [ClaimStatus.APPROVED]:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
    [ClaimStatus.REJECTED]:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
    [ClaimStatus.ALL]:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-400",
  };
  const dot: Record<ClaimStatus, string> = {
    [ClaimStatus.PENDING]: "bg-amber-500",
    [ClaimStatus.APPROVED]: "bg-emerald-500",
    [ClaimStatus.REJECTED]: "bg-red-500",
    [ClaimStatus.ALL]: "bg-slate-500",
  };
  return (
    <Badge variant="outline" className={map[status]}>
      <span
        className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${dot[status]}`}
      />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClaimManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const [viewingClaim, setViewingClaim] = useState<IClaim | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [reviewingClaim, setReviewingClaim] = useState<IClaim | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [deletingClaim, setDeletingClaim] = useState<IClaim | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const { data, isLoading, refetch } = useGetAllClaimsQuery({
    searchTerm: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });
  console.log("claims from data", data);

  const [softDeleteClaim, { isLoading: isDeleting }] =
    useSoftDeleteClaimMutation();

  const claims: IClaim[] = data?.data ?? [];
  const stats = data?.stats;

  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = statusFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  const sortedClaims = useMemo(() => {
    if (!sortField || !sortDir) return claims;
    return [...claims].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortField === "claimTitle") {
        aVal = a.claimTitle ?? "";
        bVal = b.claimTitle ?? "";
      }
      if (sortField === "status") {
        aVal = a.status ?? "";
        bVal = b.status ?? "";
      }
      if (sortField === "createdAt") {
        aVal = String(a.createdAt ?? "");
        bVal = String(b.createdAt ?? "");
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [claims, sortField, sortDir]);

  const handleSort = (field: SortField) => {
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

  const clearFilters = () => setStatusFilter("all");
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleDelete = async () => {
    if (!deletingClaim?._id) return;
    try {
      await softDeleteClaim(String(deletingClaim._id)).unwrap();
      toast.success("Claim moved to trash");
      setIsDeleteOpen(false);
      setDeletingClaim(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete claim");
    }
  };

  const SortableTh = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center hover:text-slate-900 dark:hover:text-white transition-colors">
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance Claims"
        description="Review and manage customer claim submissions"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Claims" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard/claims/trash">
              <Button
                variant="default"
                className="group hover:cursor-pointer border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Trash</span>
              </Button>
            </Link>

            {/* <CreateClaimModal onSuccess={refetch} /> */}
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
            Filter stats by date:
          </p>
          <div className="flex items-center gap-2 flex-wrap">
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
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Claims"
              value={stats?.total ?? 0}
              sub="in the system"
              icon={FileText}
              color="blue"
            />
            <StatCard
              label="Pending"
              value={stats?.pending ?? 0}
              sub="awaiting review"
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="Approved"
              value={stats?.approved ?? 0}
              sub="claims approved"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
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
          <SelectTrigger className="w-40 h-9 text-sm">
            <span>
              {statusFilter === "all"
                ? "All Status"
                : STATUS_LABELS[statusFilter]}
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
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table className="min-w-275">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-none bg-linear-to-r *:text-white from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                  <SortableTh field="claimTitle" label="Service" />
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Attachments
                  </TableHead>
                  <SortableTh field="status" label="Status" />
                  <SortableTh field="createdAt" label="Submitted" />
                  <TableHead className="text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <ClaimRowSkeleton key={i} />
                  ))
                ) : sortedClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <FileText className="w-12 h-12 mb-4 opacity-30" />
                        {searchTerm || hasActiveFilters ? (
                          <>
                            <p className="text-base font-medium">
                              No results found
                            </p>
                            <p className="text-sm mt-1">
                              Try adjusting your search or filters
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-base font-medium">
                              No claims submitted yet
                            </p>
                            <p className="text-sm mt-1">
                              Customer claims will appear here
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedClaims.map((claim, index) => (
                    <TableRow
                      key={String(claim._id)}
                      className={`
border-b
transition-all
duration-300
hover:shadow-sm

hover:bg-indigo-50
dark:hover:bg-indigo-950/20

${
  index % 2 === 0
    ? "bg-white dark:bg-background"
    : "bg-linear-to-r from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/10"
}
`}
                    >
                      {/* Service */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate max-w-44">
                              {claim.claimTitle}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-44">
                              {claim.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-32">
                            {getCustomerName(claim)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-32">
                            {getCustomerPhone(claim)}
                          </p>
                        </div>
                      </TableCell>

                      {/* Attachments */}
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                        {claim.attachments?.length ?? 0}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={claim.status} />
                      </TableCell>

                      {/* Submitted */}
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                        {formatDate(claim.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title="View details"
                            onClick={() => {
                              setViewingClaim(claim);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title="Review claim"
                            onClick={() => {
                              setReviewingClaim(claim);
                              setIsReviewOpen(true);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            title="Move to trash"
                            onClick={() => {
                              setDeletingClaim(claim);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <Pagination
            page={page}
            totalPage={totalPage}
            onPageChange={setPage}
          />
        </div>

        {!isLoading && sortedClaims.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sortedClaims.length}
              </span>{" "}
              claim{sortedClaims.length !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </p>
            {totalPage > 1 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {totalPage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {viewingClaim && (
        <ClaimDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          item={viewingClaim}
        />
      )}
      {reviewingClaim && (
        <ReviewClaimModal
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          item={reviewingClaim}
          onSuccess={refetch}
        />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move claim{" "}
              <strong>{deletingClaim?.claimTitle}</strong> to trash? It can be
              restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Moving..." : "Move to Trash"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
