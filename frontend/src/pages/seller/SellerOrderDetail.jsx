import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import OrderStatusTimeline from "../../components/OrderStatusTimeline";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";
import { statusBadgeClass } from "../../lib/orderStatus";

export default function SellerOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState("");

  useEffect(() => {
    api(`/seller/orders/${id}`).then(setOrder).catch(() => setNotFound(true));
  }, [id]);

  async function processOrder() {
    setProcessing(true);
    setProcessError("");
    try {
      const updated = await api(`/seller/orders/${id}/process`, { method: "POST" });
      setOrder(updated);
    } catch (err) {
      setProcessError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">📥</p>
        <h1 className="mt-4 text-xl font-bold">Pesanan tidak ditemukan</h1>
        <Link to="/seller/orders" className="mt-2 inline-block text-sm text-sea-700 hover:underline">
          ← Pesanan masuk
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="py-24 text-center text-slate-400">Memuat…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/seller/orders" className="hover:text-sea-700">Pesanan Masuk</Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-slate-600">{order.code}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Pesanan <span className="font-mono">{order.code}</span>
        </h1>
        <Badge className={statusBadgeClass(order.status)}>{order.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Pembeli: <strong>{order.buyer_username}</strong>
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <h2 className="font-bold text-slate-800">Barang Pesanan</h2>
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
              <div className="flex justify-between text-slate-600">
                <span>Diskon</span><span>− {formatIDR(order.discount)}</span>
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

          <Card className="p-6">
            <h2 className="font-bold text-slate-800">📍 Tujuan Pengiriman</h2>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {order.recipient_name} · {order.phone}
            </p>
            <p className="mt-1 text-sm text-slate-500">{order.full_address}</p>
          </Card>

          {/* Aksi proses pesanan */}
          {order.status === "Sedang Dikemas" ? (
            <Card className="border-sea-200 bg-sea-50/40 p-5">
              <h3 className="font-bold text-slate-800">Proses Pesanan</h3>
              <p className="mt-1 text-sm text-slate-600">
                Tandai pesanan ini selesai dikemas. Statusnya akan berubah ke
                <strong> Menunggu Pengirim</strong> dan job pengiriman menjadi
                tersedia bagi Driver.
              </p>
              {processError && (
                <p className="mt-2 text-sm text-rose-600">{processError}</p>
              )}
              <Button className="mt-3" disabled={processing} onClick={processOrder}>
                {processing ? "Memproses…" : "✅ Proses Pesanan"}
              </Button>
            </Card>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Pesanan sudah diproses. Status saat ini: <strong>{order.status}</strong>.
            </div>
          )}
        </div>

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
