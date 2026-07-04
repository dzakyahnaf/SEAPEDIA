import RoleShell from "./RoleShell";

const FEATURES = [
  { icon: "🔍", title: "Cari Job", description: "Temukan job pengiriman yang siap diambil.", level: 5 },
  { icon: "🛵", title: "Ambil & Antar", description: "Ambil job dan perbarui progres pengiriman.", level: 5 },
  { icon: "🏁", title: "Konfirmasi Selesai", description: "Selesaikan job dan catat waktu pengantaran.", level: 5 },
  { icon: "💵", title: "Penghasilan", description: "Riwayat job dan total penghasilan Anda.", level: 5 },
];

export default function DriverDashboard() {
  return <RoleShell role="DRIVER" features={FEATURES} />;
}
