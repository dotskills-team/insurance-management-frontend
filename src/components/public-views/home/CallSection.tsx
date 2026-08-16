import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/sideConfig";
import { PhoneCall } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function CallSection() {
  return (
    <div className="overflow-hidden background-second dark:bg-[#0A2E24] py-2 px-6 sm:py-10 sm:px-10">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-16 text-center">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <PhoneCall className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white sm:text-xl">
              Get a callback to understand more
            </p>
            <p className="sm:mt-1 text-sm text-white/60">
              Our advisors will reach out within 30 minutes
            </p>
          </div>
        </div>

        {/* <Button
          className="shrink-0 rounded-full btn-bg px-8 py-5 sm:py-6 text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 hover:shadow-lg"
        > */}
        {/* <Link
            href={`https://wa.me/${siteConfig.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Call
          </Link> */}

        {/* </Button> */}

        <a href="tel:09639444274">
          <Button className="shrink-0 rounded-full btn-bg px-8 py-5 sm:py-6 text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 hover:shadow-lg">
            Get Call
          </Button>
        </a>
      </div>
    </div>
  );
}