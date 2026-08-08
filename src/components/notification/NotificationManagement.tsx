/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Bell,
  CheckCircle2,
  MailOpen,
  LayoutGrid,
  Check,
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
  useGetAllNotificationsQuery,
  useSoftDeleteNotificationMutation,
  useMarkAsReadMutation,
  INotification,
  NotificationType,
} from "@/redux/features/notification/notification.api";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Role } from "@/types/user.types";
import { NotificationDetailsModal } from "./NotificationDetailsModal";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "title" | "isRead" | "createdAt";
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

const getUserName = (user: INotification["user"]) =>
  typeof user === "string" ? user : user?.name;

const getUserPhone = (user: INotification["user"]) =>
  typeof user === "string" ? undefined : user?.phone;

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.SUBSCRIPTION_CREATED]: "Subscription Created",
  [NotificationType.PAYMENT_SUCCESS]: "Payment Success",
  [NotificationType.PAYMENT_FAILED]: "Payment Failed",
  [NotificationType.SUBSCRIPTION_EXPIRING]: "Subscription Expiring",
  [NotificationType.SUBSCRIPTION_EXPIRED]: "Subscription Expired",
  [NotificationType.GENERAL]: "General",
  [NotificationType.CLAIM]: "Claim",
};

const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  [NotificationType.SUBSCRIPTION_CREATED]:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  [NotificationType.PAYMENT_SUCCESS]:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  [NotificationType.PAYMENT_FAILED]:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  [NotificationType.SUBSCRIPTION_EXPIRING]:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  [NotificationType.SUBSCRIPTION_EXPIRED]:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  [NotificationType.GENERAL]:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
  [NotificationType.CLAIM]:
    "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-400",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NotificationRowSkeleton() {
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
  { gradient: string; iconWrap: string; shadow: string }
> = {
  violet: {
    gradient: "from-violet-600 to-violet-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-violet-900/25",
  },
  emerald: {
    gradient: "from-emerald-600 to-emerald-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-emerald-900/25",
  },
  slate: {
    gradient: "from-slate-600 to-slate-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-slate-900/25",
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

export default function NotificationManagement() {
  // ── filters ──
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── sort ──
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── modals ──
  const [viewingNotification, setViewingNotification] =
    useState<INotification | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingNotification, setDeletingNotification] =
    useState<INotification | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // ── API ──
  const { data, isLoading, refetch } = useGetAllNotificationsQuery({
    searchTerm: searchTerm || undefined,
    isRead: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const [softDeleteNotification, { isLoading: isDeleting }] =
    useSoftDeleteNotificationMutation();
  const [markAsRead, { isLoading: isMarking }] = useMarkAsReadMutation();

  // ── derived ──
  const notifications: INotification[] = data?.data ?? [];
  const stats = data?.stats;
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  // ── client sort ──
  const sortedNotifications = React.useMemo(() => {
    if (!sortField || !sortDir) return notifications;
    return [...notifications].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "title") {
        aVal = a.title ?? "";
        bVal = b.title ?? "";
      }
      if (sortField === "isRead") {
        aVal = String(a.isRead);
        bVal = String(b.isRead);
      }
      if (sortField === "createdAt") {
        aVal = a.createdAt ?? "";
        bVal = b.createdAt ?? "";
      }
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [notifications, sortField, sortDir]);

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
    setTypeFilter("all");
  };
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const openDetailsDialog = (n: INotification) => {
    setViewingNotification(n);
    setIsDetailsOpen(true);
  };
  const openDeleteDialog = (n: INotification) => {
    setDeletingNotification(n);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingNotification?._id) return;
    try {
      await softDeleteNotification(deletingNotification._id).unwrap();
      toast.success("Notification moved to trash");
      setIsDeleteOpen(false);
      setDeletingNotification(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete notification");
    }
  };

  const handleMarkAsRead = async (n: INotification) => {
    try {
      await markAsRead(n._id).unwrap();
      toast.success("Marked as read");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to mark as read");
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
        title="Notification Management"
        description="Manage notifications sent to users"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notification Management" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard/notifications/trash">
              <Button
                variant="default"
               className="group hover:cursor-pointer border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out">
              
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Trash</span>
              </Button>
            </Link>
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
              label="Total Notifications"
              value={stats?.total ?? 0}
              sub="All notifications"
              icon={LayoutGrid}
              color="violet"
            />
            <StatCard
              label="Read"
              value={stats?.read ?? 0}
              sub={`${stats?.total ? Math.round(((stats?.read ?? 0) / stats.total) * 100) : 0}% of total`}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              label="Unread"
              value={stats?.unread ?? 0}
              sub="Pending review"
              icon={MailOpen}
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
            placeholder="Search by user name or phone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | "true" | "false")}
        >
          <SelectTrigger className="w-40 h-9 text-sm">
            <span>
              {statusFilter === "all"
                ? "All Status"
                : statusFilter === "true"
                  ? "Read"
                  : "Unread"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Read</SelectItem>
            <SelectItem value="false">Unread</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter as any}
          onValueChange={(v) => setTypeFilter(v as "all" | NotificationType)}
        >
          <SelectTrigger className="w-48 h-9 text-sm">
            <span>
              {typeFilter === "all"
                ? "All Types"
                : NOTIFICATION_TYPE_LABELS[typeFilter]}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(NotificationType).map((t) => (
              <SelectItem key={t} value={t}>
                {NOTIFICATION_TYPE_LABELS[t]}
              </SelectItem>
            ))}
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
                  <SortableTh field="title" label="Notification" />
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Phone</TableHead>
                  <SortableTh field="createdAt" label="Sent" />
                  <SortableTh field="isRead" label="Status" />
                  <TableHead className="text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <NotificationRowSkeleton key={i} />
                  ))
                ) : sortedNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Bell className="w-12 h-12 mb-4 opacity-30" />
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
                              No notifications yet
                            </p>
                            <p className="text-sm mt-1">
                              Notifications sent to users will appear here
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedNotifications.map((notification, index) => (
                    <TableRow
                      key={notification._id}
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
                      {/* Title + message */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white shrink-0">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate max-w-52">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-52">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        {notification.type ? (
                          <Badge
                            variant="outline"
                            className={`whitespace-nowrap ${NOTIFICATION_TYPE_COLORS[notification.type]}`}
                          >
                            {NOTIFICATION_TYPE_LABELS[notification.type]}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* User */}
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                        {getUserName(notification.user) ?? "—"}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                        {getUserPhone(notification.user) ?? "—"}
                      </TableCell>

                      {/* Sent date */}
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                        {formatDate(notification.createdAt)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {notification.isRead ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                          >
                            <span className="h-1.5 w-1.5 rounded-full mr-1.5 inline-block bg-emerald-500" />
                            Read
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          >
                            <span className="h-1.5 w-1.5 rounded-full mr-1.5 inline-block bg-slate-400" />
                            Unread
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
                            onClick={() => openDetailsDialog(notification)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="Mark as read"
                              disabled={isMarking}
                              onClick={() => handleMarkAsRead(notification)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            title="Delete notification"
                            onClick={() => openDeleteDialog(notification)}
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
        {!isLoading && sortedNotifications.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sortedNotifications.length}
              </span>{" "}
              notification{sortedNotifications.length !== 1 ? "s" : ""}
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
      {viewingNotification && (
        <NotificationDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          item={viewingNotification}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move{" "}
              <strong>{deletingNotification?.title}</strong> to trash? This can
              be restored later.
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
