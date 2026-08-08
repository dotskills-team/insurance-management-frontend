"use client";

import Image from "next/image";
import Link from "next/link";
import {  Mail, Phone, MapPin } from "lucide-react";
import { FaFacebookF , FaLinkedinIn, FaYoutube  } from "react-icons/fa";
import { siteConfig } from "@/lib/sideConfig";

const companyLinks = [
  { label: "Our Product", href: "/product" },
  { label: "About Us", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-of-condition" },
];

const socialLinks = [
  { id: 1, icon: FaFacebookF, href: "https://facebook.com", label: "Facebook", bg: "bg-[#1877F2]" },
  { id: 2, icon: FaLinkedinIn, href: "https://linkedin.com", label: "LinkedIn", bg: "bg-[#0A66C2]" },
  { id: 3, icon: FaYoutube, href: "https://youtube.com", label: "YouTube", bg: "bg-[#FF0000]" },
  {
    id: 4,
    icon: null,
    href: "https://wa.me/01350775021",
    label: "WhatsApp",
    bg: "bg-[#25D366]",
    customIcon: true,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-[#F7F9FC] dark:border-white/10 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6 pt-5 sm:pt-16 pb-5">
        <div className="grid grid-cols-2 gap-5 sm:gap-12 md:grid-cols-3">
          {/* Brand / IDRA / Social */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="relative h-9 w-9 shrink-0">
                <Image
                  src="/favicon.ico"
                  alt="Surokkha Health"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-[#0F467C] dark:text-white">
                SUROKKA
              </span>
            </Link>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
                Your Trusted Health Insurance Partner
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Surokkha Health helps individuals and families access reliable health insurance
                plans with transparent coverage, affordable premiums, and a seamless
                digital experience.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${social.bg} text-white transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    {social.customIcon ? (
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.85.505 3.583 1.383 5.06L2 22l5.094-1.336A9.94 9.94 0 0 0 12.001 22C17.524 22 22 17.523 22 12S17.524 2 12.001 2zm0 18.163a8.13 8.13 0 0 1-4.147-1.13l-.297-.176-3.028.794.808-2.951-.193-.303a8.13 8.13 0 0 1-1.247-4.32c0-4.494 3.657-8.15 8.15-8.15 4.494 0 8.15 3.656 8.15 8.15 0 4.493-3.656 8.086-8.15 8.086z" />
                      </svg>
                    ) : (
                      Icon && <Icon className="h-4 w-4" strokeWidth={2} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-[#007A55] dark:text-[#00E0AE]">
              Company
            </h3>
            <ul className="space-y-3.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[#0B1F3A] transition-colors hover:text-[#00A67E] dark:text-gray-300 dark:hover:text-[#00E0AE]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-[#007A55] dark:text-[#00E0AE]">
              Contact
            </h3>

            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#00A67E]">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </p>
                <Link
                  href={`mailto:${siteConfig.email}`}
                  className="mt-1 block wrap-break-word text-[15px] text-[#0B1F3A] hover:text-[#00A67E] dark:text-gray-300 dark:hover:text-[#00E0AE]"
                >
                  {siteConfig.email}
                </Link>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#00A67E]">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </p>
                <Link
                  href="tel:+09639444274"
                  className="mt-1 block text-[15px] text-[#0B1F3A] hover:text-[#00A67E] dark:text-gray-300 dark:hover:text-[#00E0AE]"
                >
                  {siteConfig.phone}
                </Link>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#00A67E]">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-[#0B1F3A] dark:text-gray-300">
                  {siteConfig.address.street}, {siteConfig.address.city}{" "}
                  {siteConfig.address.postalCode}, Bangladesh
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment partners — static wrapping grid */}
        <div className="mt-5 sm:mt-14 border-t border-black/5 pt-8 dark:border-white/10">
        <h3 className="font-semibold text-center">Payment Partner</h3>
          <Image
            src="/assets/shurjoPay-logo.webp"
            alt="Payment Gateway Logo"
            width={100}
            height={10}
            priority
            className="mx-auto h-auto  object-contain"
          />
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-black/5 pt-6 text-center dark:border-white/10">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            © {new Date().getFullYear()} <span className="font-bold">Surokkha Health</span>. All Rights Reserved. Developed by <Link target="_blank" href={"https://dotskillsbd.com"}><span className="font-bold text-[#0F467C] dark:text-[#43B748]">Dotskills</span> </Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}