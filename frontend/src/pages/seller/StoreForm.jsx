import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { api } from "../../lib/api";

/**
 * Form buat/ubah profil toko. Nama toko harus unik — jika sudah dipakai,
 * backend membalas 409 dan pesannya ditampilkan di bawah field.
 */
export default function StoreForm({ store, onSaved, onCancel }) {
  const isEdit = store !== null && store !== undefined;
  const [name, setName] = useState(store?.name ?? "");
  const [description, setDescription] = useState(store?.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = await api("/seller/store", {
        method: isEdit ? "PUT" : "POST",
        body: { name, description },
      });
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-bold text-slate-800">
        {isEdit ? "Ubah Profil Toko" : "Buat Toko Anda"}
      </h2>
      {!isEdit && (
        <p className="mt-1 text-sm text-slate-500">
          Toko adalah identitas publik Anda sebagai penjual. Nama toko harus
          unik di seluruh SEAPEDIA.
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input
          id="store-name"
          label="Nama Toko"
          placeholder="contoh: Toko Berkah Abadi"
          hint="3-60 karakter, harus unik."
          value={name}
          required
          minLength={3}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          id="store-description"
          label="Deskripsi Toko"
          placeholder="Ceritakan apa yang toko Anda jual…"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Buat Toko"}
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Batal
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
