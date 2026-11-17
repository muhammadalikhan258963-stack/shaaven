import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, MessageCircle, Check, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { formatPKR, STORE_WHATSAPP_NUMBER } from '../data/storeData';
import { Product } from '../types/store';

interface ProductDetailModalProps {
  product: Product | null;
  initialColor: string;
  onClose: () => void;
  onAddToCart: (product: Product, selectedColor: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  initialColor,
  onClose,
  onAddToCart,
}) => {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedColor(initialColor || product.colors[0]?.name || 'BLACK');
      setQuantity(1);
    }
  }, [product, initialColor]);

  if (!product) return null;

  const activeVariant =
    product.colors.find((c) => c.name === selectedColor) ?? product.colors[0];

  const directWhatsAppUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Assalam-o-Alaikum SHA.AVEN! I want to order:\n• Product: ${product.name}\n• Color: ${selectedColor}\n• Quantity: ${quantity}\n• Total: ${formatPKR(
      product.price * quantity
    )}\nPlease confirm availability for Cash on Delivery.`
  )}`;

  const handleAddAndClose = () => {
    onAddToCart(product, selectedColor, quantity);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Image Showcase */}
        <div className="bg-zinc-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-zinc-200">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-zinc-200/60">
            <img
              src={product.image}
              alt={`${product.name} - ${selectedColor}`}
              referrerPolicy="no-referrer"
              style={activeVariant?.imageFilter ? { filter: activeVariant.imageFilter } : undefined}
              className="w-full h-full object-cover transition-all duration-200"
            />
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase">
              In Stock
            </span>
          </div>
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="p-6 sm:p-7 flex flex-col justify-between gap-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              {product.category.replace('-', ' ')}
            </span>
            <h2
              id="pdp-title"
              className="mt-1 font-display text-xl sm:text-2xl font-extrabold text-zinc-950 leading-snug"
            >
              {product.name}
            </h2>
            <p className="mt-2.5 text-sm text-zinc-600 leading-relaxed">
              {product.fullDescription}
            </p>

            {/* Key Specs */}
            <ul className="mt-4 space-y-1.5">
              {product.specs.map((spec) => (
                <li key={spec} className="flex items-center gap-2 text-xs text-zinc-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{spec}</span>
                </li>
              ))}
            </ul>

            {/* Color Selection */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-2">
                <span>Select Color:</span>
                <span className="text-zinc-950 uppercase">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((variant) => {
                  const active = variant.name === selectedColor;
                  return (
                    <button
                      key={variant.name}
                      type="button"
                      onClick={() => setSelectedColor(variant.name)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-all cursor-pointer ${
                        active
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-zinc-300"
                        style={{ backgroundColor: variant.hex }}
                      />
                      <span>{variant.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Price + Quantity + Actions */}
          <div className="pt-4 border-t border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-xs text-zinc-500">Total Price</span>
                <span className="font-display text-2xl font-extrabold text-zinc-950 tabular-nums">
                  {formatPKR(product.price * quantity)}
                </span>
              </div>

              {/* Quantity Stepper */}
              <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white text-zinc-700 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white text-zinc-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleAddAndClose}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order via WhatsApp</span>
              </a>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
              <span className="inline-flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-600" /> Free Delivery All Pakistan
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cash on Delivery
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
