import { baseApi } from "../baseApi";

export interface ISiteSetting {
  staffAccessEnabled: boolean;
  updatedBy: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  updatedAt: string | null;
}

interface ISiteSettingResponse {
  data: ISiteSetting;
}

export const siteSettingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSiteSetting: builder.query<ISiteSettingResponse, void>({
      query: () => ({
        url: "/site-setting",
        method: "GET",
      }),
      providesTags: ["SITE_SETTING"],
    }),

    updateSiteSetting: builder.mutation<
      ISiteSettingResponse,
      { staffAccessEnabled: boolean }
    >({
      query: (data) => ({
        url: "/site-setting",
        method: "PATCH",
        data,
      }),
      invalidatesTags: ["SITE_SETTING"],
    }),
  }),
});

export const { useGetSiteSettingQuery, useUpdateSiteSettingMutation } =
  siteSettingApi;
