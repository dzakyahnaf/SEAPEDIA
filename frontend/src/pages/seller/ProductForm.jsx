import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { api } from "../../lib/api";

/** Form tambah/ubah produk milik toko Seller yang sedang login. */
export default function ProductForm({ product, onSaved, onCancel }) {
  const isEdit = Boolean(product?.id);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? "",
    stock: product?.stock ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
      };
      const saved = await api(
        isEdit ? `/seller/products/${product.id}` : "/seller/products",
        { method: isEdit ? "PUT" : "POST", body }
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
        {isEdit ? `Ubah Produk: ${product.name}` : "Tambah Produk Baru"}
      </h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input
          id="product-name"
          label="Nama Produk"
          value={form.name}
          required
          minLength={3}
          maxLength={120}
          onChange={set("name")}
        />
        <Textarea
          id="product-description"
          label="Deskripsi"
          rows={3}
          maxLength={2000}
          value={form.description}
          onChange={set("description")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="product-price"
            label="Harga (Rp)"
            type="number"
            min={1}
            hint="Rupiah utuh, tanpa titik/koma."
            value={form.price}
            required
            onChange={set("price")}
          />
          <Input
            id="product-stock"
            label="Stok"
            type="number"
            min={0}
            hint="Stok dipakai saat checkout (Level 3)."
            value={form.stock}
            required
            onChange={set("stock")}
          />
        </div>
        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </form>
    </Card>
  );
}
