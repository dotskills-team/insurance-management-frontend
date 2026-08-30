
// /* eslint-disable react-hooks/incompatible-library */
// /* eslint-disable @typescript-eslint/no-explicit-any */

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { toast } from "sonner";
// import {
//   Loader2,
//   Plus,
//   Search,
//   UserCheck,
//   UserPlus,
//   X,
//   Check,
//   User,
//   Users,
//   ArrowRight,
//   ArrowLeft,
//   ContactRound,
//   HeartHandshake,
//   ShieldCheck,
// } from "lucide-react";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Separator } from "@/components/ui/separator";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// import { useCreateSubscriptionMutation } from "@/redux/features/subscription/subscription.api";
// import { useGetAllCustomersQuery } from "@/redux/features/user/user.api";
// import { useGetAllPackagesQuery } from "@/redux/features/package/package.api";
// import { IUser } from "@/types/user.types";
// import { PlanType } from "@/types/subscription.types";

// import {
//   divisions,
//   getDistrictsByDivision,
//   getUpazilasByDistrict,
// } from "@/lib/bd-address";
// import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// // ── local shape assumption for package plans (adjust if IPackage differs) ──
// interface IPackagePlan {
//   type: PlanType;
//   regularPrice: number;
//   discountPrice?: number;
//   durationInMonths?: number;
// }
// interface IPackageWithPlans {
//   _id: string;
//   name: string;
//   plans: IPackagePlan[];
//   // true -> this package covers 2 persons; subscription needs a 2nd person's info
//   isJoint?: boolean;
// }

// const PLAN_LABELS: Record<PlanType, string> = {
//   [PlanType.MONTHLY]: "Monthly",
//   [PlanType.QUARTERLY]: "Quarterly",
//   [PlanType.HALF_YEARLY]: "Half Yearly",
//   [PlanType.YEARLY]: "Yearly",
//   [PlanType.LIFETIME]: "Lifetime",
// };

// const formatCurrency = (n?: number) => `৳${(n ?? 0).toLocaleString("en-BD")}`;

// const calculateAge = (dob: string): number => {
//   const birthDate = new Date(dob);
//   if (isNaN(birthDate.getTime())) return 0;
//   const today = new Date();
//   let age = today.getFullYear() - birthDate.getFullYear();
//   const m = today.getMonth() - birthDate.getMonth();
//   if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
//   return age;
// };


// // ── schema ──────────────────────────────────────────────────────────────────

// const schema = z
//   .object({
//     mode: z.enum(["new", "existing"]),

//     // existing customer
//     customerId: z.string().optional(),

//     // new customer
//     name: z.string().optional(),
//     phone: z.string().optional(),
//     email: z.string().optional(),
//     nid: z.string().optional(),
//     dateOfBirth: z.string().optional(),
//     gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
//     division: z.string().optional(),
//     district: z.string().optional(),
//     thana: z.string().optional(),
//     street: z.string().optional(),

//     // who the subscription actually covers.
//     // Toggle is only shown for: mode === "existing" && !packageIsJoint
//     subscribeFor: z.enum(["SELF", "OTHER"]),
//     beneficiaryName: z.string().optional(),
//     beneficiaryPhone: z.string().optional(),
//     beneficiaryDateOfBirth: z.string().optional(),
//     beneficiaryRelationship: z.string().optional(),

//     // common
//     package: z.string().min(1, "Please select a package"),
//     planType: z.nativeEnum(PlanType, { error: "Please select a plan" }),
//     price: z.number().min(0),

//     // synced from the selected package (see useEffect below) — not user-editable
//     packageIsJoint: z.boolean().optional().default(false),

//     // 2nd covered person — required only when packageIsJoint === true
//     joinMemberName: z.string().optional(),
//     joinMemberPhone: z.string().optional(),
//     joinMemberDateOfBirth: z.string().optional(),
//     joinMemberRelationship: z.string().optional(),

//     // subscription-level nominee — always required.
//     // source === "JOIN_MEMBER" only possible when packageIsJoint === true
//     subscriptionNomineeSource: z.enum(["JOIN_MEMBER", "OTHER"]).default("OTHER"),
//     subscriptionNomineeName: z.string().optional(),
//     subscriptionNomineePhone: z.string().optional(),
//     subscriptionNomineeDateOfBirth: z.string().optional(),
//     subscriptionNomineeRelationship: z.string().optional(),
//   })
//   .superRefine((data, ctx) => {
//     if (data.mode === "existing") {
//       if (!data.customerId) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["customerId"],
//           message: "Please select a customer",
//         });
//       }
//     } else {
//       if (!data.name?.trim())
//         ctx.addIssue({
//           code: "custom",
//           path: ["name"],
//           message: "Name is required",
//         });
//       if (!data.phone?.trim() || data.phone.length !== 11) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["phone"],
//           message: "Valid 11-digit phone required",
//         });
//       }

//       if (!data.dateOfBirth?.trim()) {
//         ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Date of birth is required" });
//       } else {
//         const age = calculateAge(data.dateOfBirth);
//         if (age < 18 || age > 65) {
//           ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Age must be between 18 and 65 years" });
//         }
//       }
//       if (!data.gender)
//         ctx.addIssue({
//           code: "custom",
//           path: ["gender"],
//           message: "Gender is required",
//         });
//       if (!data.division?.trim())
//         ctx.addIssue({
//           code: "custom",
//           path: ["division"],
//           message: "Division is required",
//         });
//       if (!data.district?.trim())
//         ctx.addIssue({
//           code: "custom",
//           path: ["district"],
//           message: "District is required",
//         });
//       if (!data.thana?.trim())
//         ctx.addIssue({
//           code: "custom",
//           path: ["thana"],
//           message: "Thana is required",
//         });
//     }

//     // Self/Someone toggle is only ever meaningful for: existing customer + single package
//     const subscribeForApplies = data.mode === "existing" && !data.packageIsJoint;
//     if (subscribeForApplies && data.subscribeFor === "OTHER") {
//       if (!data.beneficiaryName?.trim()) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["beneficiaryName"],
//           message: "Beneficiary name is required",
//         });
//       }
//       if (
//         !data.beneficiaryPhone?.trim() ||
//         data.beneficiaryPhone.length !== 11
//       ) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["beneficiaryPhone"],
//           message: "Valid 11-digit phone required",
//         });
//       }
//       if (!data.beneficiaryRelationship?.trim()) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["beneficiaryRelationship"],
//           message: "Relationship is required",
//         });
//       }
//     }

//     // Join Member — required whenever the selected package is Joint
//     if (data.packageIsJoint) {
//       if (!data.joinMemberName?.trim()) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["joinMemberName"],
//           message: "Join member name is required",
//         });
//       }
//       if (
//         !data.joinMemberPhone?.trim() ||
//         data.joinMemberPhone.length !== 11
//       ) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["joinMemberPhone"],
//           message: "Valid 11-digit phone required",
//         });
//       }
//       if (!data.joinMemberRelationship?.trim()) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["joinMemberRelationship"],
//           message: "Relationship is required",
//         });
//       }
//     }

//     // Nominee — always required.
//     // If Joint package AND nominee source is JOIN_MEMBER, info is copied
//     // from joinMember at submit time, so no separate fields needed here.
//     const nomineeUsesJoinMember =
//       data.packageIsJoint && data.subscriptionNomineeSource === "JOIN_MEMBER";

//     if (!nomineeUsesJoinMember) {
//       if (!data.subscriptionNomineeName?.trim()) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["subscriptionNomineeName"],
//           message: "Nominee name is required",
//         });
//       }
//       if (
//         !data.subscriptionNomineePhone?.trim() ||
//         data.subscriptionNomineePhone.length !== 11
//       ) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["subscriptionNomineePhone"],
//           message: "Valid 11-digit phone required",
//         });
//       }
//       if (!data.subscriptionNomineeRelationship?.trim()) {
//         ctx.addIssue({
//           code: "custom",
//           path: ["subscriptionNomineeRelationship"],
//           message: "Relationship is required",
//         });
//       }
//     }
//   });

// type FormValues = z.infer<typeof schema>;

// const defaultValues: FormValues = {
//   mode: "new",
//   customerId: "",
//   name: "",
//   phone: "",
//   email: "",
//   nid: "",
//   dateOfBirth: "",
//   gender: undefined,
//   division: "",
//   district: "",
//   thana: "",
//   street: "",
//   subscribeFor: "SELF",
//   beneficiaryName: "",
//   beneficiaryPhone: "",
//   beneficiaryDateOfBirth: "",
//   beneficiaryRelationship: "",
//   package: "",
//   planType: undefined as any,
//   price: 0,
//   packageIsJoint: false,
//   joinMemberName: "",
//   joinMemberPhone: "",
//   joinMemberDateOfBirth: "",
//   joinMemberRelationship: "",
//   subscriptionNomineeSource: "OTHER",
//   subscriptionNomineeName: "",
//   subscriptionNomineePhone: "",
//   subscriptionNomineeDateOfBirth: "",
//   subscriptionNomineeRelationship: "",
// };

// interface CreateSubscriptionModalProps {
//   onSuccess?: () => void;
//   isCustomer?: boolean;
// }

// export function CreateSubscriptionModal({
//   onSuccess,
//   isCustomer
// }: CreateSubscriptionModalProps) {
//   const [open, setOpen] = useState(false);
//   const [createSubscription, { isLoading }] = useCreateSubscriptionMutation();

//   // wizard step (only relevant for mode === "new")
//   const [step, setStep] = useState<1 | 2>(1);
//   const [direction, setDirection] = useState<"forward" | "back">("forward");

//   // customer search state
//   const [customerSearch, setCustomerSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [selectedCustomer, setSelectedCustomer] = useState<IUser | null>(null);
//   const [showResults, setShowResults] = useState(false);

//   // ── division / district / thana cascading selection ──
//   const [divisionId, setDivisionId] = useState("");
//   const [districtId, setDistrictId] = useState("");
//   const [thanaId, setThanaId] = useState("");

//   const availableDistricts = useMemo(
//     () => getDistrictsByDivision(divisionId),
//     [divisionId],
//   );
//   const availableUpazilas = useMemo(
//     () => getUpazilasByDistrict(districtId),
//     [districtId],
//   );

//   useEffect(() => {
//     const t = setTimeout(() => setDebouncedSearch(customerSearch), 350);
//     return () => clearTimeout(t);
//   }, [customerSearch]);

//   const { data: customersData, isFetching: isSearching } =
//     useGetAllCustomersQuery(
//       { searchTerm: debouncedSearch, limit: 8 },
//       { skip: debouncedSearch.trim().length < 2 },
//     );
//   const customerResults: IUser[] = customersData?.data ?? [];

//   const { data: packagesData } = useGetAllPackagesQuery({ limit: 100 } as any);

//   const packages: IPackageWithPlans[] = useMemo(() => {
//     const raw = packagesData as any;
//     if (!raw) return [];
//     if (Array.isArray(raw.data)) return raw.data;
//     if (Array.isArray(raw.data?.data)) return raw.data.data;
//     return [];
//   }, [packagesData]);

//   const form = useForm<FormValues>({
//     resolver: zodResolver(schema as any),
//     defaultValues,
//   });

//   const mode = form.watch("mode");
//   const selectedPackageId = form.watch("package");
//   const selectedPlanType = form.watch("planType");

//   const selectedPackage = useMemo(
//     () => packages.find((p) => p._id === selectedPackageId),
//     [packages, selectedPackageId],
//   );
//   const packageIsJoint = !!selectedPackage?.isJoint;

//   // self/someone toggle only makes sense for existing customer + single package
//   const showSubscribeForToggle = mode === "existing" && !packageIsJoint;

//   const availablePlans = useMemo(
//     () => selectedPackage?.plans ?? [],
//     [selectedPackage],
//   );

//   const selectedPlan = useMemo(
//     () => availablePlans.find((p) => p.type === selectedPlanType),
//     [availablePlans, selectedPlanType],
//   );

//   useEffect(() => {
//     if (selectedPlan) {
//       const price = selectedPlan.discountPrice || selectedPlan.regularPrice;
//       form.setValue("price", price, { shouldValidate: true });
//     }
//   }, [selectedPlan, form]);

//   useEffect(() => {
//     if (selectedPackageId) {
//       form.setValue("planType", undefined as any);
//       form.setValue("price", 0);
//     }

//     // sync the hidden packageIsJoint flag with the selected package
//     form.setValue("packageIsJoint", packageIsJoint, { shouldValidate: true });

//     if (!packageIsJoint) {
//       // clear join member data when switching away from a Joint package
//       form.setValue("joinMemberName", "");
//       form.setValue("joinMemberPhone", "");
//       form.setValue("joinMemberDateOfBirth", "");
//       form.setValue("joinMemberRelationship", "");
//       // "use join member as nominee" is impossible without a join member
//       if (form.getValues("subscriptionNomineeSource") === "JOIN_MEMBER") {
//         form.setValue("subscriptionNomineeSource", "OTHER");
//       }
//     }

//     // self/someone toggle only applies for existing + single package —
//     // reset it whenever that condition no longer holds
//     if (!(mode === "existing" && !packageIsJoint)) {
//       form.setValue("subscribeFor", "SELF");
//       form.setValue("beneficiaryName", "");
//       form.setValue("beneficiaryPhone", "");
//       form.setValue("beneficiaryDateOfBirth", "");
//       form.setValue("beneficiaryRelationship", "");
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedPackageId, packageIsJoint, mode]);

//   const resetAll = () => {
//     form.reset(defaultValues);
//     setSelectedCustomer(null);
//     setCustomerSearch("");
//     setDebouncedSearch("");
//     setDivisionId("");
//     setDistrictId("");
//     setThanaId("");
//     setStep(1);
//     setDirection("forward");
//   };

//   const handleModeSwitch = (m: "existing" | "new") => {
//     form.setValue("mode", m);
//     setStep(1);
//     setDirection("forward");
//     if (m === "new") {
//       setSelectedCustomer(null);
//       form.setValue("customerId", "");
//     } else {
//       setCustomerSearch("");
//     }
//   };


//   const goNext = async () => {
//     const values = form.getValues();

//     const missing: { field: keyof FormValues; message: string }[] = [];

//     if (!values.name?.trim())
//       missing.push({ field: "name", message: "Name is required" });
//     if (!values.phone?.trim() || values.phone.trim().length !== 11)
//       missing.push({
//         field: "phone",
//         message: "Valid 11-digit phone required",
//       });


//     if (!values.dateOfBirth?.trim()) {
//       missing.push({ field: "dateOfBirth", message: "Date of birth is required" });
//     } else {
//       const age = calculateAge(values.dateOfBirth);
//       if (age < 18 || age > 65) {
//         missing.push({ field: "dateOfBirth", message: "Age must be between 18 and 65 years" });
//       }
//     }
//     if (!values.gender)
//       missing.push({ field: "gender", message: "Gender is required" });
//     if (!values.division?.trim())
//       missing.push({ field: "division", message: "Division is required" });
//     if (!values.district?.trim())
//       missing.push({ field: "district", message: "District is required" });
//     if (!values.thana?.trim())
//       missing.push({ field: "thana", message: "Thana is required" });

//     if (missing.length > 0) {
//       missing.forEach(({ field, message }) => {
//         form.setError(field, { type: "manual", message });
//       });
//       toast.error(missing[0].message);
//       return;
//     }

//     setDirection("forward");
//     setStep(2);
//   };

//   const goBack = () => {
//     setDirection("back");
//     setStep(1);
//   };

//   const pickCustomer = (c: IUser) => {
//     setSelectedCustomer(c);
//     form.setValue("customerId", String(c._id), { shouldValidate: true });
//     setShowResults(false);
//     setCustomerSearch("");
//   };

//   const clearCustomer = () => {
//     setSelectedCustomer(null);
//     form.setValue("customerId", "");
//   };

//   const handleDivisionChange = (id: string | null) => {
//     const value = id ?? "";
//     const division = divisions.find((d) => d.id === value);
//     setDivisionId(value);
//     setDistrictId("");
//     setThanaId("");
//     form.setValue("division", division?.name ?? "", { shouldValidate: true });
//     form.setValue("district", "", { shouldValidate: true });
//     form.setValue("thana", "", { shouldValidate: true });
//   };

//   const handleDistrictChange = (id: string | null) => {
//     const value = id ?? "";
//     const district = availableDistricts.find((d) => d.id === value);
//     setDistrictId(value);
//     setThanaId("");
//     form.setValue("district", district?.name ?? "", { shouldValidate: true });
//     form.setValue("thana", "", { shouldValidate: true });
//   };

//   const handleThanaChange = (id: string | null) => {
//     const value = id ?? "";
//     const upazila = availableUpazilas.find((u) => u.id === value);
//     setThanaId(value);
//     form.setValue("thana", upazila?.name ?? "", { shouldValidate: true });
//   };

//   const onError = (errors: typeof form.formState.errors) => {
//     const firstError = Object.values(errors)[0];
//     toast.error((firstError as any)?.message || "Please check the form fields");
//   };

//   const onSubmit = async (values: FormValues) => {
//     if (!selectedPlan) {
//       toast.error("Please select a valid plan");
//       return;
//     }

//     const useJoinMemberAsNominee =
//       values.packageIsJoint && values.subscriptionNomineeSource === "JOIN_MEMBER";

//     const nomineePayload = useJoinMemberAsNominee
//       ? {
//           source: "JOIN_MEMBER" as const,
//           name: values.joinMemberName!.trim(),
//           phone: values.joinMemberPhone!.trim(),
//           relationship: values.joinMemberRelationship!.trim(),
//           ...(values.joinMemberDateOfBirth && {
//             dateOfBirth: values.joinMemberDateOfBirth,
//           }),
//         }
//       : {
//           source: "OTHER" as const,
//           name: values.subscriptionNomineeName!.trim(),
//           phone: values.subscriptionNomineePhone!.trim(),
//           relationship: values.subscriptionNomineeRelationship!.trim(),
//           ...(values.subscriptionNomineeDateOfBirth && {
//             dateOfBirth: values.subscriptionNomineeDateOfBirth,
//           }),
//         };

//     const basePayload = {
//       package: values.package,
//       planType: values.planType,
//       durationInMonths: selectedPlan.durationInMonths,
//       price: values.price,
//       subscribeFor: values.subscribeFor,
//       ...(showSubscribeForToggle &&
//         values.subscribeFor === "OTHER" && {
//           beneficiary: {
//             name: values.beneficiaryName!.trim(),
//             phone: values.beneficiaryPhone!.trim(),
//             relationship: values.beneficiaryRelationship!.trim(),
//             ...(values.beneficiaryDateOfBirth && {
//               dateOfBirth: values.beneficiaryDateOfBirth,
//             }),
//           },
//         }),
//       ...(values.packageIsJoint && {
//         joinMember: {
//           name: values.joinMemberName!.trim(),
//           phone: values.joinMemberPhone!.trim(),
//           relationship: values.joinMemberRelationship!.trim(),
//           ...(values.joinMemberDateOfBirth && {
//             dateOfBirth: values.joinMemberDateOfBirth,
//           }),
//         },
//       }),
//       nominee: nomineePayload,
//     };

//     let payload;

//     // Customer Dashboard
//     if (isCustomer) {
//       // Backend should automatically use req.user.userId
//       payload = basePayload;
//     }

//     // Staff -> Existing Customer
//     else if (values.mode === "existing") {
//       payload = {
//         ...basePayload,
//         customer: values.customerId,
//       };
//     }

//     // Staff -> New Customer
//     else {
//       payload = {
//         ...basePayload,
//         customerPayload: {
//           name: values.name!.trim(),
//           phone: values.phone!.trim(),
//           ...(values.email?.trim() && {
//             email: values.email.trim(),
//           }),

//           role: "CUSTOMER" as const,
//           nid: values.nid!.trim(),
//           dateOfBirth: values.dateOfBirth,
//           gender: values.gender,

//           address: {
//             division: values.division!.trim(),
//             district: values.district!.trim(),
//             thana: values.thana!.trim(),
//             ...(values.street?.trim() && {
//               street: values.street.trim(),
//             }),
//           },
//         },
//       };
//     }

//     try {
//       const res = await createSubscription(payload as any).unwrap();
//       toast.success("Subscription created successfully");
//       const paymentUrl = res?.data?.data?.paymentUrl;
//       console.log(paymentUrl);
//       setOpen(false);
//       resetAll();
//       onSuccess?.();
//     } catch (err: any) {
//       toast.error(err?.data?.message || "Failed to create subscription");
//     }
//   };

//   const isNewMode = mode === "new";
//   const slideClass =
//     direction === "forward"
//       ? "animate-in slide-in-from-right-8 fade-in duration-300 ease-out"
//       : "animate-in slide-in-from-left-8 fade-in duration-300 ease-out";

//   return (
//     <Dialog
//       open={open}
//       onOpenChange={(v) => {
//         setOpen(v);
//         if (!v) resetAll();
//       }}
//     >
//       <DialogTrigger>
//         <Button   className="group hover:cursor-pointer border-indigo-600 text-white bg-indigo-700 hover:bg-indigo-800 hover:shadow-xl hover:text-white duration-500 dark:text-white cursor-pointer font-bold tracking-widest transition-all  uppercase disabled:opacity-60 hover:scale-103 ease-in-out">
//           <Plus className="w-4 h-4" /> New Subscription / Customer
//         </Button>
//       </DialogTrigger>

//       <DialogContent className="max-w-2xl w-full scrollbar-none">
//         <DialogHeader className="text-center">
//           <DialogTitle className="uppercase tracking-widest text-sm">
//             Create Subscription
//           </DialogTitle>
//         </DialogHeader>

//         <Separator />

//         <ScrollArea className="max-h-[80vh] pr-2">
//           <form
//             onSubmit={form.handleSubmit(onSubmit as any, onError)}
//             className="space-y-5 pr-2"
//           >
//             {/* ── Mode Toggle (New Customer first) ── */}
//             <div className={` grid ${!isCustomer ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
//               <button
//                 type="button"
//                 onClick={() => handleModeSwitch("new")}
//                 className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${mode === "new"
//                   ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 scale-[1.02]"
//                   : "border-slate-200 text-slate-500 dark:border-slate-700"
//                   }`}
//               >
//                 <UserPlus className="w-4 h-4" /> New Customer
//               </button>
//               {!isCustomer && (
//                 <button
//                   type="button"
//                   onClick={() => handleModeSwitch("existing")}
//                   className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${mode === "existing"
//                     ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 scale-[1.02]"
//                     : "border-slate-200 text-slate-500 dark:border-slate-700"
//                     }`}
//                 >
//                   <UserCheck className="w-4 h-4" /> Existing Customer
//                 </button>
//               )}
//             </div>

//             {/* ── Wizard Step Indicator (New Customer only) ── */}
//             {isNewMode && (
//               <div className="flex items-center justify-center gap-3 py-1">
//                 <div className="flex items-center gap-2">
//                   <div
//                     className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${step >= 1
//                       ? "bg-indigo-600 text-white scale-100"
//                       : "bg-slate-200 text-slate-500 dark:bg-slate-700"
//                       }`}
//                   >
//                     {step > 1 ? (
//                       <Check className="w-4 h-4" />
//                     ) : (
//                       <ContactRound className="w-4 h-4" />
//                     )}
//                   </div>
//                   <span
//                     className={`text-xs font-medium transition-colors duration-300 ${step === 1 ? "text-indigo-700 dark:text-indigo-400" : "text-slate-400"}`}
//                   >
//                     Customer Info
//                   </span>
//                 </div>

//                 <div className="relative h-0.5 w-10 bg-slate-200 dark:bg-slate-700 overflow-hidden rounded-full">
//                   <div
//                     className={`absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-500 ease-out ${step === 2 ? "w-full" : "w-0"
//                       }`}
//                   />
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <div
//                     className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${step === 2
//                       ? "bg-indigo-600 text-white scale-100"
//                       : "bg-slate-200 text-slate-500 dark:bg-slate-700"
//                       }`}
//                   >
//                     <HeartHandshake className="w-4 h-4" />
//                   </div>
//                   <span
//                     className={`text-xs font-medium transition-colors duration-300 ${step === 2 ? "text-indigo-700 dark:text-indigo-400" : "text-slate-400"}`}
//                   >
//                     Plan & Nominee
//                   </span>
//                 </div>
//               </div>
//             )}

//             {/* ══════════════════ EXISTING CUSTOMER (single step) ══════════════════ */}
//             {mode === "existing" && !isCustomer && (
//               <div className="space-y-5 animate-in fade-in duration-300">
//                 <div className="space-y-2">
//                   <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
//                     Search Customer
//                   </p>

//                   {selectedCustomer ? (
//                     <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 animate-in zoom-in-95 duration-200">
//                       <div className="flex items-center gap-2">
//                         <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
//                           {selectedCustomer.name?.charAt(0)?.toUpperCase() ??
//                             "C"}
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
//                             {selectedCustomer.name}
//                           </p>
//                           <p className="text-xs text-slate-500 font-mono">
//                             {selectedCustomer.phone}
//                           </p>
//                         </div>
//                       </div>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="icon"
//                         className="h-7 w-7"
//                         onClick={clearCustomer}
//                       >
//                         <X className="w-3.5 h-3.5" />
//                       </Button>
//                     </div>
//                   ) : (
//                     <div className="relative">
//                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                       <Input
//                         placeholder="Search by name or phone..."
//                         className="pl-10"
//                         value={customerSearch}
//                         onChange={(e) => {
//                           setCustomerSearch(e.target.value);
//                           setShowResults(true);
//                         }}
//                         onFocus={() => setShowResults(true)}
//                       />
//                       {showResults && debouncedSearch.trim().length >= 2 && (
//                         <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
//                           {isSearching ? (
//                             <p className="px-3 py-3 text-xs text-slate-400 text-center">
//                               Searching...
//                             </p>
//                           ) : customerResults.length === 0 ? (
//                             <p className="px-3 py-3 text-xs text-slate-400 text-center">
//                               No customers found
//                             </p>
//                           ) : (
//                             customerResults.map((c) => (
//                               <button
//                                 key={String(c._id)}
//                                 type="button"
//                                 onClick={() => pickCustomer(c)}
//                                 className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
//                               >
//                                 <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
//                                   {c.name?.charAt(0)?.toUpperCase() ?? "C"}
//                                 </div>
//                                 <div className="min-w-0">
//                                   <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
//                                     {c.name}
//                                   </p>
//                                   <p className="text-xs text-slate-500 font-mono">
//                                     {c.phone}
//                                   </p>
//                                 </div>
//                               </button>
//                             ))
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                   {form.formState.errors.customerId && (
//                     <p className="text-xs text-red-500">
//                       {form.formState.errors.customerId.message}
//                     </p>
//                   )}
//                 </div>

//                 <Separator />
//                 <PlanBlock
//                   form={form}
//                   packages={packages}
//                   selectedPackage={selectedPackage}
//                   selectedPackageId={selectedPackageId}
//                   availablePlans={availablePlans}
//                   selectedPlan={selectedPlan}
//                 />
//                 <Separator />

//                 {packageIsJoint ? (
//                   <JoinMemberBlock form={form} />
//                 ) : (
//                   <SubscribeForBlock form={form} />
//                 )}

//                 <Separator />
//                 <NomineeBlock form={form} packageIsJoint={packageIsJoint} />

//                 <Button
//                   type="submit"
//                   variant="outline"
//                   className="group hover:cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white duration-300 w-full mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? (
//                     <span className="flex items-center gap-2">
//                       <Loader2 className="w-4 h-4 animate-spin" /> Creating...
//                     </span>
//                   ) : (
//                     <span className="flex items-center gap-2">
//                       <Check className="w-4 h-4" /> Create Subscription
//                     </span>
//                   )}
//                 </Button>
//               </div>
//             )}

//             {/* ══════════════════ NEW CUSTOMER (multistep wizard) ══════════════════ */}
//             {isNewMode && (
//               <div className="overflow-hidden">
//                 {step === 1 && (
//                   <div key="step1" className={`space-y-4 ${slideClass}`}>
//                     <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
//                       Basic Info
//                     </p>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="space-y-1.5 col-span-2">
//                         <Input
//                           placeholder="Full Name *"
//                           {...form.register("name")}
//                         />
//                         {form.formState.errors.name && (
//                           <p className="text-xs text-red-500">
//                             {form.formState.errors.name.message}
//                           </p>
//                         )}
//                       </div>
//                       <div className="space-y-1.5">
//                         <Input
//                           placeholder="Phone *"
//                           {...form.register("phone")}
//                         />
//                         {form.formState.errors.phone && (
//                           <p className="text-xs text-red-500">
//                             {form.formState.errors.phone.message}
//                           </p>
//                         )}
//                       </div>
//                       <Input placeholder="Email" {...form.register("email")} />
//                       <div className="space-y-1.5">
//                         <Input placeholder="NID" {...form.register("nid")} />
//                         {form.formState.errors.nid && (
//                           <p className="text-xs text-red-500">
//                             {form.formState.errors.nid.message}
//                           </p>
//                         )}
//                       </div>

//                       <div className="space-y-1.5">
//                         <Input
//                           type="date"
//                           placeholder="Date of Birth *"
//                           max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
//                           min={new Date(new Date().setFullYear(new Date().getFullYear() - 65)).toISOString().split("T")[0]}
//                           {...form.register("dateOfBirth")}
//                         />
//                         {form.formState.errors.dateOfBirth && (
//                           <p className="text-xs text-red-500">
//                             {form.formState.errors.dateOfBirth.message}
//                           </p>
//                         )}
//                       </div>


//                       <div className="space-y-1.5 col-span-2">
//                         <Select
//                           value={form.watch("gender") ?? ""}
//                           onValueChange={(v) =>
//                             form.setValue("gender", v as any, {
//                               shouldValidate: true,
//                             })
//                           }
//                         >
//                           <SelectTrigger className="w-full">
//                             <SelectValue placeholder="Gender *" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="MALE">Male</SelectItem>
//                             <SelectItem value="FEMALE">Female</SelectItem>
//                             <SelectItem value="OTHER">Other</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         {form.formState.errors.gender && (
//                           <p className="text-xs text-red-500">
//                             {form.formState.errors.gender.message}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     <Separator />
//                     <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
//                       Address
//                     </p>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="space-y-1.5">
//                         <Select
//                           value={divisionId}
//                           onValueChange={handleDivisionChange}
//                         >
//                           <SelectTrigger className="h-12 w-full text-base px-4">
//                             <span>
//                               {divisionId
//                                 ? divisions.find((d) => d.id === divisionId)
//                                   ?.name
//                                 : "Division *"}
//                             </span>
//                           </SelectTrigger>
//                           <SelectContent>
//                             {divisions.map((d) => (
//                               <SelectItem key={d.id} value={d.id}>
//                                 {d.name}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         {form.formState.errors.division && (
//                           <p className="text-xs text-red-500">
//                             {form.formState.errors.division.message}
//                           </p>
//                         )}
//                       </div>

//                       <div className="space-y-1.5">
//                         <Select
//                           value={districtId}
//                           onValueChange={handleDistrictChange}
//                           disabled={!divisionId}
//                         >
//                           <SelectTrigger className="h-12 w-full text-base px-4">
//                             <span>
//                               {districtId
//                                 ? availableDistricts.find(
//                                   (d) => d.id === districtId,
//                                 )?.name
//                                 : "District *"}
//                             </span>
//                           </SelectTrigger>
//                           <SelectContent>
//                             {availableDistricts.map((d) => (
//                               <SelectItem key={d.id} value={d.id}>
//                                 {d.name}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         {form.formState.errors.district && (
//                           <p className="text-xs text-red-500">
//                             {form.formState.errors.district.message}
//                           </p>
//                         )}
//                       </div>

//                       <div className="space-y-1.5">
//                         <Select
//                           value={thanaId}
//                           onValueChange={handleThanaChange}
//                           disabled={!districtId}
//                         >
//                           <SelectTrigger className="h-12 w-full text-base px-4">
//                             <span>
//                               {thanaId
//                                 ? availableUpazilas.find(
//                                   (u) => u.id === thanaId,
//                                 )?.name
//                                 : "Thana *"}
//                             </span>
//                           </SelectTrigger>
//                           <SelectContent>
//                             {availableUpazilas.map((u) => (
//                               <SelectItem key={u.id} value={u.id}>
//                                 {u.name}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         {form.formState.errors.thana && (
//                           <p className="text-xs text-red-500">
//                             {form.formState.errors.thana.message}
//                           </p>
//                         )}
//                       </div>

//                       <Input
//                         placeholder="Street"
//                         className="h-8 w-full text-base px-4"
//                         {...form.register("street")}
//                       />
//                     </div>

//                     <Button
//                       type="button"
//                       onClick={goNext}
//                       variant="outline"
//                       className="group hover:cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white duration-300 w-full mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60"
//                     >
//                       Continue <ArrowRight className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 )}

//                 {step === 2 && (
//                   <div key="step2" className={`space-y-5 ${slideClass}`}>
//                     <PlanBlock
//                       form={form}
//                       packages={packages}
//                       selectedPackage={selectedPackage}
//                       selectedPackageId={selectedPackageId}
//                       availablePlans={availablePlans}
//                       selectedPlan={selectedPlan}
//                     />

//                     {packageIsJoint && (
//                       <>
//                         <Separator />
//                         <JoinMemberBlock form={form} />
//                       </>
//                     )}

//                     <Separator />
//                     <NomineeBlock form={form} packageIsJoint={packageIsJoint} />

//                     <div className="flex gap-2">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={goBack}
//                         className="gap-2 transition-transform duration-200 hover:scale-[1.01]"
//                       >
//                         <ArrowLeft className="w-4 h-4" /> Back
//                       </Button>
//                       <Button
//                         type="submit"
//                         variant="outline"
//                         className="flex-1 group dark:text-white dark:hover:bg-indigo-500 hover:cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white duration-300 w-full mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60"
//                         disabled={isLoading}
//                       >
//                         {isLoading ? (
//                           <span className="flex items-center gap-2">
//                             <Loader2 className="w-4 h-4 animate-spin" />{" "}
//                             Creating...
//                           </span>
//                         ) : (
//                           <span className="flex items-center gap-2">
//                             <Check className="w-4 h-4" /> Create Subscription
//                           </span>
//                         )}
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </form>
//           <ScrollBar orientation="vertical" />
//         </ScrollArea>
//       </DialogContent>
//     </Dialog>
//   );
// }

// // ── shared blocks ──

// // Only rendered for: mode === "existing" && !packageIsJoint
// function SubscribeForBlock({ form }: { form: any }) {
//   const subscribeFor = form.watch("subscribeFor");
//   return (
//     <div className="space-y-3">
//       <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
//         Subscribing For
//       </p>
//       <div className="grid grid-cols-2 gap-2">
//         <button
//           type="button"
//           onClick={() =>
//             form.setValue("subscribeFor", "SELF", { shouldValidate: true })
//           }
//           className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${subscribeFor === "SELF"
//             ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 scale-[1.02]"
//             : "border-slate-200 text-slate-500 dark:border-slate-700"
//             }`}
//         >
//           <User className="w-4 h-4" /> For Myself
//         </button>
//         <button
//           type="button"
//           onClick={() =>
//             form.setValue("subscribeFor", "OTHER", { shouldValidate: true })
//           }
//           className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${subscribeFor === "OTHER"
//             ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 scale-[1.02]"
//             : "border-slate-200 text-slate-500 dark:border-slate-700"
//             }`}
//         >
//           <Users className="w-4 h-4" /> For Someone Else
//         </button>
//       </div>

//       {subscribeFor === "OTHER" && (
//         <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-250">
//           <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 pt-1">
//             Beneficiary Info
//           </p>
//           <div className="grid grid-cols-2 gap-3">
//             <div className="space-y-1.5 col-span-2">
//               <Input
//                 placeholder="Beneficiary Name *"
//                 {...form.register("beneficiaryName")}
//               />
//               {form.formState.errors.beneficiaryName && (
//                 <p className="text-xs text-red-500">
//                   {form.formState.errors.beneficiaryName.message}
//                 </p>
//               )}
//             </div>
//             <div className="space-y-1.5">
//               <Input
//                 placeholder="Beneficiary Phone *"
//                 {...form.register("beneficiaryPhone")}
//               />
//               {form.formState.errors.beneficiaryPhone && (
//                 <p className="text-xs text-red-500">
//                   {form.formState.errors.beneficiaryPhone.message}
//                 </p>
//               )}
//             </div>
//             <Input
//               type="date"
//               placeholder="Date of Birth"
//               {...form.register("beneficiaryDateOfBirth")}
//             />
//             <div className="space-y-1.5 col-span-2">
//               <Input
//                 placeholder="Relationship (e.g. Spouse, Son, Father) *"
//                 {...form.register("beneficiaryRelationship")}
//               />
//               {form.formState.errors.beneficiaryRelationship && (
//                 <p className="text-xs text-red-500">
//                   {form.formState.errors.beneficiaryRelationship.message}
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // 2nd covered person — shown whenever the selected package is Joint
// // (both existing-customer and new-customer flows)
// function JoinMemberBlock({ form }: { form: any }) {
//   return (
//     <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-250">
//       <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
//         <Users className="w-3.5 h-3.5" /> Join Member Info <span className="text-red-500">*</span>
//       </p>
//       <p className="text-[11px] text-slate-400 pb-1">
//         This package covers 2 persons. Please provide the 2nd person&apos;s info.
//       </p>
//       <div className="grid grid-cols-2 gap-3">
//         <div className="space-y-1.5 col-span-2">
//           <Input
//             placeholder="Join Member Name *"
//             {...form.register("joinMemberName")}
//           />
//           {form.formState.errors.joinMemberName && (
//             <p className="text-xs text-red-500">
//               {form.formState.errors.joinMemberName.message}
//             </p>
//           )}
//         </div>
//         <div className="space-y-1.5">
//           <Input
//             placeholder="Join Member Phone *"
//             {...form.register("joinMemberPhone")}
//           />
//           {form.formState.errors.joinMemberPhone && (
//             <p className="text-xs text-red-500">
//               {form.formState.errors.joinMemberPhone.message}
//             </p>
//           )}
//         </div>
//         <Input
//           type="date"
//           placeholder="Date of Birth"
//           {...form.register("joinMemberDateOfBirth")}
//         />
//         <div className="space-y-1.5 col-span-2">
//           <Input
//             placeholder="Relationship (e.g. Spouse, Son, Father) *"
//             {...form.register("joinMemberRelationship")}
//           />
//           {form.formState.errors.joinMemberRelationship && (
//             <p className="text-xs text-red-500">
//               {form.formState.errors.joinMemberRelationship.message}
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Subscription-level nominee — always required.
// // When the package is Joint, offers a shortcut to reuse the Join Member's info.
// function NomineeBlock({
//   form,
//   packageIsJoint,
// }: {
//   form: any;
//   packageIsJoint: boolean;
// }) {
//   const source = form.watch("subscriptionNomineeSource");
//   const useJoinMemberAsNominee = packageIsJoint && source === "JOIN_MEMBER";

//   return (
//     <div className="space-y-3">
//       <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
//         <ShieldCheck className="w-3.5 h-3.5" /> Nominee <span className="text-red-500">*</span>
//       </p>

//       {packageIsJoint && (
//         <label className="flex items-center gap-2 text-sm cursor-pointer select-none rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
//           <input
//             type="checkbox"
//             checked={useJoinMemberAsNominee}
//             onChange={(e) =>
//               form.setValue(
//                 "subscriptionNomineeSource",
//                 e.target.checked ? "JOIN_MEMBER" : "OTHER",
//                 { shouldValidate: true },
//               )
//             }
//             className="h-4 w-4 rounded border-slate-300"
//           />
//           Select the Join Person as Nominee
//         </label>
//       )}

//       {useJoinMemberAsNominee ? (
//         <p className="text-xs text-slate-400 italic px-1 animate-in fade-in duration-200">
//           Nominee will be set to the Join Member&apos;s information.
//         </p>
//       ) : (
//         <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-250">
//           <div className="space-y-1.5 col-span-2">
//             <Input
//               placeholder="Nominee Name *"
//               {...form.register("subscriptionNomineeName")}
//             />
//             {form.formState.errors.subscriptionNomineeName && (
//               <p className="text-xs text-red-500">
//                 {form.formState.errors.subscriptionNomineeName.message}
//               </p>
//             )}
//           </div>
//           <div className="space-y-1.5">
//             <Input
//               placeholder="Nominee Phone *"
//               {...form.register("subscriptionNomineePhone")}
//             />
//             {form.formState.errors.subscriptionNomineePhone && (
//               <p className="text-xs text-red-500">
//                 {form.formState.errors.subscriptionNomineePhone.message}
//               </p>
//             )}
//           </div>
//           <Input
//             type="date"
//             placeholder="Date of Birth"
//             {...form.register("subscriptionNomineeDateOfBirth")}
//           />
//           <div className="space-y-1.5 col-span-2">
//             <Input
//               placeholder="Relationship (e.g. Spouse, Son, Father) *"
//               {...form.register("subscriptionNomineeRelationship")}
//             />
//             {form.formState.errors.subscriptionNomineeRelationship && (
//               <p className="text-xs text-red-500">
//                 {form.formState.errors.subscriptionNomineeRelationship.message}
//               </p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function PlanBlock({
//   form,
//   packages,
//   selectedPackage,
//   selectedPackageId,
//   availablePlans,
//   selectedPlan,
// }: {
//   form: any;
//   packages: IPackageWithPlans[];
//   selectedPackage?: IPackageWithPlans;
//   selectedPackageId: string;
//   availablePlans: IPackagePlan[];
//   selectedPlan?: IPackagePlan;
// }) {
//   return (
//     <div className="space-y-4">
//       <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
//         Subscription
//       </p>

//       <div className="grid grid-cols-1 gap-3">
//         <div className="space-y-1.5">
//           <Select
//             value={form.watch("package")}
//             onValueChange={(v: string) =>
//               form.setValue("package", v as any, { shouldValidate: true })
//             }
//           >
//             <SelectTrigger className="w-full">
//               <span className="flex items-center gap-1.5">
//                 {selectedPackage?.isJoint ? (
//                   <Users className="w-3.5 h-3.5 text-slate-400" />
//                 ) : selectedPackage ? (
//                   <User className="w-3.5 h-3.5 text-slate-400" />
//                 ) : null}
//                 {selectedPackage ? selectedPackage.name : "Select Package"}
//               </span>
//             </SelectTrigger>
//             <SelectContent>
//               {packages.map((pkg) => (
//                 <SelectItem key={pkg._id} value={pkg._id}>
//                   <span className="flex items-center gap-1.5">
//                     {pkg.isJoint ? (
//                       <Users className="w-3.5 h-3.5 text-slate-400" />
//                     ) : (
//                       <User className="w-3.5 h-3.5 text-slate-400" />
//                     )}
//                     {pkg.name}
//                   </span>
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//           {form.formState.errors.package && (
//             <p className="text-xs text-red-500">
//               {form.formState.errors.package.message}
//             </p>
//           )}
//         </div>

//         <div className="space-y-1.5">
//           <Select
//             value={form.watch("planType") ?? ""}
//             onValueChange={(v: string) =>
//               form.setValue("planType", v as PlanType, { shouldValidate: true })
//             }
//             disabled={!selectedPackageId}
//           >
//             <SelectTrigger className="w-full">
//               <SelectValue placeholder="Select Plan" />
//             </SelectTrigger>
//             <SelectContent>
//               {availablePlans.map((plan) => {
//                 const price = plan.discountPrice || plan.regularPrice;
//                 return (
//                   <SelectItem key={plan.type} value={plan.type}>
//                     {PLAN_LABELS[plan.type]} — {formatCurrency(price)}
//                   </SelectItem>
//                 );
//               })}
//             </SelectContent>
//           </Select>
//           {form.formState.errors.planType && (
//             <p className="text-xs text-red-500">
//               {form.formState.errors.planType.message}
//             </p>
//           )}
//         </div>
//       </div>

//       {selectedPlan && (
//         <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 animate-in fade-in zoom-in-95 duration-200">
//           <span className="text-sm text-slate-500 dark:text-slate-400">
//             Price
//           </span>
//           <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
//             {formatCurrency(form.watch("price"))}
//           </span>
//         </div>
//       )}
//     </div>
//   );
// }



// v2 

/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Search,
  UserCheck,
  UserPlus,
  X,
  Check,
  User,
  Users,
  ArrowRight,
  ArrowLeft,
  ContactRound,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateSubscriptionMutation } from "@/redux/features/subscription/subscription.api";
import { useGetAllCustomersQuery } from "@/redux/features/user/user.api";
import { useGetAllPackagesQuery } from "@/redux/features/package/package.api";
import { IUser } from "@/types/user.types";
import { PlanType } from "@/types/subscription.types";

import {
  divisions,
  getDistrictsByDivision,
  getUpazilasByDistrict,
} from "@/lib/bd-address";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// ── local shape assumption for package plans (adjust if IPackage differs) ──
interface IPackagePlan {
  type: PlanType;
  regularPrice: number;
  discountPrice?: number;
  durationInMonths?: number;
}
interface IPackageWithPlans {
  _id: string;
  name: string;
  plans: IPackagePlan[];
  // true -> this package covers 2 persons; subscription needs a 2nd person's info
  isJoint?: boolean;
}

const PLAN_LABELS: Record<PlanType, string> = {
  [PlanType.MONTHLY]: "Monthly",
  [PlanType.QUARTERLY]: "Quarterly",
  [PlanType.HALF_YEARLY]: "Half Yearly",
  [PlanType.YEARLY]: "Yearly",
  [PlanType.LIFETIME]: "Lifetime",
};

// options for the Join Member relationship dropdown
const RELATIONSHIP_OPTIONS = ["Husband", "Wife", "Son", "Daughter"] as const;

const formatCurrency = (n?: number) => `৳${(n ?? 0).toLocaleString("en-BD")}`;

const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};


// ── schema ──────────────────────────────────────────────────────────────────

const schema = z
  .object({
    mode: z.enum(["new", "existing"]),

    // existing customer
    customerId: z.string().optional(),

    // new customer
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    nid: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    division: z.string().optional(),
    district: z.string().optional(),
    thana: z.string().optional(),
    street: z.string().optional(),

    // who the subscription actually covers.
    // Toggle is only shown for: mode === "existing" && !packageIsJoint
    subscribeFor: z.enum(["SELF", "OTHER"]),
    beneficiaryName: z.string().optional(),
    beneficiaryPhone: z.string().optional(),
    beneficiaryDateOfBirth: z.string().optional(),
    beneficiaryRelationship: z.string().optional(),

    // common
    package: z.string().min(1, "Please select a package"),
    planType: z.nativeEnum(PlanType, { error: "Please select a plan" }),
    price: z.number().min(0),

    // synced from the selected package (see useEffect below) — not user-editable
    packageIsJoint: z.boolean().optional().default(false),

    // 2nd covered person — required only when packageIsJoint === true
    joinMemberName: z.string().optional(),
    joinMemberPhone: z.string().optional(),
    joinMemberDateOfBirth: z.string().optional(),
    joinMemberRelationship: z.string().optional(),

    // subscription-level nominee — always required.
    // source === "JOIN_MEMBER" only possible when packageIsJoint === true
    subscriptionNomineeSource: z.enum(["JOIN_MEMBER", "OTHER"]).default("OTHER"),
    subscriptionNomineeName: z.string().optional(),
    subscriptionNomineePhone: z.string().optional(),
    subscriptionNomineeDateOfBirth: z.string().optional(),
    subscriptionNomineeRelationship: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "existing") {
      if (!data.customerId) {
        ctx.addIssue({
          code: "custom",
          path: ["customerId"],
          message: "Please select a customer",
        });
      }
    } else {
      if (!data.name?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Name is required",
        });
      if (!data.phone?.trim() || data.phone.length !== 11) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Valid 11-digit phone required",
        });
      }

      if (!data.dateOfBirth?.trim()) {
        ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Date of birth is required" });
      } else {
        const age = calculateAge(data.dateOfBirth);
        if (age < 18 || age > 65) {
          ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Age must be between 18 and 65 years" });
        }
      }
      if (!data.gender)
        ctx.addIssue({
          code: "custom",
          path: ["gender"],
          message: "Gender is required",
        });
      if (!data.division?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["division"],
          message: "Division is required",
        });
      if (!data.district?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["district"],
          message: "District is required",
        });
      if (!data.thana?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["thana"],
          message: "Thana is required",
        });
    }

    // Self/Someone toggle is only ever meaningful for: existing customer + single package
    const subscribeForApplies = data.mode === "existing" && !data.packageIsJoint;
    if (subscribeForApplies && data.subscribeFor === "OTHER") {
      if (!data.beneficiaryName?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["beneficiaryName"],
          message: "Beneficiary name is required",
        });
      }
      if (
        !data.beneficiaryPhone?.trim() ||
        data.beneficiaryPhone.length !== 11
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["beneficiaryPhone"],
          message: "Valid 11-digit phone required",
        });
      }
      if (!data.beneficiaryRelationship?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["beneficiaryRelationship"],
          message: "Relationship is required",
        });
      }
    }

    // Join Member — required whenever the selected package is Joint
    if (data.packageIsJoint) {
      if (!data.joinMemberName?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["joinMemberName"],
          message: "Join member name is required",
        });
      }
      if (
        !data.joinMemberPhone?.trim() ||
        data.joinMemberPhone.length !== 11
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["joinMemberPhone"],
          message: "Valid 11-digit phone required",
        });
      }
      if (!data.joinMemberRelationship?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["joinMemberRelationship"],
          message: "Relationship is required",
        });
      }
    }

    // Nominee — always required.
    // If Joint package AND nominee source is JOIN_MEMBER, info is copied
    // from joinMember at submit time, so no separate fields needed here.
    const nomineeUsesJoinMember =
      data.packageIsJoint && data.subscriptionNomineeSource === "JOIN_MEMBER";

    if (!nomineeUsesJoinMember) {
      if (!data.subscriptionNomineeName?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["subscriptionNomineeName"],
          message: "Nominee name is required",
        });
      }
      if (
        !data.subscriptionNomineePhone?.trim() ||
        data.subscriptionNomineePhone.length !== 11
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["subscriptionNomineePhone"],
          message: "Valid 11-digit phone required",
        });
      }
      if (!data.subscriptionNomineeRelationship?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["subscriptionNomineeRelationship"],
          message: "Relationship is required",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  mode: "new",
  customerId: "",
  name: "",
  phone: "",
  email: "",
  nid: "",
  dateOfBirth: "",
  gender: undefined,
  division: "",
  district: "",
  thana: "",
  street: "",
  subscribeFor: "SELF",
  beneficiaryName: "",
  beneficiaryPhone: "",
  beneficiaryDateOfBirth: "",
  beneficiaryRelationship: "",
  package: "",
  planType: undefined as any,
  price: 0,
  packageIsJoint: false,
  joinMemberName: "",
  joinMemberPhone: "",
  joinMemberDateOfBirth: "",
  joinMemberRelationship: "",
  subscriptionNomineeSource: "OTHER",
  subscriptionNomineeName: "",
  subscriptionNomineePhone: "",
  subscriptionNomineeDateOfBirth: "",
  subscriptionNomineeRelationship: "",
};

interface CreateSubscriptionModalProps {
  onSuccess?: () => void;
  isCustomer?: boolean;
}

export function CreateSubscriptionModal({
  onSuccess,
  isCustomer
}: CreateSubscriptionModalProps) {
  const [open, setOpen] = useState(false);
  const [createSubscription, { isLoading }] = useCreateSubscriptionMutation();

  // wizard step (only relevant for mode === "new")
  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // customer search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<IUser | null>(null);
  const [showResults, setShowResults] = useState(false);

  // ── division / district / thana cascading selection ──
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(customerSearch), 350);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const { data: customersData, isFetching: isSearching } =
    useGetAllCustomersQuery(
      { searchTerm: debouncedSearch, limit: 8 },
      { skip: debouncedSearch.trim().length < 2 },
    );
  const customerResults: IUser[] = customersData?.data ?? [];

  const { data: packagesData } = useGetAllPackagesQuery({ limit: 100 } as any);

  const packages: IPackageWithPlans[] = useMemo(() => {
    const raw = packagesData as any;
    if (!raw) return [];
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.data)) return raw.data.data;
    return [];
  }, [packagesData]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const mode = form.watch("mode");
  const selectedPackageId = form.watch("package");
  const selectedPlanType = form.watch("planType");

  const selectedPackage = useMemo(
    () => packages.find((p) => p._id === selectedPackageId),
    [packages, selectedPackageId],
  );
  const packageIsJoint = !!selectedPackage?.isJoint;

  // self/someone toggle only makes sense for existing customer + single package
  const showSubscribeForToggle = mode === "existing" && !packageIsJoint;

  const availablePlans = useMemo(
    () => selectedPackage?.plans ?? [],
    [selectedPackage],
  );

  const selectedPlan = useMemo(
    () => availablePlans.find((p) => p.type === selectedPlanType),
    [availablePlans, selectedPlanType],
  );

  useEffect(() => {
    if (selectedPlan) {
      const price = selectedPlan.discountPrice || selectedPlan.regularPrice;
      form.setValue("price", price, { shouldValidate: true });
    }
  }, [selectedPlan, form]);

  useEffect(() => {
    if (selectedPackageId) {
      form.setValue("planType", undefined as any);
      form.setValue("price", 0);
    }

    // sync the hidden packageIsJoint flag with the selected package
    form.setValue("packageIsJoint", packageIsJoint, { shouldValidate: true });

    if (!packageIsJoint) {
      // clear join member data when switching away from a Joint package
      form.setValue("joinMemberName", "");
      form.setValue("joinMemberPhone", "");
      form.setValue("joinMemberDateOfBirth", "");
      form.setValue("joinMemberRelationship", "");
      // "use join member as nominee" is impossible without a join member
      if (form.getValues("subscriptionNomineeSource") === "JOIN_MEMBER") {
        form.setValue("subscriptionNomineeSource", "OTHER");
      }
    }

    // self/someone toggle only applies for existing + single package —
    // reset it whenever that condition no longer holds
    if (!(mode === "existing" && !packageIsJoint)) {
      form.setValue("subscribeFor", "SELF");
      form.setValue("beneficiaryName", "");
      form.setValue("beneficiaryPhone", "");
      form.setValue("beneficiaryDateOfBirth", "");
      form.setValue("beneficiaryRelationship", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackageId, packageIsJoint, mode]);

  const resetAll = () => {
    form.reset(defaultValues);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setDebouncedSearch("");
    setDivisionId("");
    setDistrictId("");
    setThanaId("");
    setStep(1);
    setDirection("forward");
  };

  const handleModeSwitch = (m: "existing" | "new") => {
    form.setValue("mode", m);
    setStep(1);
    setDirection("forward");
    if (m === "new") {
      setSelectedCustomer(null);
      form.setValue("customerId", "");
    } else {
      setCustomerSearch("");
    }
  };


  const goNext = async () => {
    const values = form.getValues();

    const missing: { field: keyof FormValues; message: string }[] = [];

    if (!values.name?.trim())
      missing.push({ field: "name", message: "Name is required" });
    if (!values.phone?.trim() || values.phone.trim().length !== 11)
      missing.push({
        field: "phone",
        message: "Valid 11-digit phone required",
      });


    if (!values.dateOfBirth?.trim()) {
      missing.push({ field: "dateOfBirth", message: "Date of birth is required" });
    } else {
      const age = calculateAge(values.dateOfBirth);
      if (age < 18 || age > 65) {
        missing.push({ field: "dateOfBirth", message: "Age must be between 18 and 65 years" });
      }
    }
    if (!values.gender)
      missing.push({ field: "gender", message: "Gender is required" });
    if (!values.division?.trim())
      missing.push({ field: "division", message: "Division is required" });
    if (!values.district?.trim())
      missing.push({ field: "district", message: "District is required" });
    if (!values.thana?.trim())
      missing.push({ field: "thana", message: "Thana is required" });

    if (missing.length > 0) {
      missing.forEach(({ field, message }) => {
        form.setError(field, { type: "manual", message });
      });
      toast.error(missing[0].message);
      return;
    }

    setDirection("forward");
    setStep(2);
  };

  const goBack = () => {
    setDirection("back");
    setStep(1);
  };

  const pickCustomer = (c: IUser) => {
    setSelectedCustomer(c);
    form.setValue("customerId", String(c._id), { shouldValidate: true });
    setShowResults(false);
    setCustomerSearch("");
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    form.setValue("customerId", "");
  };

  const handleDivisionChange = (id: string | null) => {
    const value = id ?? "";
    const division = divisions.find((d) => d.id === value);
    setDivisionId(value);
    setDistrictId("");
    setThanaId("");
    form.setValue("division", division?.name ?? "", { shouldValidate: true });
    form.setValue("district", "", { shouldValidate: true });
    form.setValue("thana", "", { shouldValidate: true });
  };

  const handleDistrictChange = (id: string | null) => {
    const value = id ?? "";
    const district = availableDistricts.find((d) => d.id === value);
    setDistrictId(value);
    setThanaId("");
    form.setValue("district", district?.name ?? "", { shouldValidate: true });
    form.setValue("thana", "", { shouldValidate: true });
  };

  const handleThanaChange = (id: string | null) => {
    const value = id ?? "";
    const upazila = availableUpazilas.find((u) => u.id === value);
    setThanaId(value);
    form.setValue("thana", upazila?.name ?? "", { shouldValidate: true });
  };

  const onError = (errors: typeof form.formState.errors) => {
    const firstError = Object.values(errors)[0];
    toast.error((firstError as any)?.message || "Please check the form fields");
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedPlan) {
      toast.error("Please select a valid plan");
      return;
    }

    const useJoinMemberAsNominee =
      values.packageIsJoint && values.subscriptionNomineeSource === "JOIN_MEMBER";

    const nomineePayload = useJoinMemberAsNominee
      ? {
          source: "JOIN_MEMBER" as const,
          name: values.joinMemberName!.trim(),
          phone: values.joinMemberPhone!.trim(),
          relationship: values.joinMemberRelationship!.trim(),
          ...(values.joinMemberDateOfBirth && {
            dateOfBirth: values.joinMemberDateOfBirth,
          }),
        }
      : {
          source: "OTHER" as const,
          name: values.subscriptionNomineeName!.trim(),
          phone: values.subscriptionNomineePhone!.trim(),
          relationship: values.subscriptionNomineeRelationship!.trim(),
          ...(values.subscriptionNomineeDateOfBirth && {
            dateOfBirth: values.subscriptionNomineeDateOfBirth,
          }),
        };

    const basePayload = {
      package: values.package,
      planType: values.planType,
      durationInMonths: selectedPlan.durationInMonths,
      price: values.price,
      subscribeFor: values.subscribeFor,
      ...(showSubscribeForToggle &&
        values.subscribeFor === "OTHER" && {
          beneficiary: {
            name: values.beneficiaryName!.trim(),
            phone: values.beneficiaryPhone!.trim(),
            relationship: values.beneficiaryRelationship!.trim(),
            ...(values.beneficiaryDateOfBirth && {
              dateOfBirth: values.beneficiaryDateOfBirth,
            }),
          },
        }),
      ...(values.packageIsJoint && {
        joinMember: {
          name: values.joinMemberName!.trim(),
          phone: values.joinMemberPhone!.trim(),
          relationship: values.joinMemberRelationship!.trim(),
          ...(values.joinMemberDateOfBirth && {
            dateOfBirth: values.joinMemberDateOfBirth,
          }),
        },
      }),
      nominee: nomineePayload,
    };

    let payload;

    // Customer Dashboard
    if (isCustomer) {
      // Backend should automatically use req.user.userId
      payload = basePayload;
    }

    // Staff -> Existing Customer
    else if (values.mode === "existing") {
      payload = {
        ...basePayload,
        customer: values.customerId,
      };
    }

    // Staff -> New Customer
    else {
      payload = {
        ...basePayload,
        customerPayload: {
          name: values.name!.trim(),
          phone: values.phone!.trim(),
          ...(values.email?.trim() && {
            email: values.email.trim(),
          }),

          role: "CUSTOMER" as const,
          nid: values.nid!.trim(),
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,

          address: {
            division: values.division!.trim(),
            district: values.district!.trim(),
            thana: values.thana!.trim(),
            ...(values.street?.trim() && {
              street: values.street.trim(),
            }),
          },
        },
      };
    }

    try {
      const res = await createSubscription(payload as any).unwrap();
      toast.success("Subscription created successfully");
      const paymentUrl = res?.data?.data?.paymentUrl;
      console.log(paymentUrl);
      setOpen(false);
      resetAll();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create subscription");
    }
  };

  const isNewMode = mode === "new";
  const slideClass =
    direction === "forward"
      ? "animate-in slide-in-from-right-8 fade-in duration-300 ease-out"
      : "animate-in slide-in-from-left-8 fade-in duration-300 ease-out";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetAll();
      }}
    >
      <DialogTrigger>
        <Button   className="group hover:cursor-pointer border-indigo-600 text-white bg-indigo-700 hover:bg-indigo-800 hover:shadow-xl hover:text-white duration-500 dark:text-white cursor-pointer font-bold tracking-widest transition-all  uppercase disabled:opacity-60 hover:scale-103 ease-in-out">
          <Plus className="w-4 h-4" /> New Subscription / Customer
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl w-full scrollbar-none">
        <DialogHeader className="text-center">
          <DialogTitle className="uppercase tracking-widest text-sm">
            Create Subscription
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[80vh] pr-2">
          <form
            onSubmit={form.handleSubmit(onSubmit as any, onError)}
            className="space-y-5 pr-2"
          >
            {/* ── Mode Toggle (New Customer first) ── */}
            <div className={` grid ${!isCustomer ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
              <button
                type="button"
                onClick={() => handleModeSwitch("new")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${mode === "new"
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 scale-[1.02]"
                  : "border-slate-200 text-slate-500 dark:border-slate-700"
                  }`}
              >
                <UserPlus className="w-4 h-4" /> New Customer
              </button>
              {!isCustomer && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch("existing")}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${mode === "existing"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 scale-[1.02]"
                    : "border-slate-200 text-slate-500 dark:border-slate-700"
                    }`}
                >
                  <UserCheck className="w-4 h-4" /> Existing Customer
                </button>
              )}
            </div>

            {/* ── Wizard Step Indicator (New Customer only) ── */}
            {isNewMode && (
              <div className="flex items-center justify-center gap-3 py-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${step >= 1
                      ? "bg-indigo-600 text-white scale-100"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                      }`}
                  >
                    {step > 1 ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <ContactRound className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${step === 1 ? "text-indigo-700 dark:text-indigo-400" : "text-slate-400"}`}
                  >
                    Customer Info
                  </span>
                </div>

                <div className="relative h-0.5 w-10 bg-slate-200 dark:bg-slate-700 overflow-hidden rounded-full">
                  <div
                    className={`absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-500 ease-out ${step === 2 ? "w-full" : "w-0"
                      }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${step === 2
                      ? "bg-indigo-600 text-white scale-100"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                      }`}
                  >
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${step === 2 ? "text-indigo-700 dark:text-indigo-400" : "text-slate-400"}`}
                  >
                    Plan & Nominee
                  </span>
                </div>
              </div>
            )}

            {/* ══════════════════ EXISTING CUSTOMER (single step) ══════════════════ */}
            {mode === "existing" && !isCustomer && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                    Search Customer
                  </p>

                  {selectedCustomer ? (
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {selectedCustomer.name?.charAt(0)?.toUpperCase() ??
                            "C"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {selectedCustomer.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {selectedCustomer.phone}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={clearCustomer}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search by name or phone..."
                        className="pl-10"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                      />
                      {showResults && debouncedSearch.trim().length >= 2 && (
                        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                          {isSearching ? (
                            <p className="px-3 py-3 text-xs text-slate-400 text-center">
                              Searching...
                            </p>
                          ) : customerResults.length === 0 ? (
                            <p className="px-3 py-3 text-xs text-slate-400 text-center">
                              No customers found
                            </p>
                          ) : (
                            customerResults.map((c) => (
                              <button
                                key={String(c._id)}
                                type="button"
                                onClick={() => pickCustomer(c)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {c.name?.charAt(0)?.toUpperCase() ?? "C"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                    {c.name}
                                  </p>
                                  <p className="text-xs text-slate-500 font-mono">
                                    {c.phone}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {form.formState.errors.customerId && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.customerId.message}
                    </p>
                  )}
                </div>

                <Separator />
                <PlanBlock
                  form={form}
                  packages={packages}
                  selectedPackage={selectedPackage}
                  selectedPackageId={selectedPackageId}
                  availablePlans={availablePlans}
                  selectedPlan={selectedPlan}
                />
                <Separator />

                {packageIsJoint ? (
                  <JoinMemberBlock form={form} />
                ) : (
                  <SubscribeForBlock form={form} />
                )}

                <Separator />
                <NomineeBlock form={form} packageIsJoint={packageIsJoint} />

                <Button
                  type="submit"
                  variant="outline"
                  className="group hover:cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white duration-300 w-full mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Create Subscription
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* ══════════════════ NEW CUSTOMER (multistep wizard) ══════════════════ */}
            {isNewMode && (
              <div className="overflow-hidden">
                {step === 1 && (
                  <div key="step1" className={`space-y-4 ${slideClass}`}>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                      Basic Info
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 col-span-2">
                        <Input
                          placeholder="Full Name *"
                          {...form.register("name")}
                        />
                        {form.formState.errors.name && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Input
                          placeholder="Phone *"
                          {...form.register("phone")}
                        />
                        {form.formState.errors.phone && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                      <Input placeholder="Email" {...form.register("email")} />
                      <div className="space-y-1.5">
                        <Input placeholder="NID" {...form.register("nid")} />
                        {form.formState.errors.nid && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.nid.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Input
                          type="date"
                          placeholder="Date of Birth *"
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                          min={new Date(new Date().setFullYear(new Date().getFullYear() - 65)).toISOString().split("T")[0]}
                          {...form.register("dateOfBirth")}
                        />
                        {form.formState.errors.dateOfBirth && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.dateOfBirth.message}
                          </p>
                        )}
                      </div>


                      <div className="space-y-1.5 col-span-2">
                        <Select
                          value={form.watch("gender") ?? ""}
                          onValueChange={(v) =>
                            form.setValue("gender", v as any, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Gender *" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.gender && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.gender.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                      Address
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Select
                          value={divisionId}
                          onValueChange={handleDivisionChange}
                        >
                          <SelectTrigger className="h-12 w-full text-base px-4">
                            <span>
                              {divisionId
                                ? divisions.find((d) => d.id === divisionId)
                                  ?.name
                                : "Division *"}
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
                        {form.formState.errors.division && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.division.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Select
                          value={districtId}
                          onValueChange={handleDistrictChange}
                          disabled={!divisionId}
                        >
                          <SelectTrigger className="h-12 w-full text-base px-4">
                            <span>
                              {districtId
                                ? availableDistricts.find(
                                  (d) => d.id === districtId,
                                )?.name
                                : "District *"}
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
                        {form.formState.errors.district && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.district.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Select
                          value={thanaId}
                          onValueChange={handleThanaChange}
                          disabled={!districtId}
                        >
                          <SelectTrigger className="h-12 w-full text-base px-4">
                            <span>
                              {thanaId
                                ? availableUpazilas.find(
                                  (u) => u.id === thanaId,
                                )?.name
                                : "Thana *"}
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
                        {form.formState.errors.thana && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.thana.message}
                          </p>
                        )}
                      </div>

                      <Input
                        placeholder="Street"
                        className="h-8 w-full text-base px-4"
                        {...form.register("street")}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={goNext}
                      variant="outline"
                      className="group hover:cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white duration-300 w-full mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div key="step2" className={`space-y-5 ${slideClass}`}>
                    <PlanBlock
                      form={form}
                      packages={packages}
                      selectedPackage={selectedPackage}
                      selectedPackageId={selectedPackageId}
                      availablePlans={availablePlans}
                      selectedPlan={selectedPlan}
                    />

                    {packageIsJoint && (
                      <>
                        <Separator />
                        <JoinMemberBlock form={form} />
                      </>
                    )}

                    <Separator />
                    <NomineeBlock form={form} packageIsJoint={packageIsJoint} />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="gap-2 transition-transform duration-200 hover:scale-[1.01]"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Button>
                      <Button
                        type="submit"
                        variant="outline"
                        className="flex-1 group dark:text-white dark:hover:bg-indigo-500 hover:cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white duration-300 w-full mt-2 cursor-pointer font-bold tracking-widest uppercase transition-colors disabled:opacity-60"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Creating...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Check className="w-4 h-4" /> Create Subscription
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── shared blocks ──

// Only rendered for: mode === "existing" && !packageIsJoint
function SubscribeForBlock({ form }: { form: any }) {
  const subscribeFor = form.watch("subscribeFor");
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
        Subscribing For
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            form.setValue("subscribeFor", "SELF", { shouldValidate: true })
          }
          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${subscribeFor === "SELF"
            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 scale-[1.02]"
            : "border-slate-200 text-slate-500 dark:border-slate-700"
            }`}
        >
          <User className="w-4 h-4" /> For Myself
        </button>
        <button
          type="button"
          onClick={() =>
            form.setValue("subscribeFor", "OTHER", { shouldValidate: true })
          }
          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all duration-200 ${subscribeFor === "OTHER"
            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 scale-[1.02]"
            : "border-slate-200 text-slate-500 dark:border-slate-700"
            }`}
        >
          <Users className="w-4 h-4" /> For Someone Else
        </button>
      </div>

      {subscribeFor === "OTHER" && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-250">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 pt-1">
            Beneficiary Info
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Input
                placeholder="Beneficiary Name *"
                {...form.register("beneficiaryName")}
              />
              {form.formState.errors.beneficiaryName && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.beneficiaryName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Input
                placeholder="Beneficiary Phone *"
                {...form.register("beneficiaryPhone")}
              />
              {form.formState.errors.beneficiaryPhone && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.beneficiaryPhone.message}
                </p>
              )}
            </div>
            <Input
              type="date"
              placeholder="Date of Birth"
              {...form.register("beneficiaryDateOfBirth")}
            />
            <div className="space-y-1.5 col-span-2">
              <Input
                placeholder="Relationship (e.g. Spouse, Son, Father) *"
                {...form.register("beneficiaryRelationship")}
              />
              {form.formState.errors.beneficiaryRelationship && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.beneficiaryRelationship.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 2nd covered person — shown whenever the selected package is Joint
// (both existing-customer and new-customer flows)
function JoinMemberBlock({ form }: { form: any }) {
  return (
    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-250">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> Join Member Info <span className="text-red-500">*</span>
      </p>
      <p className="text-[11px] text-slate-400 pb-1">
        This package covers 2 persons. Please provide the 2nd person&apos;s info.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Input
            placeholder="Join Member Name *"
            {...form.register("joinMemberName")}
          />
          {form.formState.errors.joinMemberName && (
            <p className="text-xs text-red-500">
              {form.formState.errors.joinMemberName.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Input
            placeholder="Join Member Phone *"
            {...form.register("joinMemberPhone")}
          />
          {form.formState.errors.joinMemberPhone && (
            <p className="text-xs text-red-500">
              {form.formState.errors.joinMemberPhone.message}
            </p>
          )}
        </div>
        <Input
          type="date"
          placeholder="Date of Birth"
          {...form.register("joinMemberDateOfBirth")}
        />
        <div className="space-y-1.5 col-span-2">
          <Select
            value={form.watch("joinMemberRelationship") ?? ""}
            onValueChange={(v: string) =>
              form.setValue("joinMemberRelationship", v, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Relationship *" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.joinMemberRelationship && (
            <p className="text-xs text-red-500">
              {form.formState.errors.joinMemberRelationship.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Subscription-level nominee — always required.
// When the package is Joint, offers a shortcut to reuse the Join Member's info.
function NomineeBlock({
  form,
  packageIsJoint,
}: {
  form: any;
  packageIsJoint: boolean;
}) {
  const source = form.watch("subscriptionNomineeSource");
  const useJoinMemberAsNominee = packageIsJoint && source === "JOIN_MEMBER";

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" /> Nominee <span className="text-red-500">*</span>
      </p>

      {packageIsJoint && (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <input
            type="checkbox"
            checked={useJoinMemberAsNominee}
            onChange={(e) =>
              form.setValue(
                "subscriptionNomineeSource",
                e.target.checked ? "JOIN_MEMBER" : "OTHER",
                { shouldValidate: true },
              )
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          Select the Join Person as Nominee
        </label>
      )}

      {useJoinMemberAsNominee ? (
        <p className="text-xs text-slate-400 italic px-1 animate-in fade-in duration-200">
          Nominee will be set to the Join Member&apos;s information.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-250">
          <div className="space-y-1.5 col-span-2">
            <Input
              placeholder="Nominee Name *"
              {...form.register("subscriptionNomineeName")}
            />
            {form.formState.errors.subscriptionNomineeName && (
              <p className="text-xs text-red-500">
                {form.formState.errors.subscriptionNomineeName.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Input
              placeholder="Nominee Phone *"
              {...form.register("subscriptionNomineePhone")}
            />
            {form.formState.errors.subscriptionNomineePhone && (
              <p className="text-xs text-red-500">
                {form.formState.errors.subscriptionNomineePhone.message}
              </p>
            )}
          </div>
          <Input
            type="date"
            placeholder="Date of Birth"
            {...form.register("subscriptionNomineeDateOfBirth")}
          />
          <div className="space-y-1.5 col-span-2">
            <Input
              placeholder="Relationship (e.g. Spouse, Son, Father) *"
              {...form.register("subscriptionNomineeRelationship")}
            />
            {form.formState.errors.subscriptionNomineeRelationship && (
              <p className="text-xs text-red-500">
                {form.formState.errors.subscriptionNomineeRelationship.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanBlock({
  form,
  packages,
  selectedPackage,
  selectedPackageId,
  availablePlans,
  selectedPlan,
}: {
  form: any;
  packages: IPackageWithPlans[];
  selectedPackage?: IPackageWithPlans;
  selectedPackageId: string;
  availablePlans: IPackagePlan[];
  selectedPlan?: IPackagePlan;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
        Subscription
      </p>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Select
            value={form.watch("package")}
            onValueChange={(v: string) =>
              form.setValue("package", v as any, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <span className="flex items-center gap-1.5">
                {selectedPackage?.isJoint ? (
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                ) : selectedPackage ? (
                  <User className="w-3.5 h-3.5 text-slate-400" />
                ) : null}
                {selectedPackage ? selectedPackage.name : "Select Package"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg) => (
                <SelectItem key={pkg._id} value={pkg._id}>
                  <span className="flex items-center gap-1.5">
                    {pkg.isJoint ? (
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {pkg.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.package && (
            <p className="text-xs text-red-500">
              {form.formState.errors.package.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Select
            value={form.watch("planType") ?? ""}
            onValueChange={(v: string) =>
              form.setValue("planType", v as PlanType, { shouldValidate: true })
            }
            disabled={!selectedPackageId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Plan" />
            </SelectTrigger>
            <SelectContent>
              {availablePlans.map((plan) => {
                const price = plan.discountPrice || plan.regularPrice;
                return (
                  <SelectItem key={plan.type} value={plan.type}>
                    {PLAN_LABELS[plan.type]} — {formatCurrency(price)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {form.formState.errors.planType && (
            <p className="text-xs text-red-500">
              {form.formState.errors.planType.message}
            </p>
          )}
        </div>
      </div>

      {selectedPlan && (
        <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 animate-in fade-in zoom-in-95 duration-200">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Price
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {formatCurrency(form.watch("price"))}
          </span>
        </div>
      )}
    </div>
  );
}