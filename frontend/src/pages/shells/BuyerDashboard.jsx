import RoleShell from "./RoleShell";

const FEATURES = [
  { icon: "👛", title: "Wallet & Top-up", description: "Isi saldo dan lihat riwayat transaksi wallet.", level: 3 },
  { icon: "📍", title: "Alamat Pengiriman", description: "Kelola alamat tujuan pengiriman pesanan.", level: 3 },
  { icon: "🛒", title: "Keranjang", description: "Keranjang belanja dengan aturan satu toko per checkout.", level: 3 },
  { icon: "🧾", title: "Checkout", description: "Subtotal, diskon, ongkir, PPN 12%, dan total akhir.", level: 3 },
  { icon: "📦", title: "Riwayat Pesanan", description: "Lacak status pesanan dengan timeline lengkap.", level: 3 },
  { icon: "📊", title: "Laporan Pengeluaran", description: "Ringkasan belanja Anda di SEAPEDIA.", level: 4 },
];

export default function BuyerDashboard() {
  return <RoleShell role="BUYER" features={FEATURES} />;
}
