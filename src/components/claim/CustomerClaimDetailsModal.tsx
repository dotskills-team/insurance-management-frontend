"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { IClaim } from "@/types/claim.types";
import { formatDate } from "@/lib/utils/format-subscription";
import { getClaimSubscriptionLabel } from "@/utils/format-claim";
import { ClaimStatusBadge } from "./ClaimStatusBadge";
import { ClaimDocumentHistory } from "./ClaimDocumentHistory";
import { PAYMENT_METHOD_LABELS } from "@/lib/utils/claim-labels";
import { PaymentMethod } from "@/types/claim.types";

interface ClaimDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IClaim;
}

export function CustomerClaimDetailsModal({ open, onOpenChange, item }: ClaimDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest text-sm">Claim Details</DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="space-y-4 pt-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <ClaimStatusBadge status={item.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subscription</span>
            <span className="font-medium text-foreground">{getClaimSubscriptionLabel(item.subscription)}</span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Claim Title</span>
            <p className="font-medium text-foreground">{item.claimTitle}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Description</span>
            <p className="text-foreground whitespace-pre-wrap">{item.description}</p>
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground">Receive Payment</span>
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <p className="font-medium text-foreground">{PAYMENT_METHOD_LABELS[item.paymentMethod]}</p>
              {(item.paymentMethod === PaymentMethod.BKASH || item.paymentMethod === PaymentMethod.NAGAD) && (
                <p className="text-foreground">Mobile: {item.paymentInfo?.mobileNumber ?? "—"}</p>
              )}
              {item.paymentMethod === PaymentMethod.BANK && (
                <div className="grid grid-cols-2 gap-2 text-foreground">
                  <span>Bank: {item.paymentInfo?.bankName ?? "—"}</span>
                  <span>Holder: {item.paymentInfo?.accountName ?? "—"}</span>
                  <span>Account: {item.paymentInfo?.accountNumber ?? "—"}</span>
                  <span>Routing: {item.paymentInfo?.routingNumber ?? "—"}</span>
                  <span className="col-span-2">Branch: {item.paymentInfo?.branchName ?? "—"}</span>
                </div>
              )}
            </div>
          </div>

          <ClaimDocumentHistory claim={item} />

          {item.adminNote && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Admin Note</span>
              <p className="text-foreground whitespace-pre-wrap">{item.adminNote}</p>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Submitted {formatDate(item.createdAt)}</span>
            {item.reviewedAt && <span>Reviewed {formatDate(item.reviewedAt)}</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}