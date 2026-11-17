import React, { useState, useRef, useEffect } from 'react';
import {
  Truck,
  Banknote,
  ShieldCheck,
  ShoppingBag,
  ChevronDown,
  Menu,
  X,
  MessageCircle,
  Instagram,
  Youtube,
  Facebook,
} from 'lucide-react';
import { CATEGORIES, STORE_WHATSAPP_DISPLAY, STORE_WHATSAPP_NUMBER } from '../data/storeData';
import { CategoryId } from '../types/store';

interface NavbarProps {
  cartCount: number;
  selectedCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  onOpenCart: () => void;
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  selectedCategory,
  onSelectCategory,
  onOpenCart,
  onOpenContact,
}) => {
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCategoryClick = (cat: CategoryId) => {
    onSelectCategory(cat);
    setProductsMenuOpen(false);
    setMobileMenuOpen(false);
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const whatsappHref = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Assalam-o-Alaikum SHA.AVEN! I would like to inquire about your products.'
  )}`;

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[#0B0B0D] text-white text-xs border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 text-zinc-200 font-medium">
              <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Fast Shipping All Over Pakistan
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-zinc-200 font-medium">
              <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Cash on Delivery Available
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-zinc-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Trusted Store
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-zinc-400 shrink-0">
            <a
              href="#reviews-section"
              aria-label="Instagram"
              className="hover:text-amber-400 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="#reviews-section"
              aria-label="YouTube"
              className="hover:text-amber-400 transition-colors"
            >
              <Youtube className="w-3.5 h-3.5" />
            </a>
            <a
              href="#reviews-section"
              aria-label="Facebook"
              className="hover:text-amber-400 transition-colors"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Brand Logo */}
          <a
            href="#top"
            onClick={() => onSelectCategory('all')}
            className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-sm text-white">
              <ShoppingBag className="w-5 h-5 stroke-[2.25]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight text-zinc-950">
                SHA.AVEN
              </span>
              <span className="text-[10px] font-bold tracking-[0.14em] text-amber-600 uppercase mt-0.5">
                ONLINE SOLUTION
              </span>
            </div>
          </a>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-5">
            <a
              href="#top"
              onClick={() => onSelectCategory('all')}
              className="px-4 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 hover:bg-zinc-800 transition-colors"
            >
              HOME
            </a>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProductsMenuOpen((prev) => !prev)}
                aria-expanded={productsMenuOpen}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide text-zinc-700 hover:text-orange-600 hover:bg-orange-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                PRODUCTS
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    productsMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {productsMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-zinc-200 shadow-xl py-2 z-50">
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('all')}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <span>All Products</span>
                    <span className="text-[11px] text-zinc-400">View All</span>
                  </button>
                  <div className="my-1 border-t border-zinc-100" />
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2.5 cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-amber-50 text-amber-700 font-semibold'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <img
                        src={cat.image}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover border border-zinc-200"
                      />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="#reviews-section"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide text-zinc-700 hover:text-orange-600 hover:bg-orange-50 transition-colors whitespace-nowrap shrink-0"
            >
              REVIEWS
            </a>

            <button
              type="button"
              onClick={onOpenContact}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide text-zinc-700 hover:text-orange-600 hover:bg-orange-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              CONTACT
            </button>
          </nav>

          {/* Right Actions: WhatsApp + Cart */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="tabular-nums">{STORE_WHATSAPP_DISPLAY}</span>
            </a>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Open shopping cart with ${cartCount} items`}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-zinc-950 text-[11px] font-bold flex items-center justify-center tabular-nums shadow-sm">
                {cartCount}
              </span>
            </button>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-2">
            <a
              href="#top"
              onClick={() => {
                onSelectCategory('all');
                setMobileMenuOpen(false);
              }}
              className="block px-3 py-2.5 rounded-lg bg-zinc-950 text-white text-sm font-semibold"
            >
              HOME
            </a>
            <button
              type="button"
              onClick={() => handleCategoryClick('all')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-800 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              ALL PRODUCTS
            </button>
            <a
              href="#reviews-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-800 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              REVIEWS
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-800 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              CONTACT
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp {STORE_WHATSAPP_DISPLAY}</span>
            </a>
          </div>
        )}
      </header>
    </>
  );
};
