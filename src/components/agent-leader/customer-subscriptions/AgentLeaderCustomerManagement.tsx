/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Edit2,
  Trash2,
  Search,
  Eye,
  PackageCheck,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  UserCog,
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
  useDeleteUserMutation,
  useGetMyLeaderBothCustomersQuery,
} from "@/redux/features/user/user.api";

import { PageHeader } from "../../shared/PageHeader";
import { ViewToggle, ViewMode } from "@/components/shared/dashboard/ViewToggle";
import { Pagination } from "../../pagination/Pagination";
import { CustomerDetailsModal } from "../../customer/CustomerDetailsModal";
import { UpdateCustomerModal } from "../../customer/UpdateCustomer";
import {
  CustomerCard,
  CustomerCardSkeleton,
} from "../../customer/CustomerCard";
import { IsActive, IUser } from "@/types/user.types";
import { CustomerSubscriptionsModal } from "../../customer/CustomerSubscriptionDetailsModal";
import Link from "next/link";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type SortField = "name" | "phone" | "isActive" | "createdAt" | "gender";
type SortDir = "asc" | "desc" | null;

const STATUS_LABELS: Record<IsActive, string> = {
  [IsActive.ACTIVE]: "Active",
  [IsActive.INACTIVE]: "Inactive",
  [IsActive.CREATED]: "Created",
  [IsActive.BLOCKED]: "Blocked",
  [IsActive.ALL]: "All",
};

const STATUS_STYLES: Record<IsActive, string> = {
  [IsActive.ACTIVE]:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  [IsActive.INACTIVE]:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
  [IsActive.CREATED]:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
  [IsActive.BLOCKED]:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  [IsActive.ALL]:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const STATUS_DOT: Record<IsActive, string> = {
  [IsActive.ACTIVE]: "bg-emerald-500",
  [IsActive.INACTIVE]: "bg-slate-400",
  [IsActive.CREATED]: "bg-slate-400",
  [IsActive.BLOCKED]: "bg-red-500",
  [IsActive.ALL]: "bg-slate-500",
};

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function CustomerRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      {Array.from({ length: 6 }).map((_, i) => (
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

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

type StatColor = "blue" | "emerald" | "slate" | "red";

const STAT_COLOR_MAP: Record<
  StatColor,
  {
    bg: string;
    iconBg: string;
    icon: string;
    text: string;
    border: string;
    glow: string;
  }
> = {
  blue: {
    bg: "bg-linear-to-br from-blue-950 to-blue-900",
    iconBg: "bg-linear-to-br from-blue-500 to-blue-600",
    icon: "text-white",
    text: "text-blue-50",
    border: "hover:border-blue-800",
    glow: "hover:shadow-blue-500/20",
  },

  emerald: {
    bg: "bg-linear-to-br from-emerald-950 to-emerald-900",
    iconBg: "bg-linear-to-br from-emerald-500 to-emerald-600",
    icon: "text-white",
    text: "text-emerald-100",
    border: "hover:border-emerald-800",
    glow: "hover:shadow-emerald-500/20",
  },

  slate: {
    bg: "bg-linear-to-br from-slate-950 to-slate-900",
    iconBg: "bg-linear-to-br from-slate-500 to-slate-700",
    icon: "text-white",
    text: "text-slate-100",
    border: "hover:border-slate-700",
    glow: "hover:shadow-slate-500/20",
  },

  red: {
    bg: "bg-linear-to-br from-rose-950 to-red-900",
    iconBg: "bg-linear-to-br from-rose-500 to-red-600",
    icon: "text-white",
    text: "text-rose-100",
    border: "hover:border-rose-800",
    glow: "hover:shadow-rose-500/20",
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
    relative
    overflow-hidden
    group
    rounded-2xl
    border
    p-5
    transition-all
    duration-300
    hover:-translate-y-1
    hover:shadow-xl
    ${c.bg}
    ${c.border}
    ${c.glow}
  `}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-3xl opacity-40 transition-opacity duration-300 group-hover:opacity-80" />
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-100">{label}</p>
        <div
          className={`
    h-11
    w-11
    rounded-xl
    flex
    items-center
    justify-center
    ${c.iconBg}
    shadow-lg
    transition-transform
    duration-300
    group-hover:scale-110
    group-hover:rotate-6
  `}
        >
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${c.text}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 font-medium ${c.text}`}>{sub}</p>}
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

function SortableTh({
  field,
  label,
  sortField,
  sortDir,
  handleSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField | null;
  sortDir: SortDir;
  handleSort: (field: SortField) => void;
}) {
  return (
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
}

export default function AgentLeaderCustomerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<IsActive | "all">("all");
  const [genderFilter, setGenderFilter] = useState<
    "MALE" | "FEMALE" | "OTHER" | "all"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── sort ──
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── view mode: table (default) or grid ──
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // ── modals ──
  const [editingCustomer, setEditingCustomer] = useState<IUser | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<IUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<IUser | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [subscriptionsCustomer, setSubscriptionsCustomer] =
    useState<IUser | null>(null);
  const [isSubscriptionsOpen, setIsSubscriptionsOpen] = useState(false);

  // ── reset page on filter change ──
  useEffect(() => {
    setTimeout(() => {
      setPage(1);
    }, 100);
  }, [searchTerm, statusFilter, genderFilter]);

  // ── query params ──
  const baseParams = {
    searchTerm: searchTerm || undefined,
    isActive: statusFilter !== "all" ? (statusFilter as IsActive) : undefined,
    gender: genderFilter !== "all" ? genderFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  const { data, isLoading, refetch } =
    useGetMyLeaderBothCustomersQuery(baseParams);
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // ── derived data ──
  const customers: IUser[] = useMemo(() => data?.data ?? [], [data]);
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = statusFilter !== "all" || genderFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  // ── client-side sort ──
  const sortedCustomers = useMemo(() => {
    if (!sortField || !sortDir) return customers;
    return [...customers].sort((a, b) => {
      let aVal = "",
        bVal = "";
      if (sortField === "name") {
        aVal = a.name ?? "";
        bVal = b.name ?? "";
      }
      if (sortField === "phone") {
        aVal = a.phone ?? "";
        bVal = b.phone ?? "";
      }
      if (sortField === "isActive") {
        aVal = a.isActive ?? "";
        bVal = b.isActive ?? "";
      }
      if (sortField === "createdAt") {
        aVal = a.createdAt ?? "";
        bVal = b.createdAt ?? "";
      }
      if (sortField === "gender") {
        aVal = a.gender ?? "";
        bVal = b.gender ?? "";
      }
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [customers, sortField, sortDir]);

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
    setGenderFilter("all");
  };
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const openEditDialog = (c: IUser) => {
    setEditingCustomer(c);
    setIsUpdateOpen(true);
  };
  const openDetailsDialog = (c: IUser) => {
    setViewingCustomer(c);
    setIsDetailsOpen(true);
  };
  const openDeleteDialog = (c: IUser) => {
    setDeletingCustomer(c);
    setIsDeleteOpen(true);
  };
  const openSubscriptionsDialog = (c: IUser) => {
    setSubscriptionsCustomer(c);
    setIsSubscriptionsOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCustomer?._id) return;
    try {
      await deleteUser(String(deletingCustomer._id)).unwrap();
      toast.success("Customer deleted successfully");
      setIsDeleteOpen(false);
      setDeletingCustomer(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete customer");
    }
  };

  const getAgentName = (c: IUser): string => {
    const a = c.createdBy;
    if (!a) return "—";
    if (typeof a === "string") return a;
    return a.name ?? "—";
  };

  return (
    <div className="space-y-6">
      {/* <DashboardHeroBanner
        title="My Agent Customers"
        description="Track and manage customers created by the agents on your team."
        onRefresh={refetch}
        isRefreshing={isFetching}
      /> */}

      <PageHeader
        title="My Agent Customers"
        description="Manage customers created by your agents"
        breadcrumbs={[
          { label: "Dashboard", href: "/agent-leader/dashboard" },
          { label: "My Agent Customers" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/agent-leader/dashboard/customers/trash">
              <Button
                variant="default"
                className="group hover:cursor-pointer border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 transition-transform ease-in-out flex gap-2 items-center"
              >
                <Trash2 className="h-4 w-4" />
                <span>Trash</span>
              </Button>
            </Link>

            {/* <CreateSubscriptionModal onSuccess={refetch} /> */}
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 px-4 py-3 shadow-sm">
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
                className="h-9 w-9 shrink-0 transition-all duration-200 hover:shadow-sm active:scale-95"
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
          </>
        ) : (
          <>
            <StatCard
              label="Total Customers"
              value={stats?.total ?? 0}
              sub="registered under your agents"
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Active Customers"
              value={stats?.active ?? 0}
              sub={`${stats?.total ? Math.round(((stats?.active ?? 0) / stats.total) * 100) : 0}% of total`}
              icon={UserCheck}
              color="emerald"
            />
            <StatCard
              label="Inactive Customers"
              value={stats?.inactive ?? 0}
              sub="not currently active"
              icon={UserX}
              color="slate"
            />
            <StatCard
              label="Blocked Customers"
              value={stats?.blocked ?? 0}
              sub="access restricted"
              icon={ShieldAlert}
              color="red"
            />
          </>
        )}
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-3 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Gender filter */}
        <Select
          value={genderFilter}
          onValueChange={(v) => setGenderFilter(v as typeof genderFilter)}
        >
          <SelectTrigger className="w-36 h-9 text-sm">
            <span>
              {genderFilter === "all"
                ? "All Genders"
                : GENDER_LABELS[genderFilter]}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter as any}
          onValueChange={(v) => setStatusFilter(v as IsActive | "all")}
        >
          <SelectTrigger className="w-40 h-9 text-sm">
            <span>
              {statusFilter === "all"
                ? "All Status"
                : STATUS_LABELS[statusFilter as IsActive]}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={IsActive.ACTIVE}>Active</SelectItem>
            <SelectItem value={IsActive.INACTIVE}>Inactive</SelectItem>
            <SelectItem value={IsActive.BLOCKED}>Blocked</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearFilters}
            title="Clear filters"
            className="shrink-0 transition-all duration-200 hover:shadow-sm active:scale-95"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* ── Section header: count + view toggle ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {isLoading
            ? "Loading customers…"
            : `${meta?.total ?? sortedCustomers.length} customer${(meta?.total ?? sortedCustomers.length) !== 1 ? "s" : ""}`}
        </p>
        <ViewToggle view={viewMode} onChange={setViewMode} />
      </div>

      {/* ── Table View ── */}
      {viewMode === "table" && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="overflow-x-auto">
              <Table className="min-w-312.5">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="border-none *:text-white bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                    <SortableTh
                      field="name"
                      label="Customer"
                      sortField={sortField}
                      sortDir={sortDir}
                      handleSort={handleSort}
                    />

                    <SortableTh
                      field="phone"
                      label="Phone"
                      sortField={sortField}
                      sortDir={sortDir}
                      handleSort={handleSort}
                    />

                    <SortableTh
                      field="gender"
                      label="Gender"
                      sortField={sortField}
                      sortDir={sortDir}
                      handleSort={handleSort}
                    />

                    <TableHead className="whitespace-nowrap">NID</TableHead>

                    <TableHead className="whitespace-nowrap">
                      Created By
                    </TableHead>

                    <SortableTh
                      field="createdAt"
                      label="Joined"
                      sortField={sortField}
                      sortDir={sortDir}
                      handleSort={handleSort}
                    />

                    <TableHead className="whitespace-nowrap">
                      Last Login
                    </TableHead>

                    <SortableTh
                      field="isActive"
                      label="Status"
                      sortField={sortField}
                      sortDir={sortDir}
                      handleSort={handleSort}
                    />

                    <TableHead className="text-right whitespace-nowrap">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <CustomerRowSkeleton key={i} />
                    ))
                  ) : sortedCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                          <Users className="w-12 h-12 mb-4 opacity-30" />
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
                                No customers found under your agents.
                              </p>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCustomers.map((customer, index) => {
                      const status = customer.isActive ?? IsActive.INACTIVE;
                      return (
                        <TableRow
                          key={String(customer._id)}
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
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {customer.picture ? (
                                <Image
                                  src={customer.picture}
                                  width={200}
                                  height={200}
                                  priority
                                  quality={90}
                                  alt={customer.name}
                                  className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 via-blue-500 to-cyan-500 shadow-md flex items-center justify-center text-white font-bold"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                  {customer.name?.charAt(0)?.toUpperCase() ??
                                    "C"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white truncate max-w-36">
                                  {customer.name ?? "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                            {customer.phone ?? "—"}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                            {customer.gender ? (
                              GENDER_LABELS[customer.gender]
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 italic text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                            {customer.nid ?? (
                              <span className="text-slate-300 dark:text-slate-600 italic text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                              <UserCog className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {getAgentName(customer)}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                            {formatDate(customer.createdAt)}
                          </TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                            {customer.lastLoginAt ? (
                              formatDate(customer.lastLoginAt)
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 italic text-xs">
                                Never
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                STATUS_STYLES[status as IsActive] ??
                                STATUS_STYLES[IsActive.INACTIVE]
                              }
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${STATUS_DOT[status as IsActive] ?? STATUS_DOT[IsActive.INACTIVE]}`}
                              />
                              {STATUS_LABELS[status as IsActive] ?? "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 justify-end">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
                                title="View details"
                                onClick={() => openDetailsDialog(customer)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
                                title="View subscriptions"
                                onClick={() =>
                                  openSubscriptionsDialog(customer)
                                }
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                              </Button>
                              {/* <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
                                title="Edit customer"
                                onClick={() => openEditDialog(customer)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button> */}
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
                                title="Delete customer"
                                onClick={() => openDeleteDialog(customer)}
                              >
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

              <Pagination
                page={page}
                totalPage={totalPage}
                onPageChange={setPage}
              />
            </div>

            {!isLoading && sortedCustomers.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {sortedCustomers.length}
                  </span>{" "}
                  customer{sortedCustomers.length !== 1 ? "s" : ""}
                  {hasActiveFilters && " (filtered)"}
                </p>
                {totalPage > 1 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Page {page} of {totalPage}
                  </p>
                )}
              </div>
            )}

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* ── Grid View ── */}
      {viewMode === "grid" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CustomerCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
              <Users className="w-12 h-12 mb-4 opacity-30" />
              {searchTerm || hasActiveFilters ? (
                <>
                  <p className="text-base font-medium">No results found</p>
                  <p className="text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </>
              ) : (
                <p className="text-base font-medium">
                  No customers found under your agents.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedCustomers.map((customer) => (
                  <CustomerCard
                    key={String(customer._id)}
                    customer={customer}
                    showAgentColumn
                    getAgentName={getAgentName}
                    onViewDetails={openDetailsDialog}
                    onViewSubscriptions={openSubscriptionsDialog}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                  />
                ))}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm px-4 py-3">
                <Pagination
                  page={page}
                  totalPage={totalPage}
                  onPageChange={setPage}
                />
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {sortedCustomers.length}
                    </span>{" "}
                    customer{sortedCustomers.length !== 1 ? "s" : ""}
                    {hasActiveFilters && " (filtered)"}
                  </p>
                  {totalPage > 1 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Page {page} of {totalPage}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {editingCustomer && (
        <UpdateCustomerModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          item={editingCustomer}
          onSuccess={refetch}
        />
      )}
      {viewingCustomer && (
        <CustomerDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          item={viewingCustomer}
        />
      )}
      {subscriptionsCustomer && (
        <CustomerSubscriptionsModal
          open={isSubscriptionsOpen}
          onOpenChange={setIsSubscriptionsOpen}
          customer={subscriptionsCustomer}
        />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingCustomer?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
