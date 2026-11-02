"use client";

import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { IClaim, ClaimStatus } from "@/types/claim.types";
import { CLAIM_TITLE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils/claim-labels";
import { ClaimDocumentHistory } from "./ClaimDocumentHistory";

interface ClaimDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IClaim;
}

const STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.PENDING]: "Pending",
  [ClaimStatus.APPROVED]: "Approved",
  [ClaimStatus.REJECTED]: "Rejected",
  [ClaimStatus.ALL]: "All",
};

const STATUS_ICONS: Record<ClaimStatus, React.ElementType> = {
  [ClaimStatus.PENDING]: Clock,
  [ClaimStatus.APPROVED]: CheckCircle2,
  [ClaimStatus.REJECTED]: XCircle,
  [ClaimStatus.ALL]: FileText,
};

const STATUS_COLORS: Record<ClaimStatus, string> = {
  [ClaimStatus.PENDING]:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  [ClaimStatus.APPROVED]:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  [ClaimStatus.REJECTED]:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  [ClaimStatus.ALL]:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-400",
};

const getCustomerName = (claim: IClaim) =>
  typeof claim.customer === "object" ? claim.customer.name : "—";

const getCustomerPhone = (claim: IClaim) =>
  typeof claim.customer === "object" ? claim.customer.phone : undefined;

const getReviewerName = (claim: IClaim) =>
  typeof claim.reviewedBy === "object" ? claim.reviewedBy.name : undefined;

const formatDate = (iso?: string | Date) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ClaimDetailsModal({
  open,
  onOpenChange,
  item,
}: ClaimDetailsModalProps) {
  const StatusIcon = STATUS_ICONS[item.status];
console.log("claim item:", item)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md mb-1">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-widest uppercase">
            Claim Details
          </DialogTitle>
          <DialogDescription className="text-[#96999A] text-sm tracking-wide">
            Full information about this claim
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-5 pt-1">
          {/* ── Status ── */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400">
              Status
            </p>
            <Badge variant="outline" className={STATUS_COLORS[item.status]}>
              <StatusIcon className="w-3 h-3 mr-1.5" />
              {STATUS_LABELS[item.status]}
            </Badge>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
              Claim
            </p>
            <p className="font-medium text-sm text-slate-900 dark:text-white">
              {CLAIM_TITLE_LABELS[item.claimTitle]}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">
              {item.description}
            </p>
          </div>

          <Separator />

          {/* ── Payment Info ── */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
              Receive Payment
            </p>
            <div className="rounded-lg bg-slate-50/60 dark:bg-slate-800/30 p-3 space-y-1.5">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {PAYMENT_METHOD_LABELS[item.paymentMethod]}
              </p>
              {(item.paymentMethod === "BKASH" ||
                item.paymentMethod === "NAGAD") && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Mobile: {item.paymentInfo?.mobileNumber ?? "—"}
                </p>
              )}
              {item.paymentMethod === "BANK" && (
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span>Bank: {item.paymentInfo?.bankName ?? "—"}</span>
                  <span>Holder: {item.paymentInfo?.accountName ?? "—"}</span>
                  <span>Account: {item.paymentInfo?.accountNumber ?? "—"}</span>
                  <span>Routing: {item.paymentInfo?.routingNumber ?? "—"}</span>
                  <span className="col-span-2">
                    Branch: {item.paymentInfo?.branchName ?? "—"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* ── Customer & Dates ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3" /> Customer
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {getCustomerName(item)}
              </p>
              {getCustomerPhone(item) && (
                <p className="text-xs text-slate-400">
                  {getCustomerPhone(item)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Submitted
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {formatDate(item.createdAt)}
              </p>
            </div>
          </div>

          {/* ── Documents (date-wise history) ── */}
          <ClaimDocumentHistory claim={item} />

          {/* ── Review Info (only if reviewed) ── */}
          {item.status !== ClaimStatus.PENDING && (
            <>
              <Separator />
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">
                  Review
                </p>
                {item.adminNote && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {item.adminNote}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  {getReviewerName(item) && (
                    <span>
                      Reviewed by:{" "}
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {getReviewerName(item)}
                      </span>
                    </span>
                  )}
                  {item.reviewedAt && (
                    <span>{formatDate(item.reviewedAt)}</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
