"use client";

import { useState } from "react";
import {
  Wallet,
  HandCoins,
  Stethoscope,
  ShieldCheck,
  HeartPulse,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useInView } from "@/components/shared/useInView";

interface Benefit {
  id: number;
  icon: typeof Wallet;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    id: 1,
    icon: Wallet,
    title: "Affordable Protection Plans",
    description:
      "Choose from flexible and affordable health protection plans designed to suit individuals, families, and different budgets without compromising essential coverage.",
  },
  {
    id: 2,
    icon: HandCoins,
    title: "Trusted Healthcare Support",
    description:
      "Get financial assistance during hospitalization and access dependable healthcare support when you need it most, helping reduce the burden of unexpected medical expenses.",
  },
  {
    id: 3,
    icon: Stethoscope,
    title: "Transparent & Hassle-Free Claim Process",
    description:
      "Submit and track your claims through a simple, transparent process with minimal paperwork and faster claim settlements.",
  },
  {
    id: 4,
    icon: ShieldCheck,
    title: "Nationwide Partner Network",
    description:
      "Access a wide network of trusted hospitals, diagnostic centers, and healthcare providers across Bangladesh for convenient and reliable medical services.",
  },
  {
    id: 5,
    icon: HeartPulse,
    title: "Dedicated Customer Care",
    description:
      "Our friendly support team is always ready to assist you with policy information, claims, renewals, and any healthcare-related questions.",
  },
  {
    id: 6,
    icon: Smartphone,
    title: "Digital-First Experience",
    description:
      "Manage your health protection plan online with a secure and user-friendly platform for enrollment, policy management, claims, and customer support.",
  },
  {
    id: 7,
    icon: HeartPulse,
    title: "Reliable Health Protection for Individuals & Families",
    description:
      "Comprehensive health protection designed for individuals and families, offering peace of mind with financial security against unexpected medical emergencies.",
  },
];

const INITIAL_COUNT = 3;

export default function WhyChooseBenefitsSection() {
  const { ref: sectionRef, isVisible: visible } = useInView({
    threshold: 0.2,
  });
  const [expanded, setExpanded] = useState(false);

  const visibleBenefits = expanded
    ? benefits
    : benefits.slice(0, INITIAL_COUNT);

  return (
    <section
      ref={sectionRef}
      className="bg-[#0B1F3A] py-6 dark:bg-[#050D1A] sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={`mx-auto mb-12 max-w-2xl text-center transition-all duration-700 ease-out sm:mb-16 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Why Choose Surokkha?
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBenefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.id}
                style={{
                  transitionDelay: visible ? `${index * 100}ms` : "0ms",
                }}
                className={`group rounded-2xl border border-white/10 bg-white/3 p-6 transition-all duration-700 ease-out hover:-translate-y-1 hover:border-[#00C896]/40 hover:bg-white/6 ${
                  visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                }`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00C896]/10 transition-colors duration-300 group-hover:bg-[#00C896]/20">
                  <Icon
                    className="h-6 w-6 text-[#00E0AE]"
                    strokeWidth={1.75}
                  />
                </div>

                <h3 className="mb-2 text-lg font-bold text-white">
                  {benefit.title}
                </h3>

                <p className="text-sm leading-relaxed text-white/70">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>

        {benefits.length > INITIAL_COUNT && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-[#00C896]/50 hover:bg-white/10"
            >
              {expanded ? "Show Less" : "Show More"}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-[#00E0AE]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#00E0AE]" />
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}