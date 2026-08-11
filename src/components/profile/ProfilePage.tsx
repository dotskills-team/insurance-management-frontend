"use client";

import Image from "next/image";
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Cake,
  IdCard,
  BadgeCheck,
  Pencil,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useGetMeQuery } from "@/redux/features/user/user.api";
import { Button } from "@/components/ui/button";
import UpdateProfileModal from "./UpdateProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import SetPasswordModal from "./SetPasswordModal";
import { BackToDashboardSection } from "../shared/dashboard/BackToDashboardSection";

export default function ProfilePage() {
  const { data, isLoading, isError } = useGetMeQuery();
  const user = data?.data;
  const [openModal, setOpenModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [openSetPasswordModal, setOpenSetPasswordModal] = useState(false);

  const userRole = user?.role;
  const canEditProfile = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  console.log("user ", canEditProfile)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50/50 via-background to-blue-50/30 dark:from-indigo-950/10 dark:via-background dark:to-blue-950/10 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-64 rounded-3xl bg-muted" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 rounded-2xl bg-muted lg:col-span-1" />
            <div className="h-96 rounded-2xl bg-muted lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">
        Failed to load profile information.
      </div>
    );
  }

  const address = user.address;

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50/50 via-background to-blue-50/30 dark:from-indigo-950/10 dark:via-background dark:to-blue-950/10">
      {/* <BackToDashboardSection /> */}
      <div className="mx-auto container p-4 space-y-6">
        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-indigo-600 to-blue-700 p-6 sm:p-8 shadow-lg shadow-indigo-900/10">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />

          <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white/30 bg-white/10 shadow-xl backdrop-blur-sm">
              {user.picture ? (
                <Image src={user.picture} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/20">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {user.role?.replace(/_/g, " ")}
                </span>
                {user.employeeId && (
                  <span className="text-xs text-white/70">ID: {user?.employeeId}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {
                canEditProfile &&
                <Button
                  variant="outline"
                  onClick={() => setOpenModal(true)}
                  className="group hover:cursor-pointer bg-transparent dark:hover:bg-white dark:bg-gray-100 dark:text-indigo-500 dark:hover:text-indigo-700 dark:hover:border-indigo-700 dark:border-indigo-400 hover:border-indigo-600 text-white hover:bg-indigo-800 hover:shadow-xl hover:text-white duration-500 mt-2 cursor-pointer font-bold tracking-widest uppercase transform disabled:opacity-60 hover:scale-105 transition-transform ease-in-out flex gap-2 items-center"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Button>
              }
              {/* <Button
                variant="outline"
                onClick={() => setOpenPasswordModal(true)}
                className="group hover:cursor-pointer bg-transparent dark:hover:bg-white dark:bg-gray-100 dark:text-indigo-500 dark:hover:text-indigo-700 dark:hover:border-indigo-700 dark:border-indigo-400 hover:border-indigo-600 text-white hover:bg-indigo-800 hover:shadow-xl hover:text-white duration-500 mt-2 cursor-pointer font-bold tracking-widest uppercase transform disabled:opacity-60 hover:scale-105 transition-transform ease-in-out flex gap-2 items-center"
              >
                <KeyRound className="h-4 w-4" />
                Password
              </Button> */}
            </div>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: quick summary panel */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-border bg-gray-100 dark:bg-slate-950 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/10 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Account</h2>
              </div>

              <div className="space-y-3">
                <SummaryRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={user.phone} />
                <SummaryRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user.email} />
                <SummaryRow icon={<IdCard className="h-3.5 w-3.5" />} label="NID" value={user.nid} />
              </div>

              <div className="pt-2 border-t border-border">
                {
                  user?.hasPassword ? <Button
                    variant="outline"
                    onClick={() => setOpenPasswordModal(true)}
                    className="w-full gap-2 transition-all duration-200 hover:shadow-sm"
                  >
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </Button> : <Button
                    variant="outline"
                    onClick={() => setOpenSetPasswordModal(true)}
                    className="w-full gap-2 transition-all duration-200 hover:shadow-sm"
                  >
                    <KeyRound className="h-4 w-4" />
                    Set Password
                  </Button>
                }
              </div>
            </div>
          </aside>

          {/* Right: detail sections */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-border bg-gray-100 dark:bg-slate-950 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone} />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
                <InfoItem icon={<IdCard className="h-4 w-4" />} label="NID" value={user.nid} />
                <InfoItem
                  icon={<Cake className="h-4 w-4" />}
                  label="Date of Birth"
                  value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-GB") : undefined}
                />
                <InfoItem icon={<UserIcon className="h-4 w-4" />} label="Gender" value={user.gender} />
              </div>
            </section>

            {address && (
              <section className="rounded-2xl border border-border bg-gray-100 dark:bg-slate-950 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Address
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem label="Division" value={address.division} />
                  <InfoItem label="District" value={address.district} />
                  <InfoItem label="Thana" value={address.thana} />
                  <InfoItem label="Street" value={address?.street} />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <UpdateProfileModal user={user} open={openModal} onOpenChange={setOpenModal} />
      <ChangePasswordModal open={openPasswordModal} onOpenChange={setOpenPasswordModal} />
      <SetPasswordModal open={openSetPasswordModal} onOpenChange={setOpenSetPasswordModal} />
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium text-foreground truncate max-w-32">{value || "—"}</span>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20">
      {icon && (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-700 dark:text-indigo-400">
          {icon}
        </span>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}