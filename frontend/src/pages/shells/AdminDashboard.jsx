import RoleShell from "./RoleShell";

const FEATURES = [
  { icon: "📈", title: "Monitoring Marketplace", description: "Pantau user, toko, produk, pesanan, dan pengiriman.", level: 6 },
  { icon: "🎟️", title: "Voucher & Promo", description: "Buat dan kelola voucher serta promo diskon.", level: 6 },
  { icon: "⏰", title: "Simulasi Waktu", description: "Majukan hari untuk menguji pesanan yang terlambat.", level: 6 },
  { icon: "↩️", title: "Overdue & Refund", description: "Auto-return / auto-refund pesanan yang melewati SLA.", level: 6 },
];

export default function AdminDashboard() {
  return <RoleShell role="ADMIN" features={FEATURES} />;
}
