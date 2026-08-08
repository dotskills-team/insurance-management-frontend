/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircle2, Clock, XCircle, Ban, ShieldCheck, ShieldAlert } from "lucide-react";
import { IDashboardSummary } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils/format-subscription";
import { cn } from "@/lib/utils";
import { useGetMeQuery } from "@/redux/features/user/user.api";

interface StatusChipProps {
  label: string;
  value: number;
  icon: typeof CheckCircle2;
  tone: "success" | "warning" | "muted" | "danger";
}

const TONE_STYLES = {
  success: {
    card: "bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    icon: "bg-emerald-500 text-white",
    value: "text-emerald-700 dark:text-emerald-400",
  },

  warning: {
    card: "bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: "bg-amber-500 text-white",
    value: "text-amber-700 dark:text-amber-400",
  },

  muted: {
    card: "bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700",
    icon: "bg-slate-500 text-white",
    value: "text-slate-700 dark:text-slate-300",
  },

  danger: {
    card: "bg-linear-to-br from-rose-50 to-red-100 dark:from-rose-950/40 dark:to-red-900/20 border-rose-200 dark:border-rose-800",
    icon: "bg-rose-500 text-white",
    value: "text-rose-700 dark:text-rose-400",
  },
} as const;

function StatusChip({ label, value, icon: Icon, tone }: StatusChipProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div
  className={cn(
    "flex items-center gap-3 rounded-xl border p-3.5 duration-500 hover:scale-105 transition-transform transform ease-in-out hover:shadow-xl hover:-translate-y-0.5",
    styles.card
  )}
>
     <div
  className={cn(
    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
    styles.icon
  )}
>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
       <p
  className={cn(
    "text-lg font-bold tabular-nums",
    styles.value
  )}
>
  {value.toLocaleString()}
</p>
      </div>
    </div>
  );
}

interface StatusBreakdownRowProps {
  summary: IDashboardSummary;
}



export function StatusBreakdownRow({ summary }: StatusBreakdownRowProps) {

  const items: any[] = [
  {
    label: "Active Subscriptions",
    value: summary.activeSubscriptions,
    icon: CheckCircle2,
    tone: "success",
  },
  {
    label: "Pending Subscriptions",
    value: summary.pendingSubscriptions,
    icon: Clock,
    tone: "warning",
  },
  {
    label: "Expired Subscriptions",
    value: summary.expiredSubscriptions,
    icon: XCircle,
    tone: "muted",
  },
  {
    label: "Cancelled Subscriptions",
    value: summary.cancelledSubscriptions,
    icon: Ban,
    tone: "danger",
  },
  {
    label: "Paid Subscriptions",
    value: summary.paidSubscriptions,
    icon: ShieldCheck,
    tone: "success",
  },
  {
    label: "Unpaid Subscriptions",
    value: summary.unpaidSubscriptions,
    icon: ShieldAlert,
    tone: "muted",
  },
].filter((item) => item.value > 0);

  const { data: me } = useGetMeQuery(undefined);
  const role = me?.data?.role;
  
  return (
   <div className={`grid ${role === "ADMIN" || role === "SUPER_ADMIN" || role === "MANAGER" ? "grid-cols-2 md:grid-cols-4 xl:grid-cols-5" : role === "AGENT_LEADER" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-2 xl:grid-cols-2"} gap-3`}>
  {items.map((item) => (
    <StatusChip
      key={item.label}
      label={item.label}
      value={item.value}
      icon={item.icon}
      tone={item.tone}
    />
  ))}
</div>
  );
}

export function AverageRevenueBanner({ summary }: { summary: IDashboardSummary }) {
  return (
    <div className="rounded-xl border border-border bg-linear-to-r from-slate-900 to-cyan-800 p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-cyan-100/70 uppercase tracking-wide">Average Revenue per Subscription</p>
        <p className="text-2xl font-bold text-white mt-1 tabular-nums">{formatCurrency(summary.averageRevenue)}</p>
      </div>
    </div>
  );
}