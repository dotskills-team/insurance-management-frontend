import { Role } from "@/types/user.types";
import type { IPopulatedAgentLeader, IPopulatedCreatedBy } from "@/types/user.types";

const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.ADMIN]: "Admin",
  [Role.MANAGER]: "A.M - Partnerships",
  [Role.A_A_MANAGER]: "A.A. Manager",
  [Role.AGENT_LEADER]: "Agent Leader",
  [Role.AGENT]: "Agent",
  [Role.CUSTOMER]: "Customer",
  [Role.CLAIMS_MANAGER]: "CS & Claim Executive",
};

export function formatRole(role: Role | undefined): string {
  if (!role) return "—";
  return ROLE_LABELS[role] ?? role;
}

export function formatBDT(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `৳${num.toLocaleString("en-BD")}`;
}

export function getPopulatedName(
  value: string | IPopulatedAgentLeader | IPopulatedCreatedBy | undefined,
): string {
  if (!value) return "—";
  if (typeof value === "string") return "—"; 
  return value.name;
}