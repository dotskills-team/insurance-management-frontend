
import CallSection from '@/components/public-views/home/CallSection'
import ClaimProcessSection from '@/components/public-views/home/ClaimProcessSection'
import CoverageSection from '@/components/public-views/home/CoverageSection'
import FindPlanSection from '@/components/public-views/home/FindPlanSection'
import HeroSection from '@/components/public-views/home/HeroSection'
import NewsAwardsSection from '@/components/public-views/home/NewsAwardsSection'
import OfferSection from '@/components/public-views/home/OfferSection'
import PartnerSection from '@/components/public-views/home/PartnerSection'
import PlansSection from '@/components/public-views/home/PlanSection'
import TrustedPartnersSection from '@/components/public-views/home/TrustedPartnersSection'
import WhyChooseUsSection from '@/components/public-views/home/WhyChooseUsSection'
import Image from 'next/image'
import React from 'react'

function HomePage() {
  return (
    <div className='bg-color'>
        <HeroSection /> 
        <CallSection />
        <OfferSection />
        <PlansSection />
        <CoverageSection />
        {/* <PartnerSection /> */}
        <WhyChooseUsSection />
        <ClaimProcessSection />
        <TrustedPartnersSection />
        <FindPlanSection />
        {/* <NewsAwardsSection /> */}

      {/* <Image
        className="w-full h-full cursor-pointer transition-transform duration-300 ease-out group-hover:scale-105 object-cover"
        src="/assets/comming-soon-banner-image.png"
        alt="Coming Soon"
        width={1920}
        height={400}
        priority
      /> */}
    </div>
  )
}

export default HomePage