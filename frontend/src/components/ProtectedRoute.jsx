import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Melindungi halaman privat.
 * - Belum login  -> ke /login.
 * - Multi-role tapi belum memilih role aktif -> dipaksa ke /select-role
 *   (aturan: tidak boleh masuk dashboard privat sebelum memilih role).
 * - Prop `roles` membatasi akses berdasarkan ROLE AKTIF sesi.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading, needsRoleSelection } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        Memuat…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (needsRoleSelection && location.pathname !== "/select-role") {
    return <Navigate to="/select-role" replace />;
  }

  if (roles && !roles.includes(user.active_role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-xl font-bold text-slate-800">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-slate-500">
          Halaman ini hanya untuk role {roles.join(", ")}. Role aktif Anda saat
          ini adalah {user.active_role ?? "belum dipilih"}. Ganti role aktif
          melalui menu pilih role jika Anda memiliki role tersebut.
        </p>
      </div>
    );
  }

  return children;
}
