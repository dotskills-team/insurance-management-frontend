/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { useGetAllClaimsQuery } from "@/redux/features/claim/claim.api";
import { IClaim, ClaimStatus } from "@/types/claim.types";

import { PageHeader } from "../shared/PageHeader";
import { Pagination } from "../pagination/Pagination";
import { ViewToggle, ViewMode } from "../shared/dashboard/ViewToggle";
import { ClaimStatCard } from "./ClaimStatCard";
import { ClaimManagerCard } from "./ClaimManagerCard";
import { ClaimManagerTable, ClaimSortField, SortDir } from "./ClaimManagerTable";
import { ClaimDetailsModal } from "../claim/ClaimDetailsModal";
import { ReviewClaimModal } from "../claim/ReviewClaim";

const STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.PENDING]: "Pending",
  [ClaimStatus.APPROVED]: "Approved",
  [ClaimStatus.REJECTED]: "Rejected",
  [ClaimStatus.ALL]: "All",
};

export default function ClaimManagerOverview() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all");

  const { data, isLoading, isFetching, refetch } = useGetAllClaimsQuery({
    searchTerm: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="CS & Claim Executive Dashboard"
        description="Review, manage, and resolve customer claim submissions"
        breadcrumbs={[{ label: "CS & Claim Executive Dashboard" }]}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : (
          <>
            <ClaimStatCard
              label="Total Claims"
              value={stats?.total ?? 0}
              sub="in the system"
              icon={FileText}
              color="blue"
            />
            <ClaimStatCard
              label="Pending"
              value={stats?.pending ?? 0}
              sub="awaiting review"
              icon={Clock}
              color="amber"
            />
            <ClaimStatCard
              label="Approved"
              value={stats?.approved ?? 0}
              sub="claims approved"
              icon={CheckCircle2}
              color="emerald"
            />
            <ClaimStatCard
              label="Rejected"
              value={stats?.rejected ?? 0}
              sub="claims rejected"
              icon={XCircle}
              color="red"
            />
          </>
        )}
      </div>
    </div>
  );
}