import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";
import { statusBadgeClass } from "../../lib/orderStatus";

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function JobCard({ job, cta }) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-400">{job.code}</p>
          <p className="mt-0.5 font-bold text-slate-800">🏪 {job.store_name}</p>
          <p className="mt-1 text-sm text-slate-600">
            📍 {job.recipient_name} · {job.phone}
          </p>
          <p className="line-clamp-2 text-xs text-slate-500">{job.full_address}</p>
        </div>
        <div className="shrink-0 text-right">
          <Badge className="bg-emerald-100 text-emerald-700">
            +{formatIDR(job.earning)}
          </Badge>
          <p className="mt-1 text-[11px] text-slate-400">{job.delivery_method_label}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">{job.item_count} barang</span>
        {cta}
      </div>
    </Card>
  );
}

export default function DriverDashboard() {
  const [jobs, setJobs] = useState(null);
  const [earnings, setEarnings] = useState(null);

  function reload() {
    api("/driver/jobs").then(setJobs).catch(() => setJobs([]));
    api("/driver/earnings").then(setEarnings).catch(() => {});
  }

  useEffect(reload, []);

  const activeJob = earnings?.active_job;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/dashboard" className="hover:text-sea-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Pengantar</span>
      </nav>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Dashboard Pengantar</h1>

      {/* Ringkasan penghasilan */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-sea-700 to-sea-500 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-sea-100">
            Total Penghasilan
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {earnings ? formatIDR(earnings.total_earning) : "…"}
          </p>
          <p className="mt-1 text-[11px] text-sea-100">
            {earnings?.earning_rate_percent ?? 80}% dari ongkir tiap job selesai
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Job Selesai</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            {earnings?.completed_jobs ?? "…"}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Job Aktif</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            {activeJob ? 1 : 0}
          </p>
        </Card>
      </div>

      {/* Job aktif */}
      {activeJob && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">Job Aktif</h2>
          <div className="mt-3">
            <JobCard
              job={activeJob}
              cta={
                <Link to={`/driver/jobs/${activeJob.order_id}`}>
                  <Button size="sm">Kelola Pengiriman →</Button>
                </Link>
              }
            />
          </div>
        </section>
      )}

      {/* Job tersedia */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Job Tersedia{" "}
            <span className="text-sm font-normal text-slate-400">
              ({jobs?.length ?? 0})
            </span>
          </h2>
          <Button variant="outline" size="sm" onClick={reload}>↻ Muat ulang</Button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Hanya menampilkan pesanan berstatus "Menunggu Pengirim" yang belum
          diambil driver lain.
        </p>

        {jobs === null ? (
          <p className="mt-4 text-sm text-slate-400">Memuat…</p>
        ) : jobs.length === 0 ? (
          <Card className="mt-4 p-12 text-center">
            <p className="text-5xl">🛵</p>
            <p className="mt-4 font-semibold text-slate-700">Belum ada job tersedia</p>
            <p className="mt-1 text-sm text-slate-400">
              Job muncul setelah penjual memproses pesanan mereka.
            </p>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.order_id}
                job={job}
                cta={
                  <Link to={`/driver/jobs/${job.order_id}`}>
                    <Button size="sm">Lihat & Ambil →</Button>
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Riwayat job */}
      {earnings && earnings.history.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">Riwayat Job</h2>
          <Card className="mt-4 overflow-x-auto p-6">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Kode</th>
                  <th className="pb-2 pr-4">Tujuan</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Waktu</th>
                  <th className="pb-2 text-right">Earning</th>
                </tr>
              </thead>
              <tbody>
                {earnings.history.map((job) => (
                  <tr key={job.order_id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs">{job.code}</td>
                    <td className="py-2.5 pr-4">{job.recipient_name}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className={statusBadgeClass(job.status)}>{job.status}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">
                      {formatDateTime(job.created_at)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600">
                      {job.status === "Pesanan Selesai" ? `+${formatIDR(job.earning)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}
    </div>
  );
}
