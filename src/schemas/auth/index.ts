import { z } from 'zod';

// Phone Number Schema - Bangladesh format
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^(\0|0)?1[3-9]\d{8}$/,
    'Please enter a valid phone number'
  )
  .transform((val) => {
    // Normalize phone number to start with 0
    if (val.startsWith('0')) return val;
    if (val.startsWith('0')) return '0' + val.slice(1);
    return '0' + val;
  });

// Login Schema
export const loginSchema = z.object({
  phoneNumber: phoneSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register Schema
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters'),
  phoneNumber: phoneSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreedToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  phoneNumber: phoneSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// OTP Schema
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

export type OTPFormData = z.infer<typeof otpSchema>;

// Reset Password Schema
export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
