"use client";

import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const partners = [
  { id: 1, name: "Zaynax", logo: "/assets/zaynax-logo.svg" },
  { id: 2, name: "Shurjopay", logo: "/assets/shurjoPay-logo.webp" },
  { id: 3, name: "Protective", logo: "/assets/protective-logo-1.png" },
];

export default function TrustedPartnersSection() {
  return (
    <section className="bg-white py-6 dark:bg-neutral-950 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-[#00C896]/10 px-4 py-1 text-xs font-bold uppercase tracking-wide text-[#00A67E]">
            Partnerships
          </span>
          <h2 className="text-3xl font-extrabold text-[#0B1F3A] dark:text-white sm:text-4xl">
            Our Business Partners
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            We partner with leading Bangladeshi companies and multinationals
          </p>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-linear-to-r from-white to-transparent dark:from-neutral-950 sm:w-24" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-linear-to-l from-white to-transparent dark:from-neutral-950 sm:w-24" />

        <Carousel
          opts={{
            loop: true,
            align: "start",
            watchDrag: false,
            skipSnaps: false,
          }}
          plugins={[
            Autoplay({
              delay: 2000,
              stopOnInteraction: false,
              stopOnMouseEnter: false,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-6">
            {partners.map((partner) => (
              <CarouselItem
                key={partner.id}
                className="basis-1/2 pl-6 sm:basis-1/3"
              >
                <div className="flex h-20 items-center justify-center rounded-2xl border border-black/5 bg-white px-6 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:h-24">
                  <div className="relative h-10 w-full sm:h-12">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      sizes="200px"
                      className={`object-contain ${partner.name === "Protective"
                          ? "scale-[1.8]"
                          : ""
                        } dark:brightness-0 dark:invert`}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}