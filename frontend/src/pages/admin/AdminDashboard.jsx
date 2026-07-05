import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";
import { statusBadgeClass } from "../../lib/orderStatus";
import DiscountManager from "./DiscountManager";
import OverduePanel from "./OverduePanel";

const TABS = [
  { key: "ringkasan", label: "Ringkasan" },
  { key: "users", label: "Pengguna" },
  { key: "stores", label: "Toko" },
  { key: "products", label: "Produk" },
  { key: "orders", label: "Pesanan" },
  { key: "deliveries", label: "Pengiriman" },
  { key: "discounts", label: "Voucher & Promo" },
  { key: "overdue", label: "Overdue & Simulasi" },
];

const ROLE_BADGE = {
  ADMIN: "bg-rose-100 text-rose-700",
  SELLER: "bg-amber-100 text-amber-700",
  BUYER: "bg-sky-100 text-sky-700",
  DRIVER: "bg-violet-100 text-violet-700",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function StatTile({ label, value, accent }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ?? "text-slate-800"}`}>{value}</p>
    </Card>
  );
}

function Table({ columns, rows, render }) {
  if (rows === null) return <p className="text-sm text-slate-400">Memuat…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate-400">Belum ada data.</p>;
  return (
    <Card className="overflow-x-auto p-6">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            {columns.map((c) => (
              <th key={c} className="pb-2 pr-4">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(render)}</tbody>
      </table>
    </Card>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("ringkasan");
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState({}); // cache per tab

  useEffect(() => {
    api("/admin/summary").then(setSummary).catch(() => {});
  }, []);

  // Muat data tab saat pertama dibuka.
  useEffect(() => {
    const endpoints = {
      users: "/admin/users",
      stores: "/admin/stores",
      products: "/admin/products",
      orders: "/admin/orders",
      deliveries: "/admin/deliveries",
    };
    if (endpoints[tab] && data[tab] === undefined) {
      setData((d) => ({ ...d, [tab]: null }));
      api(endpoints[tab])
        .then((res) => setData((d) => ({ ...d, [tab]: res })))
        .catch(() => setData((d) => ({ ...d, [tab]: [] })));
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/dashboard" className="hover:text-sea-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Admin</span>
      </nav>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">🛡️ Admin Monitoring</h1>

      {/* Tab nav */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-sea-600 text-sea-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* Ringkasan */}
        {tab === "ringkasan" && (
          summary === null ? (
            <p className="text-sm text-slate-400">Memuat…</p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <StatTile label="Pengguna" value={summary.total_users} />
                <StatTile label="Toko" value={summary.total_stores} />
                <StatTile label="Produk" value={summary.total_products} />
                <StatTile label="Pesanan" value={summary.total_orders} />
                <StatTile label="Voucher" value={summary.total_vouchers} />
                <StatTile label="Promo" value={summary.total_promos} />
                <StatTile label="Pengiriman Aktif" value={summary.active_deliveries} accent="text-sea-700" />
                <StatTile label="Overdue" value={summary.overdue_orders} accent={summary.overdue_orders > 0 ? "text-rose-600" : "text-slate-800"} />
              </div>
              <Card className="p-6">
                <h3 className="font-bold text-slate-800">Pesanan per Status</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(summary.orders_by_status).map(([s, n]) => (
                    <Badge key={s} className={statusBadgeClass(s)}>{s}: {n}</Badge>
                  ))}
                  {Object.keys(summary.orders_by_status).length === 0 && (
                    <p className="text-sm text-slate-400">Belum ada pesanan.</p>
                  )}
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Total saldo wallet seluruh pengguna: {formatIDR(summary.total_wallet_balance)}
                </p>
              </Card>
            </div>
          )
        )}

        {/* Pengguna */}
        {tab === "users" && (
          <Table
            columns={["Username", "Email", "Peran", "Bergabung"]}
            rows={data.users ?? null}
            render={(u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-4 font-semibold text-slate-800">{u.username}</td>
                <td className="py-2.5 pr-4 text-slate-500">{u.email}</td>
                <td className="py-2.5 pr-4">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} className={ROLE_BADGE[r]}>{r}</Badge>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 text-xs text-slate-400">{formatDate(u.created_at)}</td>
              </tr>
            )}
          />
        )}

        {/* Toko */}
        {tab === "stores" && (
          <Table
            columns={["Nama Toko", "Penjual", "Jml Produk", "Berdiri"]}
            rows={data.stores ?? null}
            render={(s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-4 font-semibold text-slate-800">{s.name}</td>
                <td className="py-2.5 pr-4 text-slate-500">{s.seller_username}</td>
                <td className="py-2.5 pr-4">{s.product_count}</td>
                <td className="py-2.5 text-xs text-slate-400">{formatDate(s.created_at)}</td>
              </tr>
            )}
          />
        )}

        {/* Produk */}
        {tab === "products" && (
          <Table
            columns={["Produk", "Toko", "Harga", "Stok"]}
            rows={data.products ?? null}
            render={(p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-4 font-semibold text-slate-800">{p.name}</td>
                <td className="py-2.5 pr-4 text-slate-500">{p.store_name}</td>
                <td className="py-2.5 pr-4">{formatIDR(p.price)}</td>
                <td className="py-2.5">
                  {p.stock > 0 ? p.stock : <span className="text-rose-600">habis</span>}
                </td>
              </tr>
            )}
          />
        )}

        {/* Pesanan */}
        {tab === "orders" && (
          <Table
            columns={["Kode", "Pembeli", "Toko", "Status", "Total"]}
            rows={data.orders ?? null}
            render={(o) => (
              <tr key={o.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-4 font-mono text-xs">{o.code}</td>
                <td className="py-2.5 pr-4">{o.buyer_username}</td>
                <td className="py-2.5 pr-4 text-slate-500">{o.store_name}</td>
                <td className="py-2.5 pr-4">
                  <Badge className={statusBadgeClass(o.status)}>{o.status}</Badge>
                  {o.is_overdue && <Badge className="ml-1 bg-rose-100 text-rose-700">overdue</Badge>}
                </td>
                <td className="py-2.5 font-semibold">{formatIDR(o.total)}</td>
              </tr>
            )}
          />
        )}

        {/* Pengiriman */}
        {tab === "deliveries" && (
          <Table
            columns={["Kode", "Toko", "Status", "Driver", "Metode"]}
            rows={data.deliveries ?? null}
            render={(d) => (
              <tr key={d.order_id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-4 font-mono text-xs">{d.code}</td>
                <td className="py-2.5 pr-4 text-slate-500">{d.store_name}</td>
                <td className="py-2.5 pr-4">
                  <Badge className={statusBadgeClass(d.status)}>{d.status}</Badge>
                </td>
                <td className="py-2.5 pr-4">
                  {d.driver_username ?? <span className="text-slate-400">belum diambil</span>}
                </td>
                <td className="py-2.5 text-slate-500">{d.delivery_method_label}</td>
              </tr>
            )}
          />
        )}

        {tab === "discounts" && <DiscountManager />}
        {tab === "overdue" && <OverduePanel />}
      </div>
    </div>
  );
}
