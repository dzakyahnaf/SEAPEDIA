import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatIDR } from "../lib/format";
import { ROLE_INFO } from "../lib/roles";

function FinanceCard({ icon, label, value, note }) {
  return (
    <Card className="p-5">
      <p className="text-2xl">{icon}</p>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold text-slate-800">
        {value !== null && value !== undefined ? formatIDR(value) : "—"}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{note}</p>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const activeInfo = user.active_role ? ROLE_INFO[user.active_role] : null;
  const fin = user.financial_summary;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header profil */}
      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sea-600 text-2xl font-black text-white">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{user.username}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-xs text-slate-400">
              Bergabung {formatDate(user.created_at)}
              {user.store_name && <> · Toko: {user.store_name}</>}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Peran aktif:</span>
            {activeInfo ? (
              <Badge className={activeInfo.badgeClass}>
                {activeInfo.icon} {activeInfo.label}
              </Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-700">Belum dipilih</Badge>
            )}
          </div>
          {user.roles.length > 1 && (
            <Link to="/select-role">
              <Button variant="outline" size="sm">Ganti Peran Aktif</Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Peran yang dimiliki */}
      <section className="mt-8">
        <h2 className="font-bold text-slate-800">Peran yang Anda Miliki</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {user.roles.map((role) => {
            const info = ROLE_INFO[role];
            const isActive = user.active_role === role;
            return (
              <Card
                key={role}
                className={`p-4 ${isActive ? "border-sea-500 ring-1 ring-sea-200" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{info.icon}</span>
                  {isActive && (
                    <span className="text-[10px] font-bold uppercase text-sea-700">
                      aktif
                    </span>
                  )}
                </div>
                <p className="mt-2 font-bold text-slate-800">{info.label}</p>
                {isActive ? (
                  <Link
                    to={info.dashboardPath}
                    className="mt-1 inline-block text-xs font-semibold text-sea-700 hover:underline"
                  >
                    Buka dashboard →
                  </Link>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Aktifkan peran ini untuk membuka dashboard-nya.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Ringkasan finansial lintas peran (placeholder Level 1) */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">Ringkasan Finansial</h2>
          <Badge className="bg-slate-100 text-slate-500">placeholder</Badge>
        </div>
        <p className="mt-1 text-xs text-slate-400">{fin.note}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {user.roles.includes("BUYER") && (
            <FinanceCard
              icon="👛"
              label="Saldo Wallet (Pembeli)"
              value={fin.buyer_wallet_balance}
              note="Top-up & riwayat transaksi hadir di Level 3."
            />
          )}
          {user.roles.includes("SELLER") && (
            <FinanceCard
              icon="💰"
              label="Pendapatan (Penjual)"
              value={fin.seller_income}
              note="Laporan pendapatan hadir di Level 4."
            />
          )}
          {user.roles.includes("DRIVER") && (
            <FinanceCard
              icon="🛵"
              label="Penghasilan (Pengantar)"
              value={fin.driver_earnings}
              note="Riwayat job & penghasilan hadir di Level 5."
            />
          )}
          {user.roles.includes("ADMIN") && (
            <Card className="p-5">
              <p className="text-2xl">🛡️</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Admin
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Monitoring marketplace hadir di Level 6.
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
