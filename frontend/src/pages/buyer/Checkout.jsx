import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";

export default function Checkout() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState(null);
  const [methods, setMethods] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [method, setMethod] = useState("REGULAR");
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Diskon: kode yang sedang diketik vs kode yang sudah diterapkan.
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  useEffect(() => {
    api("/buyer/addresses").then((list) => {
      setAddresses(list);
      const preferred = list.find((a) => a.is_default) ?? list[0];
      if (preferred) setAddressId(preferred.id);
    });
    api("/buyer/delivery-methods").then(setMethods);
  }, []);

  // Ringkasan selalu dihitung backend (source of truth) berdasar metode
  // pengiriman + kode diskon yang diterapkan.
  const loadPreview = useCallback(
    async (code) => {
      setPreview(null);
      setPreviewError("");
      try {
        const body = { delivery_method: method };
        if (code) body.discount_code = code;
        const result = await api("/buyer/checkout/preview", { method: "POST", body });
        setPreview(result);
      } catch (err) {
        setPreviewError(err.message);
      }
    },
    [method]
  );

  useEffect(() => {
    loadPreview(appliedCode);
  }, [loadPreview, appliedCode]);

  async function applyDiscount() {
    const code = discountInput.trim();
    if (!code) return;
    setDiscountError("");
    setApplyingDiscount(true);
    try {
      // Validasi lewat preview; jika gagal, jangan hapus ringkasan sebelumnya.
      const body = { delivery_method: method, discount_code: code };
      const result = await api("/buyer/checkout/preview", { method: "POST", body });
      setPreview(result);
      setAppliedCode(code);
    } catch (err) {
      setDiscountError(err.message);
    } finally {
      setApplyingDiscount(false);
    }
  }

  function removeDiscount() {
    setAppliedCode("");
    setDiscountInput("");
    setDiscountError("");
  }

  async function handleCheckout() {
    setSubmitError("");
    setSubmitting(true);
    try {
      const body = { address_id: addressId, delivery_method: method };
      if (appliedCode) body.discount_code = appliedCode;
      const order = await api("/buyer/checkout", { method: "POST", body });
      navigate(`/buyer/orders/${order.id}`, { state: { justOrdered: true } });
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  if (addresses === null) {
    return <div className="py-24 text-center text-slate-400">Memuat…</div>;
  }

  if (previewError && !preview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">🛒</p>
        <p className="mt-4 font-semibold text-slate-700">{previewError}</p>
        <Link to="/products" className="mt-4 inline-block">
          <Button>Jelajahi Produk</Button>
        </Link>
      </div>
    );
  }

  const canSubmit = addressId && preview && preview.sufficient_balance && !submitting;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {/* Alamat */}
          <Card className="p-6">
            <h2 className="font-bold text-slate-800">📍 Alamat Pengiriman</h2>
            {addresses.length === 0 ? (
              <div className="mt-3 text-sm text-slate-500">
                Anda belum punya alamat.{" "}
                <Link to="/buyer" className="font-semibold text-sea-700 hover:underline">
                  Tambahkan alamat dulu →
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-colors ${
                      addressId === address.id
                        ? "border-sea-500 bg-sea-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                      className="mt-1 accent-sea-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {address.label}{" "}
                        {address.is_default && (
                          <Badge className="ml-1 bg-sea-100 text-sea-700">Utama</Badge>
                        )}
                      </p>
                      <p className="text-sm text-slate-600">
                        {address.recipient_name} · {address.phone}
                      </p>
                      <p className="text-xs text-slate-500">{address.full_address}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Card>

          {/* Metode pengiriman */}
          <Card className="p-6">
            <h2 className="font-bold text-slate-800">🚚 Metode Pengiriman</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {methods.map((m) => (
                <label
                  key={m.code}
                  className={`cursor-pointer rounded-xl border-2 p-3.5 transition-colors ${
                    method === m.code
                      ? "border-sea-500 bg-sea-50/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    className="hidden"
                    checked={method === m.code}
                    onChange={() => setMethod(m.code)}
                  />
                  <p className="text-sm font-bold text-slate-800">{m.label}</p>
                  <p className="text-sm font-semibold text-sea-700">{formatIDR(m.fee)}</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    {m.description}
                  </p>
                </label>
              ))}
            </div>
          </Card>

          {/* Kode diskon */}
          <Card className="p-6">
            <h2 className="font-bold text-slate-800">🎟️ Voucher / Promo</h2>
            <p className="mt-1 text-xs text-slate-400">
              Masukkan satu kode Voucher atau Promo (tidak bisa digabung).
            </p>
            {appliedCode && preview?.applied_discount ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    <Badge className="mr-1 bg-emerald-100 text-emerald-700">
                      {preview.applied_discount.type === "VOUCHER" ? "Voucher" : "Promo"}
                    </Badge>
                    {preview.applied_discount.code} diterapkan
                  </p>
                  <p className="text-xs text-emerald-700">
                    {preview.applied_discount.description ||
                      `Potongan ${preview.applied_discount.percent}%`}{" "}
                    · hemat {formatIDR(preview.applied_discount.amount)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-rose-600!" onClick={removeDiscount}>
                  Hapus
                </Button>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex gap-2">
                  <Input
                    id="discount-code"
                    placeholder="Masukkan kode, contoh: HEMAT10"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    disabled={applyingDiscount || !discountInput.trim()}
                    onClick={applyDiscount}
                  >
                    {applyingDiscount ? "…" : "Terapkan"}
                  </Button>
                </div>
                {discountError && (
                  <p className="mt-2 text-xs text-rose-600">{discountError}</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Ringkasan */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24 p-6">
            <h2 className="font-bold text-slate-800">Ringkasan Belanja</h2>
            {preview === null ? (
              <p className="mt-3 text-sm text-slate-400">Menghitung…</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-slate-400">dari 🏪 {preview.store.name}</p>
                <div className="mt-3 space-y-1.5 border-b border-slate-100 pb-3 text-sm">
                  {preview.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-600">
                      <span className="mr-2 line-clamp-1">
                        {item.product_name} ×{item.quantity}
                      </span>
                      <span className="shrink-0">{formatIDR(item.line_total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatIDR(preview.subtotal)}</span>
                  </div>
                  <div className={`flex justify-between ${preview.discount > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                    <span>
                      Diskon
                      {preview.applied_discount && ` (${preview.applied_discount.code})`}
                    </span>
                    <span>− {formatIDR(preview.discount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Ongkos Kirim</span>
                    <span>{formatIDR(preview.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>PPN {preview.tax_rate_percent}%</span>
                    <span>{formatIDR(preview.tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900">
                    <span>Total</span>
                    <span className="text-sea-700">{formatIDR(preview.total)}</span>
                  </div>
                </div>

                <div
                  className={`mt-4 rounded-lg px-3 py-2.5 text-xs font-medium ${
                    preview.sufficient_balance
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  Saldo wallet: {formatIDR(preview.wallet_balance)}
                  {!preview.sufficient_balance && (
                    <>
                      {" — tidak cukup. "}
                      <Link to="/buyer" className="underline">Top-up dulu →</Link>
                    </>
                  )}
                </div>

                {submitError && (
                  <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                    {submitError}
                  </div>
                )}

                <Button
                  size="lg"
                  className="mt-4 w-full"
                  disabled={!canSubmit}
                  onClick={handleCheckout}
                >
                  {submitting ? "Memproses…" : "Bayar dengan Wallet"}
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
