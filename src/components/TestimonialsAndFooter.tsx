import React, { useState } from 'react';
import { Star, ShoppingBag, MessageCircle, X, CheckCircle2, Settings } from 'lucide-react';
import { TESTIMONIALS, STORE_WHATSAPP_DISPLAY, STORE_WHATSAPP_NUMBER } from '../data/storeData';

interface TestimonialsAndFooterProps {
  contactOpen: boolean;
  onCloseContact: () => void;
  onOpenAdmin: () => void;
}

export const TestimonialsAndFooter: React.FC<TestimonialsAndFooterProps> = ({
  contactOpen,
  onCloseContact,
  onOpenAdmin,
}) => {
  const [contactSent, setContactSent] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    window.setTimeout(() => {
      setContactSent(false);
      setContactName('');
      setContactPhone('');
      setContactMsg('');
      onCloseContact();
    }, 1800);
  };

  return (
    <>
      {/* Client Testimonials Section */}
      <section id="reviews-section" className="bg-zinc-50/90 border-t border-zinc-200/70 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-[0.14em] uppercase">
              CLIENT TESTIMONIALS
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
              What Our Customers Say
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-500">
              Real feedback from our valued shoppers across Pakistan.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {TESTIMONIALS.map((review) => (
              <article
                key={review.id}
                className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {review.quote}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
                  <div
                    className={`w-10 h-10 rounded-full ${review.avatarBg} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                  >
                    {review.initials}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-950">{review.name}</h3>
                    <p className="text-[11px] text-zinc-500">{review.location}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Footer Service Info Row */}
      <footer className="bg-white border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xs font-bold text-zinc-950">Customer Support</h3>
            <p className="mt-1.5 text-xs text-zinc-500">
              24/7 dedicated support for all inquiries.
            </p>
            <a
              href={`https://wa.me/${STORE_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 tabular-nums"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{STORE_WHATSAPP_DISPLAY}</span>
            </a>
          </div>

          <div>
            <h3 className="text-xs font-bold text-zinc-950">Nationwide Shipping</h3>
            <p className="mt-1.5 text-xs text-zinc-500">
              Express Cash on Delivery across Pakistan.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-zinc-950">Flexible Payment</h3>
            <p className="mt-1.5 text-xs text-zinc-500">
              Online bank transfer or COD options.
            </p>
          </div>
        </div>

        {/* Bottom Dark Brand Bar */}
        <div className="bg-[#0B0B0D] text-zinc-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="leading-none">
                <span className="font-display font-bold text-sm text-white block">SHA.AVEN</span>
                <span className="text-[9px] text-zinc-400 tracking-wider uppercase">
                  Online Solution
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-3">
              <p className="text-[11px] text-zinc-400">
                © 2026 SHA.AVEN Store. All rights reserved.
              </p>
              <button
                type="button"
                onClick={onOpenAdmin}
                aria-label="Settings"
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/70 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Inquiry Modal */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs"
          onClick={onCloseContact}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Contact SHA.AVEN Support"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative"
          >
            <button
              type="button"
              onClick={onCloseContact}
              aria-label="Close contact dialog"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-lg font-extrabold text-zinc-950">
              Contact SHA.AVEN Support
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Have a question about sizing, colors, or Cash on Delivery? Send us a message or chat
              directly on WhatsApp.
            </p>

            {contactSent ? (
              <div className="my-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
                <p className="mt-2 text-sm font-bold text-zinc-900">Message Received!</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Our team will reach out shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ayesha Khan"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Message</label>
                  <textarea
                    rows={3}
                    required
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="How can we help you?"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-1 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Send Inquiry
                  </button>
                  <a
                    href={`https://wa.me/${STORE_WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp ({STORE_WHATSAPP_DISPLAY})</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
