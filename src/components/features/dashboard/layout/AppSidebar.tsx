"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavItem } from "./DashboardLayout";
import Image from "next/image";
import { ChevronDown, LogOut, User } from "lucide-react";
import { IUser } from "@/types/user.types";
import { getDashboardNavigation } from "./navigation";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "../../../../../public/assets/shurokkha-logo-1.png"
export interface AppSidebarProps {
  user?: IUser | null;
  onLogout?: () => void;
  isLoading?: boolean;
}

function getActiveHref(
  navigation: { items: NavItem[] }[],
  pathname: string,
): string | null {
  let best: string | null = null;

  for (const group of navigation) {
    for (const item of group.items) {
      const isExact = pathname === item.href;
      const isNestedUnder = pathname.startsWith(`${item.href}/`);

      if (isExact || isNestedUnder) {
        if (!best || item.href.length > best.length) {
          best = item.href;
        }
      }
    }
  }

  return best;
}

function NavItemRow({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const Icon = item.icon;

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={isCollapsed ? item.label : undefined}
        className={cn(
          "group/nav relative h-10 gap-3 mb-2 rounded-xl px-2.5 text-lg font-semibold",
          "transition-all duration-200 ease-out",
          isActive
            ? cn(
              "bg-linear-to-r from-indigo-500 to-blue-600 *:text-white font-bold shadow-md shadow-indigo-900/20",
              "hover:from-indigo-600 hover:to-blue-700 hover:text-white",
            )
            : cn(
              "text-gray-600 hover:bg-blue-600 hover:text-white hover:shadow-sm",
              "dark:text-gray-400 dark:hover:bg-blue-600 dark:hover:text-gray-100",
            ),
        )}
      >
        <Link
          href={item.href}
          onClick={handleClick}
          className={cn(
            "flex w-full items-center gap-3",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0",
          )}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            <Icon
              className={cn(
                "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover/nav:scale-110",
                isActive
                  ? "text-white"
                  : "text-gray-600 group-hover/nav:text-current",
              )}
            />
          </span>

          <span className="truncate group-data-[collapsible=icon]:hidden">
            {item.label}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebarSkeleton({ role }: { role?: string | null }) {
  if (role === "CUSTOMER") return null;
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-200/80 dark:border-gray-800"
    >
      <SidebarHeader className="border-b mb-3 border-gray-200/80 dark:border-gray-800">
        <div className="ml-2 my-2">
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3">
        {Array.from({ length: 3 }).map((_, groupIdx) => (
          <SidebarGroup key={groupIdx} className="px-2 py-1">
            <div className="px-2 pb-2">
              <Skeleton className="h-3 w-20" />
            </div>
            <SidebarMenu>
              {Array.from({ length: 4 }).map((_, itemIdx) => (
                <SidebarMenuItem key={itemIdx}>
                  <div className="flex items-center gap-3 px-2.5 py-2.5">
                    <Skeleton className="h-5 w-5 rounded shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200/80 dark:border-gray-800 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 rounded-xl p-2">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar({ user, onLogout, isLoading }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();
  const navigation = getDashboardNavigation(user?.role);
  const activeHref = getActiveHref(navigation, pathname);

  // const dashboardRoot = navigation[0]?.items[0]?.href ?? "";

  if (isLoading) return <AppSidebarSkeleton role={user?.role} />;

  const initials =
    user?.name
      ?.trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const roleLabel = user?.role
    ?.replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const role = user?.role;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-200/80 dark:border-gray-800"
    >
      {/* ── Header / Logo ── */}
      <SidebarHeader className="border-b border-gray-200/80 dark:border-gray-800 bg-gray-100 dark:bg-gray-950">
        <Link
          href="/"
          className="flex items-center py-1 group-data-[collapsible=icon]:justify-center"
        >
          <div
            className={cn(
              "flex items-center gap-1 rounded-xl ring-1 ring-indigo-500/10 transition-all duration-200",
              "bg-linear-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-950/30 dark:via-gray-900 dark:to-blue-950/20",
              isCollapsed ? "h-9 w-9 ml-1 justify-center" : "h-12 w-60 ml-2 px-2"
            )}
          >
            <div
              className={cn(
                "relative shrink-0",
                isCollapsed ? "h-7 w-7" : "h-9 w-9"
              )}
            >
              <Image
                src={logo}
                alt="Shurokkha Logo"
                fill
                quality={90}
                className="object-contain"
                priority
              />
            </div>

            {!isCollapsed && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                Surokkha Health
              </h3>
            )}
          </div>
        </Link>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="bg-gray-100 dark:bg-gray-950">
        <ScrollArea className="h-full px-2">
          <div className="py-2">
            {navigation.map((group) => (
              <SidebarGroup key={group.label} className="px-1 py-1.5">
                <SidebarGroupLabel
                  className={cn(
                    "font-bold uppercase tracking-widest text-[10.5px] text-gray-600 dark:text-gray-300 px-2 pb-1.5",
                    "transition-all duration-200",
                    "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:py-0",
                  )}
                >
                  {group.label}
                </SidebarGroupLabel>

                <SidebarMenu>
                  {group.items.map((item) => (
                    <NavItemRow
                      key={item.id}
                      item={item}
                      isActive={item.href === activeHref}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      {/* ── Footer / User ── */}
      {user && (
        <SidebarFooter className="border-t border-gray-200/80 bg-gray-100 dark:bg-gray-950 dark:border-gray-800 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <SidebarMenuButton
                    size="lg"
                    className={cn(
                      "gap-3 rounded-xl transition-all duration-200",
                      "hover:bg-linear-to-r hover:from-indigo-50 hover:to-blue-50",
                      "dark:hover:from-indigo-900/20 dark:hover:to-blue-900/10",
                      "group-data-[collapsible=icon]:justify-center",
                    )}
                    tooltip={
                      isCollapsed
                        ? `${user.name || "User"} · ${roleLabel ?? "User"}`
                        : undefined
                    }
                  >
                    <Avatar className="h-8 w-8 shrink-0 rounded-lg ring-2 ring-transparent transition-all duration-200 hover:ring-indigo-300 dark:hover:ring-indigo-800">
                      <AvatarImage src={user.picture} alt={user.name} />
                      <AvatarFallback className="rounded-lg bg-linear-to-br from-indigo-500 to-blue-500 text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                      <p className="truncate text-[13.5px] font-semibold text-gray-900 dark:text-gray-50">
                        {user.name || "User"}
                      </p>
                      <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                        {user.phone}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 ml-auto group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  side="top"
                  sideOffset={8}
                  className="w-56 rounded-xl border-gray-200/80 dark:border-gray-700/60"
                >
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {user.phone}
                    </p>
                    {roleLabel && (
                      <span className="mt-1.5 inline-block rounded-full bg-linear-to-r from-indigo-50 to-blue-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:from-indigo-900/20 dark:to-blue-900/20 dark:text-indigo-400">
                        {roleLabel}
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer text-sm">
                    <Link
                      className="flex items-center gap-2 cursor-pointer"
                      href={`${role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin/dashboard/profile" : role === "AGENT_LEADER" ? "/agent-leader/dashboard/profile" : role === "AGENT" ? "/agent/dashboard/profile" : role === "MANAGER" ? "/manager/dashboard/profile": role === "A_A_MANAGER" ? "/a-a-manager/dashboard/profile" : "/customer/dashboard/profile"}`}
                    >
                      {" "}
                      <User className="h-3.5 w-3.5" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem className="gap-2 cursor-pointer text-sm">
                    <Link href={`${dashboardRoot}/settings`} className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </Link>
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
