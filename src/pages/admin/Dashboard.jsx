import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonCard, SkeletonRow } from "../../components/Skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    const steps = 60;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

function StatCard({ label, value, prefix = "", color }) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const display = typeof value === "number"
    ? `${prefix}${animated.toLocaleString()}`
    : value;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.03, y: -4 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-default"
    >
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-sm md:text-xl font-bold break-words min-w-0 ${color}`}>
        {display}
      </p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managersLoading, setManagersLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Fetch managers once
  const fetchManagers = async () => {
    setManagersLoading(true);
    let managersData = [];
    try {
      const managersSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "manager"))
      );
      managersData = managersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      toast.error("Failed to load managers");
    }
    setManagers(managersData);
    setManagersLoading(false);
  };

  // ✅ Real-time listener for submissions
  useEffect(() => {
    fetchManagers();

    const unsubscribe = onSnapshot(
      collection(db, "submissions"),
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSubmissions(data);
        autoArchive(data);
        setLoading(false);
      },
      (err) => {
        toast.error("Failed to load submissions");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const autoArchive = async (submissionsData) => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const toArchive = submissionsData.filter((s) => {
      const subDate = new Date(s.date);
      return subDate < threeMonthsAgo;
    });

    if (toArchive.length === 0) return;

    try {
      for (const sub of toArchive) {
        await addDoc(collection(db, "archive"), {
          ...sub,
          archivedAt: new Date().toISOString(),
        });
        await deleteDoc(doc(db, "submissions", sub.id));
      }
      toast.success(`${toArchive.length} old submission(s) archived`);
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  const clearArchived = async () => {
    setClearing(true);
    try {
      const archiveSnap = await getDocs(collection(db, "archive"));
      for (const document of archiveSnap.docs) {
        await deleteDoc(doc(db, "archive", document.id));
      }
      toast.success(`${archiveSnap.docs.length} archived submissions cleared!`);
    } catch (err) {
      toast.error("Failed to clear archive");
    }
    setClearing(false);
    setShowClearModal(false);
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      const submissionsSnap = await getDocs(collection(db, "submissions"));
      for (const document of submissionsSnap.docs) {
        await deleteDoc(doc(db, "submissions", document.id));
      }
      const archiveSnap = await getDocs(collection(db, "archive"));
      for (const document of archiveSnap.docs) {
        await deleteDoc(doc(db, "archive", document.id));
      }
      toast.success("All submissions cleared!");
    } catch (err) {
      toast.error("Failed to clear submissions");
    }
    setClearing(false);
    setShowClearModal(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const totalSales = submissions.reduce((acc, s) => acc + (s.sales || 0), 0);
  const totalExpenses = submissions.reduce((acc, s) => acc + (s.expenses || 0), 0);
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const userName = userData ? userData.name : "";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center relative"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center"
          >
            <span className="text-white text-xs font-bold">OS</span>
          </motion.div>
          <span className="text-white font-semibold">Orange Stations</span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <span className="text-gray-400 text-sm">Welcome, {userName}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 text-sm border border-white/10 px-3 py-1.5 rounded-lg hover:text-white transition"
          >
            Logout
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-2xl bg-transparent border-none cursor-pointer"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 flex flex-col gap-2 z-50 md:hidden"
            >
              <p className="text-gray-500 text-xs px-3 py-1">Welcome, {userName}</p>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="text-gray-400 text-sm hover:text-white transition text-left px-3 py-2 rounded-lg hover:bg-white/5 border border-white/10"
              >
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex justify-between items-start mb-8"
        >
          <div>
            <h1 className="text-white text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Overview of all stations</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowClearModal(true)}
            className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/20 transition"
          >
            🗑 Clear History
          </motion.button>
        </motion.div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <StatCard label="Total Stations" value={managers.length} color="text-orange-500" />
            <StatCard label="Total Sales" value={totalSales} prefix="₦" color="text-green-400" />
            <StatCard label="Total Expenses" value={totalExpenses} prefix="₦" color="text-red-400" />
            <StatCard label="Pending Reviews" value={pendingCount} color="text-yellow-400" />
          </motion.div>
        )}

        {/* Navigation Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: "Manage Managers", desc: "Add, view and manage station managers", path: "/admin/managers", color: "bg-orange-500" },
            { label: "View Reports", desc: "Charts and summaries across all stations", path: "/admin/reports", color: "bg-blue-500" },
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(card.path)}
              className="bg-white/5 border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/10 transition"
            >
              <div className={`w-10 h-10 ${card.color} rounded-lg mb-4`} />
              <h3 className="text-white font-semibold mb-1">{card.label}</h3>
              <p className="text-gray-500 text-sm">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Managers List */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h2 className="text-white font-semibold mb-6">All Stations</h2>
          {managersLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : managers.length === 0 ? (
            <p className="text-gray-500 text-sm">No managers added yet</p>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {managers.map((manager) => {
                const managerSubmissions = submissions.filter(
                  (s) => s.managerId === manager.id
                );
                const pending = managerSubmissions.filter(
                  (s) => s.status === "pending"
                ).length;

                return (
                  <motion.div
                    key={manager.id}
                    variants={staggerItem}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/admin/station/${manager.id}`)}
                    className="flex flex-col p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 10 }}
                        className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0"
                      >
                        <span className="text-orange-500 text-sm font-bold">
                          {manager.name ? manager.name.charAt(0).toUpperCase() : "?"}
                        </span>
                      </motion.div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{manager.name}</p>
                        <p className="text-gray-500 text-xs truncate">{manager.stationName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {pending > 0 ? (
                        <motion.span
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="bg-yellow-500/15 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/30"
                        >
                          {pending} pending
                        </motion.span>
                      ) : (
                        <span />
                      )}
                      <span className="text-gray-600 text-xs">→</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Clear History Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-white font-bold text-lg mb-2">Clear History</h2>
              <p className="text-gray-500 text-sm mb-6">
                Choose what you want to clear. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-white text-sm font-semibold mb-1">Clear Archived Submissions</h3>
                  <p className="text-gray-500 text-xs mb-3">
                    Deletes submissions older than 3 months that have been archived. Current submissions are kept.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearArchived}
                    disabled={clearing}
                    className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg text-xs font-medium hover:bg-yellow-500/25 transition w-full"
                  >
                    {clearing ? "Clearing..." : "🗑 Clear Archive"}
                  </motion.button>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <h3 className="text-red-400 text-sm font-semibold mb-1">Clear All Submissions</h3>
                  <p className="text-gray-500 text-xs mb-3">
                    Permanently deletes ALL submissions including current ones. This cannot be undone!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearAll}
                    disabled={clearing}
                    className="bg-red-500/15 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-500/25 transition w-full"
                  >
                    {clearing ? "Clearing..." : "⚠️ Clear Everything"}
                  </motion.button>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowClearModal(false)}
                className="w-full text-gray-500 text-sm hover:text-white transition"
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}