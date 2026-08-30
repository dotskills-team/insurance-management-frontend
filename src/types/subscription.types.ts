
import { IUser } from "./user.types";
import { IInsurancePackage } from "./package.types";

export enum PlanType {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  HALF_YEARLY = "HALF_YEARLY",
  YEARLY = "YEARLY",
  LIFETIME = "LIFETIME",
}

export enum SubscriptionStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  COMPLETED = "COMPLETED",
}

export enum SubscribeFor {
  SELF = "SELF",
  OTHER = "OTHER",
}

// Where the nominee's info is sourced from — only relevant when the
// selected package is Joint (package.isJoint === true)
export enum NomineeSource {
  JOIN_MEMBER = "JOIN_MEMBER", // nominee is the same person as joinMember
  OTHER = "OTHER",             // a completely separate person
}

export interface IBeneficiary {
  name: string;
  phone: string;
  dateOfBirth?: string;
  relationship: string;
}

// The 2nd covered person — only applicable when package.isJoint === true
export interface IJoinMember {
  name: string;
  phone: string;
  dateOfBirth?: string;
  relationship: string;
}

// Subscription-level nominee (who receives the claim payout).
// Nominee now belongs to the Subscription, not the User/Customer profile —
// a customer can have a different nominee per subscription (e.g. the join
// member on a Joint package).
export interface ISubscriptionNominee {
  source?: NomineeSource;
  name: string;
  phone: string;
  dateOfBirth?: string;
  relationship: string;
}

export interface IPackagePlan {
  type: PlanType;
  regularPrice: number;
  discountPrice?: number;
  durationInMonths?: number;
}

export interface ISubscription {
  _id: string;

  customer: IUser | string;
  package: IInsurancePackage | string;

  planType: PlanType;
  durationInMonths?: number;

  price: number;

  paymentStatus: PaymentStatus;
  transactionId?: string;

  subscribeFor?: SubscribeFor;
  beneficiary?: IBeneficiary;

  // 2nd covered person — present only when the package is Joint
  joinMember?: IJoinMember;

  // nominee for this subscription — always required at creation
  nominee?: ISubscriptionNominee;

  status: SubscriptionStatus;

  startDate: string;
  endDate?: string | null;

  isLifetime?: boolean;

  createdBy?: IUser | string;

  autoRenew?: boolean;

  isDeleted: boolean;
  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface IPackageWiseRevenue {
  packageId: string | null;
  packageName?: string;
  subscriptions: number;
  totalRevenue: number;
  averageRevenue: number;
}

export interface IOverviewCard {
  subscriptions: number;
  revenue: number;
  averageRevenue: number;
  packageWiseRevenue: IPackageWiseRevenue[];
}

export interface IOverviewData {
  today: IOverviewCard;
  month: IOverviewCard;
  lifetime: IOverviewCard;
}

export interface IOverviewResponse {
  success: boolean;
  message: string;
  data: IOverviewData;
}

export interface ICustomerAddress {
  division: string;
  district: string;
  thana: string;
  street?: string;
}

export interface ICreateSubscriptionPayload {
  customer?: string;
  customerPayload?: {
    name: string;
    phone: string;
    email?: string;
    role?: "CUSTOMER";
    nid?: string;
    dateOfBirth?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    address?: ICustomerAddress;
  };
  package: string;
  planType: PlanType;
  durationInMonths?: number;
  price: number;
  autoRenew?: boolean;
  subscribeFor?: SubscribeFor;
  beneficiary?: {
    name: string;
    phone: string;
    dateOfBirth?: string;
    relationship: string;
  };
  // required when the selected package.isJoint === true
  joinMember?: {
    name: string;
    phone: string;
    dateOfBirth?: string;
    relationship: string;
  };
  // required — subscription-level nominee
  nominee: {
    source?: NomineeSource;
    name: string;
    phone: string;
    dateOfBirth?: string;
    relationship: string;
  };
}

// export interface IUpdateSubscriptionPayload {
//   planType?: PlanType;
//   price?: number;
//   status?: SubscriptionStatus;
//   paymentStatus?: PaymentStatus;
//   startDate?: string;
//   autoRenew?: boolean;
// }
export interface IUpdateSubscriptionPayload {
  planType?: PlanType;
  price?: number;
  status?: SubscriptionStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  autoRenew?: boolean;
  nominee?: {
    source?: NomineeSource;
    name: string;
    phone: string;
    dateOfBirth?: string;
    relationship: string;
  };
}

export interface ISubscriptionStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  cancelled: number;
  paid: number;
  unpaid: number;
  refunded: number;
  failed: number;
  totalRevenue: number;
}

export interface GetSubscriptionsParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  searchTerm?: string;
  status?: SubscriptionStatus;
  paymentStatus?: PaymentStatus;
  dateType?: "created" | "updatedAt" | "startDate" | "endDate";
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface ISubscriptionListResponse {
  success: boolean;
  message: string;
  data: {
    data: ISubscription[];
    meta: IMeta;
    stats: ISubscriptionStats;
  };
}

export interface ISingleSubscriptionResponse {
  success: boolean;
  message: string;
  data: ISubscription;
}

export interface ICreateSubscriptionResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      subscription: ISubscription;
      paymentUrl: string;
    };
  };
}