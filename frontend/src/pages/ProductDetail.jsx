import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatIDR } from "../lib/format";

/** Panel tambah-ke-keranjang untuk user dengan role aktif Pembeli. */
function AddToCartPanel({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState("");

  async function add() {
    setBusy(true);
    setError("");
    setConflict("");
    setAdded(false);
    try {
      await api("/buyer/cart/items", {
        method: "POST",
        body: { product_id: product.id, quantity },
      });
      setAdded(true);
    } catch (err) {
      // 409 = keranjang berisi produk toko lain (aturan single-store checkout)
      if (err.status === 409) setConflict(err.message);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearAndAdd() {
    setBusy(true);
    setConflict("");
    try {
      await api("/buyer/cart", { method: "DELETE" });
      await add();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (product.stock === 0) {
    return (
      <div className="mt-8 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
        Stok produk ini sedang habis.
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-lg border border-slate-300">
          <button
            className="px-3.5 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            disabled={busy || quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
          <button
            className="px-3.5 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            disabled={busy || quantity >= product.stock}
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
        <Button size="lg" disabled={busy} onClick={add} className="flex-1 sm:flex-none">
          {busy ? "Memproses…" : "🛒 Tambah ke Keranjang"}
        </Button>
      </div>

      {added && (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          ✓ Ditambahkan ke keranjang.{" "}
          <Link to="/cart" className="underline">Lihat keranjang →</Link>
        </p>
      )}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      {conflict && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3.5 text-sm text-amber-800">
          <p>{conflict}</p>
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" variant="danger" disabled={busy} onClick={clearAndAdd}>
              Kosongkan & Tambahkan
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConflict("")}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { isLoggedIn, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    api(`/products/${id}`)
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">📦</p>
        <h1 className="mt-4 text-xl font-bold">Produk tidak ditemukan</h1>
        <Link to="/products" className="mt-2 inline-block text-sm text-sea-700 hover:underline">
          ← Kembali ke katalog
        </Link>
      </div>
    );
  }

  if (!product) {
    return <div className="py-24 text-center text-slate-400">Memuat…</div>;
  }

  const isActiveBuyer = isLoggedIn && user?.active_role === "BUYER";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/products" className="hover:text-sea-700">Katalog</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-2xl bg-gradient-to-br from-sea-400 to-sea-800 text-8xl font-black text-white/90">
          {product.name.slice(0, 1).toUpperCase()}
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-extrabold text-sea-700">
            {formatIDR(product.price)}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Stok tersedia: <strong>{product.stock}</strong>
          </p>

          {/* Info toko penjual */}
          <Card className="mt-6 flex items-center gap-4 p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sea-100 text-xl">
              🏪
            </span>
            <div>
              <p className="font-bold text-slate-800">{product.store.name}</p>
              <p className="text-xs text-slate-500">{product.store.description}</p>
              <Link
                to={`/stores/${product.store.id}`}
                className="mt-1 inline-block text-xs font-semibold text-sea-700 hover:underline"
              >
                Kunjungi toko ini →
              </Link>
            </div>
          </Card>

          <div className="mt-6">
            <h2 className="font-bold text-slate-800">Deskripsi</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          </div>

          {/* Aksi pembelian — hanya untuk role aktif Pembeli */}
          {isActiveBuyer ? (
            <AddToCartPanel product={product} />
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              {!isLoggedIn ? (
                <>
                  Ingin membeli produk ini?{" "}
                  <Link to="/login" className="font-semibold text-sea-700 hover:underline">
                    Masuk
                  </Link>{" "}
                  atau{" "}
                  <Link to="/register" className="font-semibold text-sea-700 hover:underline">
                    daftar
                  </Link>{" "}
                  sebagai Pembeli terlebih dahulu.
                </>
              ) : (
                <>
                  Anda sedang tidak dalam peran Pembeli.{" "}
                  <Link to="/select-role" className="font-semibold text-sea-700 hover:underline">
                    Ganti role aktif
                  </Link>{" "}
                  ke Pembeli untuk berbelanja.
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
