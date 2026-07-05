// Status utama siklus pesanan — label persis sesuai ketentuan soal.
export const STATUS_BADGE = {
  "Sedang Dikemas": "bg-amber-100 text-amber-700",
  "Menunggu Pengirim": "bg-sky-100 text-sky-700",
  "Sedang Dikirim": "bg-violet-100 text-violet-700",
  "Pesanan Selesai": "bg-emerald-100 text-emerald-700",
  "Dikembalikan": "bg-rose-100 text-rose-700",
};

export const STATUS_ICON = {
  "Sedang Dikemas": "📦",
  "Menunggu Pengirim": "⏳",
  "Sedang Dikirim": "🛵",
  "Pesanan Selesai": "✅",
  "Dikembalikan": "↩️",
};

export function statusBadgeClass(status) {
  return STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600";
}
