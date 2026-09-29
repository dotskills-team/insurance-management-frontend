
"use client";

import { PieChart as PieChartIcon, CreditCard } from "lucide-react";
import { useGetDashboardOverviewQuery } from "@/redux/features/dashboard/dashboard.api";
import { KpiGrid } from "./KpiGrid";
import { StatusBreakdownRow, AverageRevenueBanner } from "./StatusBreakdownRow";
// import { CustomerDashboardOverview } from "./CustomerDashboardOverview";
import { RevenueChart } from "./RevenueChart";
import { StatusPieChart } from "./StatusPieChart";
import { TopPackagesList } from "./TopPackagesList";
import { PackagePerformanceTable } from "./PackagePerformanceTable";
import { RecentSubscriptionsTable } from "./RecentSubscriptionsTable";
import { RecentCustomersTable } from "./RecentCustomersTable";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardErrorState } from "./DashboardErrorState";
import { DashboardHeader } from "./DashboardHeader";
import { useGetMeQuery } from "@/redux/features/user/user.api";
import { ManagerDashboardContent } from "./ManagerDashboardContent";
import { CustomerDashboardOverview } from "./CustomerDashboardOverview";
import { OverviewDashboard } from "@/components/shared/overview/OverviewDashboard";

export function DashboardPageContent() {
  const { data: me, isLoading: isMeLoading } = useGetMeQuery();
  const role = me?.data.role ?? "";
  const isManager = role === "MANAGER";

  const { data, isLoading, isError, refetch } = useGetDashboardOverviewQuery(
    undefined,
    { skip: isMeLoading || isManager },
  );

  if (isMeLoading) return <DashboardSkeleton />;

  if (isManager) {
    return <ManagerDashboardContent />;
  }

  const isCustomer = role === "CUSTOMER";

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data?.data) return <DashboardErrorState onRetry={refetch} />;

  const dashboard = data.data;

  if (isCustomer) {
    return (
      <div className="space-y-6">
        <DashboardHeader role={role} onRefresh={refetch} />
        <CustomerDashboardOverview summary={dashboard.summary} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader role={role} onRefresh={refetch} />
      <KpiGrid summary={dashboard.summary} isCustomer={isCustomer} />
      <StatusBreakdownRow summary={dashboard.summary} />
      <AverageRevenueBanner summary={dashboard.summary} />

      <div>
        <h2 className="text-xl font-bold mb-4">Package Performance Overview</h2>
        <OverviewDashboard
          data={dashboard.overview}
          isLoading={false}
          isError={false}
          onRetry={refetch}
        />
      </div>
      <RevenueChart data={dashboard.revenueChart} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusPieChart
          title="Subscription Status"
          icon={PieChartIcon}
          data={dashboard.subscriptionStatusChart}
        />
        <StatusPieChart
          title="Payment Status"
          icon={CreditCard}
          data={dashboard.paymentStatusChart}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPackagesList items={dashboard.topPackages} />
        <PackagePerformanceTable items={dashboard.topPackages} />
      </div>

      <RecentSubscriptionsTable items={dashboard.recentSubscriptions} />
      <RecentCustomersTable items={dashboard.recentCustomers} />
    </div>
  );
}