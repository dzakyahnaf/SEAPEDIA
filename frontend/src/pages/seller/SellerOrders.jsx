import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";
import { statusBadgeClass } from "../../lib/orderStatus";

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SellerOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/seller/orders")
      .then(setOrders)
      .catch((err) => { setError(err.message); setOrders([]); });
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/seller" className="hover:text-sea-700">Dashboard Penjual</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Pesanan Masuk</span>
      </nav>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Pesanan Masuk</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pesanan dari pembeli untuk toko Anda. Aksi memproses pesanan hadir di
        Level 4.
      </p>

      {error && (
        <div className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {orders === null ? (
        <p className="mt-6 text-sm text-slate-400">Memuat…</p>
      ) : orders.length === 0 && !error ? (
        <Card className="mt-6 p-12 text-center">
          <p className="text-5xl">📥</p>
          <p className="mt-4 font-semibold text-slate-700">Belum ada pesanan masuk</p>
          <p className="mt-1 text-sm text-slate-400">
            Pesanan akan muncul di sini setelah pembeli checkout produk Anda.
          </p>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/seller/orders/${order.id}`} className="block">
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-400">{order.code}</p>
                    <p className="mt-0.5 font-bold text-slate-800">
                      Pembeli: {order.buyer_username}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.item_count} barang · {order.delivery_method_label} ·{" "}
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={statusBadgeClass(order.status)}>{order.status}</Badge>
                    <p className="mt-1.5 font-extrabold text-sea-700">
                      {formatIDR(order.total)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
