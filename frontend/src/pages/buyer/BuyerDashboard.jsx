import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { api } from "../../lib/api";
import { formatDate, formatIDR } from "../../lib/format";
import AddressForm from "./AddressForm";

const TOPUP_PRESETS = [50_000, 100_000, 200_000, 500_000];

const TX_STYLE = {
  TOPUP: { label: "Top-up", class: "bg-emerald-100 text-emerald-700" },
  PAYMENT: { label: "Pembayaran", class: "bg-rose-100 text-rose-700" },
  REFUND: { label: "Refund", class: "bg-sky-100 text-sky-700" },
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function BuyerDashboard() {
  const [wallet, setWallet] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupBusy, setTopupBusy] = useState(false);
  const [topupError, setTopupError] = useState("");
  const [addressForm, setAddressForm] = useState(null); // null | "new" | address

  useEffect(() => {
    api("/buyer/wallet").then(setWallet).catch(() => {});
    api("/buyer/addresses").then(setAddresses).catch(() => {});
  }, []);

  async function handleTopup(amount) {
    setTopupError("");
    setTopupBusy(true);
    try {
      const updated = await api("/buyer/wallet/topup", {
        method: "POST",
        body: { amount: Number(amount) },
      });
      setWallet(updated);
      setTopupAmount("");
    } catch (err) {
      setTopupError(err.message);
    } finally {
      setTopupBusy(false);
    }
  }

  async function handleDeleteAddress(id) {
    try {
      await api(`/buyer/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // biarkan; error jarang terjadi di sini
    }
  }

  function handleAddressSaved(saved) {
    setAddresses((prev) => {
      const cleared = saved.is_default
        ? prev.map((a) => ({ ...a, is_default: false }))
        : prev;
      const exists = cleared.some((a) => a.id === saved.id);
      return exists
        ? cleared.map((a) => (a.id === saved.id ? saved : a))
        : [...cleared, saved];
    });
    setAddressForm(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/dashboard" className="hover:text-sea-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Pembeli</span>
      </nav>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Dashboard Pembeli</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Wallet */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-sea-700 to-sea-500 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-sea-100">
              Saldo Wallet
            </p>
            <p className="mt-1 text-3xl font-extrabold">
              {wallet ? formatIDR(wallet.balance) : "…"}
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              {TOPUP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  disabled={topupBusy}
                  onClick={() => handleTopup(preset)}
                  className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
                >
                  +{formatIDR(preset)}
                </button>
              ))}
              <div className="flex items-end gap-2">
                <Input
                  id="topup-custom"
                  type="number"
                  min={10000}
                  max={10000000}
                  placeholder="Nominal lain"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-36 [&_input]:!py-1.5 [&_input]:text-xs"
                />
                <Button
                  size="sm"
                  disabled={topupBusy || !topupAmount}
                  onClick={() => handleTopup(topupAmount)}
                  className="bg-white !text-sea-700 hover:bg-sea-50"
                >
                  Top-up
                </Button>
              </div>
            </div>
            {topupError && <p className="mt-2 text-xs text-rose-200">{topupError}</p>}
            <p className="mt-3 text-[11px] text-sea-100">
              Top-up bersifat simulasi (dummy) — tidak ada pembayaran sungguhan.
            </p>
          </Card>

          {/* Riwayat transaksi wallet */}
          <Card className="mt-4 p-6">
            <h2 className="font-bold text-slate-800">Riwayat Transaksi Wallet</h2>
            {wallet === null ? (
              <p className="mt-3 text-sm text-slate-400">Memuat…</p>
            ) : wallet.transactions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Belum ada transaksi.</p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {wallet.transactions.slice(0, 8).map((tx) => {
                  const style = TX_STYLE[tx.type] ?? TX_STYLE.TOPUP;
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <Badge className={style.class}>{style.label}</Badge>
                        <div>
                          <p className="text-sm text-slate-700">{tx.description}</p>
                          <p className="text-xs text-slate-400">{formatDateTime(tx.created_at)}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {tx.amount >= 0 ? "+" : "−"}{formatIDR(Math.abs(tx.amount))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Tautan cepat */}
        <div className="space-y-4">
          <Link to="/cart" className="block">
            <Card className="p-5 transition-shadow hover:shadow-md">
              <p className="text-2xl">🛒</p>
              <p className="mt-1 font-bold text-slate-800">Keranjang Belanja</p>
              <p className="text-xs text-slate-500">Lihat & atur isi keranjang Anda.</p>
            </Card>
          </Link>
          <Link to="/buyer/orders" className="block">
            <Card className="p-5 transition-shadow hover:shadow-md">
              <p className="text-2xl">📦</p>
              <p className="mt-1 font-bold text-slate-800">Riwayat Pesanan</p>
              <p className="text-xs text-slate-500">Lacak status semua pesanan Anda.</p>
            </Card>
          </Link>
          <Link to="/buyer/report" className="block">
            <Card className="p-5 transition-shadow hover:shadow-md">
              <p className="text-2xl">📊</p>
              <p className="mt-1 font-bold text-slate-800">Laporan Pengeluaran</p>
              <p className="text-xs text-slate-500">Ringkasan total belanja Anda.</p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Alamat pengiriman */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Alamat Pengiriman</h2>
          {addressForm === null && (
            <Button onClick={() => setAddressForm("new")}>+ Tambah Alamat</Button>
          )}
        </div>

        {addressForm !== null && (
          <div className="mt-4">
            <AddressForm
              address={addressForm === "new" ? null : addressForm}
              onSaved={handleAddressSaved}
              onCancel={() => setAddressForm(null)}
            />
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.length === 0 && addressForm === null && (
            <Card className="p-6 text-center text-sm text-slate-400 sm:col-span-2 lg:col-span-3">
              Belum ada alamat. Tambahkan alamat untuk bisa checkout.
            </Card>
          )}
          {addresses.map((address) => (
            <Card key={address.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">📍 {address.label}</p>
                {address.is_default && (
                  <Badge className="bg-sea-100 text-sea-700">Utama</Badge>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {address.recipient_name} · {address.phone}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {address.full_address}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Ditambahkan {formatDate(address.created_at)}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddressForm(address)}>
                  Ubah
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="!text-rose-600"
                  onClick={() => handleDeleteAddress(address.id)}
                >
                  Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
