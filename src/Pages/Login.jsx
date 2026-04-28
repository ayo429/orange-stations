import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import toast from "react-hot-toast";

export default function Login() {
  const { login, userData } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

 const handleLogin = async () => {
  if (!email || !password) {
    toast.error("Please fill in all fields");
    return;
  }
  try {
    setLoading(true);
    const result = await login(email, password); // ✅ save result
    const docRef = doc(db, "users", result.user.uid);
    const docSnap = await getDoc(docRef);
    const role = docSnap.data()?.role;

    toast.success("Welcome back!");

    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/manager");
    }
  } catch (err) {
    toast.error("Invalid email or password");
  }
  setLoading(false);
};

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-orange-500 transition placeholder:text-gray-600";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">OS</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Orange Stations</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-gray-400 text-xs mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className={inputClass}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition mt-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Orange Stations Management System
        </p>
      </div>
    </div>
  );
}
