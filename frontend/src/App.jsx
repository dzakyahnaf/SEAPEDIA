import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Register from "./pages/Register";
import SelectRole from "./pages/SelectRole";
import AdminDashboard from "./pages/shells/AdminDashboard";
import BuyerDashboard from "./pages/shells/BuyerDashboard";
import DriverDashboard from "./pages/shells/DriverDashboard";
import SellerDashboard from "./pages/shells/SellerDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Halaman publik — bisa diakses guest */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Halaman privat — butuh login */}
            <Route
              path="/select-role"
              element={
                <ProtectedRoute>
                  <SelectRole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Dashboard per peran — dibatasi role AKTIF */}
            <Route
              path="/buyer"
              element={
                <ProtectedRoute roles={["BUYER"]}>
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller"
              element={
                <ProtectedRoute roles={["SELLER"]}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver"
              element={
                <ProtectedRoute roles={["DRIVER"]}>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="py-24 text-center">
                  <p className="text-6xl">🌊</p>
                  <h1 className="mt-4 text-xl font-bold text-slate-800">
                    Halaman tidak ditemukan
                  </h1>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
