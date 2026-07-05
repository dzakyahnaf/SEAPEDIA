import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";

function CartRow({ item, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setQuantity(quantity) {
    if (quantity < 1) return;
    setBusy(true);
    setError("");
    try {
      const cart = await api(`/buyer/cart/items/${item.id}`, {
        method: "PUT",
        body: { quantity },
      });
      onChanged(cart);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const cart = await api(`/buyer/cart/items/${item.id}`, { method: "DELETE" });
      onChanged(cart);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          to={`/products/${item.product_id}`}
          className="font-semibold text-slate-800 hover:text-sea-700"
        >
          {item.product_name}
        </Link>
        <p className="text-sm text-slate-500">
          {formatIDR(item.price)} · stok {item.stock}
        </p>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-slate-300">
          <button
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            disabled={busy || item.quantity <= 1}
            onClick={() => setQuantity(item.quantity - 1)}
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
          <button
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            disabled={busy || item.quantity >= item.stock}
            onClick={() => setQuantity(item.quantity + 1)}
          >
            +
          </button>
        </div>
        <p className="w-28 text-right font-bold text-sea-700">
          {formatIDR(item.line_total)}
        </p>
        <Button variant="ghost" size="sm" className="!text-rose-600" disabled={busy} onClick={remove}>
          Hapus
        </Button>
      </div>
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);

  useEffect(() => {
    api("/buyer/cart").then(setCart).catch(() => {});
  }, []);

  async function clearCart() {
    const cleared = await api("/buyer/cart", { method: "DELETE" });
    setCart(cleared);
  }

  if (cart === null) {
    return <div className="py-24 text-center text-slate-400">Memuat…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Keranjang Belanja</h1>
      <p className="mt-1 text-sm text-slate-500">
        ℹ️ Satu keranjang hanya dapat berisi produk dari <strong>satu toko</strong>{" "}
        (aturan single-store checkout).
      </p>

      {cart.items.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <p className="text-5xl">🛒</p>
          <p className="mt-4 font-semibold text-slate-700">Keranjang Anda kosong</p>
          <p className="mt-1 text-sm text-slate-400">
            Yuk jelajahi produk dari berbagai toko di SEAPEDIA.
          </p>
          <Link to="/products" className="mt-4 inline-block">
            <Button>Jelajahi Produk</Button>
          </Link>
        </Card>
      ) : (
        <>
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-sm font-semibold text-slate-700">
                🏪 Belanja dari{" "}
                <Link to={`/stores/${cart.store.id}`} className="text-sea-700 hover:underline">
                  {cart.store.name}
                </Link>
              </p>
              <Button variant="ghost" size="sm" className="!text-rose-600" onClick={clearCart}>
                Kosongkan Keranjang
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
              {cart.items.map((item) => (
                <CartRow key={item.id} item={item} onChanged={setCart} />
              ))}
            </div>
          </Card>

          <Card className="mt-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Subtotal ({cart.total_items} barang)
              </p>
              <p className="text-2xl font-extrabold text-sea-700">
                {formatIDR(cart.subtotal)}
              </p>
              <p className="text-[11px] text-slate-400">
                Ongkir & PPN 12% dihitung saat checkout.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/checkout")}>
              Lanjut ke Checkout →
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
