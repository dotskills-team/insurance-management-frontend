/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/schemas/auth";
import { PhoneInput } from "./PhoneInput";
import { PasswordInput } from "./PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  Lock,
  Headphones,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
} from "@/redux/features/auth/auth.api";

interface OtpSuccessData {
  accessToken: string;
  refreshToken: string;
  user: any;
}

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
  onOtpSuccess?: (data: OtpSuccessData) => Promise<void> | void;
}

const PHONE_REGEX = /^01[3-9]\d{8}$/;

export function LoginForm({
  onSubmit,
  isLoading = false,
  onOtpSuccess,
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema as any),
    mode: "onBlur",
    defaultValues: {
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");
  const loading = isSubmitting || isLoading;

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        toast.error("Login handler not configured");
      }
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  // ================= OTP flow =================
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpPhoneError, setOtpPhoneError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendTimer]);

  const handleSendOtp = async () => {
    setOtpPhoneError("");

    if (!PHONE_REGEX.test(otpPhone)) {
      setOtpPhoneError("Enter a valid phone number");
      return;
    }

    try {
      const res = await sendOtp({ phone: otpPhone }).unwrap();
      console.log("res", res);
      toast.success(res?.message || "OTP sent successfully");
      setOtpSent(true);
      setResendTimer(30);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length < 4) {
      toast.error("Enter a valid OTP");
      return;
    }

    try {
      const res = await verifyOtp({ phone: otpPhone, otp: otpCode }).unwrap();
      toast.success("Logged in successfully");

      if (onOtpSuccess) {
        await onOtpSuccess(res.data);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="w-full">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#007A5A]/10">
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your Shurokkha account
        </p>
      </div>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 rounded-xl p-1">
          <TabsTrigger value="password" className="rounded-lg">
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Password
          </TabsTrigger>
          <TabsTrigger value="otp" className="rounded-lg">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            OTP
          </TabsTrigger>
        </TabsList>

        {/* ================= Phone + Password ================= */}
        <TabsContent value="password">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <PhoneInput
              label="Phone Number"
              placeholder="017XXXXXXXX"
              disabled={loading}
              error={errors.phoneNumber?.message}
              {...register("phoneNumber")}
            />

            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              disabled={loading}
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setValue("rememberMe", !!checked)
                  }
                />
                <span className="text-sm text-muted-foreground">
                  Remember me
                </span>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#007A5A] hover:text-[#006349]"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="
                h-12
                w-full
                rounded-xl
                bg-indigo-600
                text-white
                shadow-lg
                shadow-[#007A5A]/20
                hover:bg-indigo-600
                hover:shadow-xl hover:cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out
              "
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        {/* ================= Phone + OTP ================= */}
        <TabsContent value="otp">
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="otp-phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="otp-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="017XXXXXXXX"
                    value={otpPhone}
                    disabled={otpSent}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    className="h-12 rounded-xl pl-9"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isSendingOtp || resendTimer > 0}
                  onClick={handleSendOtp}
                  className="h-12 shrink-0 rounded-xl"
                >
                  {isSendingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : resendTimer > 0 ? (
                    `${resendTimer}s`
                  ) : otpSent ? (
                    "Resend"
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
              {otpPhoneError && (
                <p className="text-xs text-destructive">{otpPhoneError}</p>
              )}
            </div>

            {otpSent && (
              <div className="space-y-1.5">
                <Label htmlFor="otp-code">OTP Code</Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="h-12 rounded-xl pl-9 tracking-widest"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!otpSent || isVerifyingOtp}
              className="
                h-12
                w-full
                rounded-xl
                bg-indigo-600
                text-white
                shadow-lg
                shadow-[#007A5A]/20
                hover:bg-indigo-600
                hover:shadow-xl hover:cursor-pointer hover:scale-105 transition-transform duration-500 ease-in-out
              "
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Register */}
      {/* <div className="text-center mt-5">
        <span className="text-sm text-muted-foreground">
          Don&apos;t have an account?
        </span>

        <Link
          href="/register"
          className="ml-1 font-semibold text-[#007A5A] hover:text-[#006349]"
        >
          Create Account
        </Link>
      </div> */}

      {/* Security Notice */}
      <div className="mt-5 rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-muted-foreground">
            Your account is protected with secure authentication and encrypted
            communication.
          </span>
        </div>
      </div>

      {/* Trust Section */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
        <div className="text-center">
          <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-[#007A5A]" />
          <p className="text-sm font-semibold">Secure</p>
          <p className="text-xs text-muted-foreground">Authentication</p>
        </div>

        <div className="text-center">
          <Headphones className="mx-auto mb-2 h-5 w-5 text-[#007A5A]" />
          <p className="text-sm font-semibold">24/7</p>
          <p className="text-xs text-muted-foreground">Support</p>
        </div>

        <div className="text-center">
          <Lock className="mx-auto mb-2 h-5 w-5 text-[#007A5A]" />
          <p className="text-sm font-semibold">Trusted</p>
          <p className="text-xs text-muted-foreground">Platform</p>
        </div>
      </div>
    </div>
  );
}
