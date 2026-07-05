import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { api } from "../../lib/api";

/** Form tambah/ubah alamat pengiriman Buyer. */
export default function AddressForm({ address, onSaved, onCancel }) {
  const isEdit = Boolean(address?.id);
  const [form, setForm] = useState({
    label: address?.label ?? "",
    recipient_name: address?.recipient_name ?? "",
    phone: address?.phone ?? "",
    full_address: address?.full_address ?? "",
    is_default: address?.is_default ?? false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) =>
      setForm({
        ...form,
        [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = await api(
        isEdit ? `/buyer/addresses/${address.id}` : "/buyer/addresses",
        { method: isEdit ? "PUT" : "POST", body: form }
      );
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-sea-200 bg-sea-50/40 p-6">
      <h3 className="font-bold text-slate-800">
        {isEdit ? "Ubah Alamat" : "Tambah Alamat Baru"}
      </h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="address-label"
            label="Label"
            placeholder="Rumah / Kantor / Kos"
            value={form.label}
            required
            maxLength={30}
            onChange={set("label")}
          />
          <Input
            id="address-recipient"
            label="Nama Penerima"
            value={form.recipient_name}
            required
            maxLength={60}
            onChange={set("recipient_name")}
          />
        </div>
        <Input
          id="address-phone"
          label="No. Telepon"
          placeholder="08xxxxxxxxxx"
          hint="8-15 digit angka."
          value={form.phone}
          required
          onChange={set("phone")}
        />
        <Textarea
          id="address-full"
          label="Alamat Lengkap"
          placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos"
          rows={3}
          value={form.full_address}
          required
          minLength={10}
          maxLength={500}
          onChange={set("full_address")}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={set("is_default")}
            className="h-4 w-4 accent-sea-600"
          />
          Jadikan alamat utama
        </label>
        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Alamat"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Batal</Button>
        </div>
      </form>
    </Card>
  );
}
