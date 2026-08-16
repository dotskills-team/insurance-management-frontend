
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomerMobileBottomNav } from "./CustomerMobileBottomNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  LayoutDashboard,
  Package,
  Building2,
  Handshake,
  User,
  Sun,
  Moon,
  Clock,
  LogOut,
  ChevronDown,
  Layout,
  BriefcaseMedical,
  MapPin,
  Phone,
  FileCheck2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { AppSidebar } from "./AppSidebar";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGetMeQuery } from "@/redux/features/user/user.api";
import { IUser } from "@/types/user.types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { WhatsAppSupportButton } from "@/components/notification/WhatsAppSupportButton";
import { NotificationBell } from "@/components/notification/NotificationBell";
import { NearbyBranchesButton } from "./NearbyBranchesButton";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const dashboardNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        id: "agentLeader",
        label: "Agent Leaders",
        href: "/admin/dashboard/agent-leader",
        icon: Handshake,
      },
      {
        id: "admins",
        label: "Admins",
        href: "/admin/dashboard/admins",
        icon: User,
      },
      {
        id: "agents",
        label: "Agents",
        href: "/admin/dashboard/agents",
        icon: Handshake,
      },
      {
        id: "partners",
        label: "Partners",
        href: "/admin/dashboard/partners",
        icon: Handshake,
      },
      {
        id: "branches",
        label: "Branches",
        href: "/admin/dashboard/branches",
        icon: Building2,
      },
      {
        id: "packages",
        label: "Packages",
        href: "/admin/dashboard/packages",
        icon: Package,
      },
      {
        id: "customers",
        label: "Customers",
        href: "/admin/dashboard/customers",
        icon: Package,
      },
    ],
  },
];

export interface BreadcrumbTrailItem {
  label: string;
  href?: string;
}

interface DashboardHeaderProps {
  pageTitle?: string;
  breadcrumbs?: BreadcrumbTrailItem[];
  user?: IUser;
  isUserLoading?: boolean;
  onLogout?: () => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 14) return "Good Noon";
  if (hour < 18) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

function formatRole(role?: string) {
  if (!role) return "";
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setTimeout(() => setNow(new Date()), 100);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const date = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const offsetMinutes = -now.getTimezoneOffset();
  const offsetHours = offsetMinutes / 60;
  const offsetLabel = `UTC${offsetHours >= 0 ? "+" : ""}${offsetHours}`;

  return (
    <div
      className={cn(
        "hidden lg:flex items-center gap-2.5 rounded-full px-3.5 py-1.5",
        "bg-linear-to-r from-blue-600 via-green-600 to-indigo-700",
        "dark:from-emerald-950/40 dark:via-cyan-950/30 dark:to-blue-950/30",
        "shadow-sm",
        "transition-all duration-300",
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>

      <Clock className="h-3.5 w-3.5 text-emerald-100 dark:text-emerald-400" />

      <div className="flex items-baseline gap-1">
        <span className="text-[13px] font-bold tabular-nums text-gray-100">
          {time}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-emerald-100 dark:text-emerald-500/90">
          :{seconds}
        </span>
      </div>

      <span className="h-3.5 w-px bg-emerald-200 dark:bg-emerald-800" />

      <span className="text-[11.5px] font-medium text-gray-100 dark:text-gray-400 whitespace-nowrap">
        {date}
      </span>

      <span className="hidden lg:inline text-[10px] font-semibold text-blue-100 dark:text-blue-400/80">
        {offsetLabel}
      </span>
    </div>
  );
}

export function DashboardHeader({
  user,
  isUserLoading,
  onLogout,
}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();

  const firstName = user?.name?.split(" ")[0];
  const initials = user?.name?.substring(0, 2).toUpperCase() || "U";
  const roleLabel = formatRole((user as any)?.role);
  const role = user?.role;

  console.log("DashboardHeader role:", role);

  const roleKnown = !isUserLoading && !!role;
  const isClaimsManager = role === "CLAIMS_MANAGER";
  const isSimplifiedRole = role === "CUSTOMER" || isClaimsManager;
  const showSidebarChrome = roleKnown && !isSimplifiedRole;

  const notificationsHref =
    role === "ADMIN" || role === "SUPER_ADMIN"
      ? "/admin/dashboard/notifications"
      : role === "AGENT_LEADER"
        ? "/agent-leader/dashboard/notifications"
        : role === "AGENT"
          ? "/agent/dashboard/notifications"
          : role === "MANAGER"
            ? "/manager/dashboard/notifications"
            : isClaimsManager
              ? "/claims-manager/dashboard/notifications"
              : "/customer/dashboard/notifications";

  const profileHref =
    role === "ADMIN" || role === "SUPER_ADMIN"
      ? "/admin/dashboard/profile"
      : role === "AGENT_LEADER"
        ? "/agent-leader/dashboard/profile"
        : role === "AGENT"
          ? "/agent/dashboard/profile"
          : role === "MANAGER"
            ? "/manager/dashboard/profile"
            : isClaimsManager
              ? "/claims-manager/dashboard/profile"
              : "/customer/dashboard/profile";

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-linear-to-r from-white via-white to-emerald-50/40 dark:from-gray-950 dark:via-gray-950 dark:to-emerald-950/10 backdrop-blur-sm dark:border-gray-800">
      <div
        className={cn(
          "flex flex-nowrap items-center",
          "gap-2 sm:gap-3 lg:gap-4",
          "min-h-14 sm:min-h-16 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2",
        )}
      >
        {showSidebarChrome && (
          <>
            <SidebarTrigger className="-ml-1 h-8 w-8 shrink-0 rounded-lg text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-colors duration-200" />
            <Separator
              orientation="vertical"
              className="hidden sm:block h-8 sm:h-10 shrink-0 bg-gray-200 dark:bg-gray-700"
            />
          </>
        )}

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {(role === "CUSTOMER" || isClaimsManager) && (
            <>
              <Link
                href={isClaimsManager ? "/claims-manager/dashboard" : "/"}
                className="group flex shrink-0 items-center gap-2"
                aria-label={isClaimsManager ? "Go to Claims Dashboard" : "Go to homepage"}
              >
                <Image
                  className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                  src={theme === "dark" ? "/assets/logo-light.webp" : "/assets/logo-dark.webp"}
                  alt="Shurokkha Health"
                  width={180}
                  height={48}
                  priority
                />
                <span className="flex flex-col leading-tight">
                  <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight">
                    Shurokkha
                  </span>
                  <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 -mt-0.5">
                    {isClaimsManager ? "Claims Portal" : "Health"}
                  </span>
                </span>
              </Link>
              <span
                aria-hidden
                className="hidden sm:block h-8 w-px shrink-0 bg-gray-200 dark:bg-gray-800"
              />
            </>
          )}

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {firstName && (
              <p className="hidden md:block shrink-0 whitespace-nowrap truncate text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {getGreeting()}, {firstName}
              </p>
            )}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
          <div id="header-actions" className="flex items-center gap-2" />

          {/* Live clock — component itself is hidden below lg */}
          <LiveClock />

          {/* Standout CTA — customer only */}
          {role === "CUSTOMER" && (
            <div className="hidden sm:block">
              <NearbyBranchesButton />
            </div>
          )}

          <div className="flex items-center gap-0.5 sm:gap-1 rounded-full border border-gray-200/80 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40 shadow-sm px-0.5">
            <div className="hidden min-[400px]:block">
              {role === "CUSTOMER" || isClaimsManager && <WhatsAppSupportButton />}
            </div>

            {(role === "CUSTOMER") && (
              <NotificationBell role={role} viewAllHref={notificationsHref} />
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:scale-110 active:scale-95 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 sm:h-4.5 sm:w-4.5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 sm:h-4.5 sm:w-4.5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            </Button>
          </div>

          {isUserLoading ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 pl-0.5 sm:pl-1 pr-1 sm:pr-1.5 py-1 rounded-full",
                  "hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                )}
              >
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-[13.5px] font-semibold text-gray-800 dark:text-gray-100 truncate max-w-28 lg:max-w-32">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-28 lg:max-w-32">
                    {role === "CLAIMS_MANAGER" ? "CS & Claim Executive" : roleLabel}
                  </span>
                </div>
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-emerald-100 dark:ring-emerald-900/60">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback className="bg-linear-to-br from-emerald-500 via-cyan-500 to-blue-600 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-gray-400 shrink-0" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-64 rounded-xl"
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <Avatar className="h-10 w-10 ring-2 ring-emerald-100 dark:ring-emerald-900/60">
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback className="bg-linear-to-br from-emerald-500 via-cyan-500 to-blue-600 text-white text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                      {user.phone}
                    </p>
                    {roleLabel && (
                      <span className="mt-1 inline-block rounded-full bg-linear-to-r from-emerald-50 to-blue-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:from-emerald-900/20 dark:to-blue-900/20 dark:text-emerald-400">
                        {role === "CLAIMS_MANAGER" ? "CS & Claim Executive" : roleLabel}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                {role === "CUSTOMER" && (
                  <>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-sm">
                      <Link
                        className="flex items-center gap-2 cursor-pointer"
                        href={"/customer/dashboard"}
                      >
                        <Layout className="h-3.5 w-3.5" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-sm">
                      <Link
                        className="flex items-center gap-2 cursor-pointer"
                        href={"/customer/dashboard/nearby-branches"}
                      >
                        <MapPin className="h-3.5 w-3.5" /> Nearby Partners
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-sm">
                      <Link
                        className="flex items-center gap-2 cursor-pointer"
                        href={"/customer/dashboard/consultants"}
                      >
                        <BriefcaseMedical className="h-3.5 w-3.5" /> Doctor
                        Consultants
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {/* {isClaimsManager && (
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-sm">
                    <Link
                      className="flex items-center gap-2 cursor-pointer"
                      href={"/claims-manager/dashboard"}
                    >
                      <FileCheck2 className="h-3.5 w-3.5" /> Claims Dashboard
                    </Link>
                  </DropdownMenuItem>
                )} */}
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-sm">
                  <Link
                    className="flex items-center gap-2 cursor-pointer"
                    href={profileHref}
                  >
                    <User className="h-3.5 w-3.5" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-3.5 w-3.5" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  pageTitle?: string;
  breadcrumbs?: BreadcrumbTrailItem[];
  defaultOpen?: boolean;
}

export function DashboardLayoutWrapper({
  children,
  pageTitle,
  breadcrumbs,
  defaultOpen = true,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { data: user, isLoading } = useGetMeQuery(undefined);
  const { logout } = useUser();

  const role = user?.data?.role;
  const roleKnown = !isLoading && !!role;
  const showSidebar = roleKnown && role !== "CUSTOMER";
  const showMobileBottomNav = roleKnown && role === "CUSTOMER";

  const handleLogout = async () => {
    await logout();
    toast.success("Logout successful");
    router.push("/login");
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TooltipProvider>
        {showSidebar && (
          <AppSidebar
            user={user?.data}
            onLogout={handleLogout}
            isLoading={false}
          />
        )}
        <SidebarInset className="flex flex-col min-h-screen">
          <DashboardHeader
            pageTitle={pageTitle}
            breadcrumbs={breadcrumbs}
            user={user?.data}
            isUserLoading={isLoading}
            onLogout={handleLogout}
          />

          <main
            className={cn(
              "flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-950/50",
              showMobileBottomNav && "pb-16 sm:pb-0",
            )}
          >
            <div
              className={`${role !== "CUSTOMER" ? "p-4 md:p-6" : "p-4 md:p-6"}`}
            >
              {role === "CUSTOMER" && (
                <div className="relative flex flex-row items-center justify-end gap-3 mx-4">
                  {user?.data?.phone && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-linear-to-r from-indigo-500 via-teal-500 to-indigo-600 backdrop-blur-sm px-4 py-2.5 ring-1 ring-white/15 self-start sm:self-auto">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div className="leading-tight">
                        <p className="text-[10px] font-medium text-white/80 uppercase tracking-wide">
                          Registered Mobile
                        </p>
                        <p className="text-sm font-semibold text-white tabular-nums">
                          {user?.data?.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {children}
            </div>
          </main>
        </SidebarInset>

        {showMobileBottomNav && <CustomerMobileBottomNav />}
      </TooltipProvider>
    </SidebarProvider>
  );
}