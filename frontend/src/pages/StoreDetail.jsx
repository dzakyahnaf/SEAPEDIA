import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Card from "../components/ui/Card";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";

/** Halaman toko publik — bisa diakses guest. */
export default function StoreDetail() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setStore(null);
    setNotFound(false);
    api(`/stores/${id}`)
      .then(setStore)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">🏪</p>
        <h1 className="mt-4 text-xl font-bold">Toko tidak ditemukan</h1>
        <Link to="/products" className="mt-2 inline-block text-sm text-sea-700 hover:underline">
          ← Kembali ke katalog
        </Link>
      </div>
    );
  }

  if (!store) {
    return <div className="py-24 text-center text-slate-400">Memuat…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/products" className="hover:text-sea-700">Katalog</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{store.name}</span>
      </nav>

      <Card className="mt-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sea-100 text-3xl">
          🏪
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{store.name}</h1>
          <p className="text-sm text-slate-500">{store.description}</p>
          <p className="mt-1 text-xs text-slate-400">
            {store.product_count} produk · bergabung {formatDate(store.created_at)}
          </p>
        </div>
      </Card>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Produk dari toko ini</h2>
      {store.products.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Toko ini belum memiliki produk.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {store.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
