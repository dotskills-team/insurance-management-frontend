/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Edit2,
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
} from "lucide-react";

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
import { useGetMyCustomersQuery } from "@/redux/features/user/user.api";

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
import { CreateSubscriptionModal } from "../../subscription/CreateSubscriptionModal";
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
  [IsActive.CREATED]: "bg-slate-400",
  [IsActive.INACTIVE]: "bg-slate-400",
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
    ring: string;
    glow: string;
  }
> = {
  blue: {
    bg: "bg-linear-to-br from-blue-900 via-indigo-800 to-cyan-950",
    iconBg: "bg-white/15 backdrop-blur-sm",
    icon: "text-white",
    ring: "hover:ring-blue-300/40",
    glow: "hover:shadow-blue-500/25",
  },

  emerald: {
    bg: "bg-linear-to-br from-emerald-900 via-green-800 to-teal-950",
    iconBg: "bg-white/15 backdrop-blur-sm",
    icon: "text-white",
    ring: "hover:ring-emerald-300/40",
    glow: "hover:shadow-emerald-500/25",
  },

  slate: {
    bg: "bg-linear-to-br from-slate-900 via-indigo-800 to-slate-950",
    iconBg: "bg-white/10 backdrop-blur-sm",
    icon: "text-white",
    ring: "hover:ring-slate-300/30",
    glow: "hover:shadow-slate-500/20",
  },

  red: {
    bg: "bg-linear-to-br from-rose-900 via-red-800 to-red-950",
    iconBg: "bg-white/15 backdrop-blur-sm",
    icon: "text-white",
    ring: "hover:ring-red-300/40",
    glow: "hover:shadow-red-500/25",
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
        ${c.bg}
        shadow-lg
        ring-1
        ring-white/10
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
        ${c.glow}
        ${c.ring}
      `}
    >
      {/* Decorative Glow */}
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-3xl transition-all duration-300 group-hover:bg-white/20" />

      <div className="relative flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
          {label}
        </p>

        <div
          className={`
            flex h-11 w-11 items-center justify-center
            rounded-xl
            ${c.iconBg}
            transition-transform
            duration-300
            group-hover:scale-110
          `}
        >
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>

      <p className="relative text-3xl font-bold tracking-tight text-white">
        {value}
      </p>

      {sub && <p className="relative mt-2 text-sm text-white/75">{sub}</p>}
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

export default function AgentCustomerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<IsActive | "all">("all");
  const [genderFilter, setGenderFilter] = useState<
    "MALE" | "FEMALE" | "OTHER" | "all"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── view mode: table (default) or grid ──
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [editingCustomer, setEditingCustomer] = useState<IUser | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<IUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [subscriptionsCustomer, setSubscriptionsCustomer] =
    useState<IUser | null>(null);
  const [isSubscriptionsOpen, setIsSubscriptionsOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setPage(1);
    }, 100);
  }, [searchTerm, statusFilter, genderFilter]);

  const baseParams = {
    searchTerm: searchTerm || undefined,
    isActive: statusFilter !== "all" ? (statusFilter as IsActive) : undefined,
    gender: genderFilter !== "all" ? genderFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  const { data, isLoading, refetch } = useGetMyCustomersQuery(baseParams);

  const customers: IUser[] = useMemo(() => data?.data ?? [], [data]);
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = statusFilter !== "all" || genderFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

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
  const openSubscriptionsDialog = (c: IUser) => {
    setSubscriptionsCustomer(c);
    setIsSubscriptionsOpen(true);
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
      <span className="inline-flex items-center hover:text-slate-900 dark:hover:text-white transition-colors text-white">
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* <DashboardHeroBanner
        title="My Customers"
        description="Manage the customers you've onboarded and their subscriptions."
        onRefresh={refetch}
        isRefreshing={isFetching}
      /> */}

      <PageHeader
        title="My Customers"
        description="Manage customers you have created"
        breadcrumbs={[
          { label: "Dashboard", href: "/agent/dashboard" },
          { label: "My Customers" },
        ]}
        action={<CreateSubscriptionModal onSuccess={refetch} />}
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
              sub="created by you"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <ScrollArea className="w-full whitespace-nowrap">
              <Table className="min-w-275">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="border-none bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                    <SortableTh field="name" label="Customer" />
                    <SortableTh field="phone" label="Phone" />
                    <SortableTh field="gender" label="Gender" />
                    <TableHead className="whitespace-nowrap text-white">NID</TableHead>
                    <SortableTh field="createdAt" label="Joined" />
                    <TableHead className="whitespace-nowrap text-white">
                      Last Login
                    </TableHead>
                    <SortableTh field="isActive" label="Status" />
                    <TableHead className="text-right whitespace-nowrap text-white">
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
                      <TableCell colSpan={8}>
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
                            <p className="text-base font-medium">
                              You haven&apos;t created any customers yet.
                            </p>
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
                                  className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0"
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
                              {/* No Delete action: backend's deleteUser route does
                                not currently authorize Role.AGENT. */}
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
                  You haven&apos;t created any customers yet.
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
                    onViewDetails={openDetailsDialog}
                    onViewSubscriptions={openSubscriptionsDialog}
                    onEdit={openEditDialog}
                    // no onDelete: agent list doesn't authorize delete
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
    </div>
  );
}
