import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MdShoppingCart,
  MdPerson,
  MdMenu,
  MdClose,
  MdSettings,
  MdLogout,
} from "react-icons/md";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = null; // replace later with auth
  const cartItemCount = 0;

  const handleLogout = () => {
    console.log("logout clicked");
  };

  return (
    <header className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="font-bold text-xl text-green-600">
            Dot-Herbs
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-6">
            <Link to="/products">Products</Link>

            {user?.role === "admin" && (
              <Link to="/admin">Admin</Link>
            )}
          </nav>

          {/* Right */}
          <div className="flex items-center space-x-4">

            {/* Cart */}
            <Link to="/cart" className="relative">
              <MdShoppingCart className="text-xl" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <MdPerson />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 bg-white shadow-md mt-2 p-2">
                    <Link to="/profile">Profile</Link>
                    <Link to="/orders">Orders</Link>
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">Login</Link>
                <Link to="/register">Sign Up</Link>
              </div>
            )}

            {/* Mobile */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <MdClose /> : <MdMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-2">
            <Link to="/products">Products</Link>
            {user?.role === "admin" && <Link to="/admin">Admin</Link>}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;