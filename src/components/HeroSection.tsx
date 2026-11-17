import React from 'react';
import { ArrowRight, Truck, Banknote, Headphones, Award } from 'lucide-react';
import { HERO_IMAGE } from '../data/storeData';

interface HeroSectionProps {
  onShopNow: () => void;
}

const TRUST_FEATURES = [
  {
    icon: Truck,
    title: 'Free Shipping',
    subtitle: 'Across Pakistan',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Banknote,
    title: 'Cash on Delivery',
    subtitle: 'Pay on Delivery',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    subtitle: 'Always Available',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Award,
    title: 'Trusted Store',
    subtitle: 'Trusted by Thousands',
    iconBg: 'bg-purple-50 text-purple-600',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onShopNow }) => {
  return (
    <section id="top" className="w-full">
      {/* Full-Bleed Edge-to-Edge Hero Banner */}
      <div className="relative w-full overflow-hidden bg-[#0C0D10] min-h-[420px] sm:min-h-[500px] lg:min-h-[560px] flex items-center">
        {/* Background Product Photography */}
        <img
          src={HERO_IMAGE}
          alt="SHA.AVEN smartwatch, wireless earbuds, knitwear, and sneakers showcase"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center"
        />

        {/* Measured Left Scrim for Text Legibility while Preserving Right Showcase Brightness */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0B0C0F]/95 via-[#0B0C0F]/60 sm:via-[#0B0C0F]/45 to-transparent"
        />

        {/* Hero Copy Aligned to Container Grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-14 sm:py-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-400 text-[11px] font-bold tracking-[0.14em] uppercase mb-5">
              PREMIUM STORE
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.05] [text-wrap:balance]">
              Upgrade Your Style With SHA.AVEN
            </h1>

            <p className="mt-4 text-sm sm:text-[15px] text-zinc-200 leading-relaxed max-w-md">
              Modern Gear. Better Life. Select colors, view real-time changes, and complete orders
              instantly via WhatsApp with flexible Online Payment or Cash on Delivery options.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-zinc-950 font-bold text-sm shadow-md transition-all duration-150 cursor-pointer whitespace-nowrap"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column Trust Features Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {TRUST_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl bg-white border border-zinc-200/80 shadow-xs"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{item.title}</h2>
                  <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
