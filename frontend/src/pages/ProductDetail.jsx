import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatIDR } from "../lib/format";

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
                to={`/products?store_id=${product.store.id}`}
                className="mt-1 inline-block text-xs font-semibold text-sea-700 hover:underline"
              >
                Lihat produk toko ini →
              </Link>
            </div>
          </Card>

          <div className="mt-6">
            <h2 className="font-bold text-slate-800">Deskripsi</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          </div>

          {/* Guest tidak melihat aksi privat; info checkout hadir di Level 3 */}
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            {!isLoggedIn && (
              <>
                Ingin membeli produk ini?{" "}
                <Link to="/login" className="font-semibold text-sea-700 hover:underline">
                  Masuk
                </Link>{" "}
                atau{" "}
                <Link to="/register" className="font-semibold text-sea-700 hover:underline">
                  daftar
                </Link>{" "}
                sebagai Pembeli. Fitur keranjang & checkout hadir pada tahap
                pengembangan berikutnya.
              </>
            )}
            {isLoggedIn && isActiveBuyer && (
              <>🛒 Fitur keranjang & checkout untuk Pembeli hadir pada tahap pengembangan berikutnya (Level 3).</>
            )}
            {isLoggedIn && !isActiveBuyer && (
              <>Anda sedang tidak dalam peran Pembeli. Ganti role aktif ke Pembeli untuk berbelanja nanti.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
