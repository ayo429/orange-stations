import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ManagerHistory() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'submissions'), where('managerId', '==', user.uid))
      );
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSubmissions(data);
    } catch (err) {
      toast.error('Failed to load history');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filtered = filter === 'all'
    ? submissions
    : submissions.filter((s) => s.status === filter);

  const totalSales = filtered.reduce((acc, s) => acc + (s.sales || 0), 0);
  const totalExpenses = filtered.reduce((acc, s) => acc + (s.expenses || 0), 0);

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
          <button
            onClick={() => navigate('/manager')}
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
      </nav>

      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">Submission History</h1>
            <p className="text-gray-500 text-sm mt-1">{userData?.stationName}</p>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {['all', 'pending', 'cleared'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition capitalize ${
                  filter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Cleared'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Submissions", value: filtered.length, color: "text-white" },
            { label: "Total Sales", value: `₦${totalSales.toLocaleString()}`, color: "text-green-400" },
            { label: "Total Expenses", value: `₦${totalExpenses.toLocaleString()}`, color: "text-red-400" },
            { label: "Net", value: `₦${(totalSales - totalExpenses).toLocaleString()}`, color: totalSales - totalExpenses >= 0 ? "text-green-400" : "text-red-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Submissions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">
            {filter === 'all' ? 'All Submissions' : filter === 'pending' ? 'Pending Submissions' : 'Cleared Submissions'} ({filtered.length})
          </h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-sm">No submissions found</p>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-white font-semibold">{sub.date}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Submitted {sub.submittedAt
                          ? new Date(sub.submittedAt).toLocaleString()
                          : 'N/A'}
                      </p>
                      {sub.description && (
                        <p className="text-gray-500 text-xs mt-1">{sub.description}</p>
                      )}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border ${
                      sub.status === 'cleared'
                        ? 'bg-green-500/15 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {sub.status === 'cleared' ? '✓ Cleared' : '⏳ Pending'}
                    </span>
                  </div>

                  {/* Product Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Gas</p>
                      <p className="text-blue-400 font-bold text-sm">₦{sub.gas?.toLocaleString() || '0'}</p>
                      <p className="text-gray-600 text-xs mt-1">{sub.gasQty?.toLocaleString() || '0'} kg/L</p>
                    </div>
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Petroleum</p>
                      <p className="text-yellow-400 font-bold text-sm">₦{sub.petroleum?.toLocaleString() || '0'}</p>
                      <p className="text-gray-600 text-xs mt-1">{sub.petroleumQty?.toLocaleString() || '0'} L</p>
                    </div>
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Diesel</p>
                      <p className="text-purple-400 font-bold text-sm">₦{sub.diesel?.toLocaleString() || '0'}</p>
                      <p className="text-gray-600 text-xs mt-1">{sub.dieselQty?.toLocaleString() || '0'} L</p>
                    </div>
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Kerosene</p>
                      <p className="text-orange-400 font-bold text-sm">₦{sub.kerosene?.toLocaleString() || '0'}</p>
                      <p className="text-gray-600 text-xs mt-1">{sub.keroseneQty?.toLocaleString() || '0'} L</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 col-span-2">
                      <p className="text-gray-500 text-xs mb-1">Total Sales</p>
                      <p className="text-white font-bold text-sm">₦{sub.sales?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 col-span-2">
                      <p className="text-gray-500 text-xs mb-1">Expenses</p>
                      <p className="text-red-400 font-bold text-sm">₦{sub.expenses?.toLocaleString() || '0'}</p>
                    </div>
                  </div>

                  {/* Cleared info */}
                  {sub.status === 'cleared' && sub.clearedAt && (
                    <div className="mb-4">
                      <p className="text-gray-500 text-xs">
                        Cleared on {new Date(sub.clearedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Photos */}
                  {sub.photos?.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs mb-2">
                        Photos ({sub.photos.length})
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {sub.photos.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`photo ${i + 1}`}
                            onClick={() => setSelectedPhoto(url)}
                            className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}