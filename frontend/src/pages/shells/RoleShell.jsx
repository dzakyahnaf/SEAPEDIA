import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import { ROLE_INFO } from "../../lib/roles";

/**
 * Kerangka dashboard per peran (Level 1). Setiap fitur di dalamnya akan
 * diisi pada level yang tercantum di kartunya.
 */
export default function RoleShell({ role, features }) {
  const info = ROLE_INFO[role];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-400">
        <Link to="/dashboard" className="hover:text-sea-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{info.label}</span>
      </nav>
      <div className="mt-4 flex items-center gap-4">
        <span className="text-5xl">{info.icon}</span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Dashboard {info.label}
          </h1>
          <p className="text-sm text-slate-500">{info.description}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="p-5">
            <p className="text-2xl">{feature.icon}</p>
            <h2 className="mt-2 font-bold text-slate-800">{feature.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
            <p className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
              Hadir di Level {feature.level}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
