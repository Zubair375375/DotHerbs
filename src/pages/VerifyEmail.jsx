import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  return import.meta.env.VITE_API_URL || "/api";
};

const API_URL = getApiUrl();

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(response?.data?.message || "Email verified successfully.");
      } catch (error) {
        setStatus("error");
        setMessage(
          error?.response?.data?.error ||
            "Verification link is invalid or expired.",
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Email Verification</h1>
        <p
          className={`text-sm ${
            status === "success" ? "text-green-700" : "text-red-600"
          }`}
        >
          {message}
        </p>

        {status !== "loading" && (
          <Link
            to="/login"
            className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#68a300] hover:bg-[#5f9600]"
          >
            Go to Sign in
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

