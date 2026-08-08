"use client";

import { History } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IRecentSubscription } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils/format-subscription";
import { formatDate, getInitials } from "@/utils/format-dashboard";
import { PaymentStatus, SubscriptionStatus } from "@/types/subscription.types";
import { PaymentStatusBadge } from "@/components/shared/subscriptions/PaymentStatusBadge";
import { SubscriptionStatusBadge } from "@/components/shared/subscriptions/SubscriptionStatusBadge";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { SectionEmptyState } from "./SectionEmptyState";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RecentSubscriptionsTableProps {
  items: IRecentSubscription[];
}

export function RecentSubscriptionsTable({
  items,
}: RecentSubscriptionsTableProps) {
  return (
    <DashboardSectionCard title="Recent Subscriptions" icon={History}>
      {items.length === 0 ? (
        <SectionEmptyState message="No recent subscriptions." />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table className="min-w-[1100px]">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-none bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:bg-transparent">
                  <TableHead className="font-semibold text-white">
                    Customer
                  </TableHead>
                  <TableHead className="font-semibold text-white">
                    Package
                  </TableHead>
                  <TableHead className="font-semibold text-white">
                    Amount
                  </TableHead>
                  <TableHead className="font-semibold text-white">
                    Payment
                  </TableHead>
                  <TableHead className="font-semibold text-white">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-white">
                    Agent
                  </TableHead>
                  <TableHead className="font-semibold text-white whitespace-nowrap">
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((sub, index) => (
                  <TableRow
                    key={sub._id}
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
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={sub.customerPicture}
                            alt={sub.customerName}
                          />
                          <AvatarFallback className="bg-linear-to-br from-indigo-500 via-blue-500 to-cyan-500 text-white text-xs font-bold">
                            {getInitials(sub.customerName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate max-w-32">
                            {sub.customerName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-32">
                            {sub.customerPhone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {sub.packageName}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(sub.amount)}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge
                        status={sub.paymentStatus as PaymentStatus}
                      />
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge
                        status={sub.subscriptionStatus as SubscriptionStatus}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                        {sub.agentName}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(sub.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </DashboardSectionCard>
  );
}
