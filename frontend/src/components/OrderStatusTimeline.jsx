import { STATUS_ICON } from "../lib/orderStatus";

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Timeline riwayat status pesanan dengan timestamp — dipakai Buyer & Seller. */
export default function OrderStatusTimeline({ history }) {
  const entries = [...history].reverse(); // terbaru di atas
  return (
    <ol className="relative space-y-5 border-l-2 border-slate-100 pl-6">
      {entries.map((entry, index) => (
        <li key={`${entry.status}-${entry.created_at}`} className="relative">
          <span
            className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              index === 0 ? "bg-sea-600 text-white" : "bg-slate-200"
            }`}
          >
            {index === 0 ? "●" : ""}
          </span>
          <p className={`text-sm font-semibold ${index === 0 ? "text-sea-700" : "text-slate-600"}`}>
            {STATUS_ICON[entry.status] ?? "•"} {entry.status}
          </p>
          {entry.note && <p className="text-xs text-slate-500">{entry.note}</p>}
          <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(entry.created_at)}</p>
        </li>
      ))}
    </ol>
  );
}
