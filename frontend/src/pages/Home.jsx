import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ReviewSection from "../components/ReviewSection";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ROLE_INFO } from "../lib/roles";

export default function Home() {
  const { isLoggedIn } = useAuth();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api("/products?page_size=4")
      .then((res) => setFeatured(res.items))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sea-800 via-sea-700 to-sea-500 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              Marketplace multi-penjual & multi-peran
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
              Belanja, Berjualan, dan Mengantar — Satu Akun untuk Semua.
            </h1>
            <p className="mt-4 max-w-lg text-sea-100">
              SEAPEDIA menghubungkan pembeli, penjual dari berbagai toko, dan
              pengantar dalam satu ekosistem. Satu username bisa memiliki
              beberapa peran sekaligus.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products">
                <Button size="lg" className="bg-white !text-sea-800 hover:bg-sea-50">
                  Jelajahi Produk
                </Button>
              </Link>
              {!isLoggedIn && (
                <Link to="/register">
                  <Button size="lg" variant="outline" className="!border-white/40 !text-white hover:!border-white">
                    Daftar Gratis
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="grid w-full max-w-md grid-cols-2 gap-4">
              {Object.entries(ROLE_INFO)
                .filter(([key]) => key !== "ADMIN")
                .map(([key, role]) => (
                  <div key={key} className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                    <p className="text-3xl">{role.icon}</p>
                    <p className="mt-2 font-bold">{role.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-sea-100">
                      {role.description}
                    </p>
                  </div>
                ))}
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-5 text-center">
                <p className="text-sm font-semibold text-sea-100">
                  Banyak toko,
                  <br />
                  satu marketplace 🌊
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Peran (mobile & penjelasan) */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Satu Akun, Banyak Peran
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-500">
          Daftar sebagai Pembeli, Penjual, Pengantar — atau ketiganya sekaligus.
          Setelah login, pilih peran aktif untuk sesi Anda.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Object.entries(ROLE_INFO)
            .filter(([key]) => key !== "ADMIN")
            .map(([key, role]) => (
              <Card key={key} className="p-6 text-center">
                <p className="text-4xl">{role.icon}</p>
                <h3 className="mt-3 font-bold text-slate-800">{role.label}</h3>
                <p className="mt-2 text-sm text-slate-500">{role.description}</p>
              </Card>
            ))}
        </div>
      </section>

      {/* Produk pilihan */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Produk Terbaru
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Dari berbagai toko di SEAPEDIA.
              </p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-sea-700 hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Review aplikasi (publik) */}
      <ReviewSection />
    </>
  );
}
