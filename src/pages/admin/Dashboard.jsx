import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const managersSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "manager")),
      );
      const managersData = managersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setManagers(managersData);

      const submissionsSnap = await getDocs(collection(db, "submissions"));
      const submissionsData = submissionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubmissions(submissionsData);

      // Auto-archive submissions older than 3 months
      await autoArchive(submissionsData);
    } catch (err) {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  // Auto-archive submissions older than 3 months
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
        // Add to archive collection
        await addDoc(collection(db, "archive"), {
          ...sub,
          archivedAt: new Date().toISOString(),
        });
        // Delete from submissions
        await deleteDoc(doc(db, "submissions", sub.id));
      }
      if (toArchive.length > 0) {
        toast.success(`${toArchive.length} old submission(s) archived`);
      }
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  // Clear archived submissions only
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

  // Clear ALL submissions (nuclear option)
  const clearAll = async () => {
    setClearing(true);
    try {
      // Clear submissions
      const submissionsSnap = await getDocs(collection(db, "submissions"));
      for (const document of submissionsSnap.docs) {
        await deleteDoc(doc(db, "submissions", document.id));
      }
      // Clear archive
      const archiveSnap = await getDocs(collection(db, "archive"));
      for (const document of archiveSnap.docs) {
        await deleteDoc(doc(db, "archive", document.id));
      }
      toast.success("All submissions cleared!");
      setSubmissions([]);
    } catch (err) {
      toast.error("Failed to clear submissions");
    }
    setClearing(false);
    setShowClearModal(false);
    fetchData();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const totalSales = submissions.reduce((acc, s) => acc + (s.sales || 0), 0);
  const totalExpenses = submissions.reduce(
    (acc, s) => acc + (s.expenses || 0),
    0,
  );
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">OS</span>
          </div>
          <span className="text-white font-semibold">Orange Stations</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">
            Welcome, {userData?.name}
          </span>
          <button
            onClick={handleLogout}
            className="text-gray-400 text-sm border border-white/10 px-3 py-1.5 rounded-lg hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Overview of all stations
            </p>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/20 transition"
          >
            🗑 Clear History
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Stations",
              value: managers.length,
              color: "text-orange-500",
            },
            {
              label: "Total Sales",
              value: `₦${totalSales.toLocaleString()}`,
              color: "text-green-400",
            },
            {
              label: "Total Expenses",
              value: `₦${totalExpenses.toLocaleString()}`,
              color: "text-red-400",
            },
            {
              label: "Pending Reviews",
              value: pendingCount,
              color: "text-yellow-400",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p
                className={`text-sm md:text-xl font-bold break-words min-w-0 ${stat.color}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Manage Managers",
              desc: "Add, view and manage station managers",
              path: "/admin/managers",
              color: "bg-orange-500",
            },
            {
              label: "View Reports",
              desc: "Charts and summaries across all stations",
              path: "/admin/reports",
              color: "bg-blue-500",
            },
          ].map((card, i) => (
            <div
              key={i}
              onClick={() => navigate(card.path)}
              className="bg-white/5 border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/10 transition"
            >
              <div className={`w-10 h-10 ${card.color} rounded-lg mb-4`} />
              <h3 className="text-white font-semibold mb-1">{card.label}</h3>
              <p className="text-gray-500 text-sm">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Managers List */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">All Stations</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : managers.length === 0 ? (
            <p className="text-gray-500 text-sm">No managers added yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {managers.map((manager) => {
                const managerSubmissions = submissions.filter(
                  (s) => s.managerId === manager.id,
                );
                const pending = managerSubmissions.filter(
                  (s) => s.status === "pending",
                ).length;

                return (
                  <div
                    key={manager.id}
                    onClick={() => navigate(`/admin/station/${manager.id}`)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-orange-500 text-sm font-bold">
                          {manager.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {manager.name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {manager.stationName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {pending > 0 && (
                        <span className="bg-yellow-500/15 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/30">
                          {pending} pending
                        </span>
                      )}
                      <span className="text-gray-600 text-xs">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Clear History Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-2">Clear History</h2>
            <p className="text-gray-500 text-sm mb-6">
              Choose what you want to clear. This action cannot be undone.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {/* Clear archived only */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white text-sm font-semibold mb-1">
                  Clear Archived Submissions
                </h3>
                <p className="text-gray-500 text-xs mb-3">
                  Deletes submissions older than 3 months that have been
                  archived. Current submissions are kept.
                </p>
                <button
                  onClick={clearArchived}
                  disabled={clearing}
                  className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg text-xs font-medium hover:bg-yellow-500/25 transition w-full"
                >
                  {clearing ? "Clearing..." : "🗑 Clear Archive"}
                </button>
              </div>

              {/* Clear everything */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-red-400 text-sm font-semibold mb-1">
                  Clear All Submissions
                </h3>
                <p className="text-gray-500 text-xs mb-3">
                  Permanently deletes ALL submissions including current ones.
                  This cannot be undone!
                </p>
                <button
                  onClick={clearAll}
                  disabled={clearing}
                  className="bg-red-500/15 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-500/25 transition w-full"
                >
                  {clearing ? "Clearing..." : "⚠️ Clear Everything"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowClearModal(false)}
              className="w-full text-gray-500 text-sm hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
