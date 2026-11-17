import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../data/storeData';
import { CategoryId } from '../types/store';

interface CategoryStripProps {
  selectedCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
}

export const CategoryStrip: React.FC<CategoryStripProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-950 tracking-tight">
          Shop by Category
        </h2>

        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'text-amber-600 hover:text-amber-700'
              : 'text-zinc-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full'
          }`}
        >
          <span>{selectedCategory === 'all' ? 'View All' : 'Show All Categories'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                onSelectCategory(isActive ? 'all' : category.id)
              }
              className="group flex flex-col items-center text-center gap-2.5 focus-visible:outline-none cursor-pointer"
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 transition-all duration-150 ${
                  isActive
                    ? 'ring-2 ring-amber-500 ring-offset-2 bg-amber-50'
                    : 'bg-zinc-100 border border-zinc-200/80 group-hover:border-amber-400 group-hover:scale-[1.03]'
                }`}
              >
                <img
                  src={category.image}
                  alt={category.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span
                className={`text-[11px] sm:text-xs font-semibold leading-tight transition-colors ${
                  isActive
                    ? 'text-amber-700 font-bold'
                    : 'text-zinc-700 group-hover:text-zinc-950'
                }`}
              >
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
