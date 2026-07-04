import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { api } from "../lib/api";

const PAGE_SIZE = 12;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");

  const page = Number(params.get("page") ?? 1);
  const search = params.get("search") ?? "";
  const storeId = params.get("store_id") ?? "";

  useEffect(() => {
    const query = new URLSearchParams({ page, page_size: PAGE_SIZE });
    if (search) query.set("search", search);
    if (storeId) query.set("store_id", storeId);
    setData(null);
    api(`/products?${query}`).then(setData).catch(() => setData({ items: [], total: 0 }));
  }, [page, search, storeId]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  function handleSearch(e) {
    e.preventDefault();
    const next = {};
    if (searchInput.trim()) next.search = searchInput.trim();
    setParams(next);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Katalog Produk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.total} produk dari berbagai toko` : "Memuat…"}
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
          <Input
            id="search"
            placeholder="Cari produk…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Cari</Button>
        </form>
      </div>

      {search && (
        <p className="mt-4 text-sm text-slate-500">
          Hasil pencarian untuk <strong>“{search}”</strong>{" "}
          <button
            className="ml-1 text-sea-700 hover:underline"
            onClick={() => {
              setSearchInput("");
              setParams({});
            }}
          >
            ✕ hapus filter
          </button>
        </p>
      )}

      {data && data.items.length === 0 ? (
        <div className="py-24 text-center text-slate-400">
          <p className="text-5xl">🔍</p>
          <p className="mt-4 text-sm">Tidak ada produk yang cocok.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {(data?.items ?? []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setParams((p) => { p.set("page", page - 1); return p; })}
          >
            ← Sebelumnya
          </Button>
          <span className="text-sm text-slate-500">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setParams((p) => { p.set("page", page + 1); return p; })}
          >
            Berikutnya →
          </Button>
        </div>
      )}
    </div>
  );
}
