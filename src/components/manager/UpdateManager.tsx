"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ShieldCheck, Upload, X, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useUpdateUserMutation } from "@/redux/features/user/user.api";
import { IsActive, IUser } from "@/types/user.types";

import { divisions, getDistrictsByDivision, getUpazilasByDistrict } from "@/lib/bd-address";

// ─── Schema ───────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    phone: z.string().min(11, "Enter a valid phone number").max(15),
    email: z
      .string()
      .email("Enter a valid email address")
      .optional()
      .or(z.literal("")),
    employeeId: z.string().optional(),
    isActive: z.nativeEnum(IsActive),
    division: z.string().optional(),
    district: z.string().optional(),
    thana: z.string().optional(),
    street: z.string().optional(),
    nid: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    nomineeName: z.string().optional(),
    nomineePhone: z.string().optional(),
    // ── Password change (optional) ──
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional()
      .or(z.literal("")),
    confirmNewPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (d) => {
      if (d.newPassword && d.newPassword.length > 0) {
        return d.newPassword === d.confirmNewPassword;
      }
      return true;
    },
    { message: "Passwords do not match", path: ["confirmNewPassword"] },
  )
  .refine(
    (d) => {
      if (d.confirmNewPassword && d.confirmNewPassword.length > 0) {
        return d.newPassword && d.newPassword.length > 0;
      }
      return true;
    },
    { message: "Please enter a new password first", path: ["newPassword"] },
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IUser;
  onSuccess?: () => void;
}

const STATUS_META: Record<IsActive, { label: string; dot: string }> = {
  [IsActive.ACTIVE]: { label: "Active", dot: "bg-emerald-500" },
  [IsActive.INACTIVE]: { label: "Inactive", dot: "bg-slate-400" },
  [IsActive.CREATED]: { label: "Created", dot: "bg-slate-400" },
  [IsActive.BLOCKED]: { label: "Blocked", dot: "bg-red-500" },
  [IsActive.ALL]: { label: "All", dot: "bg-slate-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Normalizes a Date / ISO string into the yyyy-MM-dd shape <input type="date"> expects
const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

// ─── Component ────────────────────────────────────────────────────────────────

export function UpdateManagerModal({ open, onOpenChange, item, onSuccess }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── division / district / thana cascading selection ──
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [thanaId, setThanaId] = useState("");

  const availableDistricts = useMemo(() => getDistrictsByDivision(divisionId), [divisionId]);
  const availableUpazilas = useMemo(() => getUpazilasByDistrict(districtId), [districtId]);

  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
  });

  const selectedStatus = watch("isActive");
  const selectedGender = watch("gender");

  useEffect(() => {
    if (open && item) {
      reset({
        name: item.name ?? "",
        phone: item.phone ?? "",
        email: item.email ?? "",
        employeeId: item.employeeId ?? "",
        isActive: item.isActive ?? IsActive.ACTIVE,
        division: item.address?.division ?? "",
        district: item.address?.district ?? "",
        thana: item.address?.thana ?? "",
        street: item.address?.street ?? "",
        nid: item.nid ?? "",
        dateOfBirth: toDateInputValue(item.dateOfBirth),
        gender: item.gender,
        nomineeName: item.nominee?.name ?? "",
        nomineePhone: item.nominee?.phone ?? "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setImagePreview(item.picture ?? null);
      setImageFile(null);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      // ── resolve existing address names back into ids so the cascading
      // Selects show the current value automatically ──
      const divisionMatch = divisions.find((d) => d.name === item.address?.division);
      const initialDivisionId = divisionMatch?.id ?? "";

      const districtsForDivision = getDistrictsByDivision(initialDivisionId);
      const districtMatch = districtsForDivision.find((d) => d.name === item.address?.district);
      const initialDistrictId = districtMatch?.id ?? "";

      const upazilasForDistrict = getUpazilasByDistrict(initialDistrictId);
      const thanaMatch = upazilasForDistrict.find((u) => u.name === item.address?.thana);
      const initialThanaId = thanaMatch?.id ?? "";

      setDivisionId(initialDivisionId);
      setDistrictId(initialDistrictId);
      setThanaId(initialThanaId);
    }
  }, [open, item, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => { setImageFile(null); setImagePreview(null); };

  // ── cascading address handlers ──
  const handleDivisionChange = (id: string | null) => {
    const value = id ?? "";
    const division = divisions.find((d) => d.id === value);
    setDivisionId(value);
    setDistrictId("");
    setThanaId("");
    setValue("division", division?.name ?? "", { shouldValidate: true });
    setValue("district", "", { shouldValidate: true });
    setValue("thana", "", { shouldValidate: true });
  };

  const handleDistrictChange = (id: string | null) => {
    const value = id ?? "";
    const district = availableDistricts.find((d) => d.id === value);
    setDistrictId(value);
    setThanaId("");
    setValue("district", district?.name ?? "", { shouldValidate: true });
    setValue("thana", "", { shouldValidate: true });
  };

  const handleThanaChange = (id: string | null) => {
    const value = id ?? "";
    const upazila = availableUpazilas.find((u) => u.id === value);
    setThanaId(value);
    setValue("thana", upazila?.name ?? "", { shouldValidate: true });
  };

  const handleClose = () => {
    clearImage();
    setDivisionId("");
    setDistrictId("");
    setThanaId("");
    onOpenChange(false);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      const hasNominee = Boolean(data.nomineeName || data.nomineePhone);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        name: data.name,
        phone: data.phone,
        ...(data.email && { email: data.email }),
        ...(data.employeeId && { employeeId: data.employeeId }),
        isActive: data.isActive,
        address: {
          division: data.division || "",
          district: data.district || "",
          thana: data.thana || "",
          street: data.street || "",
        },
        ...(data.nid && { nid: data.nid }),
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
        ...(data.gender && { gender: data.gender }),
        ...(hasNominee && {
          nominee: {
            ...(data.nomineeName && { name: data.nomineeName }),
            ...(data.nomineePhone && { phone: data.nomineePhone }),
          },
        }),
      };
      if (data.newPassword && data.newPassword.trim().length > 0) {
        payload.password = data.newPassword;
      }
      formData.append("data", JSON.stringify(payload));
      if (imageFile) formData.append("picture", imageFile);

      await updateUser({ id: String(item._id), data: formData }).unwrap();
      toast.success("Manager updated successfully!");
      handleClose();
      onSuccess?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update manager");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none p-6">
        <DialogHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md mb-1">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-widest uppercase">
            Edit Manager
          </DialogTitle>
          <DialogDescription className="text-[#96999A] text-sm tracking-wide">
            Update the manager&apos;s information below
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">

          {/* Personal Information */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
              Personal Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-1.5">
                <Label htmlFor="umg-name" className="text-xs font-semibold tracking-widest uppercase">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input id="umg-name" placeholder="e.g. Md. Karimul Islam" {...register("name")} />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="umg-phone" className="text-xs font-semibold tracking-widest uppercase">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input id="umg-phone" placeholder="01XXXXXXXXX" {...register("phone")} />
                {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ua-email" className="text-xs font-semibold tracking-widest uppercase">
                  Email{" "}
                  <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                </Label>
                <Input
                  id="ua-email"
                  type="email"
                  placeholder="example@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ua-employee-id" className="text-xs font-semibold tracking-widest uppercase">
                  Employee ID{" "}
                  <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                </Label>
                <Input
                  id="ua-employee-id"
                  placeholder="e.g. EMP-1024"
                  {...register("employeeId")}
                />
                {errors.employeeId && (
                  <p className="text-xs text-red-400">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="umg-nid" className="text-xs font-semibold tracking-widest uppercase">
                  NID / Birth Cert. No.{" "}
                  <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                </Label>
                <Input id="umg-nid" placeholder="e.g. 1990123456789" {...register("nid")} />
                {errors.nid && <p className="text-xs text-red-400">{errors.nid.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="umg-dob" className="text-xs font-semibold tracking-widest uppercase">
                  Date of Birth{" "}
                  <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                </Label>
                <Input id="umg-dob" type="date" {...register("dateOfBirth")} />
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-400">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">
                  Gender{" "}
                  <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                </Label>
                <Select
                  value={selectedGender ?? ""}
                  onValueChange={(v) =>
                    setValue("gender", (v || undefined) as FormValues["gender"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <span className="text-sm">
                      {selectedGender
                        ? GENDER_OPTIONS.find((g) => g.value === selectedGender)?.label
                        : "Select Gender"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-xs text-red-400">{errors.gender.message}</p>
                )}
              </div>

            </div>
          </div>

          <Separator />

          {/* Status */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
              Status
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold tracking-widest uppercase">
                Account Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(v) => setValue("isActive", v as IsActive, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  {selectedStatus ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full inline-block ${STATUS_META[selectedStatus]?.dot}`} />
                      {STATUS_META[selectedStatus]?.label}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Select status</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {Object.values(IsActive).map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full inline-block ${STATUS_META[s].dot}`} />
                        {STATUS_META[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.isActive && <p className="text-xs text-red-400">{errors.isActive.message}</p>}
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
              Address{" "}
              <span className="text-[#96999A] normal-case font-normal">(optional)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Division */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">Division</Label>
                <Select value={divisionId} onValueChange={handleDivisionChange}>
                  <SelectTrigger className="w-full">
                    <span className="text-sm">
                      {divisionId ? divisions.find((d) => d.id === divisionId)?.name : "Select Division"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District — depends on Division */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">District</Label>
                <Select value={districtId} onValueChange={handleDistrictChange} disabled={!divisionId}>
                  <SelectTrigger className="w-full">
                    <span className="text-sm">
                      {districtId ? availableDistricts.find((d) => d.id === districtId)?.name : "Select District"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {availableDistricts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Thana / Upazila — depends on District */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">Thana</Label>
                <Select value={thanaId} onValueChange={handleThanaChange} disabled={!districtId}>
                  <SelectTrigger className="w-full">
                    <span className="text-sm">
                      {thanaId ? availableUpazilas.find((u) => u.id === thanaId)?.name : "Select Thana"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {availableUpazilas.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="umg-street" className="text-xs font-semibold tracking-widest uppercase">Street</Label>
                <Input id="umg-street" placeholder="e.g. Ward-10" {...register("street")} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Nominee Information */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
              Nominee Information{" "}
              <span className="text-[#96999A] normal-case font-normal">(optional)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="umg-nominee-name" className="text-xs font-semibold tracking-widest uppercase">
                  Nominee Name
                </Label>
                <Input
                  id="umg-nominee-name"
                  placeholder="e.g. Jane Doe"
                  {...register("nomineeName")}
                />
                {errors.nomineeName && (
                  <p className="text-xs text-red-400">{errors.nomineeName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="umg-nominee-phone" className="text-xs font-semibold tracking-widest uppercase">
                  Nominee Phone Number
                </Label>
                <Input
                  id="umg-nominee-phone"
                  placeholder="01XXXXXXXXX"
                  {...register("nomineePhone")}
                />
                {errors.nomineePhone && (
                  <p className="text-xs text-red-400">{errors.nomineePhone.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile Picture */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold tracking-widest uppercase">
              Profile Picture{" "}
              <span className="text-[#96999A] normal-case font-normal">(optional)</span>
            </Label>
            {imagePreview ? (
              <div className="relative flex items-center gap-3 rounded-md border border-slate-200 dark:border-slate-700 p-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-14 w-14 rounded-full object-cover shrink-0 border-2 border-slate-200 dark:border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  {imageFile ? (
                    <>
                      <p className="text-xs text-slate-500 truncate">{imageFile.name}</p>
                      <p className="text-xs text-slate-400">{(imageFile.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Current profile photo</p>
                  )}
                </div>
                <Button variant="destructive" type="button" size="sm" onClick={clearImage} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="update-mg-image"
                className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-6 cursor-pointer transition-colors"
              >
                <Upload className="h-6 w-6 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm text-slate-500">Click to upload a new photo</p>
                  <p className="text-xs text-slate-400">PNG, JPG, WEBP — max 2MB</p>
                </div>
                <input
                  id="update-mg-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <Separator />

          {/* ── Change Password ── */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
              Change Password
            </p>
            <p className="text-xs text-slate-400 mb-3">
              Leave blank to keep the current password
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-1.5">
                <Label htmlFor="umg-new-password" className="text-xs font-semibold tracking-widest uppercase">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="umg-new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    className="pr-10"
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-400">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="umg-confirm-password" className="text-xs font-semibold tracking-widest uppercase">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="umg-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    className="pr-10"
                    {...register("confirmNewPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmNewPassword && (
                  <p className="text-xs text-red-400">{errors.confirmNewPassword.message}</p>
                )}
              </div>

            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="group hover:cursor-pointer border-indigo-600 text-white w-full bg-indigo-700 hover:bg-indigo-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Update Manager
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}