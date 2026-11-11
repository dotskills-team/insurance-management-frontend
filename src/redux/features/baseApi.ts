import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "./axiosBaseQuery";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "USERS",
    "USER",
    "ME",
    "PLAN",
    "PLANS",
    "PARTNERS",
    "BRANCHES",
    "PACKAGES",
    "PACKAGE",
    "DASHBOARD",
    "CLAIMS",
    "CLAIM",
    "BRANCH",
    "PARTNER",
    "SUBSCRIPTION",
    "SUBSCRIPTIONS",
    "CONSULTATIONS",
    "CATEGORIES",
    "PRODUCTS",
    "CUSTOMERS",
    "NOTIFICATIONS",
    "PAYMENTS",
    "MESSAGES",
    "ORDERS",
    "STORE",
    "STORES",

    "CONTACT","CONTACTS",
    "SITE_SETTING"
  ],
  endpoints: () => ({}),
});
