import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Flame, Search, X, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoryStrip } from './components/CategoryStrip';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { TestimonialsAndFooter } from './components/TestimonialsAndFooter';
import { AdminModal } from './components/AdminModal';
import { CATEGORIES, PRODUCTS as FALLBACK_PRODUCTS } from './data/storeData';
import { CartItem, CategoryId, Product } from './types/store';

const CART_STORAGE_KEY = 'shaaven_cart_v1';
const CART_ID_KEY = 'shaaven_cart_id_v1';

function getOrCreateCartId(): string {
  try {
    const existing = localStorage.getItem(CART_ID_KEY);
    if (existing) return existing;
    const created = `cid_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CART_ID_KEY, created);
    return created;
  } catch {
    return 'default';
  }
}

function readLocalCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota / sandbox restrictions
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => readLocalCart());
  const cartHydratedRef = useRef(false);
  const cartIdRef = useRef<string>(getOrCreateCartId());

  const [cartOpen, setCartOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState('');
  const [activeDetail, setActiveDetail] = useState<{
    product: Product;
    color: string;
  } | null>(null);

  const loadProductsFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return;
      const data = (await res.json()) as { products?: Product[] };
      if (Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch {
      // Retain current catalog if offline
    }
  }, []);

  // Load products + hydrate persisted cart from backend on mount
  useEffect(() => {
    loadProductsFromBackend();

    fetch('/api/cart', {
      headers: { 'x-cart-id': cartIdRef.current },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: CartItem[] } | null) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setCart(data.items);
          writeLocalCart(data.items);
        }
      })
      .catch(() => {
        // Keep local cart if backend unreachable
      })
      .finally(() => {
        cartHydratedRef.current = true;
      });
  }, [loadProductsFromBackend]);

  // Global keyboard shortcut: Ctrl + Shift + A (or Cmd + Shift + A) opens Admin Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist cart to both localStorage and backend /api/cart whenever cart updates
  const persistCart = useCallback((nextCart: CartItem[]) => {
    writeLocalCart(nextCart);
    fetch('/api/cart', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-cart-id': cartIdRef.current,
      },
      body: JSON.stringify({
        items: nextCart.map((i) => ({
          productId: i.product.id,
          selectedColor: i.selectedColor,
          quantity: i.quantity,
        })),
      }),
    }).catch(() => {
      // Ignore offline sync errors
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCat =
        selectedCategory === 'all' ? Boolean(product.featured) : product.category === selectedCategory;
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.shortDescription.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);
      if (q && selectedCategory === 'all') {
        return matchesQuery;
      }
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleAddToCart = (product: Product, selectedColor: string, quantity = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === selectedColor
      );
      let updated: CartItem[];
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + quantity,
        };
      } else {
        updated = [...prev, { product, selectedColor, quantity }];
      }
      persistCart(updated);
      return updated;
    });

    setCartNotice(`${product.name} (${selectedColor}) added to cart`);
    window.setTimeout(() => {
      setCartNotice((curr) =>
        curr.startsWith(product.name) ? '' : curr
      );
    }, 2800);
  };

  const handleUpdateQuantity = (productId: string, color: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.product.id === productId && item.selectedColor === color) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
      persistCart(updated);
      return updated;
    });
  };

  const handleRemoveItem = (productId: string, color: string) => {
    setCart((prev) => {
      const updated = prev.filter(
        (item) => !(item.product.id === productId && item.selectedColor === color)
      );
      persistCart(updated);
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    persistCart([]);
  };

  const scrollToProducts = () => {
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeCategoryLabel =
    selectedCategory === 'all'
      ? 'Top Products'
      : CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? 'Products';

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      <Navbar
        cartCount={cartCount}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCart={() => setCartOpen(true)}
        onOpenContact={() => setContactOpen(true)}
      />

      <main className="flex-1">
        <HeroSection onShopNow={scrollToProducts} />

        <CategoryStrip
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Top Products Catalog Grid */}
        <section
          id="products-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-500">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-950 tracking-tight">
                {activeCategoryLabel}
              </h2>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 cursor-pointer"
                >
                  <span>Clear</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Compact Search Input */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <span className="hidden md:inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
                Many Products Available
              </span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 py-14 px-6 text-center">
              <p className="font-display text-base font-bold text-zinc-900">
                No matching products found
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Try clearing your search or viewing all available categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(prod, color) => handleAddToCart(prod, color, 1)}
                  onOpenDetail={(prod, color) => setActiveDetail({ product: prod, color })}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <TestimonialsAndFooter
        contactOpen={contactOpen}
        onCloseContact={() => setContactOpen(false)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <ProductDetailModal
        product={activeDetail?.product ?? null}
        initialColor={activeDetail?.color ?? ''}
        onClose={() => setActiveDetail(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      <AdminModal
        isOpen={adminOpen}
        products={products}
        onClose={() => setAdminOpen(false)}
        onProductsChanged={loadProductsFromBackend}
      />

      {/* Quick Cart Feedback Toast */}
      {cartNotice && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-950 text-white shadow-xl border border-zinc-800 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium truncate">{cartNotice}</span>
          <button
            type="button"
            onClick={() => {
              setCartNotice('');
              setCartOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-zinc-950 text-[11px] font-bold shrink-0 cursor-pointer hover:bg-amber-300"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>View Cart</span>
          </button>
        </div>
      )}
    </div>
  );
}
