import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  sub?: string;
color?: "emerald" | "blue" | "violet" | "amber" | "cyan" | "rose";
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
  color = "cyan",
}: KpiCardProps) {
const COLORS = {
  emerald: {
    bg: "bg-linear-to-br from-emerald-950 via-green-950 to-emerald-900",
    icon: "bg-emerald-500 text-white",
    value: "text-emerald-100",
    border: "hover:border-emerald-800",
    glow: "group-hover:shadow-emerald-500/20",
    blob: "bg-emerald-500/10",
  },

  blue: {
    bg: "bg-linear-to-br from-blue-950 via-indigo-950 to-blue-900",
    icon: "bg-blue-500 text-white",
    value: "text-blue-100",
    border: "hover:border-blue-800",
    glow: "group-hover:shadow-blue-500/20",
    blob: "bg-blue-500/10",
  },

  violet: {
    bg: "bg-linear-to-br from-violet-950 via-purple-950 to-violet-900",
    icon: "bg-violet-500 text-white",
    value: "text-violet-100",
    border: "hover:border-violet-800",
    glow: "group-hover:shadow-violet-500/20",
    blob: "bg-violet-500/10",
  },

  amber: {
    bg: "bg-linear-to-br from-amber-950 via-yellow-950 to-amber-900",
    icon: "bg-amber-500 text-white",
    value: "text-amber-100",
    border: "hover:border-amber-800",
    glow: "group-hover:shadow-amber-500/20",
    blob: "bg-amber-500/10",
  },

  cyan: {
    bg: "bg-linear-to-br from-cyan-950 via-slate-950 to-cyan-900",
    icon: "bg-cyan-500 text-white",
    value: "text-cyan-100",
    border: "hover:border-cyan-800",
    glow: "group-hover:shadow-cyan-500/20",
    blob: "bg-cyan-500/10",
  },

  rose: {
    bg: "bg-linear-to-br from-rose-950 via-red-950 to-rose-900",
    icon: "bg-rose-500 text-white",
    value: "text-rose-100",
    border: "hover:border-rose-800",
    glow: "group-hover:shadow-rose-500/20",
    blob: "bg-rose-500/10",
  },
} as const;
      
const styles = COLORS[color];

  return (
<div
  className={cn(
    "group relative overflow-hidden rounded-2xl border p-5 duration-500 hover:scale-105 transition-transform transform ease-in-out hover:shadow-xl hover:-translate-y-1",
    styles.bg,
    styles.border,
    styles.glow
  )}
>
     <div
  className={cn(
    "absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl transition-all duration-300",
    styles.blob
  )}
/>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white uppercase tracking-wide">
          {label}
        </span>
      <div
  className={cn(
    "h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
    styles.icon
  )}
>
         <Icon className="h-5 w-5" />
        </div>
      </div>
      <p
  className={cn(
    "text-2xl font-bold tabular-nums",
    styles.value
  )}
>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
