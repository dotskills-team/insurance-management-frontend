
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
  Crown,
  KeyRound,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useLazyGetCustomerSubscriptionsQuery } from "@/redux/features/subscription/subscription.api";
import { ISubscription } from "@/types/subscription.types";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetAllCustomersQuery,
  useGetAgentCustomersQuery,
  useGetAgentLeaderCustomersQuery,
  useLazyGetAllCustomersQuery,
  useLazyGetAgentCustomersQuery,
  useLazyGetAgentLeaderCustomersQuery,
  useDeleteUserMutation,
  useGetAllAgentsQuery,
  useGetAllAgentLeadersQuery,
} from "@/redux/features/user/user.api";

import { PageHeader } from "../shared/PageHeader";
import { Pagination } from "../pagination/Pagination";
import { CustomerDetailsModal } from "./CustomerDetailsModal";
import { UpdateCustomerModal } from "./UpdateCustomer";
import { ChangeUserPasswordModal } from "./ChangeUserPasswordModal";
import { IsActive, IUser } from "@/types/user.types";
import { CustomerSubscriptionsModal } from "./CustomerSubscriptionDetailsModal";
import { CreateSubscriptionModal } from "../subscription/CreateSubscriptionModal";
import Link from "next/link";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useUser } from "@/context/UserContext";

type SortField = "name" | "phone" | "isActive" | "createdAt" | "gender";
type SortDir = "asc" | "desc" | null;
type FilterMode = "all" | "by_agent" | "by_leader";
type ExportScope = "selected" | "page" | "all";

const STATUS_LABELS: Record<IsActive, string> = {
  [IsActive.ACTIVE]: "Active",
  [IsActive.CREATED]: "Created",
  [IsActive.INACTIVE]: "Inactive",
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

// ── CSV export helpers ──────────────────────────────────────────────────────

function getPackageName(pkg: any): string {
  if (!pkg) return "—";
  return typeof pkg === "string" ? pkg : (pkg?.name ?? "—");
}

function pickRelevantSubscription(subs: ISubscription[]): ISubscription | null {
  if (!subs || subs.length === 0) return null;
  const active = subs.filter((s) => s.status === "ACTIVE");
  const pool = active.length > 0 ? active : subs;
  return [...pool].sort(
    (a, b) =>
      new Date(b.startDate ?? b.createdAt ?? 0).getTime() -
      new Date(a.startDate ?? a.createdAt ?? 0).getTime(),
  )[0];
}

function getSubAgentName(sub: ISubscription | null): string {
  const cb = sub?.createdBy as any;
  if (!cb) return "—";
  return typeof cb === "string" ? cb : (cb?.name ?? "—");
}

function getSubAgentLeaderName(sub: ISubscription | null): string {
  const cb = sub?.createdBy as any;
  if (!cb || typeof cb === "string") return "—";
  const leader = cb?.agentLeader;
  if (!leader) return "—";
  return typeof leader === "string" ? leader : (leader?.name ?? "—");
}

// function formatDateTime(iso?: string) {
//   if (!iso) return "—";
//   return new Date(iso).toLocaleString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type ExportRow = { customer: IUser; subscription: ISubscription | null };

function escapeCsvField(field: unknown): string {

  const str = field === null || field === undefined ? "" : String(field);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// function buildCustomerCsvColumns(getAgentName: (c: IUser) => string) {
//   return [
//     { header: "Name", accessor: (c: IUser) => c.name ?? "" },
//     { header: "Phone", accessor: (c: IUser) => c.phone ?? "" },
//     { header: "Email", accessor: (c: IUser) => c.email ?? "" },
//     {
//       header: "Gender",
//       accessor: (c: IUser) => (c.gender ? GENDER_LABELS[c.gender] : ""),
//     },
//     { header: "NID", accessor: (c: IUser) => c.nid ?? "" },
//     { header: "Created By", accessor: (c: IUser) => getAgentName(c) },
//     { header: "Joined", accessor: (c: IUser) => formatDate(c.createdAt) },
//     {
//       header: "Last Login",
//       accessor: (c: IUser) =>
//         c.lastLoginAt ? formatDate(c.lastLoginAt) : "Never",
//     },
//     {
//       header: "Status",
//       accessor: (c: IUser) =>
//         STATUS_LABELS[c.isActive ?? IsActive.INACTIVE] ?? "Unknown",
//     },
//   ];
// }


function buildCustomerCsvColumns(
  getAgentName: (c: IUser) => string,
  getLeaderName: (c: IUser) => string,
) {
  return [
    { header: "Name", accessor: (r: ExportRow) => r.customer.name ?? "" },
    { header: "Phone", accessor: (r: ExportRow) => r.customer.phone ?? "" },
    { header: "Email", accessor: (r: ExportRow) => r.customer.email ?? "" },
    { header: "Gender", accessor: (r: ExportRow) => (r.customer.gender ? GENDER_LABELS[r.customer.gender] : "") },
    { header: "NID", accessor: (r: ExportRow) => r.customer.nid ?? "" },
    { header: "Registered By (Agent)", accessor: (r: ExportRow) => getAgentName(r.customer) },
    { header: "Registered By - Leader", accessor: (r: ExportRow) => getLeaderName(r.customer) },
    { header: "Package", accessor: (r: ExportRow) => getPackageName(r.subscription?.package) },
    { header: "Package Price", accessor: (r: ExportRow) => (r.subscription ? String(r.subscription.price ?? "") : "") },
    { header: "Activation Date", accessor: (r: ExportRow) => formatDateTime(r.subscription?.startDate) },
    { header: "Subscription Status", accessor: (r: ExportRow) => r.subscription?.status ?? "" },
    { header: "Sold By (Agent)", accessor: (r: ExportRow) => getSubAgentName(r.subscription) },
    { header: "Sold By - Leader", accessor: (r: ExportRow) => getSubAgentLeaderName(r.subscription) },
    { header: "Joined", accessor: (r: ExportRow) => formatDate(r.customer.createdAt) },
    { header: "Last Login", accessor: (r: ExportRow) => (r.customer.lastLoginAt ? formatDate(r.customer.lastLoginAt) : "Never") },
    { header: "Customer Status", accessor: (r: ExportRow) => STATUS_LABELS[r.customer.isActive ?? IsActive.INACTIVE] ?? "Unknown" },
  ];
}

function buildCsv(
  rows: ExportRow[],
  getAgentName: (c: IUser) => string,
  getLeaderName: (c: IUser) => string,
): string {
  const columns = buildCustomerCsvColumns(getAgentName, getLeaderName);
  const header = columns.map((col) => escapeCsvField(col.header)).join(",");
  const csvRows = rows.map((r) =>
    columns.map((col) => escapeCsvField(col.accessor(r))).join(","),
  );
  return [header, ...csvRows].join("\n");
}

// Prepend a UTF-8 BOM so Excel / Google Sheets render Bangla names & text
// correctly instead of showing garbled characters.
function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function CustomerRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-4" />
      </TableCell>
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

type StatColor = "blue" | "emerald" | "slate" | "red";

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
  blue: {
    card: "bg-linear-to-br from-blue-600 via-blue-700 to-cyan-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-blue-100",
    glow: "hover:shadow-blue-500/30",
  },

  emerald: {
    card: "bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-emerald-100",
    glow: "hover:shadow-emerald-500/30",
  },

  slate: {
    card: "bg-linear-to-br from-slate-700 via-slate-800 to-slate-900",
    iconBg: "bg-white/10",
    icon: "text-white",
    sub: "text-slate-200",
    glow: "hover:shadow-slate-500/30",
  },

  red: {
    card: "bg-linear-to-br from-rose-600 via-red-600 to-red-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-red-100",
    glow: "hover:shadow-red-500/30",
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

export default function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
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

  // ── selection (kept as full records so it survives pagination) ──
  const [selectedCustomers, setSelectedCustomers] = useState<
    Map<string, IUser>
  >(new Map());
  const [isExporting, setIsExporting] = useState(false);

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
  const [passwordCustomer, setPasswordCustomer] = useState<IUser | null>(null);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const { user } = useUser();

  const userRole = user?.role;

  // ── reset page on filter change ──
  useEffect(() => {
    setTimeout(() => {
      setPage(1);
    }, 100);
  }, [
    searchTerm,
    filterMode,
    selectedAgentId,
    selectedLeaderId,
    statusFilter,
    genderFilter,
  ]);

  // ── shared query params ──
  const baseParams = {
    searchTerm: searchTerm || undefined,
    isActive: statusFilter !== "all" ? (statusFilter as IsActive) : undefined,
    gender: genderFilter !== "all" ? genderFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  // ── 3 different API calls depending on filter mode ──
  const allCustomersResult = useGetAllCustomersQuery(baseParams, {
    skip: filterMode !== "all",
  });

  const agentCustomersResult = useGetAgentCustomersQuery(
    { agentId: selectedAgentId, params: baseParams },
    { skip: filterMode !== "by_agent" || !selectedAgentId },
  );

  const leaderCustomersResult = useGetAgentLeaderCustomersQuery(
    { agentLeaderId: selectedLeaderId, params: baseParams },
    { skip: filterMode !== "by_leader" || !selectedLeaderId },
  );

  // ── pick active result ──
  const activeResult =
    filterMode === "by_agent"
      ? agentCustomersResult
      : filterMode === "by_leader"
        ? leaderCustomersResult
        : allCustomersResult;

  const { data, isLoading, refetch } = activeResult;
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // ── lazy queries used only for "export all filtered" (fetches beyond the
  // current page without disturbing the paginated view above) ──
  const [triggerAllCustomers] = useLazyGetAllCustomersQuery();
  const [triggerAgentCustomers] = useLazyGetAgentCustomersQuery();
  const [triggerLeaderCustomers] = useLazyGetAgentLeaderCustomersQuery();
  const [triggerCustomerSubscriptions] = useLazyGetCustomerSubscriptionsQuery();

  // ── dropdown data ──
  const { data: agentsData } = useGetAllAgentsQuery({ limit: 200 });
  const { data: leadersData } = useGetAllAgentLeadersQuery({ limit: 100 });

  // ── derived data ──
  const customers: IUser[] = useMemo(() => data?.data ?? [], [data]);
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters =
    filterMode !== "all" || statusFilter !== "all" || genderFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  // ── client-side sort only (no more client-side filter) ──
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


  console.log("customers", customers);

  const selectedCount = selectedCustomers.size;
  const isAllOnPageSelected =
    sortedCustomers.length > 0 &&
    sortedCustomers.every((c) => selectedCustomers.has(String(c._id)));

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
    setFilterMode("all");
    setSelectedAgentId("");
    setSelectedLeaderId("");
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
  const openPasswordDialog = (c: IUser) => {
    setPasswordCustomer(c);
    setIsPasswordOpen(true);
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

  // ── selection handlers ──
  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedCustomers((prev) => {
      const next = new Map(prev);
      sortedCustomers.forEach((c) => {
        const id = String(c._id);
        if (checked) next.set(id, c);
        else next.delete(id);
      });
      return next;
    });
  };

  const toggleSelectOne = (customer: IUser, checked: boolean) => {
    setSelectedCustomers((prev) => {
      const next = new Map(prev);
      const id = String(customer._id);
      if (checked) next.set(id, customer);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedCustomers(new Map());

  // ── sortable th ──
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

  const getAgentName = (c: IUser): string => {
    const a = c.createdBy;
    if (!a) return "—";
    if (typeof a === "string") return a;
    return a.name ?? "—";
  };

  const getLeaderName = (c: IUser): string => {
    const creator = c.createdBy;
    if (!creator || typeof creator === "string") return "—";
    const leader = (creator as any).agentLeader;
    if (!leader) return "—";
    return typeof leader === "string" ? leader : (leader?.name ?? "—");
  };

  const fetchSubscriptionsMap = async (
    list: IUser[],
  ): Promise<Map<string, ISubscription[]>> => {
    const map = new Map<string, ISubscription[]>();
    const BATCH_SIZE = 5;
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (c) => {
          try {
            const res = await triggerCustomerSubscriptions(String(c._id)).unwrap();
            const subs: ISubscription[] = res?.data ?? [];
            return [String(c._id), subs] as const;
          } catch {
            return [String(c._id), [] as ISubscription[]] as const;
          }
        }),
      );
      results.forEach(([id, subs]) => map.set(id, subs));
    }
    return map;
  };
  // ── export ──
  const fetchAllFilteredCustomers = async (): Promise<IUser[]> => {
    const totalCount = meta?.total ?? customers.length;
    const exportParams = { ...baseParams, page: 1, limit: totalCount || limit };

    if (filterMode === "by_agent" && selectedAgentId) {
      const res = await triggerAgentCustomers({
        agentId: selectedAgentId,
        params: exportParams,
      }).unwrap();
      return res.data ?? [];
    }
    if (filterMode === "by_leader" && selectedLeaderId) {
      const res = await triggerLeaderCustomers({
        agentLeaderId: selectedLeaderId,
        params: exportParams,
      }).unwrap();
      return res.data ?? [];
    }
    const res = await triggerAllCustomers(exportParams).unwrap();
    return res.data ?? [];
  };

  const handleExport = async (scope: ExportScope) => {
    setIsExporting(true);
    try {
      let toExport: IUser[] = [];

      if (scope === "selected") {
        toExport = Array.from(selectedCustomers.values());
      } else if (scope === "page") {
        toExport = sortedCustomers;
      } else {
        toExport = await fetchAllFilteredCustomers();
      }

      if (toExport.length === 0) {
        toast.error("No customers to export");
        return;
      }

      const subscriptionMap = await fetchSubscriptionsMap(toExport);

      const rows: ExportRow[] = [];
      toExport.forEach((customer) => {
        const allSubs = subscriptionMap.get(String(customer._id)) ?? [];
        const activeSubs = allSubs.filter((s) => s.status === "ACTIVE");

        if (activeSubs.length === 0) {
          // no active subscription — still export the customer, subscription cols blank
          rows.push({ customer, subscription: null });
        } else {
          // 1 active subscription → 1 row; multiple active → multiple rows
          activeSubs.forEach((subscription) => rows.push({ customer, subscription }));
        }
      });

      const csv = buildCsv(rows, getAgentName, getLeaderName);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `customers-${scope}-${stamp}.csv`);
      toast.success(
        `Exported ${rows.length} row${rows.length !== 1 ? "s" : ""} (${toExport.length} customer${toExport.length !== 1 ? "s" : ""}) to CSV`,
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to export customers");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="Manage all customers and monitor their activity"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customer Management" },
        ]}
        action={

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="outline"
                  className="gap-2  cursor-pointer bg-green-500 text-white font-semibold hover:bg-green-600 hover:text-white hover:scale-105 transition-all "
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={selectedCount === 0}
                  onClick={() => handleExport("selected")}
                >
                  Export Selected ({selectedCount})
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleExport("page")}
                >
                  Export This Page ({sortedCustomers.length})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleExport("all")}
                >
                  Export All Filtered ({meta?.total ?? 0})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {
              (userRole === "ADMIN" || userRole === "SUPER_ADMIN") && <Link href="/admin/dashboard/customers/trash">
                <Button
                  variant="default"
                  className="group hover:cursor-pointer transition-all  border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white cursor-pointer font-bold tracking-widest uppercase disabled:opacity-60 hover:scale-105 ease-in-out"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Trash</span>
                </Button>
              </Link>
            }

            {
              (userRole === "ADMIN" || userRole === "SUPER_ADMIN") &&
              <CreateSubscriptionModal onSuccess={refetch} />
            }
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
              sub="registered in the system"
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
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Agent Leader filter */}
        <Select
          value={
            filterMode === "by_leader"
              ? selectedLeaderId || "__leader__"
              : "__leader__"
          }
          onValueChange={(v) => {
            if (v === "__leader__") return;
            setFilterMode("by_leader");
            setSelectedLeaderId(v as any);
            setSelectedAgentId("");
          }}
        >
          <SelectTrigger className="w-52 h-9 text-sm">
            <span className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-slate-400 shrink-0" />
              {filterMode === "by_leader" && selectedLeaderId
                ? (leadersData?.data ?? []).find(
                  (l: IUser) => String(l._id) === selectedLeaderId,
                )?.name || "Leader"
                : "All Leaders"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__leader__">All Leaders</SelectItem>
            {(leadersData?.data ?? []).map((leader: IUser) => (
              <SelectItem key={String(leader._id)} value={String(leader._id)}>
                {leader.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Agent filter */}
        <Select
          value={
            filterMode === "by_agent"
              ? selectedAgentId || "__agent__"
              : "__agent__"
          }
          onValueChange={(v) => {
            if (v === "__agent__") return;
            setFilterMode("by_agent");
            setSelectedAgentId(v as any);
            setSelectedLeaderId("");
          }}
        >
          <SelectTrigger className="w-48 h-9 text-sm">
            <span className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-slate-400 shrink-0" />
              {filterMode === "by_agent" && selectedAgentId
                ? (agentsData?.data ?? []).find(
                  (a: IUser) => String(a._id) === selectedAgentId,
                )?.name || "Agent"
                : "All Agents"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__agent__">All Agents</SelectItem>
            {(agentsData?.data ?? []).map((agent: IUser) => (
              <SelectItem key={String(agent._id)} value={String(agent._id)}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 px-3 py-1.5 text-sm text-blue-700 dark:text-blue-300 shrink-0">
            <span className="font-medium">{selectedCount} selected</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table className="min-w-275">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-none bg-linear-to-r *:text-white from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={isAllOnPageSelected}
                      onCheckedChange={(checked) =>
                        toggleSelectAllOnPage(!!checked)
                      }
                      aria-label="Select all on this page"
                      className="border-white/70 data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
                    />
                  </TableHead>
                  <SortableTh field="name" label="Customer" />
                  <SortableTh field="phone" label="Phone" />
                  <SortableTh field="gender" label="Gender" />
                  <TableHead className="whitespace-nowrap">NID</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Created By
                  </TableHead>
                  <SortableTh field="createdAt" label="Joined" />
                  <TableHead className="whitespace-nowrap">
                    Last Login
                  </TableHead>
                  <SortableTh field="isActive" label="Status" />
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
                    <TableCell colSpan={10}>
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
                              No customers added yet
                            </p>
                            <p className="text-sm mt-1">
                              Click the Add Customer button to get started
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCustomers.map((customer, index) => {
                    const status = customer.isActive ?? IsActive.INACTIVE;
                    const isSelected = selectedCustomers.has(
                      String(customer._id),
                    );
                    return (
                      <TableRow
                        key={String(customer._id)}
                        data-state={isSelected ? "selected" : undefined}
                        className={`
border-b
transition-all
duration-300
hover:shadow-sm
hover:bg-indigo-50
dark:hover:bg-indigo-950/20
${isSelected ? "bg-blue-50 dark:bg-blue-950/20" : ""}

${index % 2 === 0 && !isSelected
                            ? "bg-white dark:bg-background"
                            : !isSelected
                              ? "bg-linear-to-r from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/10"
                              : ""
                          }
`}
                      >
                        {/* Select checkbox */}
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              toggleSelectOne(customer, !!checked)
                            }
                            aria-label={`Select ${customer.name}`}
                          />
                        </TableCell>
                        {/* Customer name */}
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
                              <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {customer.name?.charAt(0)?.toUpperCase() ?? "C"}
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
                              className="h-8 w-8"
                              title="View details"
                              onClick={() => openDetailsDialog(customer)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="View subscriptions"
                              onClick={() => openSubscriptionsDialog(customer)}
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                            </Button>
                            {

                              (userRole === "ADMIN" || userRole === "SUPER_ADMIN") &&

                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Change password"
                                  onClick={() => openPasswordDialog(customer)}
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Edit customer"
                                  onClick={() => openEditDialog(customer)}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Delete customer"
                                  onClick={() => openDeleteDialog(customer)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            }
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
      {passwordCustomer && (
        <ChangeUserPasswordModal
          open={isPasswordOpen}
          onOpenChange={setIsPasswordOpen}
          userId={String(passwordCustomer._id)}
          userName={passwordCustomer.name}
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