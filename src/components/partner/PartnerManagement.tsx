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
  Handshake,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  Building2,
  Stethoscope,
  Pill,
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
import { CreatePartnerModal } from "./CreatePartner";
import { UpdatePartnerModal } from "./UpdatePartner";
import { PartnerDetailsModal } from "./PartnerDetailsModal";

import {
  useGetAllPartnersQuery,
  useSoftDeletePartnerMutation,
} from "@/redux/features/partner/partner.api";
import { IPartner, PartnerCategory } from "@/types/partner.types";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Role } from "@/types/user.types";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "name" | "phone" | "isActive" | "createdAt";
type SortDir = "asc" | "desc" | null;
type CategoryFilter = "all" | PartnerCategory;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  [PartnerCategory.DIAGNOSTIC_HOSPITAL]: "Diagnostic / Hospital",
  [PartnerCategory.PHARMACEUTICALS]: "Pharmaceuticals",
};

// ─── Skeleton ───

function PartnerRowSkeleton() {
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
      {Array.from({ length: 5 }).map((_, i) => (
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

type StatColor = "violet" | "emerald" | "slate" | "blue" | "amber";


const STAT_COLOR_MAP: Record<StatColor,  {
    card: string;
    iconBg: string;
    icon: string;
    sub: string;
    glow: string;
  }> = {
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
  blue: {
card: "bg-linear-to-br from-blue-600 via-indigo-600 to-indigo-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-indigo-100",
    glow: "hover:shadow-indigo-500/30",
  },
  amber: {
   card: "bg-linear-to-br from-amber-600 via-orange-600 to-orange-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-orange-100",
    glow: "hover:shadow-orange-500/30",
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

      {sub && (
        <p className={`relative mt-2 text-sm ${c.sub}`}>
          {sub}
        </p>
      )}
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

export default function PartnerManagement() {
  // ── filters ──
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── sort ──
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── modals ──
  const [viewingPartner, setViewingPartner] = useState<IPartner | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<IPartner | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [deletingPartner, setDeletingPartner] = useState<IPartner | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { user, logout } = useUser();

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, categoryFilter]);

  // ── API ──
  const { data, isLoading, refetch } = useGetAllPartnersQuery({
    searchTerm: searchTerm || undefined,
    isActive: statusFilter !== "all" ? statusFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const [softDeletePartner, { isLoading: isDeleting }] = useSoftDeletePartnerMutation();

  // ── derived ──
  const partners: IPartner[] = data?.data ?? [];
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = statusFilter !== "all" || categoryFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  // ── client sort ──
  const sortedPartners = React.useMemo(() => {
    if (!sortField || !sortDir) return partners;
    return [...partners].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "name") { aVal = a.name ?? ""; bVal = b.name ?? ""; }
      if (sortField === "phone") { aVal = a.phone ?? ""; bVal = b.phone ?? ""; }
      if (sortField === "isActive") { aVal = String(a.isActive); bVal = String(b.isActive); }
      if (sortField === "createdAt") { aVal = a.createdAt ?? ""; bVal = b.createdAt ?? ""; }
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [partners, sortField, sortDir]);

  // ── handlers ──
  const handleSort = (field: SortField) => {
    if (sortField !== field) { setSortField(field); setSortDir("asc"); return; }
    if (sortDir === "asc") { setSortDir("desc"); return; }
    setSortField(null); setSortDir(null);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
  };
  const clearDateFilter = () => { setStartDate(""); setEndDate(""); };

  const openDetailsDialog = (p: IPartner) => { setViewingPartner(p); setIsDetailsOpen(true); };
  const openEditDialog = (p: IPartner) => { setEditingPartner(p); setIsUpdateOpen(true); };
  const openDeleteDialog = (p: IPartner) => { setDeletingPartner(p); setIsDeleteOpen(true); };

  const handleDelete = async () => {
    if (!deletingPartner?._id) return;
    try {
      await softDeletePartner(String(deletingPartner._id)).unwrap();
      toast.success("Partner moved to trash");
      setIsDeleteOpen(false);
      setDeletingPartner(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete partner");
    }
  };

  // ── sortable header ──
  const SortableTh = ({ field, label }: { field: SortField; label: string }) => (
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
        title="Partner Management"
        description="Manage insurance partners and their details"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Partner Management" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={
                user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN
                  ? "/admin/dashboard/partners/trash"
                  : "/manager/dashboard/partners/trash"
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

            <CreatePartnerModal onSuccess={refetch} />
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Date filter row */}
        <div className="sm:col-span-3 lg:col-span-5 flex flex-wrap items-center gap-3">
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
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Partners"
              value={stats?.total ?? 0}
              sub="registered partners"
              icon={LayoutGrid}
              color="violet"
            />
            <StatCard
              label="Active Partners"
              value={stats?.active ?? 0}
              sub={`${stats?.total ? Math.round(((stats?.active ?? 0) / stats.total) * 100) : 0}% of total`}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              label="Inactive Partners"
              value={stats?.inactive ?? 0}
              sub="currently disabled"
              icon={XCircle}
              color="slate"
            />
            <StatCard
              label="Diagnostic / Hospital"
              value={stats?.diagnosticHospital ?? 0}
              sub="in this category"
              icon={Stethoscope}
              color="blue"
            />
            <StatCard
              label="Pharmaceuticals"
              value={stats?.pharmaceuticals ?? 0}
              sub="in this category"
              icon={Pill}
              color="amber"
            />
          </>
        )}
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, phone or email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <Select
          value={categoryFilter as any}
          onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
        >
          <SelectTrigger className="w-full sm:w-52 h-9 text-sm">
            <span className="truncate">
              {categoryFilter === "all" ? "All Categories" : CATEGORY_LABELS[categoryFilter]}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.values(PartnerCategory).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | "true" | "false")}
        >
          <SelectTrigger className="w-40 h-9 text-sm">
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
            <Table className="min-w-275">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-none bg-linear-to-r *:text-white from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                <SortableTh field="name" label="Partner" />
                <SortableTh field="phone" label="Phone" />
                <TableHead className="whitespace-nowrap">Category</TableHead>
                <TableHead className="whitespace-nowrap">Branches</TableHead>
                <TableHead className="whitespace-nowrap">Website</TableHead>
                <SortableTh field="createdAt" label="Added" />
                <SortableTh field="isActive" label="Status" />
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <PartnerRowSkeleton key={i} />
                ))
              ) : sortedPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Handshake className="w-12 h-12 mb-4 opacity-30" />
                      {searchTerm || hasActiveFilters ? (
                        <>
                          <p className="text-base font-medium">No results found</p>
                          <p className="text-sm mt-1">Try adjusting your search or filters</p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-medium">No partners added yet</p>
                          <p className="text-sm mt-1">Click the Add Partner button to get started</p>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedPartners.map((partner, index) => (
                  <TableRow
                    key={String(partner._id)}
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
                    {/* Partner name + logo */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="w-10 h-10 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {partner.name?.charAt(0)?.toUpperCase() ?? "P"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate max-w-40">
                            {partner.name}
                          </p>
                          {partner.description && (
                            <p className="text-xs text-slate-400 truncate max-w-40">
                              {partner.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                      {partner.phone ?? "—"}
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      {partner.category ? (
                        <Badge
                          variant="outline"
                          className={
                            partner.category === PartnerCategory.DIAGNOSTIC_HOSPITAL
                              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                          }
                        >
                          {CATEGORY_LABELS[partner.category]}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Branch Count */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400 gap-1"
                      >
                        <Building2 className="w-3 h-3" />
                        {partner.branchCount ?? 0}
                      </Badge>
                    </TableCell>

                    {/* Website */}
                    <TableCell>
                      {partner.website ? (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 dark:text-violet-400 text-sm hover:underline truncate max-w-36 inline-block"
                        >
                          {partner.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Added date */}
                    <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                      {formatDate(partner.createdAt)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {partner.isActive ? (
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
                          onClick={() => openDetailsDialog(partner)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit partner"
                          onClick={() => openEditDialog(partner)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          title="Delete partner"
                          onClick={() => openDeleteDialog(partner)}
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
        {!isLoading && sortedPartners.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sortedPartners.length}
              </span>{" "}
              partner{sortedPartners.length !== 1 ? "s" : ""}
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
      {viewingPartner && (
        <PartnerDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          item={viewingPartner}
        />
      )}

      {editingPartner && (
        <UpdatePartnerModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          item={editingPartner}
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
              <strong>{deletingPartner?.name}</strong> to trash? This can be
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