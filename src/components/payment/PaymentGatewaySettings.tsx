"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
    PaymentGateway,
    useGetPaymentSettingQuery,
    useUpdatePaymentSettingMutation,
} from "@/redux/features/payment/payment.api";

const GATEWAY_OPTIONS: {
    value: PaymentGateway;
    label: string;
    description: string;
}[] = [
        {
            value: "SURJOPAY",
            label: "SurjoPay",
            description: "Refunds are approved manually from the SurjoPay merchant portal.",
        },
        {
            value: "SSLCOMMERZ",
            label: "SSLCommerz",
            description: "Refunds are initiated automatically through the SSLCommerz API.",
        },
    ];

const GATEWAY_LABEL: Record<PaymentGateway, string> = {
    SURJOPAY: "SurjoPay",
    SSLCOMMERZ: "SSLCommerz",
};

const PaymentGatewaySetting = () => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<PaymentGateway | null>(null);

    const { data, isLoading, isFetching } = useGetPaymentSettingQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const [updateSetting, { isLoading: isSaving }] =
        useUpdatePaymentSettingMutation();

    const activeGateway = data?.data?.activeGateway;
    const updatedBy = data?.data?.updatedBy;
    const updatedAt = data?.data?.updatedAt;

    // Pre-select the current active gateway when the dialog opens
    const handleOpenChange = (value: boolean) => {
        setOpen(value);
        if (value) setSelected(activeGateway ?? null);
    };

    const currentSelection = selected ?? activeGateway ?? null;
    const isUnchanged = !currentSelection || currentSelection === activeGateway;

    const handleSave = async () => {
        if (!currentSelection || isUnchanged) return;

        try {
            await updateSetting({ activeGateway: currentSelection }).unwrap();
            toast.success(
                `Payment gateway switched to ${GATEWAY_LABEL[currentSelection]}`
            );
            setOpen(false);
        } catch (error: any) {
            toast.error(
                error?.data?.message || "Failed to update the payment gateway"
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger >
                <Button variant="outline" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Payment Gateway
                    {activeGateway && (
                        <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            {GATEWAY_LABEL[activeGateway]}
                        </span>
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="overflow-hidden border-white/10 bg-[#0b1226] p-0 text-white sm:max-w-md">
                {/* Gradient header, same as the payments table header */}
                <div className="bg-linear-to-r from-indigo-600 via-blue-600 to-sky-500 px-6 py-5">
                    <DialogHeader className="space-y-1.5 text-left">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
                            <CreditCard className="h-5 w-5" />
                            Payment Gateway
                        </DialogTitle>
                        <DialogDescription className="text-sm text-white/80">
                            New payments will be processed through the gateway you select.
                            Payments already in progress will complete on their original gateway.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="space-y-3 px-6 pt-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                        </div>
                    ) : (
                        <>
                            {GATEWAY_OPTIONS.map((option) => {
                                const isSelected = currentSelection === option.value;
                                const isActive = activeGateway === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => setSelected(option.value)}
                                        className={cn(
                                            "flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all",
                                            isSelected
                                                ? "border-indigo-500 bg-linear-to-r from-indigo-500/15 to-sky-500/10 shadow-[0_0_0_1px_rgba(99,102,241,0.4)]"
                                                : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/6"
                                        )}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{option.label}</span>
                                                {isActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-white/60">
                                                {option.description}
                                            </p>
                                        </div>

                                        <div
                                            className={cn(
                                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                                isSelected
                                                    ? "border-transparent bg-linear-to-br from-indigo-500 to-sky-500 text-white"
                                                    : "border-white/30"
                                            )}
                                        >
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                    </button>
                                );
                            })}

                            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/3 p-3 text-xs text-white/60">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                                <span>
                                    Existing payment links sent to customers will use the newly
                                    selected gateway when opened.
                                </span>
                            </div>

                            {updatedAt && (
                                <p className="text-xs text-white/50">
                                    Last updated: {new Date(updatedAt).toLocaleString()}
                                    {updatedBy?.name ? ` by ${updatedBy.name}` : ""}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 px-6 pb-6 pt-5 sm:gap-2 bg-blue-950/5">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isSaving}
                        className="border-white/15 bg-transparent text-white  hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isFetching || isUnchanged}
                        className="border-0 bg-linear-to-r from-indigo-600 to-sky-500 font-semibold text-white hover:from-indigo-500 hover:to-sky-400 disabled:opacity-50"
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentGatewaySetting;