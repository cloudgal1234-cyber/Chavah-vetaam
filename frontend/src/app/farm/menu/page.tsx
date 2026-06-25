'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  emoji: string;
  category: string;
};

type CartItem = MenuItem & { quantity: number };

const CART_KEY = 'farmCart';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('הכל');
  const [loading, setLoading] = useState(true);
  const [cartAnimating, setCartAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) setCart(JSON.parse(saved));
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      const res = await fetch('/api/farm/menu');
      const data = await res.json();
      setMenuItems(data);
    } finally {
      setLoading(false);
    }
  }

  const saveCart = useCallback((newCart: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    setCart(newCart);
  }, []);

  function addToCart(item: MenuItem) {
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 300);
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      const newCart = existing
        ? prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
        : [...prev, { ...item, quantity: 1 }];
      localStorage.setItem(CART_KEY, JSON.stringify(newCart));
      return newCart;
    });
  }

  function removeFromCart(itemId: number) {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      const newCart = existing && existing.quantity > 1
        ? prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
        : prev.filter(c => c.id !== itemId);
      localStorage.setItem(CART_KEY, JSON.stringify(newCart));
      return newCart;
    });
  }

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const categories = ['הכל', ...Array.from(new Set(menuItems.map(i => i.category)))];
  const filtered = activeCategory === 'הכל' ? menuItems : menuItems.filter(i => i.category === activeCategory);

  return (
    <div className="min-h-screen bg-amber-50" dir="rtl">
      <header className="sticky top-0 z-20 bg-amber-800 text-amber-50 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold leading-none">עגלת הקפה ☕</h1>
            <p className="text-xs text-amber-200 mt-0.5">חווה וטעם</p>
          </div>
          {totalItems > 0 && (
            <button
              onClick={() => router.push('/farm/checkout')}
              className={`flex items-center gap-2 bg-amber-50 text-amber-800 font-bold px-3 py-1.5 rounded-full text-sm transition-transform ${cartAnimating ? 'scale-110' : 'scale-100'}`}
            >
              🛒 <span>{totalItems}</span>
              <span className="border-r border-amber-300 pr-2">₪{totalPrice}</span>
            </button>
          )}
        </div>
      </header>

      <div className="bg-gradient-to-b from-amber-800 to-amber-700 text-amber-50 text-center py-6 px-4">
        <p className="text-2xl font-bold">ברוכים הבאים! 🌾</p>
        <p className="text-sm text-amber-200 mt-1">בחרו מהתפריט – נכין ונביא אליכם</p>
        <p className="text-xs text-amber-300 mt-1">התשלום בעגלת הקפה באיסוף</p>
      </div>

      <div className="bg-white border-b border-amber-200 px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar sticky top-[60px] z-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-amber-700 text-white'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-32">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-44 border border-amber-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-stone-400 py-12">אין פריטים בקטגוריה זו</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => {
              const cartItem = cart.find(c => c.id === item.id);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow">
                  <div className="text-4xl text-center mb-2">{item.emoji}</div>
                  <h3 className="font-bold text-stone-800 text-center text-sm leading-tight">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs text-stone-400 text-center mt-1 flex-1 leading-relaxed">{item.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-amber-700 text-base">₪{item.price}</span>
                    {cartItem ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-lg flex items-center justify-center leading-none hover:bg-amber-200 transition-colors">−</button>
                        <span className="font-bold text-amber-800 w-4 text-center">{cartItem.quantity}</span>
                        <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-amber-700 text-white font-bold text-lg flex items-center justify-center leading-none hover:bg-amber-800 transition-colors">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="bg-amber-700 text-white text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-amber-800 transition-colors active:scale-95">הוסף +</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-5 left-0 right-0 px-4 z-30 flex justify-center">
          <button
            onClick={() => router.push('/farm/checkout')}
            className="w-full max-w-sm bg-amber-700 text-amber-50 font-bold py-4 rounded-2xl shadow-xl flex items-center justify-between px-6 active:scale-95 transition-transform"
          >
            <span className="bg-amber-50 text-amber-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">{totalItems}</span>
            <span className="text-base">לתשלום ←</span>
            <span className="text-base">₪{totalPrice}</span>
          </button>
        </div>
      )}
    </div>
  );
}
