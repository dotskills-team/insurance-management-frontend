// ─── Enums ──────────────────────────────────────────────────────────────────

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  AGENT_LEADER = "AGENT_LEADER",
  AGENT = "AGENT",
  CUSTOMER = "CUSTOMER",
  MANAGER = "MANAGER",
  A_A_MANAGER = "A_A_MANAGER",
  CLAIMS_MANAGER = "CLAIMS_MANAGER",
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  ALL = "ALL",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
  CREATED = "CREATED",
}

// ─── Sub-interfaces ──────────────────────────────────────────────────────────

export interface IAddress {
  division?: string;
  district?: string;
  thana?: string;
  street?: string;
}

export interface INominee {
  name?: string;
  phone?: string;
}

// ─── Core User Interface ─────────────────────────────────────────────────────

// Populated variants returned by the API after .populate()
export interface IPopulatedAgentLeader {
  _id: string;
  name: string;
  phone: string;
}

export interface IPopulatedCreatedBy {
  _id: string;
  name: string;
  phone: string;
  role: Role;
}

export interface IUser {
  _id?: string;

  // createdBy?: string | IPopulatedCreatedBy;
  agentLeader?: string | IPopulatedAgentLeader; // only for agents
  customId?: string;
  employeeId?: string;
  // BASIC INFO
  name: string;
  phone: string;
  email?: string;
  password?: string;
  picture?: string;
  role: Role;

  // CUSTOMER SPECIFIC INFO
  nid?: string;
  dateOfBirth?: string; // ISO string from API (Date serialised)
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: IAddress;

  // NOMINEE INFO
  nominee?: INominee;

  // EMPLOYEE RELATED
  salary?: string;
  salaryPerCustomer?: string;

  // SYSTEM FLAGS
  isActive?: IsActive.ACTIVE | null;
  isVerified?: boolean;
  hasPassword?: boolean;
  isDeleted?: boolean;
  lastLoginAt?: string; // ISO string from API
  createdBy?: (IUser & { agentLeader?: IUser | string }) | string;
  // Mongoose timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ─── Query Params ────────────────────────────────────────────────────────────

export interface GetUsersParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sort?: string;
  fields?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  role?: Role;
  isActive?: IsActive;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface IStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
}

export interface IUserListResponse {
  success: boolean;
  message: string;
  data: IUser[];
  meta: IPaginationMeta;
  stats: IStats;
}

export interface IClaimsManagerListResponse {
  success: boolean;
  message: string;
  data: {
    data: IUser[]
    meta: IPaginationMeta;
    stats: IStats;
  };
}

export interface IAllUsersResponse {
  success: boolean;
  message: string;
  data: IUser[];
  meta: IPaginationMeta;
  stats: {
    total: number;
    superAdmin: IStats;
    admin: IStats;
    manager: IStats;
    agentLeader: IStats;
    agent: IStats;
    customer: IStats;
  };
}

export interface ISingleUserResponse {
  success: boolean;
  message: string;
  data: IUser;
} 