
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "@/components/shared/useInView";

const diagnosticPartners = [
  {
    id: 1,
    name: "Popular Diagnostic Centre",
    logo: "https://akhil.populardiagnostic.com/Images/Logo/logo.png",
    city: "Dhaka",
  },
  {
    id: 2,
    name: "Labaid Diagnostic",
    logo: "https://labaiddiagnostics.com/frontend/images/labaid_new_logo.jpg",
    city: "Dhaka",
  },
  {
    id: 3,
    name: "Ibn Sina Diagnostic",
    logo: "https://images.seeklogo.com/logo-png/55/1/ibn-sina-logo-png_seeklogo-555156.png",
    city: "Chattogram",
  },
  {
    id: 4,
    name: "Al Mahmud Diagnostic",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnoRWynf8YsdcDjt30PvDuuBK9U8xAAsHP4VPb0Eb6giR4TIM3L9-2dak&s=10",
    city: "Dhaka",
  },
  {
    id: 5,
    name: "Ashiyan Diagnostic",
    logo: "/diagnostics/ashiyan.png",
    city: "Sylhet",
  },
  {
    id: 6,
    name: "Prime Diagnostic Centre",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxRVFhcvlVtnOmF3fGGoYfO6BBCbZtjCrtHlSKwIB5_GE5dqg_BjUKU-6g&s=10",
    city: "Khulna",
  },
  {
    id: 7,
    name: "Modern Diagnostic Centre",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTar_5iq7i30ujMtehZxGgXxubzh_ffpHsKQ13qk0b_rbfo-LlSDp0Zn-I&s=10",
    city: "Rajshahi",
  },
  {
    id: 8,
    name: "Central Hospital Diagnostic",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCscM0IET3DcMN2Tnmml-FDSAfeit7eUFHpFhE-yGuQpjDXRyNSaN6piQl&s=10",
    city: "Dhaka",
  },
];


function SpecimenCard({
  name,
  logo,
  city,
  id,
  index,
  inView,
}: {
  name: string;
  logo: string;
  city: string;
  id: number;
  index: number;
  inView: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const code = `BD-${String(id).padStart(4, "0")}`;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-md border border-[#D7DEDA] bg-white shadow-[0_1px_2px_rgba(15,30,25,0.04)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(14,107,88,0.12)] dark:border-[#24332E] dark:bg-[#12211D] dark:hover:shadow-[0_10px_24px_rgba(79,217,188,0.08)] ${
        inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{ transitionDelay: inView ? `${index * 60}ms` : "0ms" }}
    >
      {/* city tab */}
      <div className="flex items-center justify-between px-3 pt-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#0E6B58] dark:text-[#4FD9BC]">
          {city}
        </span>
        <span className="font-mono text-[9px] tracking-wider text-[#9AA8A2] dark:text-[#8FA39B]">
          {code}
        </span>
      </div>

      {/* logo field */}
      <div className="flex h-40 items-center justify-center px-4 py-3">
        {!errored ? (
          <Image
            src={logo}
            alt={name}
            width={140}
            height={180}
            className="max-h-25 w-auto object-contain transition-all duration-300 group-hover:grayscale-0 dark:brightness-110 dark:contrast-110"
            onError={() => setErrored(true)}
          />
        ) : (
          <span className="text-center text-sm font-medium text-[#16241F] dark:text-[#E7EFEA]">
            {name}
          </span>
        )}
      </div>

      {/* perforation */}
      <div className="relative px-3">
        <div className="absolute -left-1 -top-1.25 h-2.5 w-2.5 rounded-full bg-[#F4F7F4] dark:bg-[#0B1412]" />
        <div className="absolute -right-1 -top-1.25 h-2.5 w-2.5 rounded-full bg-[#F4F7F4] dark:bg-[#0B1412]" />
        <div className="border-t border-dashed border-[#D7DEDA] dark:border-[#24332E]" />
      </div>

      {/* name + verified stamp */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="truncate text-[11.5px] font-medium text-[#16241F] dark:text-[#E7EFEA]">
          {name}
        </span>
        <span
          className="flex shrink-0 items-center gap-1 rounded-sm border border-[#D9A441]/50 bg-[#D9A441]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-[#9A7115] dark:border-[#F0C36D]/40 dark:bg-[#F0C36D]/10 dark:text-[#F0C36D]"
          title="Verified Shurokka partner"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Verified
        </span>
      </div>
    </div>
  );
}

// Main section
export default function DiagnosticPage() {
  const { ref: gridRef, isVisible: gridInView } = useInView({
        threshold: 0.2,
    });

  const stats = [
    { label: "Partners", value: `${diagnosticPartners.length}+` },
    { label: "Booking", value: "24/7" },
  ];

  return (
    <section className="bg-[#F4F7F4] pb-5 dark:bg-[#0B1412]">
      <div className="relative overflow-hidden bg-[#0A4A3D] dark:bg-[#06231D]">
        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-10 lg:px-5">
          {/* breadcrumb */}
          <div className="pb-5">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-white"
            >
              <Link
                href="/"
                className="flex items-center gap-1 transition-colors hover:text-[#7FD9C4]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Home
              </Link>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#C7D1CC]"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-medium text-white" aria-current="page">
                Diagnostic
              </span>
            </nav>
          </div>

          {/* ---------------- Report-header hero ---------------- */}
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7FD9C4]">
                Diagnostic Network — Report No. SHK/DX/2026
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Find a partner lab.
                <br />
                Redeem your benefit on the spot.
              </h2>
              <p className="mt-3 text-sm text-[#CFE6DE] sm:text-base">
                Book tests and scans, and settle the bill directly through
                Shurokka at any partner diagnostic center below.
              </p>
            </div>

            {/* readout block, styled like a report's field grid */}
            <div className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-md border border-white/15 bg-white/10 text-white sm:w-56">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#0A4A3D] px-3 py-3 text-center dark:bg-[#06231D]"
                >
                  <p className="font-mono text-xl font-semibold">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-[#9FC9BC]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5">
        {/* ---------------- Partner logos ---------------- */}
        <div ref={gridRef} className="mt-12">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#0E6B58] dark:text-[#4FD9BC]">
              Requisition — Select Center
            </p>
            <h3 className="text-lg font-semibold text-[#16241F] dark:text-[#E7EFEA] sm:text-xl">
              Our diagnostic partners
            </h3>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {diagnosticPartners.map((partner, index) => (
              <SpecimenCard
                key={partner.id}
                id={partner.id}
                name={partner.name}
                logo={partner.logo}
                city={partner.city}
                index={index}
                inView={gridInView}
              />
            ))}
          </div>
        </div>

        {/* ---------------- CTA, styled as the tear-off bottom of a form ---------------- */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 rounded-md border border-[#D7DEDA] bg-white p-6 text-center dark:border-[#24332E] dark:bg-[#12211D] sm:flex-row sm:text-left">
          <div>
            <p className="text-sm font-semibold text-[#16241F] dark:text-[#E7EFEA]">
              Don&apos;t see your local diagnostic center?
            </p>
            <p className="mt-0.5 text-sm text-[#6B7A73] dark:text-[#8FA39B]">
              We&apos;re adding new partners every week across Bangladesh.
            </p>
          </div>
          <a
            href="/assets/pdf/surokkhahealth_partner_list.pdf"
            download
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#0E6B58] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A4A3D] dark:bg-[#4FD9BC] dark:text-[#06231D] dark:hover:bg-[#7FD9C4]"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download partner list (PDF)
          </a>
        </div>
      </div>
    </section>
  );
}