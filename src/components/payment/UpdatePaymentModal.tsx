
"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreditCard, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import {
  useUpdatePaymentMutation,
  useRequestSurjoPayRefundMutation,
  IPayment,
  PaymentStatus,
} from "@/redux/features/payment/payment.api";

// ─── Schema ───────────────────────────────────────────────────────────────────
// REFUNDED removed on purpose — backend no longer allows setting it directly
// through this generic endpoint. Refunds go through the dedicated flow below.

const updatePaymentSchema = z.object({
  status: z.enum(["UNPAID", "PAID", "FAILED", "CANCELLED"]),
});

type UpdatePaymentFormValues = z.infer<typeof updatePaymentSchema>;

interface UpdatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IPayment;
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  UNPAID: "bg-amber-500",
  PAID: "bg-emerald-500",
  COMPLETED: "bg-emerald-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-slate-400",
  REFUND_PENDING: "bg-orange-500",
  REFUNDED: "bg-blue-500",
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount ?? 0);

const SETTABLE_STATUSES: Exclude<PaymentStatus, "REFUNDED" | "REFUND_PENDING">[] = [
  "UNPAID",
  "PAID",
  "FAILED",
  "CANCELLED",
];

// ─── Component ────────────────────────────────────────────────────────────────

export function UpdatePaymentModal({
  open,
  onOpenChange,
  item,
  onSuccess,
}: UpdatePaymentModalProps) {
  const [updatePayment, { isLoading }] = useUpdatePaymentMutation();
  const [requestRefund, { isLoading: isRequestingRefund }] =
    useRequestSurjoPayRefundMutation();

  const [refundReason, setRefundReason] = useState("");

  const {
    setValue,
    watch,
    handleSubmit,
    reset,
  } = useForm<UpdatePaymentFormValues>({
    resolver: zodResolver(updatePaymentSchema) as any,
    defaultValues: {
      status: SETTABLE_STATUSES.includes(item.status as any)
        ? (item.status as UpdatePaymentFormValues["status"])
        : "UNPAID",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      status: SETTABLE_STATUSES.includes(item.status as any)
        ? (item.status as UpdatePaymentFormValues["status"])
        : "UNPAID",
    });
    setRefundReason("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const selectedStatus = watch("status");

  // Older payments have no gateway field -> SurjoPay
  const isSSLPayment = item.gateway === "SSLCOMMERZ";
  const gatewayLabel = isSSLPayment ? "SSLCommerz" : "SurjoPay";
  const isEligibleForRefund =
    item.status === "PAID" && (isSSLPayment || !!item.spOrderId);
  const isRefundPending = item.status === "REFUND_PENDING";
  const isAlreadyRefunded = item.status === "REFUNDED";

  const handleClose = () => {
    onOpenChange(false);
  };

  const onSubmit = async (data: UpdatePaymentFormValues) => {
    try {
      await updatePayment({ id: item._id, data: { status: data.status } }).unwrap();
      toast.success("Payment status updated successfully!");
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update payment status");
    }
  };

  const handleRequestRefund = async () => {
    try {
      const res = await requestRefund({ id: item._id, reason: refundReason || undefined }).unwrap();
      if (res.data?.status === "REFUNDED") {
        toast.success("Payment refunded successfully!");
      } else {
        toast.success(
          isSSLPayment
            ? "Refund initiated through SSLCommerz — status will update automatically once confirmed."
            : "Refund requested. Approve it on the SurjoPay merchant portal — status will update automatically once confirmed."
        );
      }
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to request refund");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => { if (!val) handleClose(); }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] scrollbar-none overflow-y-auto p-6">
        <DialogHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="w-12 h-12 rounded-xl from-violet-500 to-purple-600 flex items-center justify-center shadow-md mb-1">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-widest uppercase">
            Update Payment
          </DialogTitle>
          <DialogDescription className="text-[#96999A] text-sm tracking-wide">
            Manually update this payment&apos;s status
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* ── Read-only info ── */}
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
            Transaction Info
          </p>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-sm text-muted-foreground">Transaction ID</span>
              <span className="text-sm font-medium text-foreground">{item.transactionId}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium text-foreground">{formatAmount(item.amount)}</span>
            </div>
          </div>
        </div>

        {/* ── Refund pending / already refunded notices ── */}
        {isRefundPending && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 p-3 text-sm text-orange-700 dark:text-orange-400">
            A refund has already been requested for this payment and is awaiting
            {isSSLPayment ? " confirmation from SSLCommerz" : " approval on the SurjoPay portal"}.
            Status will update automatically once confirmed.
          </div>
        )}
        {isAlreadyRefunded && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-400">
            This payment has already been refunded.
          </div>
        )}

        <Separator />

        {/* ── Generic status update form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold tracking-widest uppercase">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) =>
                setValue("status", v as UpdatePaymentFormValues["status"], { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className={`h-2 w-2 rounded-full inline-block ${STATUS_DOT[selectedStatus] ?? STATUS_DOT.UNPAID}`}
                  />
                  {selectedStatus}
                </span>
              </SelectTrigger>
              <SelectContent>
                {SETTABLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full inline-block ${STATUS_DOT[s]}`} />
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              Changing to Completed / Failed / Cancelled will also update the
              linked subscription&apos;s status. Refunds are handled separately below.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || selectedStatus === item.status}
            className="group hover:cursor-pointer border-indigo-600 text-white bg-indigo-700 hover:bg-indigo-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out w-full"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Update Payment
              </span>
            )}
          </Button>
        </form>

        {/* ── Refund request section ── */}
        {isEligibleForRefund && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400">
                Refund ({gatewayLabel})
              </p>
              <p className="text-xs text-slate-400">
                {isSSLPayment
                  ? "This will send a full refund request to SSLCommerz through its API. The payment may be refunded immediately; otherwise it stays refund-pending and updates to Refunded automatically once confirmed."
                  : "SurjoPay has no automated refund API. This will mark the payment as refund-pending — you must then approve the refund manually on the SurjoPay merchant portal. Status updates to Refunded automatically once confirmed."}
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">
                  Reason (optional)
                </Label>
                <Textarea
                  placeholder="Why is this payment being refunded?"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                type="button"
                onClick={handleRequestRefund}
                disabled={isRequestingRefund}
                variant="outline"
                className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-bold tracking-widest uppercase"
              >
                {isRequestingRefund ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Requesting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Undo2 className="h-4 w-4" />
                    Request Refund
                  </span>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}