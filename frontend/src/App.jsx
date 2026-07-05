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
import StoreDetail from "./pages/StoreDetail";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerReport from "./pages/buyer/BuyerReport";
import Cart from "./pages/buyer/Cart";
import Checkout from "./pages/buyer/Checkout";
import OrderDetail from "./pages/buyer/OrderDetail";
import Orders from "./pages/buyer/Orders";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverJobDetail from "./pages/driver/DriverJobDetail";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerOrderDetail from "./pages/seller/SellerOrderDetail";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerReport from "./pages/seller/SellerReport";
import AdminDashboard from "./pages/shells/AdminDashboard";

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
            <Route path="/stores/:id" element={<StoreDetail />} />
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
              path="/cart"
              element={
                <ProtectedRoute roles={["BUYER"]}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute roles={["BUYER"]}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/orders"
              element={
                <ProtectedRoute roles={["BUYER"]}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/orders/:id"
              element={
                <ProtectedRoute roles={["BUYER"]}>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/report"
              element={
                <ProtectedRoute roles={["BUYER"]}>
                  <BuyerReport />
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
              path="/seller/orders"
              element={
                <ProtectedRoute roles={["SELLER"]}>
                  <SellerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders/:id"
              element={
                <ProtectedRoute roles={["SELLER"]}>
                  <SellerOrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/report"
              element={
                <ProtectedRoute roles={["SELLER"]}>
                  <SellerReport />
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
              path="/driver/jobs/:id"
              element={
                <ProtectedRoute roles={["DRIVER"]}>
                  <DriverJobDetail />
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
