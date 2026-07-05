import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";

function Stat({ label, value, hint, accent }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ?? "text-slate-800"}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </Card>
  );
}

export default function SellerReport() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/seller/report").then(setReport).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/seller" className="hover:text-sea-700">Dashboard Penjual</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Laporan Pendapatan</span>
      </nav>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Laporan Pendapatan</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pendapatan bersih dihitung dari nilai barang (subtotal − diskon) pada
        pesanan yang <strong>sudah selesai</strong>. Ongkir milik Driver dan PPN
        milik negara tidak dihitung. Pesanan yang dikembalikan tidak dihitung.
      </p>

      {error && (
        <div className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {report === null && !error ? (
        <p className="mt-6 text-sm text-slate-400">Memuat…</p>
      ) : report ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              label="Pendapatan Bersih"
              value={formatIDR(report.net_income)}
              hint="Dari pesanan selesai"
              accent="text-sea-700"
            />
            <Stat label="Penjualan Kotor" value={formatIDR(report.gross_sales)} />
            <Stat label="Total Diskon Diberikan" value={formatIDR(report.total_discount_given)} accent="text-amber-600" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total Pesanan" value={report.total_orders} />
            <Stat label="Diproses" value={report.in_process_orders} />
            <Stat label="Selesai" value={report.completed_orders} />
            <Stat label="Dikembalikan" value={report.returned_orders} />
          </div>
          <Link to="/seller/orders" className="mt-6 inline-block text-sm font-semibold text-sea-700 hover:underline">
            Lihat pesanan masuk →
          </Link>
        </>
      ) : null}
    </div>
  );
}
