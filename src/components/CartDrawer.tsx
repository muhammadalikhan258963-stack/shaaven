import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  MessageCircle,
  CheckCircle2,
  ArrowLeft,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { formatPKR, STORE_WHATSAPP_NUMBER } from '../data/storeData';
import { CartItem, CustomerCheckoutForm, OrderConfirmation } from '../types/store';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, color: string, delta: number) => void;
  onRemoveItem: (productId: string, color: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [form, setForm] = useState<CustomerCheckoutForm>({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    paymentMethod: 'cod',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    if (isOpen && items.length === 0 && step === 'checkout') {
      setStep('cart');
    }
  }, [isOpen, items.length, step]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const buildWhatsAppOrderText = (
    orderItems: CartItem[],
    orderTotal: number,
    customer?: CustomerCheckoutForm,
    orderNo?: string
  ) => {
    const lines = orderItems.map(
      (i, idx) =>
        `${idx + 1}. ${i.product.name} (${i.selectedColor}) x${i.quantity} = ${formatPKR(
          i.product.price * i.quantity
        )}`
    );
    const header = orderNo
      ? `*New Order Confirmed #${orderNo}*`
      : `*New Order Inquiry — SHA.AVEN*`;
    const customerBlock = customer
      ? `\n\n*Customer Details:*\nName: ${customer.fullName}\nPhone: ${customer.phone}\nCity: ${customer.city}\nAddress: ${customer.address}\nPayment: ${
          customer.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Bank Transfer'
        }`
      : '';
    return `${header}\n\n${lines.join('\n')}\n\n*Total (Free Delivery):* ${formatPKR(
      orderTotal
    )}${customerBlock}`;
  };

  const quickWhatsAppHref = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppOrderText(items, subtotal)
  )}`;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()) {
      setFormError('Please fill in your name, phone number, city, and delivery address.');
      return;
    }
    setFormError('');
    setSubmittingOrder(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: items.map((i) => ({
            productId: i.product.id,
            productName: i.product.name,
            image: i.product.image,
            price: i.product.price,
            selectedColor: i.selectedColor,
            quantity: i.quantity,
          })),
          total: subtotal,
        }),
      });

      const data = (await res.json()) as {
        order?: { orderNumber: string; createdAt: string };
        error?: string;
      };

      const orderNum =
        res.ok && data.order?.orderNumber
          ? data.order.orderNumber
          : `SHA-${Math.floor(1000 + Math.random() * 9000)}`;

      const confirmation: OrderConfirmation = {
        orderNumber: orderNum,
        customer: { ...form },
        items: [...items],
        total: subtotal,
        createdAt: new Date().toLocaleString('en-PK', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      };
      setConfirmedOrder(confirmation);
      onClearCart();
      setStep('confirmed');
    } catch {
      setFormError('Unable to submit order right now. Please try WhatsApp checkout.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleCloseDrawer = () => {
    if (step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50 backdrop-blur-xs"
      onClick={handleCloseDrawer}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                aria-label="Back to cart"
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h2 className="font-display text-base font-bold text-zinc-950">
              {step === 'cart' && `Your Cart (${items.reduce((a, b) => a + b.quantity, 0)})`}
              {step === 'checkout' && 'Checkout Details'}
              {step === 'confirmed' && 'Order Confirmed'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="Close cart"
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-11 h-11 text-emerald-600 mx-auto" />
                <h3 className="mt-3 font-display text-lg font-extrabold text-zinc-950">
                  Order #{confirmedOrder.orderNumber} Confirmed
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Preparing shipment for {confirmedOrder.customer.city} · {confirmedOrder.createdAt}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4 space-y-2.5 text-xs">
                <div className="font-bold text-zinc-900">Delivery Receipt</div>
                <div className="text-zinc-600">
                  <span className="font-semibold text-zinc-800">Customer:</span>{' '}
                  {confirmedOrder.customer.fullName} ({confirmedOrder.customer.phone})
                </div>
                <div className="text-zinc-600">
                  <span className="font-semibold text-zinc-800">Address:</span>{' '}
                  {confirmedOrder.customer.address}, {confirmedOrder.customer.city}
                </div>
                <div className="text-zinc-600">
                  <span className="font-semibold text-zinc-800">Payment:</span>{' '}
                  {confirmedOrder.customer.paymentMethod === 'cod'
                    ? 'Cash on Delivery (COD)'
                    : 'Online Bank Transfer'}
                </div>

                <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                  {confirmedOrder.items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedColor}`}
                      className="flex justify-between gap-2 text-zinc-700"
                    >
                      <span className="truncate">
                        {item.product.name} ({item.selectedColor}) × {item.quantity}
                      </span>
                      <span className="font-bold tabular-nums shrink-0">
                        {formatPKR(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-sm text-zinc-950">
                  <span>Total Payable</span>
                  <span className="tabular-nums">{formatPKR(confirmedOrder.total)}</span>
                </div>
              </div>

              <a
                href={`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  buildWhatsAppOrderText(
                    confirmedOrder.items,
                    confirmedOrder.total,
                    confirmedOrder.customer,
                    confirmedOrder.orderNumber
                  )
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Receipt on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleCloseDrawer}
                className="w-full py-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 hover:bg-zinc-50 cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-display text-base font-bold text-zinc-900">
                Your shopping cart is empty
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                Select colors on any product and click Add to build your order with free delivery
                across Pakistan.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-3.5">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}`}
                  className="flex gap-3 p-3 rounded-xl border border-zinc-200 bg-white"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-lg object-cover bg-zinc-50 border border-zinc-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-bold text-zinc-950 line-clamp-2">
                          {item.product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id, item.selectedColor)}
                          aria-label="Remove item"
                          className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-bold text-zinc-700 uppercase">
                        Color: {item.selectedColor}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-display text-sm font-extrabold text-zinc-950 tabular-nums">
                        {formatPKR(item.product.price * item.quantity)}
                      </span>

                      <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.selectedColor, -1)
                          }
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center hover:bg-white text-zinc-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.selectedColor, 1)
                          }
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center hover:bg-white text-zinc-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Muhammad Ali"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="03XX-XXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Lahore / Karachi / Islamabad"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Complete Delivery Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="House #, Street, Sector / Block, Landmark"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'cod' })}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      form.paymentMethod === 'cod'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 shrink-0" />
                    <span>Cash on Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'online' })}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      form.paymentMethod === 'online'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Online Transfer</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && step !== 'confirmed' && (
          <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Shipping Across Pakistan</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-zinc-950 pt-1">
                <span>Total Amount</span>
                <span className="tabular-nums">{formatPKR(subtotal)}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Proceed to Checkout (COD / Online)
                </button>
                <a
                  href={quickWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order Instantly via WhatsApp</span>
                </a>
              </div>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={submittingOrder}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-60"
              >
                {submittingOrder
                  ? 'Confirming Order...'
                  : `Confirm Order (${formatPKR(subtotal)})`}
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
