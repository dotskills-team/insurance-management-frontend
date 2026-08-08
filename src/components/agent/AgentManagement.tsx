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
  useGetAllAgentsQuery,
  useDeleteUserMutation,
  useGetAllAgentLeadersQuery,
} from "@/redux/features/user/user.api";

import { PageHeader } from "../shared/PageHeader";
import { Pagination } from "../pagination/Pagination";
import { CreateAgentModal } from "./CreateAgent";
import { AgentDetailsModal } from "./AgentDetailsModal";
import { UpdateAgentModal } from "./UpdateAgent";
import { IsActive, IUser } from "@/types/user.types";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortField = "name" | "phone" | "isActive" | "createdAt";
type SortDir = "asc" | "desc" | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_DOT: Record<IsActive, string> = {
  [IsActive.ACTIVE]: "bg-emerald-500",
  [IsActive.INACTIVE]: "bg-slate-400",
  [IsActive.CREATED]: "bg-slate-400",
  [IsActive.BLOCKED]: "bg-red-500",
  [IsActive.ALL]: "bg-slate-400",
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function AgentRowSkeleton() {
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
    <ChevronUp className="w-3.5 h-3.5 ml-1 text-blue-500" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-500" />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentManagement() {
  // ── filters & pagination ──
  const [searchTerm, setSearchTerm] = useState("");
  const [leaderFilter, setLeaderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<IsActive | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── sort ──
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── modals ──
  const [editingAgent, setEditingAgent] = useState<IUser | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [viewingAgent, setViewingAgent] = useState<IUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<IUser | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ── reset page on filter change ──
  useEffect(() => {
    setPage(1);
  }, [searchTerm, leaderFilter, statusFilter]);

  // ── API calls ──
  const { data, isLoading, refetch } = useGetAllAgentsQuery({
    searchTerm: searchTerm || undefined,
    isActive: statusFilter !== "all" ? (statusFilter as IsActive) : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  console.log("agents all ", data);
  const { data: leadersData } = useGetAllAgentLeadersQuery({ limit: 100 });

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // ── derived data ──
  const agents: IUser[] = data?.data ?? [];
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = leaderFilter !== "all" || statusFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  // ── client-side leader filter (backend doesn't support it directly) ──
  const filteredAgents = useMemo(() => {
    if (leaderFilter === "all") return agents;
    return agents.filter((a) => {
      const leader = a.agentLeader;
      if (!leader) return false;
      if (typeof leader === "string") return leader === leaderFilter;
      return leader._id === leaderFilter;
    });
  }, [agents, leaderFilter]);

  // ── client-side sort ──
  const sortedAgents = useMemo(() => {
    if (!sortField || !sortDir) return filteredAgents;
    return [...filteredAgents].sort((a, b) => {
      let aVal: string = "";
      let bVal: string = "";

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

      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [filteredAgents, sortField, sortDir]);

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
    setLeaderFilter("all");
    setStatusFilter("all");
  };
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const openEditDialog = (a: IUser) => {
    setEditingAgent(a);
    setIsUpdateOpen(true);
  };
  const openDetailsDialog = (a: IUser) => {
    setViewingAgent(a);
    setIsDetailsOpen(true);
  };
  const openDeleteDialog = (a: IUser) => {
    setDeletingAgent(a);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAgent?._id) return;
    try {
      await deleteUser(String(deletingAgent._id)).unwrap();
      toast.success("Agent deleted successfully");
      setIsDeleteOpen(false);
      setDeletingAgent(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete agent");
    }
  };

  // ── reusable sortable header ──
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

  // ── leader name helper ──
  const getLeaderName = (a: IUser): string => {
    const l = a.agentLeader;
    if (!l) return "—";
    if (typeof l === "string") return l;
    return l.name ?? "—";
  };

  // ── created-by helper ──
  const getCreatedByName = (a: IUser): string => {
    const c = a.createdBy;
    if (!c) return "—";
    if (typeof c === "string") return c;
    return c.name ?? "—";
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Agent Management"
        description="Manage all agents and monitor their activity"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Agent Management" },
        ]}
        // action={<CreateAgentModal onSuccess={refetch} />}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard/agents/trash">
              <Button
                variant="default"
                className="group hover:cursor-pointer border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Trash</span>
              </Button>
            </Link>

            <CreateAgentModal onSuccess={refetch} />
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date filter row */}
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
              label="Total Agents"
              value={stats?.total ?? 0}
              sub="registered in the system"
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Active Agents"
              value={stats?.active ?? 0}
              sub={`${stats?.total ? Math.round(((stats?.active ?? 0) / stats.total) * 100) : 0}% of total`}
              icon={UserCheck}
              color="emerald"
            />
            <StatCard
              label="Inactive Agents"
              value={stats?.inactive ?? 0}
              sub="not currently active"
              icon={UserX}
              color="slate"
            />
            <StatCard
              label="Blocked Agents"
              value={stats?.blocked ?? 0}
              sub="access restricted"
              icon={ShieldAlert}
              color="red"
            />
          </>
        )}
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
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
          value={leaderFilter}
          // onValueChange={(v) => setLeaderFilter(v)}
          onValueChange={(v) => setLeaderFilter(String(v))}
        >
          <SelectTrigger className="w-56 h-9 text-sm">
            <span className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-slate-400 shrink-0" />
              {leaderFilter === "all"
                ? "All Leaders"
                : (leadersData?.data ?? []).find(
                  (l: IUser) => String(l._id) === leaderFilter,
                )?.name || "Select leader"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leaders</SelectItem>
            {(leadersData?.data ?? []).map((leader: IUser) => (
              <SelectItem key={String(leader._id)} value={String(leader._id)}>
                {leader.name}
              </SelectItem>
            ))}
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
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table className="min-w-275">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-none bg-linear-to-r *:text-white from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                  <SortableTh field="name" label="Agent" />
                  <SortableTh field="phone" label="Phone" />
                  <TableHead className="whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Agent Leader
                  </TableHead>
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
                    <AgentRowSkeleton key={i} />
                  ))
                ) : sortedAgents.length === 0 ? (
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
                          <>
                            <p className="text-base font-medium">
                              No agents added yet
                            </p>
                            <p className="text-sm mt-1">
                              Click the Add Agent button to get started
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAgents.map((agent, index) => {
                    const status = agent.isActive ?? IsActive.INACTIVE;
                    return (
                      <TableRow
                        key={String(agent._id)}
                        className={`
border-b
transition-all
duration-300
hover:shadow-sm
hover:bg-indigo-50
dark:hover:bg-indigo-950/20

${index % 2 === 0
                            ? "bg-white dark:bg-background"
                            : "bg-linear-to-r from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/10"
                          }
`}
                      >
                        {/* Agent name + phone */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {agent.picture ? (
                              <img
                                src={agent.picture}
                                alt={agent.name}
                                className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {agent.name?.charAt(0)?.toUpperCase() ?? "A"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white truncate max-w-36">
                                {agent.name ?? "—"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-36">
                                {agent.phone ?? "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                          {agent.phone ?? "—"}
                        </TableCell>

                        {/* Agent Id  */}
                        <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                          {agent.employeeId ?? "—"}
                        </TableCell>

                        {/* Agent Leader */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                            <UserCog className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {getLeaderName(agent)}
                          </span>
                        </TableCell>

                        {/* Created By */}
                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                          {getCreatedByName(agent)}
                        </TableCell>

                        {/* Joined date */}
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                          {formatDate(agent.createdAt)}
                        </TableCell>

                        {/* Last login */}
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                          {agent.lastLoginAt ? (
                            formatDate(agent.lastLoginAt)
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 italic text-xs">
                              Never
                            </span>
                          )}
                        </TableCell>

                        {/* Status badge */}
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

                        {/* Actions */}
                        <TableCell>
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="View details"
                              onClick={() => openDetailsDialog(agent)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit agent"
                              onClick={() => openEditDialog(agent)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              title="Delete agent"
                              onClick={() => openDeleteDialog(agent)}
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <Pagination
            page={page}
            totalPage={totalPage}
            onPageChange={setPage}
          />
        </div>

        {/* Footer row count */}
        {!isLoading && sortedAgents.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sortedAgents.length}
              </span>{" "}
              agent{sortedAgents.length !== 1 ? "s" : ""}
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
      {editingAgent && (
        <UpdateAgentModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          item={editingAgent}
          onSuccess={refetch}
        />
      )}

      {viewingAgent && (
        <AgentDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          item={viewingAgent}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingAgent?.name}</strong>? This action cannot be
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
