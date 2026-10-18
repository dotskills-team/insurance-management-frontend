import { baseApi } from "../baseApi";
import { IResponse, IUserApiResponse } from "@/types";
import { IRegister, IRegisterResponse } from "@/types/auth.types";

interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

interface IAdminChangePasswordPayload {
  userId: string;
  newPassword: string;
}

interface IChangePasswordResponse {
  message: string;
  success: boolean;
}

// ================= OTP =================

interface ISendOtpPayload {
  phone: string;
}

interface IVerifyOtpPayload {
  phone: string;
  otp: string;
}

interface IVerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: IUserApiResponse["data"];
}

interface ISetPasswordPayload {
  password: string;
}

interface ISetForgetPasswordPayload {
  otp: string;
  phone: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<IResponse<IRegisterResponse>, IRegister>({
      query: (userInfo) => ({
        url: "/user/register",
        method: "POST",
        data: userInfo,
      }),
    }),
    login: builder.mutation({
      query: (userInfo) => ({
        url: "/auth/login",
        method: "POST",
        data: userInfo,
      }),
    }),

    // ================= SEND OTP =================

    sendOtp: builder.mutation<IResponse<null>, ISendOtpPayload>({
      query: (body) => ({
        url: "/auth/send-otp",
        method: "POST",
        data: body,
      }),
    }),

    // ================= VERIFY OTP =================

    verifyOtp: builder.mutation<IResponse<IVerifyOtpResponse>, IVerifyOtpPayload>({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        data: body,
      }),
    }),


    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    userInfo: builder.query<IUserApiResponse, void>({
      query: () => ({
        url: "/user/me",
        method: "GET",
      }),
    }),
    changePassword: builder.mutation<
      IChangePasswordResponse,
      IChangePasswordPayload
    >({
      query: (payload) => ({
        url: "/auth/change-password",
        method: "POST",
        data: payload,
      }),
    }),

    adminChangePassword: builder.mutation<
      IChangePasswordResponse,
      IAdminChangePasswordPayload
    >({
      query: (payload) => ({
        url: "/auth/admin/change-password",
        method: "POST",
        data: payload,
      }),
    }),

    setPassword: builder.mutation<
      IChangePasswordResponse,
      ISetPasswordPayload
    >({
      query: (payload) => ({
        url: "/auth/set-password",
        method: "POST",
        data: payload,
      }),
    }),

    setForgetPassword: builder.mutation<
      IChangePasswordResponse,
      ISetForgetPasswordPayload
    >({
      query: (payload) => ({
        url: "/auth/set-forget-password",
        method: "POST",
        data: payload,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useUserInfoQuery,
  useChangePasswordMutation,
  useAdminChangePasswordMutation,
  useSetPasswordMutation,
  useSetForgetPasswordMutation,
  //otp sent and verification
  useSendOtpMutation,
  useVerifyOtpMutation,
} = authApi;
