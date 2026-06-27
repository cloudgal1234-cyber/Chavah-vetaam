'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type CartItem = { id: number; name: string; price: number; emoji: string; quantity: number; milkChoice?: string };

const CART_KEY = 'farmCart';

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState('');
  const [tableNote, setTableNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length === 0) router.replace('/farm/menu');
      setCart(parsed);
    } else {
      router.replace('/farm/menu');
    }
  }, [router]);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  async function submitOrder() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/farm/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name.trim(), tableNote: tableNote.trim() || null, items: cart }),
      });
      const data = await res.json();
      if (data.success) { localStorage.removeItem(CART_KEY); setOrderNumber(data.orderNumber); }
    } finally { setSubmitting(false); }
  }

  if (orderNumber) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6 text-center" dir="rtl">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <h2 className="text-2xl font-bold text-amber-800 mb-2">ההזמנה נשלחה!</h2>
        <p className="text-stone-600 mb-1">מספר הזמנה:</p>
        <div className="bg-amber-700 text-amber-50 text-2xl font-bold px-6 py-3 rounded-2xl my-2 tracking-wider">#{orderNumber}</div>
        <div className="mt-6 bg-white border border-amber-200 rounded-2xl p-5 max-w-sm w-full text-sm text-stone-600 leading-relaxed">
          <p className="text-base font-semibold text-amber-800 mb-2">☕ ההזמנה מוכנה בקרוב</p>
          <p>התשלום והאיסוף יתבצעו <strong>בעגלת הקפה</strong>.</p>
          <p className="mt-1">אנא הישארו בסביבה – נקרא לשמכם!</p>
        </div>
        <button onClick={() => router.push('/farm/menu')} className="mt-6 text-amber-700 font-semibold text-sm underline underline-offset-2">חזרה לתפריט</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50" dir="rtl">
      <header className="sticky top-0 z-10 bg-amber-800 text-amber-50 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-amber-200 hover:text-white text-lg">→</button>
          <div>
            <h1 className="text-lg font-bold leading-none">סיכום הזמנה</h1>
            <p className="text-xs text-amber-200">{totalItems} פריטים</p>
          </div>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100"><h2 className="font-bold text-amber-800">ההזמנה שלך</h2></div>
          <ul className="divide-y divide-amber-50">
            {cart.map(item => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.emoji}</span>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">{item.name}</p>
                    {item.milkChoice && <p className="text-xs text-amber-600">🥛 {item.milkChoice}</p>}
                    <p className="text-xs text-stone-400">₪{item.price} × {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-amber-700">₪{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 flex justify-between items-center">
            <span className="font-bold text-amber-800">סה״כ לתשלום</span>
            <span className="text-xl font-bold text-amber-700">₪{total}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-amber-800 mb-2">שמך (לקריאת ההזמנה) *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="למשל: מיכל, יוסי..." className="w-full border border-amber-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-base" autoComplete="off" />
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-amber-800 mb-2">הערה (אופציונלי)</label>
          <input type="text" value={tableNote} onChange={e => setTableNote(e.target.value)} placeholder="למשל: ליד האורווה, ללא סוכר..." className="w-full border border-amber-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-base" />
        </div>
        <div className="bg-amber-100 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 text-center">
          💳 <strong>שים לב:</strong> התשלום והאיסוף יתבצעו בעגלת הקפה
        </div>
        <button onClick={submitOrder} disabled={!name.trim() || submitting} className="w-full bg-amber-700 text-amber-50 font-bold py-4 rounded-2xl text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-800 active:scale-95 transition-all">
          {submitting ? 'שולח...' : '✓ שלח הזמנה'}
        </button>
      </div>
    </div>
  );
}
