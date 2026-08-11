/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useDeleteUserMutation,
  useGetMyAgentsQuery,
} from "@/redux/features/user/user.api";
import { toast } from "sonner";
import { IAgentFilters } from "@/types/agent-leader";

import { PageHeader } from "@/components/shared/PageHeader";
import { ViewToggle, ViewMode } from "@/components/shared/dashboard/ViewToggle";
import { AgentStatsCards } from "./AgentStatsCards";
import { AgentFilters } from "./AgentFilters";
import { AgentTable } from "./AgentTable";
import { AgentCard, AgentCardSkeleton } from "./AgentCard";
import { AgentDetailsModal } from "./AgentDetailsModal";
import { AgentEmptyState } from "./AgentEmptyState";
import { AgentPagination } from "./AgentPagination";
import { DeleteAgentDialog } from "./DeleteAgentDialog";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IUser } from "@/types/user.types";
import { CreateAgentModal } from "./AgentForm";
import { UpdateAgentModal } from "./UpdateAgent";

export function MyAgentsPage() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [filters, setFilters] = useState<IAgentFilters>({
    searchTerm: "",
    status: "all",
    sortBy: "newest",
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    agentId: string;
    agentName: string;
  }>({
    isOpen: false,
    agentId: "",
    agentName: "",
  });

  // ── view mode: table (default) or grid ──
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // ── view-details modal ──
  const [viewingAgent, setViewingAgent] = useState<IUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Build query params
  const queryParams = {
    page,
    limit,
    searchTerm: filters.searchTerm,
    isActive: filters.status !== "all" ? filters.status : undefined,
    sort:
      filters.sortBy === "newest"
        ? "-createdAt"
        : filters.sortBy === "oldest"
          ? "createdAt"
          : filters.sortBy === "name-asc"
            ? "name"
            : "-name",
    startDate: filters.startDate,
    endDate: filters.endDate,
  };

  const { data, isLoading, isFetching, error, refetch } = useGetMyAgentsQuery(queryParams);
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [editingAgent, setEditingAgent] = useState<IUser | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // replace handleEdit stub with:
  const handleEdit = useCallback((agent: IUser) => {
    setEditingAgent(agent);
    setIsUpdateOpen(true);
  }, []);

  const hasFilters = Boolean(
    filters.searchTerm ||
    (filters.status && filters.status !== "all") ||
    filters.startDate ||
    filters.endDate,
  );

  const handleFiltersChange = useCallback((newFilters: IAgentFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      status: "all",
      sortBy: "newest",
    });
    setPage(1);
  }, []);

  const handleViewCustomers = useCallback(
    (agentId: string) => {
      router.push(`/agent-leader/my-agents/${agentId}/customers`);
    },
    [router],
  );

  // ── opens the details modal instead of navigating to a new page ──
  const handleViewDetails = useCallback(
    (agentId: string) => {
      const agent = data?.data?.find((a) => a._id === agentId);
      if (agent) {
        setViewingAgent(agent);
        setIsDetailsOpen(true);
      }
    },
    [data?.data],
  );

  const handleToggleBlock = useCallback(
    (agentId: string, isBlocked: boolean) => {
      toast.info(`${isBlocked ? "Unblock" : "Block"} agent: ${agentId}`);
    },
    [],
  );

  const handleDeleteClick = (agentId: string, agentName: string) => {
    setDeleteDialog({
      isOpen: true,
      agentId,
      agentName,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(deleteDialog.agentId).unwrap();

      toast.success("Agent moved to trash successfully.");

      setDeleteDialog({
        isOpen: false,
        agentId: "",
        agentName: "",
      });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to move agent to trash.");
    }
  };

  return (
    <div className="space-y-6">
      {/* <DashboardHeroBanner
        title="My Agents"
        description="Manage your assigned insurance agents, monitor their activity, customer growth and performance."
        onRefresh={refetch}
        isRefreshing={isFetching}
      /> */}

      {/* Header */}
      <PageHeader
        title="My Agents"
        description="Manage your assigned insurance agents, monitor their activity, customer growth and performance."
        breadcrumbs={[
          { label: "Dashboard", href: "/agent-leader/dashboard" },
          { label: "Team Management" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          variant="default"
          onClick={() => router.push("/agent-leader/dashboard/my-agents/trash")}
          className="group hover:cursor-pointer border-rose-600 text-white bg-rose-700 hover:bg-rose-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 transition-transform ease-in-out flex gap-2 items-center"
        >
          <Trash2 className="h-4 w-4 group-hover:rotate-6 transition-transform duration-300" />
          Trash
        </Button>
        {/* <CreateAgentModal onSuccess={refetch} /> */}
      </div>

      {/* Stats Cards */}
      <AgentStatsCards stats={data?.stats} isLoading={isLoading} />

      <AgentFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* ── Section header: count + view toggle ── */}
      {data?.data && data.data.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isLoading
              ? "Loading agents…"
              : `${data?.meta?.total ?? data.data.length} agent${(data?.meta?.total ?? data.data.length) !== 1 ? "s" : ""}`}
          </p>
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      )}

      {/* Table or Empty State */}
      {data?.data && data.data.length > 0 ? (
        <>
          {viewMode === "table" ? (
            <AgentTable
              agents={data.data}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onEdit={(agentId) => {
                const agent = data.data.find((a) => a._id === agentId);
                if (agent) handleEdit(agent);
              }}
              onToggleBlock={handleToggleBlock}
              // onDelete={(agentId) => {
              //   const agent = data.data.find((a) => a._id === agentId);
              //   if (agent) handleDeleteClick(agentId, agent.name);
              // }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <AgentCardSkeleton key={i} />)
                : data.data.map((agent) => (
                    <AgentCard
                      key={agent._id}
                      agent={agent}
                      onViewDetails={handleViewDetails}
                      onDelete={(agentId) => {
                        const found = data.data.find((a) => a._id === agentId);
                        if (found) handleDeleteClick(agentId, found.name);
                      }}
                    />
                  ))}
            </div>
          )}

          {editingAgent && (
            <UpdateAgentModal
              open={isUpdateOpen}
              onOpenChange={setIsUpdateOpen}
              item={editingAgent}
              onSuccess={refetch}
            />
          )}

          <AgentDetailsModal
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            item={viewingAgent}
          />

          <AgentPagination
            meta={data.meta}
            currentPage={page}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </>
      ) : (
        <AgentEmptyState
          hasFilters={hasFilters}
          onAddAgent={() => router.push("/agent-leader/my-agents/create")}
          onClearFilters={hasFilters ? handleResetFilters : undefined}
        />
      )}

      {/* Error State */}
      {Boolean(error) && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p>Failed to load agents. Please try again.</p>
        </div>
      )}

      {/* Delete Dialog */}
      <DeleteAgentDialog
        isOpen={deleteDialog.isOpen}
        agentName={deleteDialog.agentName}
        onConfirm={handleDeleteConfirm}
        onCancel={() =>
          setDeleteDialog({ isOpen: false, agentId: "", agentName: "" })
        }
        isLoading={isDeleting}
      />
    </div>
  );
}