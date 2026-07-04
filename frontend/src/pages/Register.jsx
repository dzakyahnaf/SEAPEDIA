import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { api } from "../lib/api";
import { NON_ADMIN_ROLES, ROLE_INFO } from "../lib/roles";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [roles, setRoles] = useState(["BUYER"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleRole(role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    if (roles.length === 0) {
      setError("Pilih minimal satu peran.");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          username: form.username,
          email: form.email,
          password: form.password,
          roles,
        },
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col px-4 py-16">
      <Card className="p-8">
        <h1 className="text-center text-2xl font-extrabold text-slate-900">
          Daftar ke SEAPEDIA
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Satu akun bisa memiliki beberapa peran sekaligus.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            id="username"
            label="Username"
            placeholder="hanya huruf, angka, dan _"
            hint="3-30 karakter; huruf, angka, atau garis bawah."
            value={form.username}
            required
            onChange={set("username")}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={form.email}
            required
            onChange={set("email")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="password"
              label="Password"
              type="password"
              hint="Minimal 8 karakter."
              value={form.password}
              required
              minLength={8}
              onChange={set("password")}
            />
            <Input
              id="confirm"
              label="Konfirmasi Password"
              type="password"
              value={form.confirm}
              required
              onChange={set("confirm")}
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Daftar sebagai <span className="text-slate-400">(boleh lebih dari satu)</span>
            </span>
            <div className="grid gap-2 sm:grid-cols-3">
              {NON_ADMIN_ROLES.map((role) => {
                const info = ROLE_INFO[role];
                const selected = roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-xl border-2 p-3 text-left transition-colors ${
                      selected
                        ? "border-sea-500 bg-sea-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xl">{info.icon}</span>
                    <p className="mt-1 text-sm font-bold text-slate-800">{info.label}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? "Memproses…" : "Daftar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-sea-700 hover:underline">
            Masuk
          </Link>
        </p>
      </Card>
    </div>
  );
}
