"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IRecentCustomer } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils/format-subscription";
import { formatDate, getInitials } from "@/utils/format-dashboard";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { SectionEmptyState } from "./SectionEmptyState";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RecentCustomersTableProps {
  items: IRecentCustomer[];
}

export function RecentCustomersTable({ items }: RecentCustomersTableProps) {
  return (
    <DashboardSectionCard title="Recent Customers" icon={Users}>
      {items.length === 0 ? (
        <SectionEmptyState message="No recent customers." />
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
                    Phone
                  </TableHead>
                  <TableHead className="font-semibold text-white text-right">
                    Subscriptions
                  </TableHead>
                  <TableHead className="font-semibold text-white text-right">
                    Total Spent
                  </TableHead>
                  <TableHead className="font-semibold text-white">
                    Created By
                  </TableHead>
                  <TableHead className="font-semibold text-white whitespace-nowrap">
                    Joined
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((customer, index) => (
                  <TableRow
                    key={customer._id}
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
                            src={customer.picture}
                            alt={customer.name}
                          />
                          <AvatarFallback className="bg-linear-to-br from-indigo-500 via-blue-500 to-cyan-500 text-white text-xs font-bold">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium text-foreground truncate max-w-32">
                          {customer.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {customer.phone}
                    </TableCell>
                    <TableCell className="text-right text-sm text-foreground tabular-nums">
                      {customer.totalSubscriptions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-cyan-700 dark:text-cyan-400 tabular-nums">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-right inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 ml-4 mt-3 justify-center text-xs font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                      {customer.createdBy || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(customer.createdAt)}
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
