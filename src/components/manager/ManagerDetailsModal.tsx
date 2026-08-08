"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Phone,
    Mail,
    CalendarDays,
    MapPin,
    ShieldCheck,
    ShieldOff,
    ShieldAlert,
    Clock,
    Users,
    LogIn,
    User,
    IdCard,
    Cake,
    VenusAndMars,
    HeartHandshake,
} from "lucide-react";
import { IsActive, IUser } from "@/types/user.types";

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
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                    {label}
                </p>
                <p className={`text-sm text-slate-800 dark:text-slate-200 wrap-break-word ${mono ? "font-mono" : ""}`}>
                    {value !== undefined && value !== null && value !== "" ? (
                        value
                    ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                    )}
                </p>
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

const formatDate = (iso?: string | null, withTime = false) => {
    if (!iso) return null;
    const opts: Intl.DateTimeFormatOptions = withTime
        ? { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
        : { day: "2-digit", month: "long", year: "numeric" };
    return new Date(iso).toLocaleDateString("en-GB", opts);
};

const formatGender = (gender?: string | null) => {
    if (!gender) return null;
    return gender.charAt(0) + gender.slice(1).toLowerCase();
};

const STATUS_CONFIG: Record<IsActive, { label: string; icon: React.ElementType; badge: string }> = {
    [IsActive.ACTIVE]: {
        label: "Active",
        icon: ShieldCheck,
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
    [IsActive.INACTIVE]: {
        label: "Inactive",
        icon: ShieldOff,
        badge: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    },
       [IsActive.CREATED]: {
        label: "Created",
        icon: ShieldCheck,
        badge: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    },
    [IsActive.BLOCKED]: {
        label: "Blocked",
        icon: ShieldAlert,
        badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
    },
    [IsActive.ALL]: {
        label: "All",
        icon: ShieldCheck,
        badge:
            "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: IUser;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ManagerDetailsModal({ open, onOpenChange, item }: Props) {
    if (!item) return null;

    const status = (item.isActive as IsActive) ?? IsActive.INACTIVE;
    const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[IsActive.INACTIVE];
    const StatusIcon = statusCfg.icon;

    const address = item.address;
    const addressParts = [
        address?.street,
        address?.thana,
        address?.district,
        address?.division,
    ].filter(Boolean);

    const createdByName =
        !item.createdBy
            ? null
            : typeof item.createdBy === "string"
                ? item.createdBy
                : item.createdBy.name;

    const createdByRole =
        item.createdBy && typeof item.createdBy !== "string"
            ? item.createdBy.role
            : null;

    const hasNominee = Boolean(item.nominee?.name || item.nominee?.phone);
    const hasPersonalDetails = Boolean(item.nid || item.dateOfBirth || item.gender);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0"> */}
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&::-webkit-scrollbar]:hidden scrollbar-none [-ms-overflow-style:none]">

                {/* Header */}
                <div className="relative bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 px-6 pt-8 pb-6 rounded-t-lg">
                    <DialogHeader className="sr-only">
                        <DialogTitle>A.M. Partnerships Details</DialogTitle>
                        <DialogDescription>Detailed information for {item.name}</DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                        {/* Avatar */}
                        {item.picture ? (
                            <img
                                src={item.picture}
                                alt={item.name}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md shrink-0"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-white dark:border-slate-800 shadow-md shrink-0">
                                {item.name?.charAt(0)?.toUpperCase() ?? "M"}
                            </div>
                        )}

                        {/* Name + badges */}
                        <div className="text-center sm:text-left flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                {item.name ?? "—"}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {item.phone}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                                <Badge variant="outline" className={statusCfg.badge}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusCfg.label}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                >
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                    Manager
                                </Badge>
                                {item.isVerified && (
                                    <Badge
                                        variant="outline"
                                        className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400"
                                    >
                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                        Verified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">

                    {/* Contact */}
                    <div>
                        <SectionTitle>Contact Information</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field icon={Phone} label="Phone" value={item.phone} mono />
                            <Field icon={Mail} label="Email" value={item.email} />
                            <Field icon={IdCard} label="Employee ID" value={item.employeeId} mono />
                        </div>
                    </div>

                    <Separator />

                    {/* Personal Details */}
                    {hasPersonalDetails && (
                        <>
                            <div>
                                <SectionTitle>Personal Details</SectionTitle>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field icon={IdCard} label="NID / Birth Cert. No." value={item.nid} mono />
                                    <Field icon={Cake} label="Date of Birth" value={formatDate(item.dateOfBirth as any)} />
                                    <Field icon={VenusAndMars} label="Gender" value={formatGender(item.gender)} />
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Created By */}
                    <div>
                        <SectionTitle>Created By</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                                icon={Users}
                                label="Created By"
                                value={
                                    createdByName
                                        ? createdByRole
                                            ? `${createdByName} (${createdByRole.replace("_", " ")})`
                                            : createdByName
                                        : null
                                }
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    {addressParts.length > 0 && (
                        <>
                            <div>
                                <SectionTitle>Address</SectionTitle>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field icon={MapPin} label="Division" value={address?.division} />
                                    <Field icon={MapPin} label="District" value={address?.district} />
                                    <Field icon={MapPin} label="Thana" value={address?.thana} />
                                    <Field icon={MapPin} label="Street" value={address?.street} />
                                </div>
                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold">Full Address:</span>{" "}
                                    {addressParts.join(", ")}
                                </p>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Nominee */}
                    {hasNominee && (
                        <>
                            <div>
                                <SectionTitle>Nominee Information</SectionTitle>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field icon={HeartHandshake} label="Nominee Name" value={item.nominee?.name} />
                                    <Field icon={Phone} label="Nominee Phone" value={item.nominee?.phone} mono />
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Account Details */}
                    <div>
                        <SectionTitle>Account Details</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field icon={User} label="Role" value="Manager" />
                            <Field icon={CalendarDays} label="Joined" value={formatDate(item.createdAt)} />
                            <Field
                                icon={LogIn}
                                label="Last Login"
                                value={item.lastLoginAt ? formatDate(item.lastLoginAt, true) : null}
                            />
                            <Field icon={Clock} label="Last Updated" value={formatDate(item.updatedAt)} />
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}