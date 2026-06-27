'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type OrderItem = { id: number; name: string; price: number; emoji: string; quantity: number };
type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  tableNote: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};
type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  emoji: string;
  category: string;
  available: boolean;
};

const WORKER_PIN_KEY = 'workerPin';
const POLL_INTERVAL = 3000;

function playChime() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [880, 1047, 1319];
    const times = [0, 0.18, 0.36];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + times[i];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.45, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch (_) {}
}

// ─── PIN screen ───────────────────────────────────────────────────────────────
function PinScreen({ onAuth }: { onAuth: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function submit() {
    if (pin.trim()) {
      onAuth(pin.trim());
      setError(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center px-6" dir="rtl">
      <div className="text-5xl mb-4">☕</div>
      <h1 className="text-2xl font-bold text-amber-300 mb-1">ממשק עובד</h1>
      <p className="text-stone-400 text-sm mb-8">עגלת הקפה – חווה של פעם</p>
      <div className="bg-stone-800 rounded-2xl p-6 w-full max-w-xs space-y-4">
        <label className="block text-sm font-medium text-stone-300">קוד גישה</label>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="הכנס קוד..."
          className="w-full bg-stone-700 text-white rounded-xl px-4 py-3 text-base placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm text-center">קוד שגוי, נסה שוב</p>}
        <button
          onClick={submit}
          className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-700 transition-colors"
        >
          כניסה
        </button>
      </div>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────
function OrderCard({ order, pin, onDone }: { order: Order; pin: string; onDone: (id: number) => void }) {
  const [marking, setMarking] = useState(false);
  const items = order.items as OrderItem[];
  const timeStr = new Date(order.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  async function markDone() {
    setMarking(true);
    await fetch(`/api/farm/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-worker-pin': pin },
      body: JSON.stringify({ status: 'done' }),
    });
    onDone(order.id);
  }

  return (
    <div className="bg-stone-800 rounded-2xl p-4 border border-stone-700 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-lg">#{order.orderNumber}</span>
            <span className="bg-amber-600 text-xs text-white px-2 py-0.5 rounded-full font-medium">ממתין</span>
          </div>
          <p className="text-white font-semibold mt-0.5">{order.customerName}</p>
          {order.tableNote && (
            <p className="text-stone-400 text-xs mt-0.5">📍 {order.tableNote}</p>
          )}
        </div>
        <div className="text-left text-stone-400 text-xs">{timeStr}</div>
      </div>

      <ul className="space-y-1.5 border-t border-stone-700 pt-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex justify-between items-center text-sm">
            <span className="text-stone-200">
              {item.emoji} {item.name}
              <span className="text-stone-400 mr-1">×{item.quantity}</span>
            </span>
            <span className="text-amber-400 font-medium">₪{item.price * item.quantity}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-stone-700 pt-3">
        <span className="text-amber-300 font-bold">סה״כ ₪{order.total}</span>
        <button
          onClick={markDone}
          disabled={marking}
          className="bg-green-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
        >
          {marking ? '...' : '✓ בוצע'}
        </button>
      </div>
    </div>
  );
}

// ─── Menu manager ─────────────────────────────────────────────────────────────
function MenuManager({ pin }: { pin: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', emoji: '☕', category: 'משקאות חמים', ingredients: '' });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/farm/menu/all', { headers: { 'x-worker-pin': pin } });
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, [pin]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function toggleAvailable(item: MenuItem) {
    await fetch(`/api/farm/menu/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-worker-pin': pin },
      body: JSON.stringify({ available: !item.available }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
  }

  async function addItem() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const res = await fetch('/api/farm/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-worker-pin': pin },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        ingredients: form.ingredients ? form.ingredients.split(',').map(s => s.trim()).filter(Boolean) : [],
      }),
    });
    const newItem = await res.json();
    setItems(prev => [...prev, newItem]);
    setForm({ name: '', description: '', price: '', emoji: '☕', category: 'משקאות חמים', ingredients: '' });
    setAdding(false);
    setSaving(false);
  }

  const categories = ['משקאות חמים', 'משקאות קרים', 'מאפים וממתקים', 'חלבים', 'אחר'];

  if (loading) return <div className="text-stone-400 text-center py-8">טוען תפריט...</div>;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setAdding(!adding)}
        className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-700 transition-colors"
      >
        {adding ? '✕ ביטול' : '+ הוספת פריט חדש'}
      </button>

      {adding && (
        <div className="bg-stone-800 rounded-2xl p-4 space-y-3 border border-amber-600">
          <h3 className="font-bold text-amber-300">פריט חדש</h3>
          {[
            { label: 'שם', key: 'name', placeholder: 'שם הפריט', type: 'text' },
            { label: 'תיאור', key: 'description', placeholder: 'תיאור קצר (אופציונלי)', type: 'text' },
            { label: 'מחיר (₪)', key: 'price', placeholder: '0', type: 'number' },
            { label: 'אמוג׳י', key: 'emoji', placeholder: '☕', type: 'text' },
            { label: 'מרכיבים', key: 'ingredients', placeholder: 'חלב, קפה, סוכר (מופרד בפסיקים)', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-stone-400 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-stone-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-stone-400 mb-1">קטגוריה</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-stone-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={addItem}
            disabled={saving || !form.name || !form.price}
            className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {saving ? 'שומר...' : '✓ שמור פריט'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`bg-stone-800 rounded-xl p-3 flex items-center justify-between border ${item.available ? 'border-stone-700' : 'border-stone-800 opacity-50'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.emoji}</span>
              <div>
                <p className={`font-medium text-sm ${item.available ? 'text-white' : 'text-stone-500 line-through'}`}>{item.name}</p>
                <p className="text-amber-400 text-xs">₪{item.price} · {item.category}</p>
              </div>
            </div>
            <button
              onClick={() => toggleAvailable(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                item.available
                  ? 'bg-stone-700 text-stone-300 hover:bg-red-900 hover:text-red-300'
                  : 'bg-stone-700 text-stone-400 hover:bg-green-900 hover:text-green-300'
              }`}
            >
              {item.available ? 'הסתר' : 'הצג'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main worker page ─────────────────────────────────────────────────────────
export default function WorkerPage() {
  const [pin, setPin] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const lastOrderIdsRef = useRef<Set<number>>(new Set());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(WORKER_PIN_KEY);
    if (saved) {
      setPin(saved);
      setAuthed(true);
    }
  }, []);

  async function handleAuth(enteredPin: string) {
    const res = await fetch('/api/farm/orders', { headers: { 'x-worker-pin': enteredPin } });
    if (res.ok) {
      sessionStorage.setItem(WORKER_PIN_KEY, enteredPin);
      setPin(enteredPin);
      setAuthed(true);
      const data = await res.json();
      setOrders(data);
      lastOrderIdsRef.current = new Set(data.map((o: Order) => o.id));
    } else {
      alert('קוד גישה שגוי');
    }
  }

  const fetchOrders = useCallback(async (currentPin: string) => {
    try {
      const res = await fetch('/api/farm/orders', { headers: { 'x-worker-pin': currentPin } });
      if (!res.ok) return;
      const data: Order[] = await res.json();
      const newIds = new Set(data.map(o => o.id));
      const hasNew = data.some(o => !lastOrderIdsRef.current.has(o.id));
      if (hasNew) {
        playChime();
        setNewOrderFlash(true);
        setTimeout(() => setNewOrderFlash(false), 2000);
      }
      lastOrderIdsRef.current = newIds;
      setOrders(data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!authed || !pin) return;
    fetchOrders(pin);
    pollingRef.current = setInterval(() => fetchOrders(pin), POLL_INTERVAL);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [authed, pin, fetchOrders]);

  function removeOrder(id: number) {
    setOrders(prev => prev.filter(o => o.id !== id));
    lastOrderIdsRef.current.delete(id);
  }

  if (!authed) return <PinScreen onAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-stone-900 text-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-900 border-b border-stone-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">☕</span>
            <div>
              <h1 className="font-bold text-amber-300 text-base leading-none">עגלת הקפה</h1>
              <p className="text-xs text-stone-500">ממשק עובד</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${newOrderFlash ? 'bg-amber-500 text-white animate-pulse' : 'bg-stone-800 text-stone-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${newOrderFlash ? 'bg-white' : 'bg-green-400'}`} />
              {newOrderFlash ? 'הזמנה חדשה!' : 'פעיל'}
            </span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="max-w-lg mx-auto px-4 pt-4 flex gap-2">
        {[
          { key: 'orders', label: `הזמנות ${orders.length > 0 ? `(${orders.length})` : ''}` },
          { key: 'menu', label: 'ניהול תפריט' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'orders' | 'menu')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-amber-600 text-white'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-10 space-y-3">
        {activeTab === 'orders' ? (
          orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-500">
              <span className="text-4xl mb-3">🕐</span>
              <p className="font-medium">אין הזמנות ממתינות</p>
              <p className="text-sm mt-1">הזמנות חדשות יופיעו כאן אוטומטית</p>
            </div>
          ) : (
            orders.map(order => (
              <OrderCard key={order.id} order={order} pin={pin!} onDone={removeOrder} />
            ))
          )
        ) : (
          <MenuManager pin={pin!} />
        )}
      </div>
    </div>
  );
}
