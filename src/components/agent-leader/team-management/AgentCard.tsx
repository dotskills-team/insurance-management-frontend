"use client";

import { format } from "date-fns";
import { Eye, Trash2, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IsActive, IUser } from "@/types/user.types";
import { AgentStatusBadge } from "./AgentStatusBadge";

interface AgentCardProps {
  agent: IUser;
  onViewDetails: (agentId: string) => void;
  onDelete: (agentId: string) => void;
}

const STATUS_TOP_ACCENT: Record<IsActive, string> = {
  [IsActive.ACTIVE]: "bg-emerald-500",
  [IsActive.INACTIVE]: "bg-slate-300 dark:bg-slate-600",
  [IsActive.CREATED]: "bg-slate-300 dark:bg-slate-600",
  [IsActive.BLOCKED]: "bg-red-500",
  [IsActive.ALL]: "bg-slate-300 dark:bg-slate-600",
};

const STATUS_CARD_TINT: Record<IsActive, string> = {
  [IsActive.ACTIVE]: "",
  [IsActive.INACTIVE]: "",
  [IsActive.CREATED]: "",
  [IsActive.BLOCKED]: "bg-red-50/30 dark:bg-red-950/10",
  [IsActive.ALL]: "",
};

export function AgentCard({ agent, onViewDetails, onDelete }: AgentCardProps) {
  const status = agent?.isActive ?? IsActive.ALL;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-emerald-200 dark:hover:ring-emerald-900 overflow-hidden ${STATUS_CARD_TINT[status]}`}
    >
      {/* ── status accent bar ── */}
      <div className={`h-1 w-full ${STATUS_TOP_ACCENT[status]}`} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-11 w-11 ring-2 ring-emerald-50 dark:ring-emerald-950">
            <AvatarImage src={agent.picture} alt={agent.name} />
            <AvatarFallback className="bg-linear-to-br from-emerald-500 to-blue-600 text-white text-xs font-bold">
              {agent.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {agent.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {agent?.employeeId ?? "—"}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <AgentStatusBadge status={status} />
        </div>
      </div>

      {/* ── Details ── */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-3 px-4 pb-4 text-sm">
        <div className="col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Contact
          </p>
          <p className="text-slate-700 dark:text-slate-300 truncate">{agent.phone}</p>
          {agent.email && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {agent.email}
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Customers
          </p>
          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
            <UserCog className="w-3.5 h-3.5 text-slate-400 shrink-0" />0
          </span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Last Login
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            {agent.lastLoginAt ? (
              format(new Date(agent.lastLoginAt), "MMM dd, yyyy")
            ) : (
              <span className="text-slate-300 dark:text-slate-600 italic text-xs">Never</span>
            )}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Joined
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            {agent.createdAt ? format(new Date(agent.createdAt), "MMM dd, yyyy") : "—"}
          </p>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mt-auto flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 px-3 py-2.5 bg-slate-50/60 dark:bg-slate-800/30">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
          title="View details"
          onClick={() => onViewDetails(agent._id as string)}
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
        {/* <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 ml-auto transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
          title="Delete agent"
          onClick={() => onDelete(agent._id as string)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button> */}
      </div>
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-3">
        <Skeleton className="w-11 h-11 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex gap-1.5 border-t border-slate-100 dark:border-slate-800 px-3 py-2.5">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
      </div>
    </div>
  );
}