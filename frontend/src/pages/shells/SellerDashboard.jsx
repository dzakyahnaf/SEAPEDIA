import RoleShell from "./RoleShell";

const FEATURES = [
  { icon: "🏪", title: "Profil Toko", description: "Buat dan kelola toko dengan nama unik.", level: 2 },
  { icon: "📦", title: "Manajemen Produk", description: "Tambah, ubah, dan hapus produk milik toko Anda.", level: 2 },
  { icon: "📥", title: "Pesanan Masuk", description: "Lihat pesanan dari pembeli untuk toko Anda.", level: 3 },
  { icon: "✅", title: "Proses Pesanan", description: "Proses pesanan agar siap diambil pengantar.", level: 4 },
  { icon: "💰", title: "Laporan Pendapatan", description: "Ringkasan pendapatan dari pesanan selesai.", level: 4 },
];

export default function SellerDashboard() {
  return <RoleShell role="SELLER" features={FEATURES} />;
}
