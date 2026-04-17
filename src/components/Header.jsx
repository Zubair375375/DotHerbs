import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectAuthUser, logoutUser } from "../store/slices/authSlice";
import { selectCartItemCount, resetCart } from "../store/slices/cartSlice";
import {
  MdShoppingCart,
  MdPerson,
  MdMenu,
  MdClose,
  MdSearch,
} from "react-icons/md";

const Header = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const cartItemCount = useSelector(selectCartItemCount);

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(resetCart());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate("/products", { state: { search: q } });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (location.pathname === "/products") {
      navigate("/products", { replace: true, state: { search: "" } });
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);

    if (location.pathname !== "/products") {
      return;
    }

    navigate("/products", { replace: true, state: { search: value } });
  };

  const navLinks = [
    { to: "/products", label: "All Products" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const rightIcons = (
    <div className="flex items-center space-x-3">
      <Link to="/cart" className="relative">
        <MdShoppingCart className="text-xl text-[#68a300]" />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {cartItemCount}
          </span>
        )}
      </Link>

      {user ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setIsMobileMenuOpen(false);
            }}
            className="rounded-full p-1.5 hover:bg-gray-100"
          >
            <MdPerson className="text-xl" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <Link
                to="/profile"
                onClick={() => setIsProfileMenuOpen(false)}
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
        <div className="flex space-x-2 text-sm">
          <Link to="/login" className="text-gray-700 hover:text-[#68a300]">
            Login
          </Link>
          <Link to="/register" className="text-gray-700 hover:text-[#68a300]">
            Sign Up
          </Link>
        </div>
      )}

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
  );

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* ── Top row: logo + search + icons ── fades/shrinks away on scroll */}
        <div
          className={`flex justify-between items-center overflow-hidden transition-all duration-300 ease-in-out ${
            scrolled ? "h-0 opacity-0 pointer-events-none" : "h-16 opacity-100"
          }`}
        >
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/assets/logos/Logo.png"
              alt="Dot-Herbs"
              className="h-6 w-auto"
            />
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center w-[480px]"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-md border border-gray-300 bg-gray-50 py-1.5 pl-4 pr-16 text-sm outline-none focus:border-[#68a300] focus:ring-1 focus:ring-[#68a300]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <MdClose className="text-base" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#68a300]"
                aria-label="Search"
              >
                <MdSearch className="text-lg" />
              </button>
            </div>
          </form>

          {rightIcons}
        </div>

        {/* ── Compact row: logo + nav + icons (only when scrolled) ── */}
        <div
          className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
            scrolled ? "h-12 opacity-100" : "h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex w-1/4 items-center justify-start">
            <Link to="/" className="flex items-center shrink-0">
              <img
                src="/assets/logos/Logo.png"
                alt="Dot-Herbs"
                className="h-5 w-auto"
              />
            </Link>
          </div>

          <nav className="hidden md:flex w-2/4 items-center justify-center space-x-6">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[#68a300]"
                      : "text-gray-700 hover:text-[#68a300]"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex w-1/4 items-center justify-end">
            {rightIcons}
          </div>
        </div>

        {/* ── Nav links row (shown at top, hidden when scrolled) ── */}
        <div
          className={`hidden md:block border-t border-gray-100 overflow-hidden transition-all duration-300 ease-in-out ${
            scrolled ? "h-0 opacity-0" : "h-11 opacity-100"
          }`}
        >
          <nav className="flex justify-center items-center space-x-8 h-11">
            {navLinks.map(({ to, label }) => (
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
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2 border-t border-gray-100 bg-white">
          {navLinks.map(({ to, label }) => (
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
        </div>
      )}
    </header>
  );
};

export default Header;
