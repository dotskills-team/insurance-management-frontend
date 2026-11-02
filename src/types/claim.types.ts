import { IMeta } from "./subscription.types";

export enum ClaimStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ALL = "ALL",
}

// ── CORE ──────────────────────────────────────────────────────────────

// export interface IClaim {
//   _id: string;

//   customer: string | {
//     _id: string;
//     name: string;
//     phone: string;
//     picture?: string;
//   };

//   subscription: string | {
//     _id: string;
//     subscriptionId?: string;
//   };

//   serviceTitle: string;

//   description: string;

//   attachments?: string[];

//   status: ClaimStatus;

//   adminNote?: string;

//   reviewedBy?: string | {
//     _id: string;
//     name: string;
//   };

//   reviewedAt?: string;

//   isDeleted: boolean;

//   createdAt: string;
//   updatedAt: string;
// }

// ── STATS ─────────────────────────────────────────────────────────────

export interface IClaimStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// ── QUERY PARAMS ──────────────────────────────────────────────────────

export interface GetClaimsParams {
  searchTerm?: string;
  status?: ClaimStatus;
  startDate?: string;
  endDate?: string;
  sort?: string;
  fields?: string;
  page?: number;
  limit?: number;
}

export enum ClaimTitle {
  OPD = "OPD",
  HOSPITAL_COVERAGE = "HOSPITAL_COVERAGE",
  PREGNANCY_COVERAGE = "PREGNANCY_COVERAGE",
  PARTIAL_DISABILITY = "PARTIAL_DISABILITY",
  PERMANENT_DISABILITY = "PERMANENT_DISABILITY",
  LIFE_COVERAGE = "LIFE_COVERAGE",
}

export enum PaymentMethod {
  BKASH = "BKASH",
  NAGAD = "NAGAD",
  BANK = "BANK",
}

export interface IDocumentSubmission {
  submittedAt: string;
  submittedBy?: string | { _id: string; name: string; role?: string } | null;
  action: "CREATED" | "UPDATED";
  documents: string[];
}

export interface IClaimPaymentInfo {
  mobileNumber?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  branchName?: string;
}

export interface IClaim {
  _id: string;
  customer:
    | string
    | {
        _id: string;
        name: string;
        phone: string;
        picture?: string;
      };

  subscription: {
    _id: string;
    subscriptionId?: string;
    package?:
      | string
      | {
          _id: string;
          name?: string;
          title?: string;
        }
      | string;
  };
  claimTitle: ClaimTitle;
  paymentMethod: PaymentMethod;
  paymentInfo: IClaimPaymentInfo;
  description: string;
  attachments?: string[];
  documentSubmissions?: IDocumentSubmission[];
  status: ClaimStatus;
  adminNote?: string;
  reviewedBy?: string | { _id: string; name: string };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── RESPONSES ─────────────────────────────────────────────────────────

export interface IClaimListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IClaim[];
  meta: IMeta;
  stats: IClaimStats;
}

export interface ISingleClaimResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IClaim;
}

// ── PAYLOADS ──────────────────────────────────────────────────────────

export interface ICreateClaimPayload {
  subscription: string;
  serviceTitle: string;
  description: string;
  attachments?: File[];
}

export interface IUpdateClaimPayload {
  serviceTitle?: string;
  description?: string;
  attachments?: File[];
}

export interface IReviewClaimPayload {
  status: ClaimStatus;
  adminNote?: string;
}
