
"use client";

import React, { useEffect, useRef, useState } from "react";

import {
  Headset,
  Stethoscope,
  BadgePercent,
  BedDouble,
  Pill,
  ShoppingCart,
} from "lucide-react";
import { useInView } from "@/components/shared/useInView";

const benefits = [
  {
    id: 1,
    icon: Headset,
    title: "24/7 Telemedicine",
    description:
      "Surokkha Health Doctors are here for you 24/7, 365 days a year. Whenever you need it, get a callback from our doctors in 5 minutes (Audio/Video)",
  },
  // {
  //   id: 2,
  //   icon: Stethoscope,
  //   title: "Specialist Doctor",
  //   description:
  //     "Get access to 4 genres of experienced Specialists, basis appointment: Gynecologist, Pediatrician, Psychologist, Nutritionist",
  // },
  {
    id: 3,
    icon: BadgePercent,
    title: "Partner Discount",
    description:
      "Get up to 50% discount on 500+ partner hospitals across 64 districts in Bangladesh on hospitalization and diagnostic tests",
  },
  {
    id: 4,
    icon: BedDouble,
    title: "Hospital Cashback",
    description:
      "Get BDT 2500-4500 per night coverage for hospitalization at any hospitals across Bangladesh",
  },
  {
    id: 5,
    icon: Pill,
    title: "Medicine Coverage",
    description:
      "Get cashback on prescribed medicine purchases with a valid prescription from any BMDC-registered doctor.",
  },
];

export default function OfferSection() {
  const { ref: sectionRef, isVisible: visible } = useInView({
      threshold: 0.2,
  });

  return (
    <section ref={sectionRef} className="bg-white py-6 dark:bg-neutral-950 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`mx-auto max-w-2xl px-5 text-center transition-all duration-700 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-3xl font-bold">What Surokkha Health Offers</h2>
          <p>
            Surokkha Health Health Offers all that you need, for a comprehensive healthcare
            solution that you can access conveniently
          </p>
        </div>

        <div
          ref={sectionRef}
          className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 mt-10"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.id}
                style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
                className={`group flex flex-col items-start rounded-2xl p-4 -m-4 -translate-y-1.5 shadow-lg shadow-black/5 transition-all duration-700 ease-out dark:shadow-black/20 hover:-translate-y-2.5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 ${
                  visible ? "opacity-100" : "opacity-0 translate-y-8"
                }`}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00C896]/15 transition-colors duration-300 group-hover:bg-[#00C896]/25">
                  <Icon className="h-6 w-6 text-[#00A67E]" strokeWidth={2} />
                </div>

                <h3 className="mb-2 text-lg font-bold text-[#0B1F3A] dark:text-white">
                  {benefit.title}
                </h3>

                <p className="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}