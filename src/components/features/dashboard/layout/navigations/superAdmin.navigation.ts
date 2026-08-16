import {
  BadgeDollarSign,
  Bell,
  Building2,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Package,
  PersonStanding,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { NavGroup } from "@/types/dashboard";

export const superAdminNavigation: NavGroup[] = [
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
    label: "Insurance Management",
    items: [
      {
        id: "packages",
        label: "Packages",
        href: "/admin/dashboard/packages",
        icon: Package,
      },

      {
        id: "claims",
        label: "Claims",
        href: "/admin/dashboard/claims",
        icon: ShieldCheck,
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "/admin/dashboard/notifications",
        icon: Bell,
      },
      {
        id: "messages",
        label: "Messages",
        href: "/admin/dashboard/messages",
        icon: MessageSquare,
      },
    ],
  },

  {
    label: "Team Management",
    items: [
      {
        id: "admins",
        label: "Admins",
        href: "/admin/dashboard/admin",
        icon: User,
      },
      {
        id: "managers",
        label: "A.M - Partnerships",
        href: "/admin/dashboard/managers",
        icon: Users,
      },
      {
        id: "claims-managers",
        label: "CS & Claim Executives",
        href: "/admin/dashboard/claims-managers",
        icon: PersonStanding,
      },
      {
        id: "a-a-managers",
        label: "A.A. Managers",
        href: "/admin/dashboard/a-a-managers",
        icon: Users,
      },
      {
        id: "agent-leaders",
        label: "Agent Leaders",
        href: "/admin/dashboard/agent-leader",
        icon: Users,
      },
      {
        id: "agents",
        label: "Agents",
        href: "/admin/dashboard/agents",
        icon: Handshake,
      },
      {
        id: "customers",
        label: "Customers",
        href: "/admin/dashboard/customers",
        icon: User,
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
    ],
  },

  {
    label: "Payment Management",
    items: [
      {
        id: "payments",
        label: "Payments",
        href: "/admin/dashboard/payments",
        icon: BadgeDollarSign,
      },
    ],
  },
];
