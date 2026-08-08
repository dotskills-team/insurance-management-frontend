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
    MessageSquare,
    LayoutGrid,
    CreditCard,
    ShieldAlert,
    Megaphone,
    Bell,
    KeyRound,
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
    useGetAllMessagesQuery,
    useSoftDeleteMessageMutation,
    IMessage,
    MessageType,
} from "@/redux/features/message/message.api";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { MessageDetailsModal } from "./MessageDetailsModal";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "phone" | "createdAt";
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

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
    [MessageType.SUBSCRIPTION]: "Subscription",
    [MessageType.PAYMENT]: "Payment",
    [MessageType.CLAIM]: "Claim",
    [MessageType.PROMOTIONAL]: "Promotional",
    [MessageType.GENERAL]: "General",
    [MessageType.OTP]: "OTP",
    [MessageType.SMS]: "SMS",
};

const MESSAGE_TYPE_COLORS: Record<MessageType, string> = {
    [MessageType.SUBSCRIPTION]:
        "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400",
    [MessageType.PAYMENT]:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
    [MessageType.CLAIM]:
        "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    [MessageType.PROMOTIONAL]:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
    [MessageType.GENERAL]:
        "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    [MessageType.OTP]:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400",
    [MessageType.SMS]:
        "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
};

const MESSAGE_TYPE_ICONS: Record<MessageType, React.ElementType> = {
    [MessageType.SUBSCRIPTION]: Bell,
    [MessageType.PAYMENT]: CreditCard,
    [MessageType.CLAIM]: ShieldAlert,
    [MessageType.PROMOTIONAL]: Megaphone,
    [MessageType.GENERAL]: MessageSquare,
    [MessageType.OTP]: KeyRound,
    [MessageType.SMS]: KeyRound,
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MessageRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </TableCell>
            {Array.from({ length: 3 }).map((_, i) => (
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

function StatCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-14 mb-1" />
            <Skeleton className="h-3 w-20" />
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

export default function MessageManagement() {
    // ── filters ──
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | MessageType>("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    // ── sort ──
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    // ── modals ──
    const [viewingMessage, setViewingMessage] = useState<IMessage | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [deletingMessage, setDeletingMessage] = useState<IMessage | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const { user } = useUser();

    useEffect(() => { setPage(1); }, [searchTerm, typeFilter]);

    // ── API ──
    const { data, isLoading, refetch } = useGetAllMessagesQuery({
        searchTerm: searchTerm || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        page,
        limit,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
    });

    const [softDeleteMessage, { isLoading: isDeleting }] = useSoftDeleteMessageMutation();

    // ── derived ──
    const messages: IMessage[] = data?.data ?? [];
    const stats = data?.stats;
    const meta = data?.meta;
    const totalPage = meta?.totalPage ?? 1;

    const hasActiveFilters = typeFilter !== "all";
    const hasDateFilter = !!(startDate || endDate);


    // ── client sort ──
    const sortedMessages = React.useMemo(() => {
        if (!sortField || !sortDir) return messages;
        return [...messages].sort((a, b) => {
            let aVal = "";
            let bVal = "";
            if (sortField === "phone") { aVal = a.phone ?? ""; bVal = b.phone ?? ""; }
            if (sortField === "createdAt") { aVal = a.createdAt ?? ""; bVal = b.createdAt ?? ""; }
            return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }, [messages, sortField, sortDir]);

                   const TOTAL_CARD_STYLE = {
  gradient: "from-violet-600 to-purple-700",
  iconWrap: "bg-white/15",
  shadow: "shadow-violet-900/25",
};

const MESSAGE_TYPE_CARD_STYLES: Record<MessageType, { gradient: string; iconWrap: string; shadow: string }> = {
  // example — adjust keys/colors to match your actual MessageType members
  SUBSCRIPTION: { gradient: "from-blue-600 to-blue-700", iconWrap: "bg-white/15", shadow: "shadow-blue-900/25" },
  PAYMENT: { gradient: "from-emerald-600 to-emerald-700", iconWrap: "bg-white/15", shadow: "shadow-emerald-900/25" },
  CLAIM: { gradient: "from-amber-500 to-amber-600", iconWrap: "bg-white/15", shadow: "shadow-amber-900/25" },
  PROMOTIONAL: { gradient: "from-indigo-500 to-indigo-600", iconWrap: "bg-white/15", shadow: "shadow-indigo-900/25" },
  OTP: { gradient: "from-green-500 to-green-600", iconWrap: "bg-white/15", shadow: "shadow-green-900/25" },
  SMS: { gradient: "from-yellow-500 to-yellow-600", iconWrap: "bg-white/15", shadow: "shadow-yellow-900/25" },
  GENERAL: { gradient: "from-slate-500 to-slate-600", iconWrap: "bg-white/15", shadow: "shadow-slate-900/25" },
};

    // ── handlers ──
    const handleSort = (field: SortField) => {
        if (sortField !== field) { setSortField(field); setSortDir("asc"); return; }
        if (sortDir === "asc") { setSortDir("desc"); return; }
        setSortField(null); setSortDir(null);
    };

    const clearFilters = () => { setTypeFilter("all"); };
    const clearDateFilter = () => { setStartDate(""); setEndDate(""); };

    const openDetailsDialog = (m: IMessage) => { setViewingMessage(m); setIsDetailsOpen(true); };
    const openDeleteDialog = (m: IMessage) => { setDeletingMessage(m); setIsDeleteOpen(true); };

    const handleDelete = async () => {
        if (!deletingMessage?._id) return;
        try {
            await softDeleteMessage(deletingMessage._id).unwrap();
            toast.success("Message moved to trash");
            setIsDeleteOpen(false);
            setDeletingMessage(null);
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to delete message");
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
                title="Message Management"
                description="View SMS messages sent to users"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Message Management" },
                ]}
                action={
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/dashboard/messages/trash"
                        >
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
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                {/* Date filter row */}
                <div className="sm:col-span-3 lg:col-span-7 flex flex-wrap items-center gap-3">
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
    <StatCardSkeleton />
    <StatCardSkeleton />
  </>
) : (
  <>
    <div
      className={`group relative overflow-hidden rounded-xl bg-linear-to-br ${TOTAL_CARD_STYLE.gradient} p-5 shadow-lg ${TOTAL_CARD_STYLE.shadow} transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl transition-opacity duration-300 group-hover:opacity-80" />
      <div className="relative flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white/80">Total</p>
        <div className={`p-2 rounded-lg ${TOTAL_CARD_STYLE.iconWrap} backdrop-blur-sm transition-transform duration-300 group-hover:scale-110`}>
          <LayoutGrid className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="relative text-2xl font-bold text-white tabular-nums">{stats?.total ?? 0}</p>
      <p className="relative text-xs mt-1 text-white/70">sent messages</p>
    </div>

    {Object.values(MessageType).map((type) => {
      const Icon = MESSAGE_TYPE_ICONS[type];
      const c = MESSAGE_TYPE_CARD_STYLES[type];
      return (
        <div
          key={type}
          className={`group relative overflow-hidden rounded-xl bg-linear-to-br ${c.gradient} p-5 shadow-lg ${c.shadow} transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl transition-opacity duration-300 group-hover:opacity-80" />
          <div className="relative flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white/80">{MESSAGE_TYPE_LABELS[type]}</p>
            <div className={`p-2 rounded-lg ${c.iconWrap} backdrop-blur-sm transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="relative text-2xl font-bold text-white tabular-nums">
            {stats?.byType?.[type] ?? 0}
          </p>
        </div>
      );
    })}
  </>
)}
            </div>

            {/* ── Search & Filters ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by phone or message..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Select
                    value={typeFilter as any}
                    onValueChange={(v) => setTypeFilter(v as "all" | MessageType)}
                >
                    <SelectTrigger className="w-48 h-9 text-sm">
                        <span>
                            {typeFilter === "all" ? "All Types" : MESSAGE_TYPE_LABELS[typeFilter]}
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.values(MessageType).map((t) => (
                            <SelectItem key={t} value={t}>
                                {MESSAGE_TYPE_LABELS[t]}
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
            <Table className="min-w-[1100px]">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-none bg-linear-to-r *:text-white from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                                <TableHead className="whitespace-nowrap">Message</TableHead>
                                <TableHead className="whitespace-nowrap">Type</TableHead>
                                <SortableTh field="phone" label="Phone" />
                                <SortableTh field="createdAt" label="Sent" />
                                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <MessageRowSkeleton key={i} />
                                ))
                            ) : sortedMessages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                            <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                                            {searchTerm || hasActiveFilters ? (
                                                <>
                                                    <p className="text-base font-medium">No results found</p>
                                                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-base font-medium">No messages yet</p>
                                                    <p className="text-sm mt-1">Sent SMS messages will appear here</p>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedMessages.map((msg, index) => (
                                    <TableRow
                                        key={msg._id}
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
                                        {/* Message */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white shrink-0">
                                                    <MessageSquare className="w-4 h-4" />
                                                </div>
                                                <p className="font-medium text-slate-900 dark:text-white truncate max-w-72">
                                                    {msg.message}
                                                </p>
                                            </div>
                                        </TableCell>

                                        {/* Type */}
                                        <TableCell>
                                            {msg.type ? (
                                                <Badge
                                                    variant="outline"
                                                    className={`whitespace-nowrap ${MESSAGE_TYPE_COLORS[msg.type]}`}
                                                >
                                                    {MESSAGE_TYPE_LABELS[msg.type]}
                                                </Badge>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>

                                        {/* Phone */}
                                        <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                                            {msg.phone ?? "—"}
                                        </TableCell>

                                        {/* Sent date */}
                                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                                            {formatDate(msg.createdAt)}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell>
                                            <div className="flex gap-1.5 justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="View details"
                                                    onClick={() => openDetailsDialog(msg)}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="Delete message"
                                                    onClick={() => openDeleteDialog(msg)}
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
                {!isLoading && sortedMessages.length > 0 && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Showing{" "}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {sortedMessages.length}
                            </span>{" "}
                            message{sortedMessages.length !== 1 ? "s" : ""}
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
            {viewingMessage && (
                <MessageDetailsModal
                    open={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                    item={viewingMessage}
                />
            )}

            {/* Delete confirm */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Move to Trash</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to move this message to{" "}
                            <strong>{deletingMessage?.phone}</strong> to trash? This can be
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