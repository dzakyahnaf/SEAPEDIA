import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import OrderStatusTimeline from "../../components/OrderStatusTimeline";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";
import { statusBadgeClass } from "../../lib/orderStatus";

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api(`/buyer/orders/${id}`).then(setOrder).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">📦</p>
        <h1 className="mt-4 text-xl font-bold">Pesanan tidak ditemukan</h1>
        <Link to="/buyer/orders" className="mt-2 inline-block text-sm text-sea-700 hover:underline">
          ← Riwayat pesanan
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="py-24 text-center text-slate-400">Memuat…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {location.state?.justOrdered && (
        <div className="mb-6 rounded-xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
          🎉 Pesanan berhasil dibuat! Pembayaran telah dipotong dari wallet Anda.
        </div>
      )}

      <nav className="text-sm text-slate-400">
        <Link to="/buyer/orders" className="hover:text-sea-700">Riwayat Pesanan</Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-slate-600">{order.code}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Pesanan <span className="font-mono">{order.code}</span>
        </h1>
        <Badge className={statusBadgeClass(order.status)}>{order.status}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {/* Barang */}
          <Card className="p-6">
            <h2 className="font-bold text-slate-800">
              Barang dari 🏪{" "}
              <Link to={`/stores/${order.store.id}`} className="text-sea-700 hover:underline">
                {order.store.name}
              </Link>
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{item.product_name}</p>
                    <p className="text-xs text-slate-400">
                      {formatIDR(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-700">{formatIDR(item.line_total)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span>{formatIDR(order.subtotal)}</span>
              </div>
              <div className={`flex justify-between ${order.discount > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                <span>
                  Diskon
                  {order.discount_code && ` (${order.discount_code})`}
                </span>
                <span>− {formatIDR(order.discount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ongkir ({order.delivery_method_label})</span>
                <span>{formatIDR(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PPN {order.tax_rate_percent}%</span><span>{formatIDR(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold">
                <span>Total</span>
                <span className="text-sea-700">{formatIDR(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Alamat tujuan */}
          <Card className="p-6">
            <h2 className="font-bold text-slate-800">📍 Alamat Pengiriman</h2>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {order.recipient_name} · {order.phone}
            </p>
            <p className="mt-1 text-sm text-slate-500">{order.full_address}</p>
          </Card>
        </div>

        {/* Timeline status */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24 p-6">
            <h2 className="font-bold text-slate-800">Status Pesanan</h2>
            <div className="mt-4">
              <OrderStatusTimeline history={order.history} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
