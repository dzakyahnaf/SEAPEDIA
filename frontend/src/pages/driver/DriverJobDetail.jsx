import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import OrderStatusTimeline from "../../components/OrderStatusTimeline";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";
import { statusBadgeClass } from "../../lib/orderStatus";

export default function DriverJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api(`/driver/jobs/${id}`).then(setJob).catch(() => setNotFound(true));
  }

  useEffect(load, [id]);

  async function takeJob() {
    setBusy(true);
    setError("");
    try {
      const updated = await api(`/driver/jobs/${id}/take`, { method: "POST" });
      setJob(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function completeJob() {
    setBusy(true);
    setError("");
    try {
      const updated = await api(`/driver/jobs/${id}/complete`, { method: "POST" });
      setJob(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">🛵</p>
        <h1 className="mt-4 text-xl font-bold">Job tidak tersedia</h1>
        <p className="mt-1 text-sm text-slate-500">
          Job mungkin sudah diambil driver lain atau belum siap.
        </p>
        <Link to="/driver" className="mt-2 inline-block text-sm text-sea-700 hover:underline">
          ← Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (!job) {
    return <div className="py-24 text-center text-slate-400">Memuat…</div>;
  }

  const isAvailable = job.status === "Menunggu Pengirim";
  const isDelivering = job.status === "Sedang Dikirim";
  const isDone = job.status === "Pesanan Selesai";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/driver" className="hover:text-sea-700">Dashboard Pengantar</Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-slate-600">{job.code}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Job <span className="font-mono">{job.code}</span>
        </h1>
        <Badge className={statusBadgeClass(job.status)}>{job.status}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {/* Tujuan */}
          <Card className="p-6">
            <h2 className="font-bold text-slate-800">📍 Tujuan Pengiriman</h2>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {job.recipient_name} · {job.phone}
            </p>
            <p className="mt-1 text-sm text-slate-500">{job.full_address}</p>
            <p className="mt-3 text-sm text-slate-600">
              Dari 🏪 <strong>{job.store_name}</strong> · {job.item_count} barang ·{" "}
              {job.delivery_method_label}
            </p>
          </Card>

          {/* Barang */}
          <Card className="p-6">
            <h2 className="font-bold text-slate-800">Barang</h2>
            <div className="mt-3 divide-y divide-slate-100">
              {job.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2.5 text-sm">
                  <span className="text-slate-700">{item.product_name}</span>
                  <span className="text-slate-400">×{item.quantity}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Aksi */}
          <Card className="border-sea-200 bg-sea-50/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Earning job ini</p>
                <p className="text-2xl font-extrabold text-emerald-600">
                  {formatIDR(job.earning)}
                </p>
                <p className="text-[11px] text-slate-400">
                  80% dari ongkir {formatIDR(job.delivery_fee)}
                </p>
              </div>
              {isAvailable && (
                <Button size="lg" disabled={busy} onClick={takeJob}>
                  {busy ? "Memproses…" : "🛵 Ambil Job"}
                </Button>
              )}
              {isDelivering && (
                <Button size="lg" disabled={busy} onClick={completeJob}>
                  {busy ? "Memproses…" : "🏁 Konfirmasi Selesai"}
                </Button>
              )}
              {isDone && (
                <Badge className="bg-emerald-100 text-emerald-700">✓ Selesai</Badge>
              )}
            </div>
            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            {isDone && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate("/driver")}
              >
                ← Kembali ke dashboard
              </Button>
            )}
          </Card>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24 p-6">
            <h2 className="font-bold text-slate-800">Status Pengiriman</h2>
            <div className="mt-4">
              <OrderStatusTimeline history={job.history} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
