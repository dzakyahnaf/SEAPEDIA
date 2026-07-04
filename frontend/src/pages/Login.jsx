import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registered = location.state?.registered;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.needs_role_selection) {
        navigate("/select-role");
      } else {
        navigate(location.state?.from ?? "/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card className="p-8">
        <h1 className="text-center text-2xl font-extrabold text-slate-900">
          Masuk ke SEAPEDIA
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Selamat datang kembali! 🌊
        </p>

        {registered && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Registrasi berhasil! Silakan masuk dengan akun baru Anda.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            id="username"
            label="Username"
            placeholder="username"
            value={username}
            required
            autoFocus
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? "Memproses…" : "Masuk"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link to="/register" className="font-semibold text-sea-700 hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </Card>
    </div>
  );
}
