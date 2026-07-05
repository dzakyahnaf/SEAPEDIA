import { useEffect, useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Default kadaluarsa 30 hari ke depan dalam format datetime-local.
function defaultExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 16);
}

function DiscountForm({ kind, onCreated }) {
  const isVoucher = kind === "voucher";
  const [form, setForm] = useState({
    code: "", description: "", percent: 10, max_discount: 0, min_spend: 0,
    remaining_usage: 100, expires_at: defaultExpiry(),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = {
        code: form.code,
        description: form.description,
        percent: Number(form.percent),
        max_discount: Number(form.max_discount),
        min_spend: Number(form.min_spend),
        expires_at: new Date(form.expires_at).toISOString(),
      };
      if (isVoucher) body.remaining_usage = Number(form.remaining_usage);
      const created = await api(isVoucher ? "/admin/vouchers" : "/admin/promos", {
        method: "POST",
        body,
      });
      onCreated(created);
      setForm({ ...form, code: "", description: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id={`${kind}-code`}
          label="Kode"
          placeholder="HEMAT10"
          value={form.code}
          required
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        <Input id={`${kind}-percent`} label="Potongan (%)" type="number" min={1} max={100}
          value={form.percent} required onChange={set("percent")} />
      </div>
      <Input id={`${kind}-desc`} label="Deskripsi" value={form.description}
        onChange={set("description")} placeholder="Diskon spesial…" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id={`${kind}-max`} label="Maks Potongan (Rp, 0=tanpa batas)" type="number" min={0}
          value={form.max_discount} onChange={set("max_discount")} />
        <Input id={`${kind}-min`} label="Min Belanja (Rp)" type="number" min={0}
          value={form.min_spend} onChange={set("min_spend")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {isVoucher && (
          <Input id="voucher-usage" label="Kuota Pemakaian" type="number" min={1}
            value={form.remaining_usage} required onChange={set("remaining_usage")} />
        )}
        <Input id={`${kind}-exp`} label="Kadaluarsa" type="datetime-local"
          value={form.expires_at} required onChange={set("expires_at")} />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <Button type="submit" disabled={busy}>
        {busy ? "Menyimpan…" : `Generate ${isVoucher ? "Voucher" : "Promo"}`}
      </Button>
    </form>
  );
}

function DiscountList({ items, isVoucher }) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-slate-400">Belum ada {isVoucher ? "voucher" : "promo"}.</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="pb-2 pr-4">Kode</th>
            <th className="pb-2 pr-4">Potongan</th>
            {isVoucher && <th className="pb-2 pr-4">Sisa Kuota</th>}
            <th className="pb-2 pr-4">Kadaluarsa</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id} className="border-b border-slate-100 last:border-0">
              <td className="py-2.5 pr-4">
                <p className="font-mono font-semibold text-slate-800">{d.code}</p>
                <p className="text-[11px] text-slate-400">{d.description}</p>
              </td>
              <td className="py-2.5 pr-4">
                {d.percent}%
                {d.max_discount > 0 && (
                  <span className="text-[11px] text-slate-400"> (maks {formatIDR(d.max_discount)})</span>
                )}
              </td>
              {isVoucher && (
                <td className="py-2.5 pr-4">
                  {d.remaining_usage > 0 ? d.remaining_usage : <span className="text-rose-600">habis</span>}
                </td>
              )}
              <td className="py-2.5 pr-4 text-xs text-slate-500">{formatDate(d.expires_at)}</td>
              <td className="py-2.5">
                {d.is_expired ? (
                  <Badge className="bg-rose-100 text-rose-700">Kadaluarsa</Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DiscountManager() {
  const [vouchers, setVouchers] = useState([]);
  const [promos, setPromos] = useState([]);

  function load() {
    api("/admin/vouchers").then(setVouchers).catch(() => {});
    api("/admin/promos").then(setPromos).catch(() => {});
  }
  useEffect(load, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-bold text-slate-800">🎟️ Voucher</h3>
        <p className="text-xs text-slate-400">Punya kadaluarsa & kuota pemakaian.</p>
        <div className="mt-4">
          <DiscountForm kind="voucher" onCreated={(v) => setVouchers((p) => [v, ...p])} />
        </div>
        <DiscountList items={vouchers} isVoucher />
      </Card>
      <Card className="p-6">
        <h3 className="font-bold text-slate-800">🏷️ Promo</h3>
        <p className="text-xs text-slate-400">Punya kadaluarsa, tanpa batas kuota.</p>
        <div className="mt-4">
          <DiscountForm kind="promo" onCreated={(p) => setPromos((prev) => [p, ...prev])} />
        </div>
        <DiscountList items={promos} isVoucher={false} />
      </Card>
    </div>
  );
}
