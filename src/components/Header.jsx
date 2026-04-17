import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectAuthUser, logoutUser } from "../store/slices/authSlice";
import { selectCartItemCount, resetCart } from "../store/slices/cartSlice";
import {
  MdShoppingCart,
  MdPerson,
  MdMenu,
  MdClose,
  MdSettings,
  MdLogout,
  MdSearch,
} from "react-icons/md";

const Header = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
      setSearchQuery("");
    }
  };
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const cartItemCount = useSelector(selectCartItemCount);

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(resetCart());
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
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

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 mx-8 max-w-sm"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-gray-300 bg-gray-50 py-1.5 pl-4 pr-10 text-sm outline-none focus:border-[#68a300] focus:ring-1 focus:ring-[#68a300]"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#68a300]"
                aria-label="Search"
              >
                <MdSearch className="text-lg" />
              </button>
            </div>
          </form>

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
      </div>

      {/* Sticky Nav Links Row */}
      <div className="hidden md:block bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex justify-center items-center space-x-8 h-11">
            {[
              { to: "/products", label: "All Products" },
              { to: "/about", label: "About Us" },
              { to: "/contact", label: "Contact" },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `pb-0.5 transition-colors font-medium text-sm ${
                    isActive
                      ? "text-[#68a300] border-b-2 border-[#68a300]"
                      : "text-gray-700 hover:text-[#68a300]"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `pb-0.5 transition-colors font-medium text-sm ${
                    isActive
                      ? "text-[#68a300] border-b-2 border-[#68a300]"
                      : "text-gray-700 hover:text-[#68a300]"
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>
      </div>

      <div className="md:hidden">
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 space-y-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            {[
              { to: "/products", label: "Products" },
              { to: "/about", label: "About Us" },
              { to: "/contact", label: "Contact" },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block py-1 font-medium transition-colors ${
                    isActive
                      ? "text-[#68a300]"
                      : "text-gray-700 hover:text-[#68a300]"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block py-1 font-medium transition-colors ${
                    isActive
                      ? "text-[#68a300]"
                      : "text-gray-700 hover:text-[#68a300]"
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
