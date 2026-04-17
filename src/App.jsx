import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser, setAuthChecked } from "./store/slices/authSlice";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import EditProduct from "./pages/admin/EditProduct";
import UserDetail from "./pages/admin/UserDetail";
import About from "./pages/About";

function App() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (accessToken) {
      dispatch(getCurrentUser());
      return;
    }

    dispatch(setAuthChecked(true));
  }, [accessToken, dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="profile" element={<Profile />} />
        <Route path="contact" element={<Contact />} />
        <Route path="about" element={<About />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/products/:id" element={<EditProduct />} />
        <Route path="admin/users/:id" element={<UserDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
