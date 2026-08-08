"use client";

import React from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IsActive, IUser } from "@/types/user.types";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { AgentActions } from "./AgentActions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface AgentTableProps {
  agents: IUser[];
  isLoading: boolean;
  onViewDetails: (agentId: string) => void;
  onViewCustomers?: (agentId: string) => void;
  onEdit?: (agentId: string) => void;
  onToggleBlock?: (agentId: string, isBlocked: boolean) => void;
  onDelete: (agentId: string) => void;
}

// ── status → left-accent + subtle row tint, brand-consistent (emerald/blue palette) ──
const STATUS_ROW_ACCENT: Record<IsActive, string> = {
  [IsActive.ACTIVE]: "border-l-4 border-l-emerald-500",

  [IsActive.INACTIVE]: "border-l-4 border-l-amber-500",
  [IsActive.CREATED]: "border-l-4 border-l-slate-400",

  [IsActive.BLOCKED]: "border-l-4 border-l-rose-500",

  [IsActive.ALL]: "border-l-4 border-l-slate-400",
};

export function AgentTable({
  agents,
  isLoading,
  onViewDetails,
  // onViewCustomers,
  // onEdit,
  onDelete,
}: AgentTableProps) {
  // const router = useRouter();
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                Customers
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <ScrollArea className="w-full whitespace-nowrap">
        <Table className="min-w-[1050px]">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-none bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
              <TableHead className="text-white font-semibold">Agent</TableHead>

              <TableHead className="text-white font-semibold">Agent ID</TableHead>

              <TableHead className="text-white font-semibold">Contact</TableHead>

              <TableHead className="text-white font-semibold">
                Customers
              </TableHead>

              <TableHead className="text-white font-semibold">
                Last Login
              </TableHead>

              <TableHead className="text-white font-semibold">Joined</TableHead>

              <TableHead className="text-white font-semibold">Status</TableHead>

              <TableHead className="text-right text-white font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent, index) => {
              const status = agent?.isActive ?? IsActive.ALL;
              return (
                <TableRow
                  key={agent._id}
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

                ${STATUS_ROW_ACCENT[status]}
                `}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={agent.picture} alt={agent.name} />
                        <AvatarFallback className="bg-linear-to-br from-indigo-500 to-cyan-500 text-white text-xs font-bold">
                          {agent.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {agent.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-foreground">{agent?.employeeId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-foreground">{agent.phone}</p>
                      {agent.email && (
                        <p className="text-xs text-muted-foreground">
                          {agent.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">0</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {agent.lastLoginAt
                        ? format(new Date(agent.lastLoginAt), "MMM dd, yyyy")
                        : "Never"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(agent.createdAt || ""), "MMM dd, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AgentStatusBadge status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AgentActions
                      agentId={agent._id as string}
                      agentStatus={status}
                      onViewDetails={() => onViewDetails(agent._id as string)}
                      // onViewCustomers={() => onViewCustomers(agent._id as string)}
                      // onEdit={() => {
                      //   router.push(`/agent-leader/my-agents/${agent._id}/edit`);
                      // }}
                      // onToggleBlock={() =>
                      //   onToggleBlock(
                      //     agent._id as string,
                      //     agent.isActive ?? IsActive.BLOCKED,
                      //   )
                      // }
                      onDelete={() => onDelete(agent._id as string)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
