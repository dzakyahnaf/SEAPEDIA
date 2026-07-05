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

export default function BuyerReport() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    api("/buyer/report").then(setReport).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/buyer" className="hover:text-sea-700">Dashboard Pembeli</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Laporan Pengeluaran</span>
      </nav>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Laporan Pengeluaran</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ringkasan seluruh belanja Anda. Pesanan yang dikembalikan (refund)
        tidak dihitung sebagai pengeluaran.
      </p>

      {report === null ? (
        <p className="mt-6 text-sm text-slate-400">Memuat…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              label="Total Pengeluaran"
              value={formatIDR(report.total_spent)}
              hint="Termasuk ongkir & PPN"
              accent="text-sea-700"
            />
            <Stat label="Total Hemat (Diskon)" value={formatIDR(report.total_discount_saved)} accent="text-emerald-600" />
            <Stat label="Total PPN Dibayar" value={formatIDR(report.total_tax_paid)} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total Pesanan" value={report.total_orders} />
            <Stat label="Pesanan Aktif" value={report.active_orders} />
            <Stat label="Selesai" value={report.completed_orders} />
            <Stat label="Dikembalikan" value={report.returned_orders} />
          </div>
          <Link to="/buyer/orders" className="mt-6 inline-block text-sm font-semibold text-sea-700 hover:underline">
            Lihat rincian pesanan →
          </Link>
        </>
      )}
    </div>
  );
}
