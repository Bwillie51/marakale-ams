"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  LogIn, 
  ShieldCheck, 
  Waves, 
  Coffee, 
  Sparkles, 
  Phone, 
  Mail, 
  Award, 
  Tv, 
  Wifi, 
  Wind, 
  Compass, 
  ArrowRight,
  Percent,
  Calendar
} from "lucide-react";

// Local image metadata asset configurations imported natively from your folder structure
import logoAsset from "./logo.png";
import backgroundAsset from "./Marakale.png";

/**
 * Marakale Luxury Hotels & Serviced Apartments - Public Marketing Storefront
 * Location: app/(public)/page.tsx
 * Presents standard hotel features, promotional bundles, amenities, and room tier cards.
 */
export default function PublicHotelMarketingWebsite() {
  
  // Standard hotel room tiers descriptions (Displayed statically for public inspiration)
  const roomTiersDescription = [
    {
      title: "Standard Suite",
      description: "Perfect for corporate travelers. Features a plush queen bed, integrated working desk, high-speed fiber connectivity, and a minimalist master bathroom.",
      priceFrom: 120,
      amenities: ["Free Wi-Fi", "Smart TV", "Air Conditioning"]
    },
    {
      title: "Deluxe Studio",
      description: "Spacious studio apartment with an open-plan lounge area, premium king-size linen layout, fully equipped kitchenette, and panoramic urban balcony view frames.",
      priceFrom: 180,
      amenities: ["Free Wi-Fi", "Kitchenette", "Balcony View", "Smart TV"]
    },
    {
      title: "Executive Apartment",
      description: "Designed for premium long-stay comfort. Features two separate bedrooms, individual lounge spaces, smart kitchen counters, and complimentary room dining privileges.",
      priceFrom: 250,
      amenities: ["Free Wi-Fi", "Full Kitchen", "2 Bathrooms", "In-Room Dining"]
    },
    {
      title: "Presidential Penthouse",
      description: "The ultimate luxury statement. Occupying the entire top level, featuring a private terrace, floor-to-ceiling panoramic views, master walk-in wardrobes, and a 24/7 dedicated butler service matrix.",
      priceFrom: 450,
      amenities: ["All Amenities Included", "Private Terrace", "24/7 Butler Service", "Spa Bath"]
    }
  ];

  // Active promotional campaigns tracking matrix
  const currentPromotions = [
    {
      badge: "Length of Stay Special",
      title: "Extended Journey Discounts",
      desc: "Stay more than 3 nights and unlock tiered pricing discounts: 5% off up to 7 nights, 12% off up to 14 nights, and an absolute 20% off for custom seasonal retreats over 2 weeks.",
      action: "Book Multi-Night Stays"
    },
    {
      badge: "In-House Dining Promo",
      title: "Complimentary Suite Breakfast",
      desc: "Place your meal orders straight from your private digital in-room portal panel upon check-in and get free morning deliveries from our top chefs.",
      action: "Explore Meal Service"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* 1. BRAND GLOBAL NAVIGATION HEADER BAR */}
      <nav className="h-20 bg-white border-b border-slate-200 px-6 md:px-12 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
            <Image 
              src={logoAsset} 
              alt="Marakale Core Brand Logo" 
              placeholder="blur" 
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider uppercase text-slate-900">
              Marakale Serviced Apartments
            </span>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              Premium Serviced Apartments
            </span>
          </div>
        </div>

        {/* System Access Authentication Entry Route Link */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-slate-900 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-white hover:text-slate-900 transition-all shadow-sm duration-200"
        >
          <LogIn className="w-3.5 h-3.5" /> Login
        </Link>
      </nav>

      {/* 2. HERO HIGHLIGHT BANNER WITH LANDING COVER MATRIX */}
      <header className="relative bg-slate-900 text-white min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-60 mix-blend-luminosity">
          <Image
            src={backgroundAsset}
            alt="Marakale Cover Backdrop Layout"
            placeholder="blur"
            fill
            priority
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-950/20 z-10" />

        <div className="relative z-20 text-center max-w-4xl mx-auto px-6 py-16 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest">
            <Award className="w-3 h-3" /> Enjoy your Premium Living Experience
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none text-white">
            Your Sanctuary in the Heart of the City
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-normal leading-relaxed">
            Welcome to Marakale. Immerse yourself in premium architectural design, smart automation arrays, and bespoke multi-room tracking coordination pools.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all shadow-md group"
            >
              <span>Check Room Availability</span>
              <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. ACTIVE PROMOTIONS & MARKETING CAMPAIGNS HIGHLIGHTS */}
      <section className="bg-slate-100 border-y border-slate-200 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-500" /> Exclusive Seasonal Packages
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPromotions.map((promo, index) => (
              <div key={index} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-black tracking-widest bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                    {promo.badge}
                  </span>
                  <h4 className="text-base font-black text-slate-900">{promo.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{promo.desc}</p>
                </div>
                <Link href="/login" className="text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1 hover:text-slate-700">
                  {promo.action} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STATIC HOTEL ROOM CATEGORIES OVERVIEW */}
      <section className="max-w-7xl w-full mx-auto p-6 md:p-12 space-y-8">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Our Curated Suite Collections</h3>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Explore our meticulously planned layout choices built to ensure complete long-stay serenity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roomTiersDescription.map((tier, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row hover:shadow-md hover:border-slate-300 transition-all duration-200">
              
              {/* Picture Placeholder Box (Mimics Standard Luxury Hotel Presentations) */}
              {/* The image Marakale.png will be added here */  }

              <div className="w-full md:w-48 bg-slate-900 text-slate-500 flex flex-col items-center justify-center p-6 text-center space-y-2 select-none border-b md:border-b-0 md:border-r border-slate-200 relative">
                <Compass className="w-8 h-8 text-slate-700 animate-spin-slow" />
                <Image
                  src={backgroundAsset}
                  alt="Marakale Cover Backdrop Layout"
                  placeholder="blur"
                  fill
                  priority
                  className="object-cover object-center"
                />
              

                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{tier.title} Photo</span>
                <span className="text-[9px] text-slate-600 font-medium">Bespoke Interior Layout</span>
                <div className="absolute top-2 left-2 text-[9px] font-extrabold uppercase px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                  Premium
                </div>
              </div>

                            {/* Text Description Box */}
              <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{tier.title}</h4>
                    <span className="text-xs font-black text-slate-900">
                      From <span className="text-sm font-black text-emerald-600">${tier.priceFrom}</span> <span className="text-[10px] text-slate-400 font-normal">/ night</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{tier.description}</p>
                </div>

                {/* Amenity Pill Injections */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tier.amenities.map((amenity, idx) => (
                    <span key={idx} className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      {amenity.includes("Wi-Fi") ? <Wifi className="w-2.5 h-2.5" /> : amenity.includes("TV") ? <Tv className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* 5. HOTEL COMPREHENSIVE FEATURES & WORLD-CLASS AMENITIES */}
      <section className="bg-slate-900 text-white py-16 px-6 md:px-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Waves className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">Premium Infinity Pools</h4>
            <p className="text-xs text-slate-400 font-normal leading-relaxed">Relax inside our absolute temperature-controlled rooftop pool decks open daily from 6:00 AM to 10:00 PM.</p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Coffee className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">Bespoke Lounge Dining</h4>
            <p className="text-xs text-slate-400 font-normal leading-relaxed">Savor curated delicacies prepared daily by five-star culinary specialists, or book individual table events.</p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">24h Guard Lock Security</h4>
            <p className="text-xs text-slate-400 font-normal leading-relaxed">Experience deep security peace-of-mind backed by encrypted room tokens and around-the-clock patrol units.</p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Wind className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">Microclimate Ventilation</h4>
            <p className="text-xs text-slate-400 font-normal leading-relaxed">Every suite features isolated medical-grade air purifier setups running continuously for fresh breathing environments.</p>
          </div>
        </div>
      </section>

      {/* 6. PUBLIC WEB FOOTER LAYOUT */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-100 px-6 py-8 text-xs font-normal">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left items-center">
          <div className="space-y-1">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider">Marakale Luxury Hotels</p>
            <p className="text-slate-9000 text-[11px]">Premium Property Management & Global Hospitality Framework.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-[11px] text-slate-500 items-center">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-9000" /> +675 71234567</span>
            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-9000" /> support@marakale.com</span>
          </div>
          <p className="text-[10px] text-slate-9000 md:text-right">
            © {new Date().getFullYear()} Marakale Stays. All system logs securely mapped under administrative cloud tracking keys.
          </p>
          <p className="text-[10px] text-slate-9000 md:text-right">
            Powered by BiiXoft AMS v1.1 Secure. All rights reserved.
          </p>
        
        </div>
      </footer>

    </div>
  );
}
