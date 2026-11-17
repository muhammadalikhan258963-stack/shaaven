import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Lock,
  LogOut,
  Package,
  ClipboardList,
  Check,
  Search,
  Loader2,
} from 'lucide-react';
import { CATEGORIES, formatPKR } from '../data/storeData';
import {
  BackendOrder,
  CategoryId,
  ColorVariant,
  OrderStatus,
  Product,
} from '../types/store';

interface AdminModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onProductsChanged: () => Promise<void>;
}

const ADMIN_TOKEN_KEY = 'shaaven_admin_token_v1';

const PRESET_COLORS: ColorVariant[] = [
  { name: 'BLACK', hex: '#111827' },
  { name: 'WHITE', hex: '#F3F4F6' },
  { name: 'SILVER', hex: '#9CA3AF' },
  { name: 'BEIGE', hex: '#D6C7B2' },
  { name: 'BLUE', hex: '#2563EB' },
  { name: 'PINK', hex: '#EC4899' },
  { name: 'GOLDEN', hex: '#D97706' },
  { name: 'DARK GREEN', hex: '#14532D' },
];

interface ProductFormState {
  id?: string;
  name: string;
  category: Exclude<CategoryId, 'all'>;
  price: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  inStock: boolean;
  featured: boolean;
  colors: ColorVariant[];
  specsText: string;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  category: 'accessories',
  price: '',
  shortDescription: '',
  fullDescription: '',
  image: '',
  inStock: true,
  featured: true,
  colors: [{ name: 'BLACK', hex: '#111827' }],
  specsText: 'Cash on Delivery Available, 7 Days Checking Warranty',
};

const readAdminToken = (): string => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

const writeAdminToken = (val: string): void => {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, val);
  } catch {
    // Ignore storage quota / sandbox restrictions
  }
};

const clearAdminToken = (): void => {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Ignore storage sandbox restrictions
  }
};

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  products,
  onClose,
  onProductsChanged,
}) => {
  const [token, setToken] = useState<string>(() => readAdminToken());
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#111827');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  const fetchOrders = useCallback(async (activeToken: string) => {
    if (!activeToken) return;
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { 'x-admin-token': activeToken },
      });
      if (res.ok) {
        const data = (await res.json()) as { orders: BackendOrder[] };
        setOrders(data.orders || []);
      }
    } catch {
      // Ignore transient errors
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !token) return;
    let cancelled = false;
    fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'x-admin-token': token },
    })
      .then((res) => res.json())
      .then((data: { valid?: boolean }) => {
        if (cancelled) return;
        if (data.valid) {
          setAuthenticated(true);
          fetchOrders(token);
        } else {
          setAuthenticated(false);
          clearAdminToken();
          setToken('');
        }
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, token, fetchOrders]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Invalid PIN.');
        return;
      }
      writeAdminToken(data.token);
      setToken(data.token);
      setAuthenticated(true);
      setPinInput('');
      fetchOrders(data.token);
    } catch {
      setAuthError('Server connection failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setToken('');
    setAuthenticated(false);
    setShowForm(false);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    setUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ filename: file.name, dataUrl }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setFormError(data.error || 'Image upload failed.');
        return;
      }
      setForm((prev) => ({ ...prev, image: data.url! }));
      showToast('Image uploaded!');
    } catch {
      setFormError('Could not upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const togglePresetColor = (preset: ColorVariant) => {
    setForm((prev) => {
      const exists = prev.colors.some((c) => c.name.toUpperCase() === preset.name.toUpperCase());
      if (exists) {
        const next = prev.colors.filter((c) => c.name.toUpperCase() !== preset.name.toUpperCase());
        return { ...prev, colors: next.length > 0 ? next : prev.colors };
      }
      return { ...prev, colors: [...prev.colors, preset] };
    });
  };

  const addCustomColor = () => {
    const clean = customColorName.trim().toUpperCase();
    if (!clean) return;
    setForm((prev) => {
      if (prev.colors.some((c) => c.name.toUpperCase() === clean)) return prev;
      return { ...prev, colors: [...prev.colors, { name: clean, hex: customColorHex }] };
    });
    setCustomColorName('');
  };

  const removeColor = (name: string) => {
    setForm((prev) => {
      if (prev.colors.length <= 1) return prev;
      return { ...prev, colors: prev.colors.filter((c) => c.name !== name) };
    });
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: String(product.price),
      shortDescription: product.shortDescription,
      fullDescription: product.fullDescription,
      image: product.image,
      inStock: product.inStock,
      featured: product.featured !== false,
      colors: product.colors.length > 0 ? product.colors : [{ name: 'BLACK', hex: '#111827' }],
      specsText: product.specs.join(', '),
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const numericPrice = Number(form.price);
    if (!form.name.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormError('Please enter a product name and a valid price in Rs.');
      return;
    }

    setSavingProduct(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price: Math.round(numericPrice),
        shortDescription: form.shortDescription.trim(),
        fullDescription: form.fullDescription.trim(),
        image: form.image.trim(),
        inStock: form.inStock,
        featured: form.featured,
        colors: form.colors,
        specs: form.specsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const isEdit = Boolean(form.id);
      const res = await fetch(isEdit ? `/api/products/${form.id}` : '/api/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error || 'Could not save product.');
        return;
      }

      await onProductsChanged();
      setShowForm(false);
      setForm(EMPTY_FORM);
      showToast(isEdit ? 'Product updated!' : 'New product added to store!');
    } catch {
      setFormError('Network error while saving product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleQuickToggleStock = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ inStock: !product.inStock }),
      });
      if (res.ok) {
        await onProductsChanged();
        showToast(`${product.name} marked ${!product.inStock ? 'In Stock' : 'Out of Stock'}`);
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      if (res.ok) {
        await onProductsChanged();
        showToast('Product deleted.');
      }
    } catch {
      // Ignore
    }
  };

  const handleUpdateOrderStatus = async (orderNumber: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === orderNumber ? { ...o, status } : o))
        );
        showToast(`Order #${orderNumber} updated to ${status}`);
      }
    } catch {
      // Ignore
    }
  };

  const filteredAdminProducts = products.filter((p) => {
    const q = adminSearch.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="SHA.AVEN Admin Panel"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Bar */}
        <div className="px-5 py-4 bg-zinc-950 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold leading-none">
                SHA.AVEN Admin Panel
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1">
                Manage Store Products, Prices, Colors & Customer Orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {toast && (
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
                {toast}
              </span>
            )}
            {authenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Admin Panel"
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!authenticated ? (
          <div className="p-8 sm:p-12 flex items-center justify-center">
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div className="text-center">
                <h3 className="font-display text-xl font-extrabold text-zinc-950">
                  Admin Login
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Enter your Admin PIN to add or edit products (Default PIN: <strong className="text-zinc-800">1234</strong>)
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Admin PIN</label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN (1234)"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
              >
                {authLoading ? 'Verifying...' : 'Unlock Dashboard'}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Sub-header Tabs */}
            <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products ({products.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('orders');
                    fetchOrders(token);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Orders ({orders.length})</span>
                </button>
              </div>

              {activeTab === 'products' && !showForm && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 overflow-y-auto">
              {activeTab === 'products' ? (
                showForm ? (
                  <form onSubmit={handleSaveProduct} className="max-w-3xl mx-auto space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-extrabold text-zinc-950">
                        {form.id ? 'Edit Product' : 'Add New Product'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {formError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                        {formError}
                      </div>
                    )}

                    {/* Image Upload + Preview */}
                    <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-28 h-24 rounded-xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
                        {form.image ? (
                          <img
                            src={form.image}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] text-zinc-400 text-center px-2">
                            No Image
                          </span>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer">
                            {uploadingImage ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingImage ? 'Uploading...' : 'Upload Photo'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[11px] text-zinc-500">
                            PNG, JPG, WEBP from phone or PC
                          </span>
                        </div>

                        <input
                          type="text"
                          value={form.image}
                          onChange={(e) => setForm({ ...form, image: e.target.value })}
                          placeholder="Or paste image URL (/uploads/... or https://...)"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>

                    {/* Basic Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-zinc-800 mb-1">
                          Product Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. AirPods Pro 2nd Gen ANC"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-800 mb-1">
                          Price (Rs.) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          placeholder="2499"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-zinc-800 mb-1">
                          Category *
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              category: e.target.value as Exclude<CategoryId, 'all'>,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.inStock}
                          onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        <span className="text-xs font-bold text-zinc-800">In Stock</span>
                      </label>

                      <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                          className="w-4 h-4 accent-amber-500"
                        />
                        <span className="text-xs font-bold text-zinc-800">
                          Show in Top Products
                        </span>
                      </label>
                    </div>

                    {/* Color Variants Builder */}
                    <div className="p-4 rounded-2xl border border-zinc-200 space-y-3">
                      <div className="text-xs font-bold text-zinc-800">
                        Available Colors ({form.colors.length})
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {form.colors.map((c) => (
                          <span
                            key={c.name}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 text-white text-[11px] font-bold"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/40"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>{c.name}</span>
                            {form.colors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeColor(c.name)}
                                className="ml-0.5 text-zinc-400 hover:text-white cursor-pointer"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {PRESET_COLORS.map((preset) => {
                          const selected = form.colors.some(
                            (c) => c.name.toUpperCase() === preset.name
                          );
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => togglePresetColor(preset)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                                selected
                                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-zinc-300"
                                style={{ backgroundColor: preset.hex }}
                              />
                              <span>{preset.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="color"
                          value={customColorHex}
                          onChange={(e) => setCustomColorHex(e.target.value)}
                          className="w-9 h-9 rounded-lg border border-zinc-300 p-0.5 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customColorName}
                          onChange={(e) => setCustomColorName(e.target.value)}
                          placeholder="Custom color name (e.g. ROSE GOLD)"
                          className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <button
                          type="button"
                          onClick={addCustomColor}
                          className="px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                        >
                          + Add Color
                        </button>
                      </div>
                    </div>

                    {/* Descriptions & Specs */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Short 1-Line Summary
                      </label>
                      <input
                        type="text"
                        value={form.shortDescription}
                        onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                        placeholder="Short tagline shown on product card"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Full Description
                      </label>
                      <textarea
                        rows={3}
                        value={form.fullDescription}
                        onChange={(e) => setForm({ ...form, fullDescription: e.target.value })}
                        placeholder="Detailed description shown when customer opens product"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Key Features (comma separated)
                      </label>
                      <input
                        type="text"
                        value={form.specsText}
                        onChange={(e) => setForm({ ...form, specsText: e.target.value })}
                        placeholder="Bluetooth 5.3, Deep Bass, 24h Battery"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProduct}
                        className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold cursor-pointer disabled:opacity-60"
                      >
                        {savingProduct
                          ? 'Saving...'
                          : form.id
                          ? 'Update Product'
                          : 'Save & Publish Product'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="relative max-w-sm">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Search store inventory..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
                      {filteredAdminProducts.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 bg-white hover:bg-zinc-50/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover border border-zinc-200 bg-zinc-50 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-zinc-950 truncate">
                                {product.name}
                              </h4>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                                <span className="uppercase">{product.category}</span>
                                <span>·</span>
                                <span className="font-bold text-zinc-900 tabular-nums">
                                  {formatPKR(product.price)}
                                </span>
                                <span>·</span>
                                <span>{product.colors.map((c) => c.name).join(', ')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleQuickToggleStock(product)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                                product.inStock
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {product.inStock ? 'In Stock' : 'Out'}
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditForm(product)}
                              aria-label={`Edit ${product.name}`}
                              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              aria-label={`Delete ${product.name}`}
                              className="p-2 rounded-lg border border-zinc-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-zinc-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {ordersLoading ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      Loading orders...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-14 text-center rounded-2xl border border-zinc-200 bg-zinc-50">
                      <ClipboardList className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-zinc-900">No orders yet</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Customer checkout orders will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.orderNumber}
                        className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-display text-sm font-extrabold text-zinc-950">
                              #{order.orderNumber}
                            </span>
                            <span className="ml-2 text-xs text-zinc-500">
                              {new Date(order.createdAt).toLocaleString('en-PK')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-zinc-950 tabular-nums">
                              {formatPKR(order.total)}
                            </span>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.orderNumber,
                                  e.target.value as OrderStatus
                                )
                              }
                              className="px-2.5 py-1 rounded-lg border border-zinc-300 bg-zinc-50 text-xs font-bold"
                            >
                              {(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] as OrderStatus[]).map(
                                (st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </div>

                        <div className="text-xs text-zinc-600 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <div>
                            <strong className="text-zinc-800">Customer:</strong>{' '}
                            {order.customer.fullName} ({order.customer.phone})
                          </div>
                          <div>
                            <strong className="text-zinc-800">Payment:</strong>{' '}
                            {order.customer.paymentMethod === 'cod'
                              ? 'Cash on Delivery'
                              : 'Online Transfer'}
                          </div>
                          <div className="sm:col-span-2">
                            <strong className="text-zinc-800">Address:</strong>{' '}
                            {order.customer.address}, {order.customer.city}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-100 space-y-1 text-xs">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-zinc-700">
                              <span>
                                {item.productName} ({item.selectedColor}) × {item.quantity}
                              </span>
                              <span className="font-bold tabular-nums">
                                {formatPKR(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
