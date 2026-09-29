"use client";

import { IOverviewData } from "@/types/subscription.types";
import { OverviewPanel } from "./OverviewPanel";
import { OverviewSkeleton } from "./OverviewSkeleton";
import { OverviewErrorState } from "./OverviewErrorState";
import { useUser } from "@/context/UserContext";

interface OverviewDashboardProps {
  data: IOverviewData | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function OverviewDashboard({ data, isLoading, isError, onRetry }: OverviewDashboardProps) {
  const user = useUser() as any;
  if (isLoading) return <OverviewSkeleton />;
  if (isError || !data) return <OverviewErrorState onRetry={onRetry} />;


  const isNotPermitted = user?.user?.role !== "AGENT" && user?.user?.role !== "AGENT_LEADER";
  const isAAManager = user?.user?.role === "A_A_MANAGER"

  const showLifetime = isNotPermitted && !isAAManager;

  console.log("showlifetime", showLifetime)

  return (
    <div className="space-y-6 pt-3">
      <div className={`grid grid-cols-1 ${showLifetime ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        <OverviewPanel label="Today" data={data.today} />
        <OverviewPanel label="This Month" data={data.month} />
        {
         showLifetime &&
          <OverviewPanel label="Lifetime" data={data.lifetime} />
        }
      </div>
    </div>
  );
}