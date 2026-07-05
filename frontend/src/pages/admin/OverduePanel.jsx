import { useEffect, useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";
import { statusBadgeClass } from "../../lib/orderStatus";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function OverduePanel() {
  const [clock, setClock] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  function load() {
    api("/admin/clock").then(setClock).catch(() => {});
    api("/admin/overdue").then(setOverdue).catch(() => {});
  }
  useEffect(load, []);

  async function advance(days) {
    setBusy(true);
    setResult(null);
    try {
      const c = await api(`/admin/clock/advance?days=${days}`, { method: "POST" });
      setClock(c);
      setOverdue(await api("/admin/overdue"));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setResult(null);
    try {
      const c = await api("/admin/clock/reset", { method: "POST" });
      setClock(c);
      setOverdue(await api("/admin/overdue"));
    } finally {
      setBusy(false);
    }
  }

  async function runOverdue() {
    setBusy(true);
    try {
      const res = await api("/admin/overdue/run", { method: "POST" });
      setResult(res);
      setOverdue(await api("/admin/overdue"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Simulasi waktu */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-800">⏰ Simulasi Waktu</h3>
        <p className="mt-1 text-sm text-slate-500">
          Majukan jam sistem untuk menguji keterlambatan pesanan. Hanya
          memengaruhi evaluasi SLA, bukan kadaluarsa sesi login.
        </p>
        {clock && (
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-slate-400">Offset simulasi</p>
              <p className="text-2xl font-extrabold text-sea-700">+{clock.offset_days} hari</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Waktu efektif</p>
              <p className="text-sm font-semibold text-slate-700">
                {formatDateTime(clock.effective_now)}
              </p>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => advance(1)}>+1 Hari</Button>
          <Button size="sm" disabled={busy} onClick={() => advance(3)}>+3 Hari</Button>
          <Button size="sm" disabled={busy} onClick={() => advance(7)}>+7 Hari</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={reset}>Reset</Button>
        </div>
      </Card>

      {/* SLA info + jalankan overdue */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800">↩️ Pesanan Terlambat (Overdue)</h3>
            <p className="mt-1 text-sm text-slate-500">
              SLA: Instant 24 jam · Next Day 48 jam · Regular 96 jam. Pesanan yang
              melewati SLA di-refund penuh & stok dipulihkan.
            </p>
          </div>
          <Button disabled={busy || overdue.length === 0} onClick={runOverdue}>
            {busy ? "Memproses…" : `Proses ${overdue.length} Overdue`}
          </Button>
        </div>

        {result && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            ✓ {result.processed_count} pesanan diproses. Total refund:{" "}
            {formatIDR(result.total_refunded)}.
          </div>
        )}

        {overdue.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            Tidak ada pesanan terlambat saat ini. Coba majukan waktu di atas.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Kode</th>
                  <th className="pb-2 pr-4">Pembeli</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Batas SLA</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs">{o.code}</td>
                    <td className="py-2.5 pr-4">{o.buyer_username}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className={statusBadgeClass(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-rose-600">{formatDateTime(o.deadline)}</td>
                    <td className="py-2.5 text-right font-semibold">{formatIDR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
