export const ROLE_INFO = {
  BUYER: {
    label: "Pembeli",
    icon: "🛒",
    description:
      "Kelola saldo, alamat pengiriman, keranjang, checkout, dan riwayat pesanan.",
    dashboardPath: "/buyer",
    badgeClass: "bg-sky-100 text-sky-700",
  },
  SELLER: {
    label: "Penjual",
    icon: "🏪",
    description:
      "Buka toko dengan nama unik, kelola produk, dan proses pesanan masuk.",
    dashboardPath: "/seller",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  DRIVER: {
    label: "Pengantar",
    icon: "🛵",
    description:
      "Cari job pengiriman, ambil job, selesaikan pengantaran, dan pantau penghasilan.",
    dashboardPath: "/driver",
    badgeClass: "bg-violet-100 text-violet-700",
  },
  ADMIN: {
    label: "Admin",
    icon: "🛡️",
    description:
      "Pantau marketplace, kelola voucher & promo, dan jalankan aksi operasional.",
    dashboardPath: "/admin",
    badgeClass: "bg-rose-100 text-rose-700",
  },
};

export const NON_ADMIN_ROLES = ["BUYER", "SELLER", "DRIVER"];
