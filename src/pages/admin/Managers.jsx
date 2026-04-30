import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db, auth } from "../../lib/firebase";
import { secondaryAuth } from "../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";

export default function AdminManagers() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    stationName: "",
    phone: "",
  });

  useEffect(() => {
    fetchManagers();
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchManagers = async () => {
    setLoading(true);
    const snap = await getDocs(
      query(collection(db, "users"), where("role", "==", "manager")),
    );
    setManagers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const handleAddManager = async () => {
    if (!form.name || !form.email || !form.password || !form.stationName) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      // ✅ Use secondaryAuth instead of auth
      const result = await createUserWithEmailAndPassword(
        secondaryAuth,
        form.email,
        form.password,
      );

      await setDoc(doc(db, "users", result.user.uid), {
        name: form.name,
        email: form.email,
        stationName: form.stationName,
        phone: form.phone,
        role: "manager",
        createdAt: new Date(),
      });

      // ✅ Sign out from secondary app so it doesn't stay logged in
      await secondaryAuth.signOut();

      toast.success(`${form.name} added successfully!`);
      setForm({
        name: "",
        email: "",
        password: "",
        stationName: "",
        phone: "",
      });
      setShowForm(false);
      fetchManagers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manager?"))
      return;
    await deleteDoc(doc(db, "users", id));
    toast.success("Manager deleted");
    fetchManagers();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-orange-500 transition placeholder:text-gray-600";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">OS</span>
          </div>
          <span className="text-white font-semibold">Orange Stations</span>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate("/admin")}
            className="text-gray-400 text-sm hover:text-white transition"
          >
            ← Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 text-sm border border-white/10 px-3 py-1.5 rounded-lg hover:text-white transition"
          >
            Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-2xl bg-transparent border-none cursor-pointer"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="absolute top-full right-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 flex flex-col gap-2 z-50 md:hidden">
            <button
              onClick={() => {
                navigate("/admin");
                setMenuOpen(false);
              }}
              className="text-gray-400 text-sm hover:text-white transition text-left px-3 py-2 rounded-lg hover:bg-white/5"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="text-gray-400 text-sm hover:text-white transition text-left px-3 py-2 rounded-lg hover:bg-white/5 border border-white/10"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">Managers</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage all station managers
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
          >
            {showForm ? "Cancel" : "+ Add Manager"}
          </button>
        </div>

        {/* Add Manager Form */}
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <h2 className="text-white font-semibold mb-6">Add New Manager</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="manager@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">
                  Station Name
                </label>
                <input
                  type="text"
                  placeholder="Station A - Lagos"
                  value={form.stationName}
                  onChange={(e) =>
                    setForm({ ...form, stationName: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              onClick={handleAddManager}
              className="mt-6 bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
            >
              Create Manager Account
            </button>
          </div>
        )}

        {/* Managers List */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">
            All Managers ({managers.length})
          </h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : managers.length === 0 ? (
            <p className="text-gray-500 text-sm">No managers added yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {managers.map((manager) => (
                <div
                  key={manager.id}
                  className="flex flex-col p-4 bg-white/5 rounded-xl gap-3"
                >
                  {/* Manager Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-orange-500 text-sm font-bold">
                        {manager.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {manager.name}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {manager.stationName}
                      </p>
                      <p className="text-gray-600 text-xs truncate">
                        {manager.email}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => navigate(`/admin/station/${manager.id}`)}
                      className="flex-1 bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-lg px-3 py-2 text-xs hover:bg-orange-500/25 transition text-center"
                    >
                      View Station
                    </button>
                    <button
                      onClick={() => handleDelete(manager.id)}
                      className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-3 py-2 text-xs hover:bg-red-500/20 transition text-center"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
