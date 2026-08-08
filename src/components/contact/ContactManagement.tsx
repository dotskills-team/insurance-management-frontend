/* eslint-disable react-hooks/static-components */
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
  Mail,
  CheckCircle2,
  MailOpen,
  LayoutGrid,
  Check,
  Reply,
  RefreshCw,
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
  useGetAllContactsQuery,
  useSoftDeleteContactMutation,
  useMarkAsReadMutation,
  useMarkAsRepliedMutation,
} from "@/redux/features/contact/contact.api";
import { IContact } from "@/types/contact.type";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { ContactDetailsModal } from "./ContactDetailsModal";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "name" | "isRead" | "createdAt";
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

function ContactRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
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

type StatColor = "violet" | "emerald" | "slate" | "blue";

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
  blue: {
    gradient: "from-blue-600 to-blue-700",
    iconWrap: "bg-white/15",
    shadow: "shadow-blue-900/25",
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

export default function ContactManagement() {
  // ── filters ──
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">(
    "all",
  );
  const [repliedFilter, setRepliedFilter] = useState<"all" | "true" | "false">(
    "all",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── sort ──
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // ── modals ──
  const [viewingContact, setViewingContact] = useState<IContact | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState<IContact | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [searchTerm, statusFilter, repliedFilter]);

  // ── API ──
  const queryParams: any = {
    ...(searchTerm && { searchTerm }),
    ...(statusFilter !== "all" && { isRead: statusFilter === "true" }),
    ...(repliedFilter !== "all" && { isReplied: repliedFilter === "true" }),
    page,
    limit,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  const { data, isLoading, refetch } = useGetAllContactsQuery(queryParams);

  const [softDeleteContact, { isLoading: isDeleting }] =
    useSoftDeleteContactMutation();
  const [markAsRead, { isLoading: isMarkingRead }] = useMarkAsReadMutation();
  const [markAsReplied, { isLoading: isMarkingReplied }] =
    useMarkAsRepliedMutation();

  // ── derived ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contacts: IContact[] = data?.data ?? [];
  const meta = data?.meta;
  const totalPage = meta?.totalPage ?? 1;

  // Calculate stats from contacts
  const stats = {
    total: meta?.total ?? 0,
    unread: contacts.filter((c) => !c.isRead).length,
    replied: contacts.filter((c) => c.isReplied).length,
  };

  const hasActiveFilters = statusFilter !== "all" || repliedFilter !== "all";
  const hasDateFilter = !!(startDate || endDate);

  // ── client sort ──
  const sortedContacts = React.useMemo(() => {
    if (!sortField || !sortDir) return contacts;
    return [...contacts].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "name") {
        aVal = a.name ?? "";
        bVal = b.name ?? "";
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
  }, [contacts, sortField, sortDir]);

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
    setRepliedFilter("all");
  };
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const openDetailsDialog = (c: IContact) => {
    setViewingContact(c);
    setIsDetailsOpen(true);
  };
  const openDeleteDialog = (c: IContact) => {
    setDeletingContact(c);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingContact?._id) return;
    try {
      await softDeleteContact(deletingContact._id).unwrap();
      toast.success("Contact moved to trash");
      setIsDeleteOpen(false);
      setDeletingContact(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete contact");
    }
  };

  const handleMarkAsRead = async (c: IContact) => {
    try {
      await markAsRead(c._id).unwrap();
      toast.success("Marked as read");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to mark as read");
    }
  };

  const handleMarkAsReplied = async (c: IContact) => {
    try {
      await markAsReplied(c._id).unwrap();
      toast.success("Marked as replied");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to mark as replied");
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
        title="Contact Management"
        description="Manage contact messages submitted by users"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Contact Management" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard/contacts/trash">
              <Button
                variant="default"
                className="group hover:cursor-pointer border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out"
              >
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

            {/* Refetch Button */}
            <Button
              variant="outline"
              className="h-9 gap-2"
              onClick={() => refetch()}
              disabled={isLoading}
              title="Refresh data"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
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
              label="Total Messages"
              value={stats?.total ?? 0}
              sub="All contact messages"
              icon={LayoutGrid}
              color="violet"
            />
            <StatCard
              label="Unread"
              value={stats?.unread ?? 0}
              sub="Pending review"
              icon={MailOpen}
              color="slate"
            />
            <StatCard
              label="Replied"
              value={stats?.replied ?? 0}
              sub={`${stats?.total ? Math.round(((stats?.replied ?? 0) / stats.total) * 100) : 0}% response rate`}
              icon={CheckCircle2}
              color="emerald"
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
          value={repliedFilter}
          onValueChange={(v) => setRepliedFilter(v as "all" | "true" | "false")}
        >
          <SelectTrigger className="w-44 h-9 text-sm">
            <span>
              {repliedFilter === "all"
                ? "All Replies"
                : repliedFilter === "true"
                  ? "Replied"
                  : "Not Replied"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Replies</SelectItem>
            <SelectItem value="true">Replied</SelectItem>
            <SelectItem value="false">Not Replied</SelectItem>
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
                  <SortableTh field="name" label="Contact" />
                  <TableHead className="whitespace-nowrap">Phone</TableHead>
                  <TableHead className="whitespace-nowrap">Subject</TableHead>
                  <SortableTh field="createdAt" label="Sent" />
                  <SortableTh field="isRead" label="Status" />
                  <TableHead className="whitespace-nowrap">Replied</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <ContactRowSkeleton key={i} />
                  ))
                ) : sortedContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Mail className="w-12 h-12 mb-4 opacity-30" />
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
                              No messages yet
                            </p>
                            <p className="text-sm mt-1">
                              Contact messages submitted by users will appear
                              here
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedContacts.map((contact, index) => (
                    <TableRow
                      key={contact._id}
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
                      {/* Name + email */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate max-w-52">
                              {contact.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-52">
                              {contact.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                        {contact.phone ?? "—"}
                      </TableCell>

                      {/* Subject */}
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                        <p className="truncate max-w-48">{contact.subject}</p>
                      </TableCell>

                      {/* Sent date */}
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                        {formatDate(contact.createdAt)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {contact.isRead ? (
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

                      {/* Replied */}
                      <TableCell>
                        {contact.isReplied ? (
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            <Reply className="w-3 h-3 mr-1" />
                            Replied
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                          >
                            Pending
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
                            onClick={() => openDetailsDialog(contact)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {!contact.isRead && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="Mark as read"
                              disabled={isMarkingRead}
                              onClick={() => handleMarkAsRead(contact)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {!contact.isReplied && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="Mark as replied"
                              disabled={isMarkingReplied}
                              onClick={() => handleMarkAsReplied(contact)}
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            title="Delete message"
                            onClick={() => openDeleteDialog(contact)}
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
        {!isLoading && sortedContacts.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sortedContacts.length}
              </span>{" "}
              message{sortedContacts.length !== 1 ? "s" : ""}
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
      {viewingContact && (
        <ContactDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          item={viewingContact}
          onMarkAsReplied={handleMarkAsReplied}
          isMarkingReplied={isMarkingReplied}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move the message from{" "}
              <strong>{deletingContact?.name}</strong> to trash? This can be
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
