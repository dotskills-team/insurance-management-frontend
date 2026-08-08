/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Users, Upload, X } from "lucide-react";

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

import {
  divisions,
  getDistrictsByDivision,
  getUpazilasByDistrict,
} from "@/lib/bd-address";
import Image from "next/image";

const updateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(11, "Enter a valid phone number").max(15),
  email: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  nid: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  isActive: z.nativeEnum(IsActive),
  // Nominee
  nomineeName: z.string().optional().or(z.literal("")),
  nomineeAge: z.preprocess(
    (val) => (val !== "" && val !== undefined ? Number(val) : undefined),
    z.number().min(1).optional(),
  ),
  nomineeRelationship: z.string().optional().or(z.literal("")),
  nomineePhone: z.string().optional().or(z.literal("")),
  // Address
  division: z.string().optional(),
  district: z.string().optional(),
  thana: z.string().optional(),
  street: z.string().optional(),
});

type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;

interface UpdateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IUser;
  onSuccess?: () => void;
}

export function UpdateCustomerModal({
  open,
  onOpenChange,
  item,
  onSuccess,
}: UpdateCustomerModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [thanaId, setThanaId] = useState("");

  const availableDistricts = useMemo(
    () => getDistrictsByDivision(divisionId),
    [divisionId],
  );
  const availableUpazilas = useMemo(
    () => getUpazilasByDistrict(districtId),
    [districtId],
  );

  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<UpdateCustomerFormValues>({
    resolver: zodResolver(updateCustomerSchema) as any,
  });

  const selectedGender = watch("gender");
  const selectedStatus = watch("isActive");

  // ── Pre-fill form when modal opens ──
  useEffect(() => {
    if (open && item) {
      reset({
        name: item.name ?? "",
        phone: item.phone ?? "",
        email: item.email ?? "",
        nid: item.nid ?? "",
        dateOfBirth: item.dateOfBirth ? item.dateOfBirth.split("T")[0] : "",
        gender: item.gender ?? undefined,
        isActive: item.isActive ?? IsActive.ACTIVE,
        nomineeName: item.nominee?.name ?? "",
        nomineePhone: item.nominee?.phone ?? "",
        division: item.address?.division ?? "",
        district: item.address?.district ?? "",
        thana: item.address?.thana ?? "",
        street: item.address?.street ?? "",
      });
      setImagePreview(item.picture ?? null);
      setImageFile(null);

      const divisionMatch = divisions.find(
        (d) => d.name === item.address?.division,
      );
      const initialDivisionId = divisionMatch?.id ?? "";

      const districtsForDivision = getDistrictsByDivision(initialDivisionId);
      const districtMatch = districtsForDivision.find(
        (d) => d.name === item.address?.district,
      );
      const initialDistrictId = districtMatch?.id ?? "";

      const upazilasForDistrict = getUpazilasByDistrict(initialDistrictId);
      const thanaMatch = upazilasForDistrict.find(
        (u) => u.name === item.address?.thana,
      );
      const initialThanaId = thanaMatch?.id ?? "";

      setDivisionId(initialDivisionId);
      setDistrictId(initialDistrictId);
      setThanaId(initialThanaId);
    }
  }, [open, item, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

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

  const onSubmit = async (data: UpdateCustomerFormValues) => {
    try {
      const formData = new FormData();
      const payload: Record<string, any> = {
        name: data.name,
        phone: data.phone,
        isActive: data.isActive,
        ...(data.email && { email: data.email }),
        ...(data.nid && { nid: data.nid }),
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
        ...(data.gender && { gender: data.gender }),
        address: {
          division: data.division || "",
          district: data.district || "",
          thana: data.thana || "",
          street: data.street || "",
        },
        nominee: {
          name: data.nomineeName || "",
          relationship: data.nomineeRelationship || "",
          phone: data.nomineePhone || "",
          ...(data.nomineeAge !== undefined && { age: data.nomineeAge }),
        },
      };
      formData.append("data", JSON.stringify(payload));
      if (imageFile) formData.append("picture", imageFile);

      await updateUser({ id: String(item._id), data: formData }).unwrap();
      toast.success("Customer updated successfully!");
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update customer");
    }
  };

  const STATUS_META: Record<IsActive, { label: string; dot: string }> = {
    [IsActive.ACTIVE]: { label: "Active", dot: "bg-emerald-500" },
    [IsActive.INACTIVE]: { label: "Inactive", dot: "bg-slate-400" },
    [IsActive.BLOCKED]: { label: "Blocked", dot: "bg-red-500" },
    [IsActive.CREATED]: { label: "Created", dot: "bg-slate-400" },
    [IsActive.ALL]: { label: "All", dot: "bg-slate-400" },
  };

  const GENDER_LABELS: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] scrollbar-none overflow-y-auto p-6">
        <DialogHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md mb-1">
            <Users className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-widest uppercase">
            Edit Customer
          </DialogTitle>
          <DialogDescription className="text-[#96999A] text-sm tracking-wide">
            Update the customer&apos;s information below
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          {/* ── Personal Information ── */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
              Personal Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-name"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="uc-name"
                  placeholder="e.g. Md. Karim Mia"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-phone"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="uc-phone"
                  placeholder="01XXXXXXXXX"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-red-400">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-email"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Email{" "}
                  <span className="text-[#96999A] normal-case font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="uc-email"
                  type="email"
                  placeholder="example@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-nid"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  NID Number{" "}
                  <span className="text-[#96999A] normal-case font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="uc-nid"
                  placeholder="e.g. 1234567890"
                  {...register("nid")}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-dob"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Date of Birth{" "}
                  <span className="text-[#96999A] normal-case font-normal">
                    (optional)
                  </span>
                </Label>
                <Input id="uc-dob" type="date" {...register("dateOfBirth")} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">
                  Gender{" "}
                  <span className="text-[#96999A] normal-case font-normal">
                    (optional)
                  </span>
                </Label>
                <Select
                  value={selectedGender ?? ""}
                  onValueChange={(v) =>
                    setValue("gender", v as "MALE" | "FEMALE" | "OTHER", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <span className="text-sm">
                      {selectedGender
                        ? GENDER_LABELS[selectedGender]
                        : "Select gender"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Status ── */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
              Account Status
            </p>
            <div className="space-y-1.5 max-w-xs">
              <Label className="text-xs font-semibold tracking-widest uppercase">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(v) =>
                  setValue("isActive", v as IsActive, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  {selectedStatus ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className={`h-2 w-2 rounded-full inline-block ${STATUS_META[selectedStatus]?.dot}`}
                      />
                      {STATUS_META[selectedStatus]?.label}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">
                      Select status
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {Object.values(IsActive).map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full inline-block ${STATUS_META[s].dot}`}
                        />
                        {STATUS_META[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.isActive && (
                <p className="text-xs text-red-400">
                  {errors.isActive.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* ── Nominee Information ── */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
              Nominee Information{" "}
              <span className="text-[#96999A] normal-case font-normal">
                (optional)
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-nominee-name"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Nominee Name
                </Label>
                <Input
                  id="uc-nominee-name"
                  placeholder="e.g. Fatema Begum"
                  {...register("nomineeName")}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-nominee-relationship"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Relationship
                </Label>
                <Input
                  id="uc-nominee-relationship"
                  placeholder="e.g. Wife, Son, Father"
                  {...register("nomineeRelationship")}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-nominee-phone"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Nominee Phone
                </Label>
                <Input
                  id="uc-nominee-phone"
                  placeholder="01XXXXXXXXX"
                  {...register("nomineePhone")}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-nominee-age"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Nominee Age
                </Label>
                <Input
                  id="uc-nominee-age"
                  type="number"
                  min={1}
                  placeholder="e.g. 35"
                  {...register("nomineeAge")}
                />
                {errors.nomineeAge && (
                  <p className="text-xs text-red-400">
                    {errors.nomineeAge.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Address ── */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
              Address{" "}
              <span className="text-[#96999A] normal-case font-normal">
                (optional)
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Division */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">
                  Division
                </Label>
                <Select value={divisionId} onValueChange={handleDivisionChange}>
                  <SelectTrigger className="w-full">
                    <span className="text-sm">
                      {divisionId
                        ? divisions.find((d) => d.id === divisionId)?.name
                        : "Select Division"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District — depends on Division */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">
                  District
                </Label>
                <Select
                  value={districtId}
                  onValueChange={handleDistrictChange}
                  disabled={!divisionId}
                >
                  <SelectTrigger className="w-full">
                    <span className="text-sm">
                      {districtId
                        ? availableDistricts.find((d) => d.id === districtId)
                            ?.name
                        : "Select District"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {availableDistricts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Thana / Upazila — depends on District */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase">
                  Thana
                </Label>
                <Select
                  value={thanaId}
                  onValueChange={handleThanaChange}
                  disabled={!districtId}
                >
                  <SelectTrigger className="w-full">
                    <span className="text-sm">
                      {thanaId
                        ? availableUpazilas.find((u) => u.id === thanaId)?.name
                        : "Select Thana"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {availableUpazilas.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="uc-street"
                  className="text-xs font-semibold tracking-widest uppercase"
                >
                  Street
                </Label>
                <Input
                  id="uc-street"
                  placeholder="e.g. Ward-10"
                  {...register("street")}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Profile Picture ── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold tracking-widest uppercase">
              Profile Picture{" "}
              <span className="text-[#96999A] normal-case font-normal">
                (optional)
              </span>
            </Label>
            {imagePreview ? (
              <div className="relative flex items-center gap-3 rounded-md border border-slate-200 dark:border-slate-700 p-2">
                <Image
                  width={200}
                  height={200}
                  src={imagePreview}
                  priority
                  quality={90}
                  alt="Preview"
                  className="h-14 w-14 rounded-full object-cover shrink-0 border-2 border-slate-200 dark:border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  {imageFile ? (
                    <>
                      <p className="text-xs text-slate-500 truncate">
                        {imageFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(imageFile.size / 1024).toFixed(1)} KB
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Current profile photo
                    </p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  type="button"
                  size="sm"
                  onClick={clearImage}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="update-customer-image"
                className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-6 cursor-pointer transition-colors"
              >
                <Upload className="h-6 w-6 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    Click to upload a new photo
                  </p>
                  <p className="text-xs text-slate-400">
                    PNG, JPG, WEBP — max 2MB
                  </p>
                </div>
                <input
                  id="update-customer-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* ── Submit ── */}
          <Button
            type="submit"
            disabled={isLoading}
            variant={"outline"}
            className="group hover:cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white duration-300 w-full mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Update Customer
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
