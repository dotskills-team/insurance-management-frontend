// // PaymentDetailsModal.tsx
// "use client";

// import {
//   CreditCard,
//   Hash,
//   Wallet,
//   Calendar,
//   ShieldCheck,
//   FileText,
//   User,
//   Phone,
//   CheckCircle2,
//   Clock,
//   XCircle,
//   Undo2,
// } from "lucide-react";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";

// import { IPayment } from "@/redux/features/payment/payment.api";

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// function Field({
//   icon: Icon,
//   label,
//   value,
//   mono = false,
// }: {
//   icon: React.ElementType;
//   label: string;
//   value?: string | number | null;
//   mono?: boolean;
// }) {
//   const isEmpty = value === undefined || value === null || value === "";
//   return (
//     <div className="flex items-start gap-3">
//       <div className="mt-0.5 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
//         <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
//       </div>
//       <div className="min-w-0">
//         <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
//           {label}
//         </p>
//         {isEmpty ? (
//           <p className="text-sm text-slate-400 italic">Not provided</p>
//         ) : (
//           <p
//             className={`text-sm text-slate-800 dark:text-slate-200 wrap-break-word ${
//               mono ? "font-mono" : ""
//             }`}
//           >
//             {value}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

// function SectionTitle({ children }: { children: React.ReactNode }) {
//   return (
//     <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
//       {children}
//     </p>
//   );
// }

// const formatDate = (iso?: string) => {
//   if (!iso) return "—";
//   return new Date(iso).toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const formatAmount = (amount: number) =>
//   new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount ?? 0);

// const STATUS_STYLES: Record<string, string> = {
//   UNPAID:
//     "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
//   PAID:
//     "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
//   COMPLETED:
//     "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
//   FAILED:
//     "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
//   CANCELLED:
//     "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
//   REFUNDED:
//     "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
// };

// const STATUS_ICON: Record<string, React.ElementType> = {
//   UNPAID: Clock,
//   PAID: CheckCircle2,
//   COMPLETED: CheckCircle2,
//   FAILED: XCircle,
//   CANCELLED: XCircle,
//   REFUNDED: Undo2,
// };

// function StatusBadge({ status }: { status: string }) {
//   const Icon = STATUS_ICON[status] ?? Clock;
//   return (
//     <Badge variant="outline" className={STATUS_STYLES[status] ?? STATUS_STYLES.UNPAID}>
//       <Icon className="w-3 h-3 mr-1" />
//       {status}
//     </Badge>
//   );
// }

// // ─── Props ────────────────────────────────────────────────────────────────────

// interface PaymentDetailsModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   item: IPayment;
// }

// // ─── Component ────────────────────────────────────────────────────────────────

// export function PaymentDetailsModal({
//   open,
//   onOpenChange,
//   item,
// }: PaymentDetailsModalProps) {
//   if (!item) return null;

//   const subscription =
//     typeof item.subscription === "string" ? undefined : item.subscription;

//   const customer =
//     subscription && typeof (subscription as any).customer !== "string"
//       ? (subscription as any).customer
//       : undefined;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-2xl max-h-[90vh] scrollbar-none overflow-y-auto p-0">

//         {/* ── Header ── */}
//         <div className="relative bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 px-6 pt-8 pb-6 rounded-t-lg">
//           <DialogHeader className="sr-only">
//             <DialogTitle>Payment Details</DialogTitle>
//             <DialogDescription>
//               Transaction and subscription information for {item.transactionId}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
//             {/* Icon Avatar */}
//             <div className="w-20 h-20 rounded-xl bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white shadow-md border-4 border-white dark:border-slate-800 shrink-0">
//               <CreditCard className="w-9 h-9" />
//             </div>

//             {/* Transaction ID + badges */}
//             <div className="text-center sm:text-left flex-1 min-w-0">
//               <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono truncate">
//                 {item.transactionId}
//               </h2>
//               <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
//                 {formatAmount(item.amount)}
//               </p>
//               <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
//                 <StatusBadge status={item.status} />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ── Body ── */}
//         <div className="px-6 py-5 space-y-6">

//           {/* Customer */}
//           {customer && (
//             <>
//               <div>
//                 <SectionTitle>Customer</SectionTitle>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <Field icon={User}  label="Name"  value={customer.name} />
//                   <Field icon={Phone} label="Phone" value={customer.phone} mono />
//                 </div>
//               </div>
//               <Separator />
//             </>
//           )}

//           {/* Transaction */}
//           <div>
//             <SectionTitle>Transaction</SectionTitle>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <Field icon={Hash}     label="Transaction ID" value={item.transactionId} mono />
//               <Field icon={Wallet}   label="Amount"         value={formatAmount(item.amount)} />
//               <Field icon={Calendar} label="Date"           value={formatDate(item.createdAt)} />
//             </div>
//           </div>

//           <Separator />

//           {/* Subscription */}
//           <div>
//             <SectionTitle>Subscription</SectionTitle>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <Field icon={FileText} label="Plan" value={subscription?.planType} />
//               <Field
//                 icon={Calendar}
//                 label="Duration"
//                 value={
//                   subscription?.durationInMonths
//                     ? `${subscription.durationInMonths} month(s)`
//                     : "Lifetime"
//                 }
//               />
//               <Field
//                 icon={Wallet}
//                 label="Plan Price"
//                 value={subscription?.price !== undefined ? formatAmount(subscription.price) : undefined}
//               />
//               <Field icon={ShieldCheck} label="Subscription Status" value={subscription?.status} />
//             </div>
//           </div>

//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }



// PaymentDetailsModal.tsx
"use client";

import {
  CreditCard,
  Hash,
  Wallet,
  Calendar,
  ShieldCheck,
  FileText,
  User,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  Undo2,
  Zap,
  MessageSquare,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { IPayment } from "@/redux/features/payment/payment.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  const isEmpty = value === undefined || value === null || value === "";
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
          {label}
        </p>
        {isEmpty ? (
          <p className="text-sm text-slate-400 italic">Not provided</p>
        ) : (
          <p
            className={`text-sm text-slate-800 dark:text-slate-200 wrap-break-word ${
              mono ? "font-mono" : ""
            }`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
      {children}
    </p>
  );
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount ?? 0);

const STATUS_STYLES: Record<string, string> = {
  UNPAID:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  PAID:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  COMPLETED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  FAILED:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  CANCELLED:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
  REFUND_PENDING:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  REFUNDED:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  UNPAID: Clock,
  PAID: CheckCircle2,
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
  CANCELLED: XCircle,
  REFUND_PENDING: Clock,
  REFUNDED: Undo2,
};

function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICON[status] ?? Clock;
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] ?? STATUS_STYLES.UNPAID}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IPayment;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentDetailsModal({
  open,
  onOpenChange,
  item,
}: PaymentDetailsModalProps) {
  if (!item) return null;

  const subscription =
    typeof item.subscription === "string" ? undefined : item.subscription;

  const customer =
    subscription && typeof (subscription as any).customer !== "string"
      ? (subscription as any).customer
      : undefined;

  const isSurjoPayPayment = !!item.spOrderId;
  const showRefundSection =
    item.status === "REFUND_PENDING" || item.status === "REFUNDED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] scrollbar-none overflow-y-auto p-0">

        {/* ── Header ── */}
        <div className="relative bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 px-6 pt-8 pb-6 rounded-t-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Transaction and subscription information for {item.transactionId}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Icon Avatar */}
            <div className="w-20 h-20 rounded-xl bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white shadow-md border-4 border-white dark:border-slate-800 shrink-0">
              <CreditCard className="w-9 h-9" />
            </div>

            {/* Transaction ID + badges */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono truncate">
                {item.transactionId}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {formatAmount(item.amount)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <StatusBadge status={item.status} />
                {isSurjoPayPayment && (
                  <Badge
                    variant="outline"
                    className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    SurjoPay
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-6">

          {/* Customer */}
          {customer && (
            <>
              <div>
                <SectionTitle>Customer</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={User}  label="Name"  value={customer.name} />
                  <Field icon={Phone} label="Phone" value={customer.phone} mono />
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Transaction */}
          <div>
            <SectionTitle>Transaction</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={Hash}     label="Transaction ID" value={item.transactionId} mono />
              <Field icon={Wallet}   label="Amount"         value={formatAmount(item.amount)} />
              <Field icon={Calendar} label="Date"           value={formatDate(item.createdAt)} />
              {isSurjoPayPayment && (
                <Field icon={Zap} label="SurjoPay Order ID" value={item.spOrderId} mono />
              )}
            </div>
          </div>

          <Separator />

          {/* Subscription */}
          <div>
            <SectionTitle>Subscription</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={FileText} label="Plan" value={subscription?.planType} />
              <Field
                icon={Calendar}
                label="Duration"
                value={
                  subscription?.durationInMonths
                    ? `${subscription.durationInMonths} month(s)`
                    : "Lifetime"
                }
              />
              <Field
                icon={Wallet}
                label="Plan Price"
                value={subscription?.price !== undefined ? formatAmount(subscription.price) : undefined}
              />
              <Field icon={ShieldCheck} label="Subscription Status" value={subscription?.status} />
            </div>
          </div>

          {/* Refund info — only when relevant */}
          {showRefundSection && (
            <>
              <Separator />
              <div>
                <SectionTitle>Refund</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {item.refundReason && (
                    <Field icon={MessageSquare} label="Reason" value={item.refundReason} />
                  )}
                  {item.refundRequestedAt && (
                    <Field
                      icon={Clock}
                      label="Requested At"
                      value={formatDate(item.refundRequestedAt)}
                    />
                  )}
                  {item.refundedAt && (
                    <Field
                      icon={Undo2}
                      label="Refunded At"
                      value={formatDate(item.refundedAt)}
                    />
                  )}
                  {item.refundRefId && (
                    <Field icon={Hash} label="Refund Ref ID" value={item.refundRefId} mono />
                  )}
                </div>
                {item.status === "REFUND_PENDING" && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
                    {item.gateway === "SSLCOMMERZ"
                      ? "Awaiting confirmation from SSLCommerz. Search using the Refund Ref ID above."
                      : "Awaiting approval on the SurjoPay merchant portal. Search using the SurjoPay Order ID above."}
                  </p>
                )}
              </div>
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}