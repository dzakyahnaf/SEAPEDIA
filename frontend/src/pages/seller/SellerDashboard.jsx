import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatDate, formatIDR } from "../../lib/format";
import ProductForm from "./ProductForm";
import StoreForm from "./StoreForm";

function ProductRow({ product, onEdit, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await api(`/seller/products/${product.id}`, { method: "DELETE" });
      onDeleted(product.id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-4">
        <p className="font-semibold text-slate-800">{product.name}</p>
        <p className="line-clamp-1 max-w-xs text-xs text-slate-400">
          {product.description}
        </p>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </td>
      <td className="py-3 pr-4 font-semibold text-sea-700">
        {formatIDR(product.price)}
      </td>
      <td className="py-3 pr-4">
        {product.stock > 0 ? (
          <Badge className="bg-emerald-100 text-emerald-700">{product.stock}</Badge>
        ) : (
          <Badge className="bg-rose-100 text-rose-700">Habis</Badge>
        )}
      </td>
      <td className="py-3 text-right">
        {!confirming ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
              Ubah
            </Button>
            <Button variant="ghost" size="sm" className="!text-rose-600" onClick={() => setConfirming(true)}>
              Hapus
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 text-xs">
            <span className="text-slate-500">Yakin?</span>
            <Button variant="danger" size="sm" disabled={deleting} onClick={handleDelete}>
              {deleting ? "…" : "Ya, hapus"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Batal
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function SellerDashboard() {
  const [store, setStore] = useState(undefined); // undefined=memuat, null=belum punya
  const [products, setProducts] = useState([]);
  const [editingStore, setEditingStore] = useState(false);
  const [productForm, setProductForm] = useState(null); // null | "new" | product

  useEffect(() => {
    api("/seller/store").then(setStore).catch(() => setStore(null));
  }, []);

  useEffect(() => {
    if (store) {
      api("/seller/products").then(setProducts).catch(() => setProducts([]));
    }
  }, [store?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (store === undefined) {
    return <div className="py-24 text-center text-slate-400">Memuat…</div>;
  }

  // Belum punya toko: tampilkan form pembuatan
  if (store === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="mb-6 text-center">
          <p className="text-5xl">🏪</p>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            Selamat Datang, Penjual Baru!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Satu langkah lagi sebelum mulai berjualan.
          </p>
        </div>
        <StoreForm store={null} onSaved={setStore} />
      </div>
    );
  }

  function handleProductSaved(saved) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev];
    });
    setProductForm(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/dashboard" className="hover:text-sea-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Penjual</span>
      </nav>

      {/* Profil toko */}
      <Card className="mt-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sea-100 text-2xl">
              🏪
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{store.name}</h1>
              <p className="text-sm text-slate-500">{store.description || "Belum ada deskripsi."}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {store.product_count} produk · berdiri {formatDate(store.created_at)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/stores/${store.id}`}>
              <Button variant="outline" size="sm">Lihat Halaman Publik</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setEditingStore(!editingStore)}>
              {editingStore ? "Tutup" : "Ubah Profil"}
            </Button>
          </div>
        </div>
        {editingStore && (
          <div className="mt-4">
            <StoreForm
              store={store}
              onSaved={(s) => { setStore(s); setEditingStore(false); }}
              onCancel={() => setEditingStore(false)}
            />
          </div>
        )}
      </Card>

      {/* Produk */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Produk Saya <span className="text-sm font-normal text-slate-400">({products.length})</span>
          </h2>
          {productForm === null && (
            <Button onClick={() => setProductForm("new")}>+ Tambah Produk</Button>
          )}
        </div>

        {productForm !== null && (
          <div className="mt-4">
            <ProductForm
              product={productForm === "new" ? null : productForm}
              onSaved={handleProductSaved}
              onCancel={() => setProductForm(null)}
            />
          </div>
        )}

        <Card className="mt-4 overflow-x-auto p-6">
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Belum ada produk. Klik "Tambah Produk" untuk mulai berjualan!
            </p>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Produk</th>
                  <th className="pb-2 pr-4">Harga</th>
                  <th className="pb-2 pr-4">Stok</th>
                  <th className="pb-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={setProductForm}
                    onDeleted={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
                  />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      {/* Pesanan & fitur berikutnya */}
      <section className="mt-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/seller/orders">
            <Card className="h-full p-4 transition-shadow hover:shadow-md">
              <p className="text-xl">📥</p>
              <p className="mt-1 text-sm font-bold text-slate-800">Pesanan Masuk</p>
              <p className="text-[11px] text-sea-700">Lihat pesanan dari pembeli →</p>
            </Card>
          </Link>
          {[
            { icon: "✅", title: "Proses Pesanan", level: 4 },
            { icon: "💰", title: "Laporan Pendapatan", level: 4 },
          ].map((f) => (
            <Card key={f.title} className="p-4 opacity-70">
              <p className="text-xl">{f.icon}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{f.title}</p>
              <p className="text-[11px] text-slate-400">Hadir di Level {f.level}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
