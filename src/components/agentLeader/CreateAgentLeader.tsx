/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Crown, Upload, X, Eye, EyeOff } from "lucide-react";

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
import { useCreateUserMutation } from "@/redux/features/user/user.api";
import Image from "next/image";

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
    salary: z.preprocess(
      (val) => (val !== "" && val !== undefined ? Number(val) : undefined),
      z.number().min(0, "Must be 0 or more").optional(),
    ),
    salaryPerCustomer: z.preprocess(
      (val) => (val !== "" && val !== undefined ? Number(val) : undefined),
      z.number().min(0, "Must be 0 or more").optional(),
    ),
    division: z.string().optional(),
    district: z.string().optional(),
    thana: z.string().optional(),
    street: z.string().optional(),
    nid: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    nomineeName: z.string().optional(),
    nomineePhone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateAgentLeaderModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── division / district / thana cascading selection (ids drive the Selects,
  // the actual name strings are what get saved into the form / payload) ──
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [thanaId, setThanaId] = useState("");

  const availableDistricts = useMemo(() => getDistrictsByDivision(divisionId), [divisionId]);
  const availableUpazilas = useMemo(() => getUpazilasByDistrict(districtId), [districtId]);

  const [createUser, { isLoading }] = useCreateUserMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      employeeId: "",
      salary: undefined,
      salaryPerCustomer: undefined,
      division: "",
      district: "",
      thana: "",
      street: "",
      nid: "",
      dateOfBirth: "",
      gender: undefined,
      nomineeName: "",
      nomineePhone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedGender = watch("gender");

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
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  // ── cascading address handlers ──
  // NOTE: shadcn's Select onValueChange can fire with `null` (e.g. on clear),
  // so these accept `string | null` and normalize to "".
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
    reset();
    clearImage();
    setShowPassword(false);
    setShowConfirm(false);
    setDivisionId("");
    setDistrictId("");
    setThanaId("");
    setOpen(false);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      const hasNominee = Boolean(data.nomineeName || data.nomineePhone);

      const payload = {
        name: data.name,
        phone: data.phone,
        ...(data.email && { email: data.email }),
        ...(data.employeeId && { employeeId: data.employeeId }),
        password: data.password,
        role: "AGENT_LEADER",
        ...(data.salary !== undefined && { salary: String(data.salary) }),
        ...(data.salaryPerCustomer !== undefined && {
          salaryPerCustomer: String(data.salaryPerCustomer),
        }),
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
      formData.append("data", JSON.stringify(payload));
      if (imageFile) formData.append("picture", imageFile);

      await createUser(formData).unwrap();
      toast.success("Agent Leader created successfully!");
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create agent leader");
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="group hover:cursor-pointer border-indigo-600 text-white bg-indigo-700 hover:bg-indigo-800 hover:shadow-xl hover:text-white duration-500 dark:text-white mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60 hover:scale-105 ease-in-out"
      >
        <Plus className="h-4 w-4" />
        Add Agent Leader
      </Button>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          if (!val) handleClose();
          else setOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="flex flex-col items-center gap-2 pb-2">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md mb-1">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-widest uppercase">
              Add New Agent Leader
            </DialogTitle>
            <DialogDescription className="text-[#96999A] text-sm tracking-wide">
              Fill in the agent leader&apos;s information below
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
                  <Label
                    htmlFor="al-name"
                    className="text-xs font-semibold tracking-widest uppercase"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="al-name"
                    placeholder="e.g. Md. Karimul Islam"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-400">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="al-phone"
                    className="text-xs font-semibold tracking-widest uppercase"
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="al-phone"
                    placeholder="01XXXXXXXXX"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-400">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-1.5 ">
                  <Label htmlFor="a-email" className="text-xs font-semibold tracking-widest uppercase">
                    Email{" "}
                    <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="a-email"
                    type="email"
                    placeholder="example@email.com"
                    {...register("email")}
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5 ">
                  <Label htmlFor="a-employee-id" className="text-xs font-semibold tracking-widest uppercase">
                    Employee ID{" "}
                    <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="a-employee-id"
                    placeholder="e.g. EMP-1024"
                    {...register("employeeId")}
                  />
                  {errors.employeeId && (
                    <p className="text-xs text-red-400">{errors.employeeId.message}</p>
                  )}
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="al-nid" className="text-xs font-semibold tracking-widest uppercase">
                    NID / Birth Cert. No.{" "}
                    <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                  </Label>
                  <Input id="al-nid" placeholder="e.g. 1990123456789" {...register("nid")} />
                  {errors.nid && <p className="text-xs text-red-400">{errors.nid.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="al-dob" className="text-xs font-semibold tracking-widest uppercase">
                    Date of Birth{" "}
                    <span className="text-[#96999A] normal-case font-normal">(optional)</span>
                  </Label>
                  <Input id="al-dob" type="date" {...register("dateOfBirth")} />
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

            {/* Compensation */}
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
                Compensation{" "}
                <span className="text-[#96999A] normal-case font-normal">
                  (optional)
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="al-salary"
                    className="text-xs font-semibold tracking-widest uppercase"
                  >
                    Monthly Salary (BDT)
                  </Label>
                  <Input
                    id="al-salary"
                    type="number"
                    min={0}
                    placeholder="e.g. 20000"
                    {...register("salary")}
                  />
                  {errors.salary && (
                    <p className="text-xs text-red-400">
                      {errors.salary.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="al-per-customer"
                    className="text-xs font-semibold tracking-widest uppercase"
                  >
                    Salary Per Customer (BDT)
                  </Label>
                  <Input
                    id="al-per-customer"
                    type="number"
                    min={0}
                    placeholder="e.g. 300"
                    {...register("salaryPerCustomer")}
                  />
                  {errors.salaryPerCustomer && (
                    <p className="text-xs text-red-400">
                      {errors.salaryPerCustomer.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Address */}
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
                  <Label className="text-xs font-semibold tracking-widest uppercase">
                    District
                  </Label>
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
                  <Label className="text-xs font-semibold tracking-widest uppercase">
                    Thana
                  </Label>
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
                  <Label
                    htmlFor="al-street"
                    className="text-xs font-semibold tracking-widest uppercase"
                  >
                    Street
                  </Label>
                  <Input
                    id="al-street"
                    placeholder="e.g. Dhaka, 1230"
                    {...register("street")}
                  />
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
                  <Label htmlFor="al-nominee-name" className="text-xs font-semibold tracking-widest uppercase">
                    Nominee Name
                  </Label>
                  <Input
                    id="al-nominee-name"
                    placeholder="e.g. Jane Doe"
                    {...register("nomineeName")}
                  />
                  {errors.nomineeName && (
                    <p className="text-xs text-red-400">{errors.nomineeName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="al-nominee-phone" className="text-xs font-semibold tracking-widest uppercase">
                    Nominee Phone Number
                  </Label>
                  <Input
                    id="al-nominee-phone"
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
                <span className="text-[#96999A] normal-case font-normal">
                  (optional)
                </span>
              </Label>
              {imagePreview ? (
                <div className="relative flex items-center gap-3 rounded-md border border-slate-200 dark:border-slate-700 p-2">
                  <Image
                    width={150}
                    height={150}
                    priority
                    quality={90}
                    src={imagePreview}
                    alt="Preview"
                    className="h-14 w-14 rounded-full object-cover shrink-0 border-2 border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate">
                      {imageFile?.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {imageFile
                        ? (imageFile.size / 1024).toFixed(1) + " KB"
                        : ""}
                    </p>
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
                  htmlFor="al-image-upload"
                  className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-6 cursor-pointer transition-colors"
                >
                  <Upload className="h-6 w-6 text-slate-400" />
                  <div className="text-center">
                    <p className="text-sm text-slate-500">
                      Click to upload a photo
                    </p>
                    <p className="text-xs text-slate-400">
                      PNG, JPG, WEBP — max 2MB
                    </p>
                  </div>
                  <input
                    id="al-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <Separator />

            {/* Account Security */}
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
                Account Security
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="al-password"
                    className="text-xs font-semibold tracking-widest uppercase"
                  >
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="al-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      className="pr-10"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="al-confirm-password"
                    className="text-xs font-semibold tracking-widest uppercase"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="al-confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      className="pr-10"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400">
                      {errors.confirmPassword.message}
                    </p>
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
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Create Agent Leader
                </span>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}