import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sea-600 font-black text-white">
              S
            </span>
            <span className="font-extrabold tracking-tight text-sea-800">SEAPEDIA</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Marketplace yang menghubungkan penjual, pembeli, dan pengantar dalam
            satu pengalaman belanja.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Jelajahi</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/products" className="hover:text-sea-700">Katalog Produk</Link></li>
            <li><Link to="/register" className="hover:text-sea-700">Buka Toko (Seller)</Link></li>
            <li><Link to="/register" className="hover:text-sea-700">Jadi Pengantar (Driver)</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Tentang</h3>
          <p className="mt-3 text-sm text-slate-500">
            Dibuat untuk Technical Challenge Software Engineering Academy
            COMPFEST 18.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SEAPEDIA — Semua transaksi dalam aplikasi ini bersifat simulasi.
      </div>
    </footer>
  );
}
