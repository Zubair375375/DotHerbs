import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectAuthUser, logoutUser } from "../store/slices/authSlice";
import { selectCartItemCount } from "../store/slices/cartSlice";
import {
  MdShoppingCart,
  MdPerson,
  MdMenu,
  MdClose,
  MdSettings,
  MdLogout,
} from "react-icons/md";

const Header = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const cartItemCount = useSelector(selectCartItemCount);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <header className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/assets/logos/Logo.png"
              alt="Dot-Herbs"
              className="h-6 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-6">
            <Link to="/products">All Products</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>

            {user?.role === "admin" && <Link to="/admin">Admin</Link>}
          </nav>

          {/* Right */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart" className="relative">
              <MdShoppingCart className="text-xl text-[#68a300]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                    setIsMobileMenuOpen(false);
                  }}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <MdPerson className="text-xl" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Logout
                    </button>
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
              type="button"
              className="md:hidden"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsProfileMenuOpen(false);
              }}
            >
              {isMobileMenuOpen ? <MdClose /> : <MdMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 space-y-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <Link
              to="/products"
              className="block text-gray-700 hover:text-herbs-600"
            >
              Products
            </Link>
            <Link
              to="/contact"
              className="block text-gray-700 hover:text-herbs-600"
            >
              Contact
            </Link>
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="block text-gray-700 hover:text-herbs-600"
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
