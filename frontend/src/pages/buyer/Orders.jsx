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

export default function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api("/buyer/orders").then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/buyer" className="hover:text-sea-700">Dashboard Pembeli</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Riwayat Pesanan</span>
      </nav>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Riwayat Pesanan</h1>

      {orders === null ? (
        <p className="mt-6 text-sm text-slate-400">Memuat…</p>
      ) : orders.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <p className="text-5xl">📦</p>
          <p className="mt-4 font-semibold text-slate-700">Belum ada pesanan</p>
          <Link to="/products" className="mt-2 inline-block text-sm text-sea-700 hover:underline">
            Mulai belanja →
          </Link>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/buyer/orders/${order.id}`} className="block">
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-400">{order.code}</p>
                    <p className="mt-0.5 font-bold text-slate-800">🏪 {order.store_name}</p>
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
