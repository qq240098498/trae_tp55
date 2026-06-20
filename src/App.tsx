import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Rooms from "@/pages/Rooms";
import Bookings from "@/pages/Bookings";
import Checkout from "@/pages/Checkout";
import Products from "@/pages/Products";
import Matchmaking from "@/pages/Matchmaking";
import DailySettlement from "@/pages/DailySettlement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
          <Route path="/products" element={<Products />} />
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/daily-settlement" element={<DailySettlement />} />
        </Route>
      </Routes>
    </Router>
  );
}
