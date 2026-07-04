import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import { ROLE_INFO } from "../lib/roles";

export default function SelectRole() {
  const { user, selectRole } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [choosing, setChoosing] = useState(null);

  async function choose(role) {
    setError("");
    setChoosing(role);
    try {
      await selectRole(role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setChoosing(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Halo, {user.username}! Masuk sebagai siapa hari ini?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Akun Anda memiliki {user.roles.length} peran. Pilih peran aktif untuk
          sesi ini — otorisasi mengikuti peran aktif, bukan seluruh peran yang
          Anda miliki. Anda bisa menggantinya kapan saja.
        </p>
      </div>

      {error && (
        <div className="mx-auto mt-6 max-w-md rounded-lg bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {user.roles.map((role) => {
          const info = ROLE_INFO[role];
          const isActive = user.active_role === role;
          return (
            <button key={role} onClick={() => choose(role)} disabled={choosing !== null}>
              <Card
                className={`h-full p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md ${
                  isActive ? "border-sea-500 ring-2 ring-sea-200" : ""
                }`}
              >
                <p className="text-5xl">{info.icon}</p>
                <h2 className="mt-3 text-lg font-bold text-slate-800">{info.label}</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {info.description}
                </p>
                {isActive && (
                  <p className="mt-3 text-xs font-bold text-sea-700">● Aktif saat ini</p>
                )}
                {choosing === role && (
                  <p className="mt-3 text-xs text-slate-400">Memproses…</p>
                )}
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
