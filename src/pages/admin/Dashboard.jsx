import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all managers
      const managersSnap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'manager'))
      );
      const managersData = managersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setManagers(managersData);

      // Fetch all submissions
      const submissionsSnap = await getDocs(collection(db, 'submissions'));
      const submissionsData = submissionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubmissions(submissionsData);
    } catch (err) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Stats
  const totalSales = submissions.reduce((acc, s) => acc + (s.sales || 0), 0);
  const totalExpenses = submissions.reduce((acc, s) => acc + (s.expenses || 0), 0);
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const clearedCount = submissions.filter((s) => s.status === 'cleared').length;

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
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all stations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Stations", value: managers.length, color: "text-orange-500" },
            { label: "Total Sales", value: `₦${totalSales.toLocaleString()}`, color: "text-green-400" },
            { label: "Total Expenses", value: `₦${totalExpenses.toLocaleString()}`, color: "text-red-400" },
            { label: "Pending Reviews", value: pendingCount, color: "text-yellow-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Manage Managers", desc: "Add, view and manage station managers", path: "/admin/managers", color: "bg-orange-500" },
            { label: "View Reports", desc: "Charts and summaries across all stations", path: "/admin/reports", color: "bg-blue-500" },
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
                  (s) => s.managerId === manager.id
                );
                const pending = managerSubmissions.filter(
                  (s) => s.status === 'pending'
                ).length;

                return (
                  <div
                    key={manager.id}
                    onClick={() => navigate(`/admin/station/${manager.id}`)}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-orange-500 text-sm font-bold">
                          {manager.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{manager.name}</p>
                        <p className="text-gray-500 text-xs">{manager.stationName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
    </div>
  );
}