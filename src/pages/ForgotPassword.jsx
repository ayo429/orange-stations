import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-orange-500 transition placeholder:text-gray-600";

  const handleReset = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        toast.error("No account found with that email");
      } else {
        toast.error("Failed to send reset email");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-8">
        {sent ? (
          <div className="text-center">
            <p className="text-white font-semibold mb-2">Check your inbox</p>
            <p className="text-gray-500 text-sm mb-6">
              A reset link has been sent to <span className="text-orange-400">{email}</span>
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-gray-400 text-sm hover:text-white transition"
            >
              ← Back to login
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-white text-xl font-bold mb-1">Forgot password</h1>
            <p className="text-gray-500 text-sm mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            <div className="mb-4">
              <label className="block text-gray-400 text-xs mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                className={inputClass}
              />
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full text-center text-gray-500 text-sm mt-4 hover:text-white transition"
            >
              ← Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}