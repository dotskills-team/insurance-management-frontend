// PaymentManagement.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  Edit2,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Undo2,
  LayoutGrid,
  Wallet,
  Send,
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
import { PaymentDetailsModal } from "./PaymentDetailsModal";

import {
  useGetAllPaymentsQuery,
  useSoftDeletePaymentMutation,
  useInitPaymentMutation,
  IPayment,
} from "@/redux/features/payment/payment.api";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { UpdatePaymentModal } from "./UpdatePaymentModal";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "transactionId" | "amount" | "status" | "createdAt";
type SortDir = "asc" | "desc" | null;

type StatusFilter =
  | "all"
  | "UNPAID"
  | "PAID"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(
    amount ?? 0,
  );

const getCustomerInfo = (
  payment: IPayment,
): { name: string; phone: string } => {
  const sub = payment.subscription;
  if (!sub || typeof sub === "string") return { name: "—", phone: "—" };

  const customer = (sub as any).customer;
  if (!customer || typeof customer === "string")
    return { name: "—", phone: "—" };

  return {
    name: customer.name ?? "—",
    phone: customer.phone ?? "—",
  };
};

const STATUS_STYLES: Record<string, string> = {
  UNPAID:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  COMPLETED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  FAILED:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  CANCELLED:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
  REFUNDED:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  REFUND_PENDING:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
};

const STATUS_DOT: Record<string, string> = {
  UNPAID: "bg-amber-500",
  PAID: "bg-emerald-500",
  COMPLETED: "bg-emerald-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-slate-400",
  REFUNDED: "bg-blue-500",
  REFUND_PENDING: "bg-orange-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={STATUS_STYLES[status] ?? STATUS_STYLES.UNPAID}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${STATUS_DOT[status] ?? STATUS_DOT.UNPAID}`}
      />
      {status}
    </Badge>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PaymentRowSkeleton() {
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

type StatColor = "blue" | "emerald" | "slate" | "red" | "amber" | "violet";

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
  amber: {
    card: "bg-linear-to-br from-amber-600 via-orange-600 to-orange-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-orange-100",
    glow: "hover:shadow-orange-500/30",
  },
  violet: {
    card: "bg-linear-to-br from-violet-600 via-purple-600 to-purple-700",
    iconBg: "bg-white/15",
    icon: "text-white",
    sub: "text-purple-100",
    glow: "hover:shadow-purple-500/30",
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

export default function PaymentManagement() {
  // ── filters ──
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── sort ──
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── modals ──
  const [viewingPayment, setViewingPayment] = useState<IPayment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<IPayment | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // ── API ──
  const { data, isLoading, refetch } = useGetAllPaymentsQuery({
    searchTerm: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const userRole = user?.role;
  console.log("User ", userRole)

  const [softDeletePayment, { isLoading: isDeleting }] =
    useSoftDeletePaymentMutation();
  const [initPayment, { isLoading: isInitiating }] =
    useInitPaymentMutation();

  const [initiatingId, setInitiatingId] = useState<string | null>(null);
  // ── derived ──
  const payments: IPayment[] = data?.data ?? [];
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = statusFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  // ── client sort ──
  const sortedPayments = React.useMemo(() => {
    if (!sortField || !sortDir) return payments;
    return [...payments].sort((a, b) => {
      if (sortField === "amount") {
        return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      let aVal = "";
      let bVal = "";
      if (sortField === "transactionId") {
        aVal = a.transactionId ?? "";
        bVal = b.transactionId ?? "";
      }
      if (sortField === "status") {
        aVal = a.status ?? "";
        bVal = b.status ?? "";
      }
      if (sortField === "createdAt") {
        aVal = a.createdAt ?? "";
        bVal = b.createdAt ?? "";
      }
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [payments, sortField, sortDir]);

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
  };
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const openDetailsDialog = (p: IPayment) => {
    setViewingPayment(p);
    setIsDetailsOpen(true);
  };
  const openEditDialog = (p: IPayment) => {
    setEditingPayment(p);
    setIsUpdateOpen(true);
  };
  const openDeleteDialog = (p: IPayment) => {
    setDeletingPayment(p);
    setIsDeleteOpen(true);
  };

  const handleInitPayment = async (payment: IPayment) => {
    if (!payment?._id) return;
    try {
      setInitiatingId(payment._id);

      console.log("Payment ", payment)

      const res = await initPayment(
        (typeof payment.subscription === "string"
          ? payment.subscription
          : payment.subscription?._id) as string,
      ).unwrap();
      toast.success("Payment link generated and sent to customer");
      refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.message || "Failed to generate payment link",
      );
    } finally {
      setInitiatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingPayment?._id) return;
    try {
      await softDeletePayment(deletingPayment._id).unwrap();
      toast.success("Payment moved to trash");
      setIsDeleteOpen(false);
      setDeletingPayment(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete payment");
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
        title="Payment Management"
        description="Track and manage subscription payments"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Payment Management" },
        ]}
        action={
          <div className="flex items-center gap-2">

            {
              (userRole === "ADMIN" || userRole === "SUPER_ADMIN") &&
              <Link href="/admin/dashboard/payments/trash">
                <Button
                  variant="default"
                  className="group hover:cursor-pointer border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Trash</span>
                </Button>
              </Link>
            }
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {/* Date filter row */}
        <div className="sm:col-span-5 flex flex-wrap items-center gap-3">
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
              label="Total Payments"
              value={stats?.total ?? 0}
              sub="all transactions"
              icon={LayoutGrid}
              color="violet"
            />
            <StatCard
              label="Completed"
              value={stats?.completed ?? 0}
              sub={`${stats?.total ? Math.round(((stats?.completed ?? 0) / stats.total) * 100) : 0}% of total`}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              label="Unpaid"
              value={stats?.unpaid ?? 0}
              sub="awaiting payment"
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="Failed / Cancelled"
              value={(stats?.failed ?? 0) + (stats?.cancelled ?? 0)}
              sub="unsuccessful"
              icon={XCircle}
              color="red"
            />
            <StatCard
              label="Refunded"
              value={stats?.refunded ?? 0}
              sub="returned to customer"
              icon={Undo2}
              color="blue"
            />
          </>
        )}
      </div>

      {/* Revenue mini card */}
      {!isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Revenue
              </p>
              <p className="text-xs text-slate-400">from completed payments</p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {formatAmount(stats?.totalRevenue ?? 0)}
          </p>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by transaction ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-44 h-9 text-sm">
            <span>{statusFilter === "all" ? "All Status" : statusFilter}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUND_PENDING">Refund Pending</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
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
                  <SortableTh field="transactionId" label="Transaction" />
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Subscription Plan
                  </TableHead>
                  <SortableTh field="amount" label="Amount" />
                  <SortableTh field="createdAt" label="Date" />
                  <SortableTh field="status" label="Status" />
                  <TableHead className="text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <PaymentRowSkeleton key={i} />
                  ))
                ) : sortedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <CreditCard className="w-12 h-12 mb-4 opacity-30" />
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
                              No payments yet
                            </p>
                            <p className="text-sm mt-1">
                              Payments will appear here once transactions occur
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPayments.map((payment, index) => {
                    const planType =
                      typeof payment.subscription === "string"
                        ? undefined
                        : payment.subscription?.planType;

                    const { name: customerName, phone: customerPhone } =
                      getCustomerInfo(payment);

                    return (
                      <TableRow
                        key={payment._id}
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
                        {/* Transaction */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white shrink-0">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <p className="font-medium text-slate-900 dark:text-white font-mono text-sm truncate max-w-40">
                              {payment.transactionId}
                            </p>
                          </div>
                        </TableCell>

                        {/* Customer */}
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-32">
                              {customerName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-32">
                              {customerPhone}
                            </p>
                          </div>
                        </TableCell>

                        {/* Subscription plan */}
                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                          {planType ?? "—"}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                          {formatAmount(payment.amount)}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                          {formatDate(payment.createdAt)}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={payment.status} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex gap-1.5 justify-end">
                            {payment.status !== "PAID" && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:hover:bg-blue-950/30"
                                title="Resend payment link"
                                disabled={initiatingId === payment._id}
                                onClick={() => handleInitPayment(payment)}
                              >
                                <Send
                                  className={`w-3.5 h-3.5 ${initiatingId === payment._id
                                    ? "animate-pulse"
                                    : ""
                                    }`}
                                />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="View details"
                              onClick={() => openDetailsDialog(payment)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {
                              (userRole === "ADMIN" || userRole === "SUPER_ADMIN") &&
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="Update status"
                                onClick={() => openEditDialog(payment)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            }
                            {
                              (userRole === "ADMIN" || userRole === "SUPER_ADMIN") &&
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                title="Delete payment"
                                onClick={() => openDeleteDialog(payment)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
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

        {/* Footer count */}
        {!isLoading && sortedPayments.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sortedPayments.length}
              </span>{" "}
              payment{sortedPayments.length !== 1 ? "s" : ""}
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
      {viewingPayment && (
        <PaymentDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          item={viewingPayment}
        />
      )}

      {editingPayment && (
        <UpdatePaymentModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          item={editingPayment}
          onSuccess={refetch}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move payment{" "}
              <strong>{deletingPayment?.transactionId}</strong> to trash? This
              can be restored later.
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
