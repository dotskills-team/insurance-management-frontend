/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Edit2, Trash2, Search, Eye, ChevronUp, ChevronDown, ChevronsUpDown,
  X, Package, PackageCheck, PackageX, DollarSign, Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import {
  useGetAllPackagesQuery,
  useSoftDeletePackageMutation,
} from "@/redux/features/package/package.api";

import { PageHeader } from "../shared/PageHeader";
import { Pagination } from "../pagination/Pagination";
import { IInsurancePackage, PlanType } from "@/types/package.types";
import { CreatePackageModal } from "./CreatePackage";
import { UpdatePackageModal } from "./UpdatePackage";
import { PackageDetailsModal } from "./PackageDetails";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortField = "name" | "coverageAmount" | "createdAt" | "isActive";
type SortDir = "asc" | "desc" | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<PlanType, string> = {
  [PlanType.MONTHLY]: "Monthly",
  [PlanType.QUARTERLY]: "Quarterly",
  [PlanType.HALF_YEARLY]: "Half-Yearly",
  [PlanType.YEARLY]: "Yearly",
  [PlanType.LIFETIME]: "Lifetime",
};

const formatCurrency = (amount?: number) => {
  if (!amount && amount !== 0) return "—";
  return `৳ ${Number(amount).toLocaleString()}`;
};

const formatDate = (iso?: string | Date) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const getLowestPlanPrice = (pkg: IInsurancePackage): number | null => {
  if (!pkg.plans?.length) return null;
  const prices = pkg.plans.map((p) => p.discountPrice > 0 ? p.discountPrice : p.regularPrice);
  return Math.min(...prices);
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function PackageRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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

type StatColor = "blue" | "emerald" | "slate" | "amber" | "red" | "violet";

const STAT_COLOR_MAP: Record<StatColor, { gradient: string; iconWrap: string; shadow: string }> = {
  blue: {
    gradient: "from-blue-600 to-blue-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-blue-900/25",
  },
  emerald: {
    gradient: "from-emerald-600 to-emerald-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-emerald-900/25",
  },
  slate: {
    gradient: "from-slate-700 to-slate-800",
    iconWrap: "bg-white/10",
    shadow: "shadow-slate-900/25",
  },
  amber: {
    gradient: "from-amber-500 to-amber-600",
    iconWrap: "bg-white/15",
    shadow: "shadow-amber-900/25",
  },
  red: {
    gradient: "from-red-600 to-red-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-red-900/25",
  },
  violet: {
    gradient: "from-violet-600 to-violet-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-violet-900/25",
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
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl transition-opacity duration-300 group-hover:opacity-80" />

      <div className="relative flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <div className={`p-2 rounded-lg ${c.iconWrap} backdrop-blur-sm transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="relative text-2xl font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="relative text-xs mt-1 text-white/70">{sub}</p>}
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 ml-1 text-slate-400" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-blue-500" />
    : <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-500" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PackageManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"true" | "false" | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const [editingPkg, setEditingPkg] = useState<IInsurancePackage | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [viewingPkg, setViewingPkg] = useState<IInsurancePackage | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingPkg, setDeletingPkg] = useState<IInsurancePackage | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

  const { data, isLoading, refetch } = useGetAllPackagesQuery({
    searchTerm: searchTerm || undefined,
    isActive: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const [softDeletePackage, { isLoading: isDeleting }] = useSoftDeletePackageMutation();

  // const packages: IInsurancePackage[] = data?.data?.data ?? data?.data ?? [];
  // const stats    = data?.data?.stats ?? data?.stats;
  // const meta     = data?.data?.meta  ?? data?.meta;
  // const totalPage = meta?.totalPage ?? 1;

  const packages: IInsurancePackage[] = data?.data?.data ?? [];
  const stats = data?.data?.stats;
  const meta = data?.data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = statusFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  const sortedPackages = useMemo(() => {
    if (!sortField || !sortDir) return packages;
    return [...packages].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortField === "name") { aVal = a.name ?? ""; bVal = b.name ?? ""; }
      if (sortField === "coverageAmount") { aVal = a.coverageAmount ?? 0; bVal = b.coverageAmount ?? 0; }
      if (sortField === "isActive") { aVal = String(a.isActive); bVal = String(b.isActive); }
      if (sortField === "createdAt") { aVal = String(a.createdAt ?? ""); bVal = String(b.createdAt ?? ""); }
      if (typeof aVal === "number") return sortDir === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [packages, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField !== field) { setSortField(field); setSortDir("asc"); return; }
    if (sortDir === "asc") { setSortDir("desc"); return; }
    setSortField(null); setSortDir(null);
  };

  const clearFilters = () => setStatusFilter("all");
  const clearDateFilter = () => { setStartDate(""); setEndDate(""); };

  const handleDelete = async () => {
    if (!deletingPkg?._id) return;
    try {
      await softDeletePackage(String(deletingPkg._id)).unwrap();
      toast.success("Package moved to trash");
      setIsDeleteOpen(false);
      setDeletingPkg(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete package");
    }
  };

  const SortableTh = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort(field)}>
      <span className="inline-flex items-center hover:text-slate-900 dark:hover:text-white transition-colors">
        {label}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance Packages"
        description="Manage all insurance packages and their plans"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Insurance Packages" },
        ]}
        action={<CreatePackageModal onSuccess={refetch} />}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0">Filter stats by date:</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" className="h-9 w-40 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-slate-400 text-sm">to</span>
            <Input type="date" className="h-9 w-40 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            {hasDateFilter && (
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={clearDateFilter}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard label="Total Packages" value={stats?.total ?? 0} sub="in the system" icon={Package} color="blue" />
            <StatCard label="Active Packages" value={stats?.active ?? 0} sub={`${stats?.total ? Math.round(((stats?.active ?? 0) / stats.total) * 100) : 0}% of total`} icon={PackageCheck} color="emerald" />
            <StatCard label="Inactive Packages" value={stats?.inactive ?? 0} sub="not currently active" icon={PackageX} color="slate" />
            <StatCard label="Total Subscriptions" value={stats?.totalSubscriptions ?? 0} sub="across all packages" icon={Users} color="violet" />
            <StatCard label="Total Revenue" value={formatCurrency(stats?.totalRevenue)} sub="from paid subscriptions" icon={DollarSign} color="amber" />
          </>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by package name..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <span>{statusFilter === "all" ? "All Status" : statusFilter === "true" ? "Active" : "Inactive"}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="icon" onClick={clearFilters} className="shrink-0">
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
                <SortableTh field="name" label="Package Name" />
                <SortableTh field="coverageAmount" label="Coverage" />
                <TableHead className="whitespace-nowrap">Plans</TableHead>
                <TableHead className="whitespace-nowrap">Starting Price</TableHead>
                <TableHead className="whitespace-nowrap">Subscriptions</TableHead>
                <TableHead className="whitespace-nowrap">Revenue</TableHead>
                <SortableTh field="createdAt" label="Created" />
                <SortableTh field="isActive" label="Status" />
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <PackageRowSkeleton key={i} />)
              ) : sortedPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Package className="w-12 h-12 mb-4 opacity-30" />
                      {searchTerm || hasActiveFilters ? (
                        <><p className="text-base font-medium">No results found</p><p className="text-sm mt-1">Try adjusting your search or filters</p></>
                      ) : (
                        <><p className="text-base font-medium">No packages created yet</p><p className="text-sm mt-1">Click the Create Package button to get started</p></>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedPackages.map((pkg, index) => {
                  const lowestPrice = getLowestPlanPrice(pkg);
                  const analytics = (pkg as any).analytics;
                  return (
                    <TableRow key={String(pkg._id)}   className={`
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
`}>
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate max-w-44">{pkg.name}</p>
                            <p className="text-xs text-slate-400 font-mono truncate max-w-44">{pkg.slug}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Coverage */}
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatCurrency(pkg.coverageAmount)}
                      </TableCell>

                      {/* Plans */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pkg.plans?.slice(0, 3).map((plan) => (
                            <Badge key={plan.type} variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                              {PLAN_LABELS[plan.type]}
                            </Badge>
                          ))}
                          {(pkg.plans?.length ?? 0) > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-500">
                              +{(pkg.plans?.length ?? 0) - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Starting price */}
                      <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {lowestPrice !== null ? formatCurrency(lowestPrice) : "—"}
                      </TableCell>

                      {/* Subscriptions */}
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                        {analytics?.totalSubscriptions ?? 0}
                      </TableCell>

                      {/* Revenue */}
                      <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap text-sm">
                        {formatCurrency(analytics?.totalRevenue)}
                      </TableCell>

                      {/* Created */}
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                        {formatDate(pkg.createdAt)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={pkg.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${pkg.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {pkg.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-1.5 justify-end">
                          <Button variant="outline" size="icon" className="h-8 w-8" title="View details" onClick={() => { setViewingPkg(pkg); setIsDetailsOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="Edit package" onClick={() => { setEditingPkg(pkg); setIsUpdateOpen(true); }}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="destructive" size="icon" className="h-8 w-8" title="Move to trash" onClick={() => { setDeletingPkg(pkg); setIsDeleteOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <Pagination page={page} totalPage={totalPage} onPageChange={setPage} />
        </div>

        {!isLoading && sortedPackages.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{sortedPackages.length}</span> package{sortedPackages.length !== 1 ? "s" : ""}{hasActiveFilters && " (filtered)"}
            </p>
            {totalPage > 1 && <p className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPage}</p>}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {editingPkg && <UpdatePackageModal open={isUpdateOpen} onOpenChange={setIsUpdateOpen} item={editingPkg} onSuccess={refetch} />}
      {viewingPkg && <PackageDetailsModal open={isDetailsOpen} onOpenChange={setIsDetailsOpen} item={viewingPkg} />}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move <strong>{deletingPkg?.name}</strong> to trash? It can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              {isDeleting ? "Moving..." : "Move to Trash"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}