import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  login,
  resendVerification,
  verifyTwoFactorLogin,
  selectAuthIsLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectAuthUser,
  selectTwoFactorChallengeToken,
  selectTwoFactorEmail,
} from "../store/slices/authSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from "react-icons/fa";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = useSelector(selectAuthIsLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);
  const twoFactorChallengeToken = useSelector(selectTwoFactorChallengeToken);
  const twoFactorEmail = useSelector(selectTwoFactorEmail);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [emailForResend, setEmailForResend] = useState("");

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      const destination = user?.role === "admin" ? "/admin" : from || "/";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, from, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await dispatch(login(formData)).unwrap();

      if (result.requiresTwoFactor) {
        toast.success("Verification code sent to your email.");
        return;
      }

      toast.success("Login successful!");

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      const destination =
        result.user?.role === "admin" ? "/admin" : from || "/";
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(error || "Login failed");
    }
  };

  const handleVerifyTwoFactor = async (e) => {
    e.preventDefault();

    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error("Please enter your 6-digit verification code");
      return;
    }

    try {
      const result = await dispatch(
        verifyTwoFactorLogin({
          challengeToken: twoFactorChallengeToken,
          code: twoFactorCode,
        }),
      ).unwrap();

      toast.success("Login successful!");
      const destination =
        result.user?.role === "admin" ? "/admin" : from || "/";
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(error || "2FA verification failed");
    }
  };

  const handleResendVerification = async () => {
    if (!emailForResend) {
      toast.error("Enter your email first");
      return;
    }

    try {
      const message = await dispatch(
        resendVerification({ email: emailForResend }),
      ).unwrap();
      toast.success(message || "Verification email sent");
    } catch (error) {
      toast.error(error || "Could not resend verification email");
    }
  };

  const handleSocialLogin = (provider) => {
    // In a real app, this would redirect to OAuth provider
    toast.info(`${provider} login coming soon!`);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-[#68a300] hover:text-[#5f9600]"
            >
              create a new account
            </Link>
          </p>
        </div>

        {!twoFactorChallengeToken ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-[#68a300] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-[#68a300] focus:z-10 sm:text-sm pr-10"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-4 w-4 text-gray-400" />
                ) : (
                  <FaEye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-[#68a300] hover:text-[#5f9600]"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {error?.toLowerCase?.().includes("verify your email") && (
            <div className="space-y-2">
              <input
                type="email"
                value={emailForResend}
                onChange={(e) => setEmailForResend(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-[#68a300] sm:text-sm"
                placeholder="Enter your email to resend verification"
              />
              <button
                type="button"
                onClick={handleResendVerification}
                className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Resend verification email
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#68a300] hover:bg-[#5f9600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5f9600] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("Google")}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <FaGoogle className="text-red-500" />
                <span className="ml-2">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("Facebook")}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <FaFacebook className="text-blue-600" />
                <span className="ml-2">Facebook</span>
              </button>
            </div>
          </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyTwoFactor}>
            <div className="rounded-md shadow-sm space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Enter the 6-digit code sent to {twoFactorEmail || "your email"}
              </p>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-[#68a300] sm:text-sm text-center tracking-[0.35em]"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) =>
                  setTwoFactorCode(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#68a300] hover:bg-[#5f9600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5f9600] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify and sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
