import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { formatPKR } from '../data/storeData';
import { Product } from '../types/store';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedColor: string) => void;
  onOpenDetail: (product: Product, selectedColor: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onOpenDetail,
}) => {
  const defaultColor = product.colors[0]?.name ?? 'BLACK';
  const [selectedColor, setSelectedColor] = useState<string>(defaultColor);
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant =
    product.colors.find((c) => c.name === selectedColor) ?? product.colors[0];

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedColor);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <article
      onClick={() => onOpenDetail(product, selectedColor)}
      className="group flex flex-col bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
    >
      {/* Studio Image Area */}
      <div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden border-b border-zinc-100">
        <img
          src={product.image}
          alt={`${product.name} in ${selectedColor}`}
          referrerPolicy="no-referrer"
          style={activeVariant?.imageFilter ? { filter: activeVariant.imageFilter } : undefined}
          className="w-full h-full object-cover object-center transition-all duration-200 group-hover:scale-[1.03]"
        />

        {/* Stock Status Label */}
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-50/95 border border-emerald-200 text-emerald-700 text-[10px] font-bold tracking-wider uppercase">
          {product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
        </span>

        {/* Live Color Preview Swatch Indicator when variant has hex */}
        {activeVariant && (
          <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/90 backdrop-blur-xs border border-zinc-200/80 shadow-xs">
            <span
              className="w-2.5 h-2.5 rounded-full border border-zinc-300 shrink-0"
              style={{ backgroundColor: activeVariant.hex }}
            />
            <span className="text-[10px] font-semibold text-zinc-700 uppercase">
              {selectedColor}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold text-zinc-950 truncate">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 truncate">{product.shortDescription}</p>

          {/* Interactive Color Variant Selector */}
          <div
            className="mt-3 flex flex-wrap items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] font-medium text-zinc-500 mr-0.5">Color:</span>
            {product.colors.map((variant) => {
              const isSelected = variant.name === selectedColor;
              return (
                <button
                  key={variant.name}
                  type="button"
                  onClick={() => setSelectedColor(variant.name)}
                  aria-pressed={isSelected}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                  }`}
                >
                  {variant.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price + Add Action */}
        <div className="pt-2.5 border-t border-zinc-100 flex items-end justify-between gap-2">
          <div>
            <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
              Price
            </span>
            <span className="font-display text-base font-extrabold text-zinc-950 tabular-nums">
              {formatPKR(product.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-950 hover:bg-zinc-800 text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
