"use client";

import React, { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Search,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Building2,
  CheckCircle2,
  XCircle,
  LayoutGrid,
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

import { PageHeader } from "../shared/PageHeader";
import { Pagination } from "../pagination/Pagination";

import {
  useGetAllBranchesQuery,
  useSoftDeleteBranchMutation,
} from "@/redux/features/branch/branch.api";
import { useGetAllPartnersQuery } from "@/redux/features/partner/partner.api";
import { IPartnerBranch } from "@/types/branch.types";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Role } from "@/types/user.types";
import { CreateBranchModal } from "./CreateBranchModal";
import { BranchDetailsModal } from "./BranchDetailsModal";
import { UpdateBranchModal } from "./UpdateBranchModal";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "branchName" | "phone" | "isActive" | "createdAt";
type SortDir = "asc" | "desc" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BranchRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </TableCell>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-20" />
        </TableCell>
      ))}
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

// ─── Stat Card ────────────────────────────────────────────────────────────────

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

type StatColor = "violet" | "emerald" | "slate";

const STAT_COLOR_MAP: Record<
  StatColor,
  {
    card: string;
    iconBg: string;
    icon: string;
    sub: string;
    glow: string;
  }
> = {
  violet: {
    card: "bg-linear-to-br from-violet-600 via-purple-600 to-violet-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-violet-100",
    glow: "hover:shadow-purple-500/30",
  },
  emerald: {
    card: "bg-linear-to-br from-emerald-600 via-green-600 to-green-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-green-100",
    glow: "hover:shadow-green-500/30",
  },
  slate: {
    card: "bg-linear-to-br from-slate-600 via-cyan-600 to-cyan-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-cyan-100",
    glow: "hover:shadow-cyan-500/30",
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
      className={`
        group
        relative
        overflow-hidden
        rounded-2xl
        p-5
        text-white
        ${c.card}
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
        ${c.glow}
      `}
    >
      {/* Decorative Glow */}
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-3xl transition-all duration-300 group-hover:bg-white/20" />

      <div className="relative flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
          {label}
        </p>

        <div
          className={`
            flex h-11 w-11 items-center justify-center
            rounded-xl
            ${c.iconBg}
            backdrop-blur-sm
            transition-transform
            duration-300
            group-hover:scale-110
          `}
        >
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>

      <h3 className="relative text-3xl font-bold tracking-tight text-white">
        {value}
      </h3>

      {sub && <p className={`relative mt-2 text-sm ${c.sub}`}>{sub}</p>}
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

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
    <ChevronUp className="w-3.5 h-3.5 ml-1 text-violet-500" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 ml-1 text-violet-500" />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BranchManagement() {
  // ── filters ──
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">(
    "all",
  );
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── sort ──
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── modals ──
  const [viewingBranch, setViewingBranch] = useState<IPartnerBranch | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<IPartnerBranch | null>(
    null,
  );
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<IPartnerBranch | null>(
    null,
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, partnerFilter, startDate, endDate]);

  // ── partners (for filter dropdown) ──
  const { data: partnersData } = useGetAllPartnersQuery({ limit: 100 } as any);
  const partners: any[] = (partnersData as any)?.data ?? [];

  // ── API ──
  const { data, isLoading, refetch } = useGetAllBranchesQuery({
    searchTerm: searchTerm || undefined,
    isActive: statusFilter !== "all" ? statusFilter : undefined,
    partner: partnerFilter !== "all" ? partnerFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const [softDeleteBranch, { isLoading: isDeleting }] =
    useSoftDeleteBranchMutation();

  // ── derived ──
  const branches: IPartnerBranch[] = data?.data ?? [];
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = statusFilter !== "all" || partnerFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  const selectedPartnerName =
    partnerFilter === "all"
      ? "All Partners"
      : (partners.find((p: any) => String(p._id) === partnerFilter)?.name ??
        "Partner");

  // ── client sort ──
  const sortedBranches = React.useMemo(() => {
    if (!sortField || !sortDir) return branches;
    return [...branches].sort((a: any, b: any) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "branchName") {
        aVal = a.branchName ?? "";
        bVal = b.branchName ?? "";
      }
      if (sortField === "phone") {
        aVal = a.phone ?? "";
        bVal = b.phone ?? "";
      }
      if (sortField === "isActive") {
        aVal = String(a.isActive);
        bVal = String(b.isActive);
      }
      if (sortField === "createdAt") {
        aVal = a.createdAt ?? "";
        bVal = b.createdAt ?? "";
      }
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [branches, sortField, sortDir]);

  // ── handlers ──
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

  const clearFilters = () => {
    setStatusFilter("all");
    setPartnerFilter("all");
  };
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const openDetailsDialog = (b: IPartnerBranch) => {
    setViewingBranch(b);
    setIsDetailsOpen(true);
  };
  const openEditDialog = (b: IPartnerBranch) => {
    setEditingBranch(b);
    setIsUpdateOpen(true);
  };
  const openDeleteDialog = (b: IPartnerBranch) => {
    setDeletingBranch(b);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!(deletingBranch as any)?._id) return;
    try {
      await softDeleteBranch(String((deletingBranch as any)._id)).unwrap();
      toast.success("Branch moved to trash");
      setIsDeleteOpen(false);
      setDeletingBranch(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete branch");
    }
  };

  // ── sortable header ──
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
      {/* Page Header */}
      <PageHeader
        title="Branch Management"
        description="Manage partner branches and their locations"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Branch Management" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={
                user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN
                  ? "/admin/dashboard/branches/trash"
                  : "/manager/dashboard/branches/trash"
              }
            >
              <Button
                variant="default"
                className="group hover:cursor-pointer border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Trash</span>
              </Button>
            </Link>

            <CreateBranchModal onSuccess={refetch} />
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Date filter row */}
        <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
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
                title="Clear date filter"
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
          </>
        ) : (
          <>
            <StatCard
              label="Total Branches"
              value={stats?.total ?? 0}
              sub="registered branches"
              icon={LayoutGrid}
              color="violet"
            />
            <StatCard
              label="Active Branches"
              value={stats?.active ?? 0}
              sub={`${stats?.total ? Math.round(((stats?.active ?? 0) / stats.total) * 100) : 0}% of total`}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              label="Inactive Branches"
              value={stats?.inactive ?? 0}
              sub="currently disabled"
              icon={XCircle}
              color="slate"
            />
          </>
        )}
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by branch name, phone or email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Partner filter */}
        <Select
          value={partnerFilter}
          onValueChange={(v) => setPartnerFilter(v as any)}
        >
          <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
            <span className="truncate">{selectedPartnerName}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Partners</SelectItem>
            {partners.map((p: any) => (
              <SelectItem key={String(p._id)} value={String(p._id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | "true" | "false")}
        >
          <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
            <span>
              {statusFilter === "all"
                ? "All Status"
                : statusFilter === "true"
                  ? "Active"
                  : "Inactive"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearFilters}
            title="Clear filters"
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
            <Table className="min-w-[1100px]">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-none bg-linear-to-r *:text-white from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                  <SortableTh field="branchName" label="Branch" />
                  <TableHead className="whitespace-nowrap">Partner</TableHead>
                  <SortableTh field="phone" label="Phone" />
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <SortableTh field="createdAt" label="Added" />
                  <SortableTh field="isActive" label="Status" />
                  <TableHead className="text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <BranchRowSkeleton key={i} />
                  ))
                ) : sortedBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Building2 className="w-12 h-12 mb-4 opacity-30" />
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
                              No branches added yet
                            </p>
                            <p className="text-sm mt-1">
                              Click the Add Branch button to get started
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedBranches.map((branch: any, index: number) => (
                    <TableRow
                      key={String(branch._id)}
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
                      {/* Branch name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {branch.branchName?.charAt(0)?.toUpperCase() ?? "B"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate max-w-40">
                              {branch.branchName}
                            </p>
                            {branch.address && (
                              <p className="text-xs text-slate-400 truncate max-w-40">
                                {branch.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Partner */}
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                        {branch.partner?.name ?? "—"}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                        {branch.phone ?? "—"}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                        {branch.email ?? "—"}
                      </TableCell>

                      {/* Added date */}
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                        {formatDate(branch.createdAt)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {branch.isActive ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                          >
                            <span className="h-1.5 w-1.5 rounded-full mr-1.5 inline-block bg-emerald-500" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          >
                            <span className="h-1.5 w-1.5 rounded-full mr-1.5 inline-block bg-slate-400" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title="View details"
                            onClick={() => openDetailsDialog(branch)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit branch"
                            onClick={() => openEditDialog(branch)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            title="Delete branch"
                            onClick={() => openDeleteDialog(branch)}
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

        {/* Footer count */}
        {!isLoading && sortedBranches.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sortedBranches.length}
              </span>{" "}
              branch{sortedBranches.length !== 1 ? "es" : ""}
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

      {viewingBranch && (
        <BranchDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          item={viewingBranch}
        />
      )}

      {editingBranch && (
        <UpdateBranchModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          item={editingBranch}
          onSuccess={refetch}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move{" "}
              <strong>{(deletingBranch as any)?.branchName}</strong> to trash?
              This can be restored later.
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
