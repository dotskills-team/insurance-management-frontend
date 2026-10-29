
// import { baseApi } from "../baseApi";

// export type PaymentStatus =
//     | "UNPAID"
//     | "PAID"
//     | "COMPLETED"
//     | "FAILED"
//     | "CANCELLED"
//     | "REFUND_PENDING"
//     | "REFUNDED";

// export interface IPayment {
//     _id: string;
//     subscription:
//     | string
//     | {
//         _id: string;
//         planType?: string;
//         durationInMonths?: number;
//         price?: number;
//         status?: string;
//     };
//     transactionId: string;
//     spOrderId?: string;
//     amount: number;
//     status: PaymentStatus;
//     isDeleted: boolean;
//     refundData?: {
//         status?: string;
//         refund_ref_id?: string;
//         errorReason?: string;
//         [key: string]: any;
//     };
//     refundRefId?: string;
//     refundReason?: string;
//     refundRequestedAt?: string;
//     refundedAt?: string;
//     createdAt?: string;
//     updatedAt?: string;
// }

// interface IInitPaymentResponse {
//     data: {
//         paymentUrl: string;
//     };
// }

// interface IPaymentListResponse {
//     data: IPayment[];
//     meta: {
//         page: number;
//         limit: number;
//         total: number;
//         totalPage: number;
//     };
//     stats: {
//         total: number;
//         completed: number;
//         unpaid: number;
//         failed: number;
//         cancelled: number;
//         refunded: number;
//         totalRevenue: number;
//     };
// }

// interface ISinglePaymentResponse {
//     data: IPayment;
// }

// interface GetPaymentsParams {
//     searchTerm?: string;
//     status?: string;
//     page?: number;
//     limit?: number;
//     startDate?: string;
//     endDate?: string;
//     sort?: string;
// }

// export const paymentApi = baseApi.injectEndpoints({
//     endpoints: (builder) => ({

//         getAllPayments: builder.query<IPaymentListResponse, GetPaymentsParams | undefined>({
//             query: (params) => ({
//                 url: "/payment/all-payments",
//                 method: "GET",
//                 params,
//             }),
//             providesTags: ["PAYMENTS"],
//         }),

//         getAllTrashPayments: builder.query<IPaymentListResponse, GetPaymentsParams | undefined>({
//             query: (params) => ({
//                 url: "/payment/all-trash-payments",
//                 method: "GET",
//                 params,
//             }),
//             providesTags: ["PAYMENTS"],
//         }),

//         getSinglePayment: builder.query<ISinglePaymentResponse, string>({
//             query: (id) => ({
//                 url: `/payment/${id}`,
//                 method: "GET",
//             }),
//             providesTags: ["PAYMENTS"],
//         }),

//         // Generic update — status here can be UNPAID/PAID/COMPLETED/FAILED/CANCELLED.
//         // REFUNDED is NOT settable through this endpoint anymore (backend rejects it).
//         updatePayment: builder.mutation<
//             ISinglePaymentResponse,
//             { id: string; data: { status?: Exclude<PaymentStatus, "REFUNDED" | "REFUND_PENDING"> } }
//         >({
//             query: ({ id, data }) => ({
//                 url: `/payment/${id}`,
//                 method: "PATCH",
//                 data,
//             }),
//             invalidatesTags: ["PAYMENTS"],
//         }),

//         // SurjoPay refund request — marks REFUND_PENDING.
//         // Actual REFUNDED status is set later, automatically, by the backend
//         // reconciliation cron once the refund is approved on the SurjoPay portal.
//         requestSurjoPayRefund: builder.mutation<
//             ISinglePaymentResponse,
//             { id: string; reason?: string }
//         >({
//             query: ({ id, reason }) => ({
//                 url: `/payment/${id}/request-refund`,
//                 method: "PATCH",
//                 data: { reason },
//             }),
//             invalidatesTags: ["PAYMENTS"],
//         }),

//         softDeletePayment: builder.mutation<ISinglePaymentResponse, string>({
//             query: (id) => ({
//                 url: `/payment/soft-delete/${id}`,
//                 method: "DELETE",
//             }),
//             invalidatesTags: ["PAYMENTS"],
//         }),

//         restorePayment: builder.mutation<ISinglePaymentResponse, string>({
//             query: (id) => ({
//                 url: `/payment/restore/${id}`,
//                 method: "PATCH",
//             }),
//             invalidatesTags: ["PAYMENTS"],
//         }),

//         deletePayment: builder.mutation<ISinglePaymentResponse, string>({
//             query: (id) => ({
//                 url: `/payment/${id}`,
//                 method: "DELETE",
//             }),
//             invalidatesTags: ["PAYMENTS"],
//         }),
//         initPayment: builder.mutation<IInitPaymentResponse, string>({
//             query: (subscriptionId) => ({
//                 url: `/payment/init-payment/${subscriptionId}`,
//                 method: "POST",
//             }),
//             invalidatesTags: ["PAYMENTS"],
//         }),
//     }),
// });

// export const {
//     useGetAllPaymentsQuery,
//     useGetAllTrashPaymentsQuery,
//     useGetSinglePaymentQuery,
//     useUpdatePaymentMutation,
//     useRequestSurjoPayRefundMutation,
//     useSoftDeletePaymentMutation,
//     useRestorePaymentMutation,
//     useDeletePaymentMutation,
//     useInitPaymentMutation
// } = paymentApi;

// With payment gateway settings

import { baseApi } from "../baseApi";

export type PaymentStatus =
    | "UNPAID"
    | "PAID"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "REFUND_PENDING"
    | "REFUNDED";

export type PaymentGateway = "SURJOPAY" | "SSLCOMMERZ";

export interface IPayment {
    _id: string;
    subscription:
    | string
    | {
        _id: string;
        planType?: string;
        durationInMonths?: number;
        price?: number;
        status?: string;
    };
    transactionId: string;
    spOrderId?: string;
    // Purono payment e nai -> SURJOPAY dhorte hobe
    gateway?: PaymentGateway;
    amount: number;
    status: PaymentStatus;
    isDeleted: boolean;
    refundData?: {
        status?: string;
        refund_ref_id?: string;
        errorReason?: string;
        [key: string]: any;
    };
    refundRefId?: string;
    refundReason?: string;
    refundRequestedAt?: string;
    refundedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPaymentSetting {
    activeGateway: PaymentGateway;
    updatedBy: {
        _id?: string;
        name?: string;
        email?: string;
        role?: string;
    } | null;
    updatedAt: string | null;
}

interface IInitPaymentResponse {
    data: {
        paymentUrl: string;
    };
}

interface IPaymentListResponse {
    data: IPayment[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPage: number;
    };
    stats: {
        total: number;
        completed: number;
        unpaid: number;
        failed: number;
        cancelled: number;
        refunded: number;
        totalRevenue: number;
    };
}

interface ISinglePaymentResponse {
    data: IPayment;
}

interface IPaymentSettingResponse {
    data: IPaymentSetting;
}

interface IUpdatePaymentSettingResponse {
    data: {
        activeGateway: PaymentGateway;
        updatedBy?: string;
    };
}

interface GetPaymentsParams {
    searchTerm?: string;
    status?: string;
    gateway?: PaymentGateway;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    sort?: string;
}

export const paymentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getAllPayments: builder.query<IPaymentListResponse, GetPaymentsParams | undefined>({
            query: (params) => ({
                url: "/payment/all-payments",
                method: "GET",
                params,
            }),
            providesTags: ["PAYMENTS"],
        }),

        getAllTrashPayments: builder.query<IPaymentListResponse, GetPaymentsParams | undefined>({
            query: (params) => ({
                url: "/payment/all-trash-payments",
                method: "GET",
                params,
            }),
            providesTags: ["PAYMENTS"],
        }),

        getSinglePayment: builder.query<ISinglePaymentResponse, string>({
            query: (id) => ({
                url: `/payment/${id}`,
                method: "GET",
            }),
            providesTags: ["PAYMENTS"],
        }),

        // Generic update — status here can be UNPAID/PAID/COMPLETED/FAILED/CANCELLED.
        // REFUNDED is NOT settable through this endpoint (backend rejects it).
        updatePayment: builder.mutation<
            ISinglePaymentResponse,
            { id: string; data: { status?: Exclude<PaymentStatus, "REFUNDED" | "REFUND_PENDING"> } }
        >({
            query: ({ id, data }) => ({
                url: `/payment/${id}`,
                method: "PATCH",
                data,
            }),
            invalidatesTags: ["PAYMENTS"],
        }),

        // Refund request (gateway-aware, backend decide kore):
        //  - SurjoPay: REFUND_PENDING, merchant portal e manually approve, cron confirm kore.
        //  - SSLCommerz: API diye automatic initiate, REFUNDED hote pare instantly
        //    ba cron diye confirm hobe.
        requestRefund: builder.mutation<
            ISinglePaymentResponse,
            { id: string; reason?: string }
        >({
            query: ({ id, reason }) => ({
                url: `/payment/${id}/request-refund`,
                method: "PATCH",
                data: { reason },
            }),
            invalidatesTags: ["PAYMENTS"],
        }),

        softDeletePayment: builder.mutation<ISinglePaymentResponse, string>({
            query: (id) => ({
                url: `/payment/soft-delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["PAYMENTS"],
        }),

        restorePayment: builder.mutation<ISinglePaymentResponse, string>({
            query: (id) => ({
                url: `/payment/restore/${id}`,
                method: "PATCH",
            }),
            invalidatesTags: ["PAYMENTS"],
        }),

        deletePayment: builder.mutation<ISinglePaymentResponse, string>({
            query: (id) => ({
                url: `/payment/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["PAYMENTS"],
        }),

        initPayment: builder.mutation<IInitPaymentResponse, string>({
            query: (subscriptionId) => ({
                url: `/payment/init-payment/${subscriptionId}`,
                method: "POST",
            }),
            invalidatesTags: ["PAYMENTS"],
        }),

        // ---------- Payment gateway setting ----------
        getPaymentSetting: builder.query<IPaymentSettingResponse, void>({
            query: () => ({
                url: "/payment-setting",
                method: "GET",
            }),
            providesTags: ["PAYMENTS"],
        }),

        updatePaymentSetting: builder.mutation<
            IUpdatePaymentSettingResponse,
            { activeGateway: PaymentGateway }
        >({
            query: (data) => ({
                url: "/payment-setting",
                method: "PATCH",
                data,
            }),
            invalidatesTags: ["PAYMENTS"],
        }),
    }),
});

export const {
    useGetAllPaymentsQuery,
    useGetAllTrashPaymentsQuery,
    useGetSinglePaymentQuery,
    useUpdatePaymentMutation,
    useRequestRefundMutation,
    useSoftDeletePaymentMutation,
    useRestorePaymentMutation,
    useDeletePaymentMutation,
    useInitPaymentMutation,
    useGetPaymentSettingQuery,
    useUpdatePaymentSettingMutation,
} = paymentApi;

// Backward compatibility: purono jaygay jodi ekhono ei naam use hoy
export const useRequestSurjoPayRefundMutation = useRequestRefundMutation;