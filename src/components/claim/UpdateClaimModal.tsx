"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Edit2, ImagePlus, X, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useUpdateClaimMutation } from "@/redux/features/claim/claim.api";
import { ClaimTitle, IClaim, PaymentMethod } from "@/types/claim.types";
import { CLAIM_TITLE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils/claim-labels";

const paymentInfoSchema = z.object({
  mobileNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  branchName: z.string().optional(),
});

const updateClaimSchema = z
  .object({
    claimTitle: z.nativeEnum(ClaimTitle),
    description: z.string().min(10, "Description must be at least 10 characters"),
    paymentMethod: z.nativeEnum(PaymentMethod),
    paymentInfo: paymentInfoSchema,
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === PaymentMethod.BKASH || data.paymentMethod === PaymentMethod.NAGAD) {
      if (!data.paymentInfo.mobileNumber?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentInfo", "mobileNumber"], message: "Mobile number is required." });
      }
    }
    if (data.paymentMethod === PaymentMethod.BANK) {
      const b = data.paymentInfo;
      const requiredBankFields: Array<[keyof typeof b, string]> = [
        ["bankName", "Bank name is required."],
        ["accountName", "Account holder name is required."],
        ["accountNumber", "Account number is required."],
        ["routingNumber", "Routing number is required."],
        ["branchName", "Branch name is required."],
      ];
      for (const [field, message] of requiredBankFields) {
        if (!b[field]?.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentInfo", field], message });
        }
      }
    }
  });

type UpdateClaimFormValues = z.infer<typeof updateClaimSchema>;

interface UpdateClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IClaim;
  onSuccess?: () => void;
}

const MAX_ATTACHMENTS = 10;

export function UpdateClaimModal({ open, onOpenChange, item, onSuccess }: UpdateClaimModalProps) {
  const [updateClaim, { isLoading }] = useUpdateClaimMutation();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors },
  } = useForm<UpdateClaimFormValues>({
    resolver: zodResolver(updateClaimSchema),
    defaultValues: {
      claimTitle: item.claimTitle,
      description: item.description,
      paymentMethod: item.paymentMethod,
      paymentInfo: item.paymentInfo ?? {},
    },
  });

  const watchedClaimTitle = watch("claimTitle");
  const watchedPaymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (open) {
      reset({
        claimTitle: item.claimTitle,
        description: item.description,
        paymentMethod: item.paymentMethod,
        paymentInfo: item.paymentInfo ?? {},
      });
      setNewFiles([]);
      setNewPreviews([]);
    }
  }, [open, item, reset]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const combined = [...newFiles, ...selected].slice(0, MAX_ATTACHMENTS);
    setNewFiles(combined);
    setNewPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const handleRemoveFile = (idx: number) => {
    const next = newFiles.filter((_, i) => i !== idx);
    setNewFiles(next);
    setNewPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const handleClose = () => {
    setNewFiles([]);
    setNewPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const onSubmit = async (data: UpdateClaimFormValues) => {
    try {
      const formData = new FormData();
      formData.append("claimTitle", data.claimTitle);
      formData.append("description", data.description);
      formData.append("paymentMethod", data.paymentMethod);
      formData.append("paymentInfo", JSON.stringify(data.paymentInfo ?? {}));
      newFiles.forEach((file) => formData.append("attachments", file));

      await updateClaim({ id: item._id, data: formData }).unwrap();
      toast.success("Claim updated successfully");
      handleClose();
      onSuccess?.();
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err as { data?: { message?: string } }).data?.message ?? "Failed to update claim")
          : "Failed to update claim";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md mb-1">
            <Edit2 className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-widest uppercase">Edit Claim</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm tracking-wide">
            {item.status === "REJECTED"
              ? "Resubmitting will move this claim back to pending review."
              : "Update your claim details below"}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold tracking-widest uppercase">
              Claim Title <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedClaimTitle}
              onValueChange={(v) => setValue("claimTitle", v as ClaimTitle, { shouldValidate: true })}
            >
              <SelectTrigger className="h-9 text-sm w-full">
                <span>{watchedClaimTitle ? CLAIM_TITLE_LABELS[watchedClaimTitle] : "Select claim type"}</span>
              </SelectTrigger>
              <SelectContent>
                {Object.values(ClaimTitle).map((t) => (
                  <SelectItem key={t} value={t}>{CLAIM_TITLE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uc-desc" className="text-xs font-semibold tracking-widest uppercase">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea id="uc-desc" rows={4} {...register("description")} />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Receive Payment</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold tracking-widest uppercase">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedPaymentMethod}
                onValueChange={(v) => setValue("paymentMethod", v as PaymentMethod, { shouldValidate: true })}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <span>{watchedPaymentMethod ? PAYMENT_METHOD_LABELS[watchedPaymentMethod] : "Select a method"}</span>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentMethod).map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(watchedPaymentMethod === PaymentMethod.BKASH || watchedPaymentMethod === PaymentMethod.NAGAD) && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-semibold tracking-widest uppercase">
                  Mobile Number <span className="text-red-500">*</span>
                </Label>
                <Input placeholder="01XXXXXXXXX" {...register("paymentInfo.mobileNumber")} />
                {errors.paymentInfo?.mobileNumber && (
                  <p className="text-xs text-red-400">{errors.paymentInfo.mobileNumber.message}</p>
                )}
              </div>
            )}

            {watchedPaymentMethod === PaymentMethod.BANK && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold tracking-widest uppercase">Bank Name <span className="text-red-500">*</span></Label>
                  <Input {...register("paymentInfo.bankName")} />
                  {errors.paymentInfo?.bankName && <p className="text-xs text-red-400">{errors.paymentInfo.bankName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold tracking-widest uppercase">Account Holder Name <span className="text-red-500">*</span></Label>
                  <Input {...register("paymentInfo.accountName")} />
                  {errors.paymentInfo?.accountName && <p className="text-xs text-red-400">{errors.paymentInfo.accountName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold tracking-widest uppercase">Account Number <span className="text-red-500">*</span></Label>
                  <Input {...register("paymentInfo.accountNumber")} />
                  {errors.paymentInfo?.accountNumber && <p className="text-xs text-red-400">{errors.paymentInfo.accountNumber.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold tracking-widest uppercase">Routing Number <span className="text-red-500">*</span></Label>
                  <Input {...register("paymentInfo.routingNumber")} />
                  {errors.paymentInfo?.routingNumber && <p className="text-xs text-red-400">{errors.paymentInfo.routingNumber.message}</p>}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold tracking-widest uppercase">Branch Name <span className="text-red-500">*</span></Label>
                  <Input {...register("paymentInfo.branchName")} />
                  {errors.paymentInfo?.branchName && <p className="text-xs text-red-400">{errors.paymentInfo.branchName.message}</p>}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {item.attachments && item.attachments.length > 0 && (
            <div>
              <Label className="text-xs font-semibold tracking-widest uppercase">Previously Submitted Documents</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                {item.attachments.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border border-border block">
                    <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Earlier uploads are kept and dated in the claim history. Files you add below are saved as a new dated submission.
              </p>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold tracking-widest uppercase">
              Add New Attachments <span className="text-muted-foreground normal-case font-normal">(optional)</span>
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
              {newPreviews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/30">
                  <img src={src} alt={`New attachment ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newFiles.length < MAX_ATTACHMENTS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Add file</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFilesChange} />
          </div>

          <Button
            type="submit"
            variant="outline"
            disabled={isLoading}
            className="group hover:cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white duration-300 w-full mt-2 font-bold tracking-widest uppercase transition-colors disabled:opacity-60"
          >
            {isLoading ? "Updating..." : "Update Claim"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}