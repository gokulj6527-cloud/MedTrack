import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, History, User, AlertCircle, CheckCircle, Send, KeyRound } from 'lucide-react';
import { api, type UserToken } from '../../services/api';

interface UserPortalProps {
  currentUser: UserToken;
}

export const UserPortal: React.FC<UserPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'verify' | 'history' | 'complaints' | 'profile'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Batch verify
  const [verifyBatchNo, setVerifyBatchNo] = useState('');
  const [batchResult, setBatchResult] = useState<any>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // History
  const [dispensingHistory, setDispensingHistory] = useState<any[]>([]);

  // Complaints
  const [complaints, setComplaints] = useState<any[]>([]);
  const [complaintForm, setComplaintForm] = useState({
    medicine_id: '',
    batch_number: '',
    complaint_type: 'SUSPECTED_COUNTERFEIT',
    description: ''
  });
  const [complaintMsg, setComplaintMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile & Password
  const [profileData, setProfileData] = useState<any>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadMedicines = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.getUserMedicines(q);
      setMedicines(res.medicines || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getUserHistory();
      setDispensingHistory(res.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadComplaints = async () => {
    try {
      const res = await api.getUserComplaints();
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await api.getUserProfileData();
      setProfileData(res.profile);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMedicines();
    loadHistory();
    loadComplaints();
    loadProfile();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedicines(searchQuery);
  };

  const handleVerifyBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchResult(null);
    setBatchError(null);
    if (!verifyBatchNo.trim()) return;

    try {
      const res = await api.checkUserBatch(verifyBatchNo.trim());
      setBatchResult(res.batch);
    } catch (err: any) {
      setBatchError(err.message || 'Batch number verification failed.');
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintMsg(null);
    try {
      const res = await api.submitComplaint(complaintForm);
      if (res.success) {
        setComplaintMsg({ type: 'success', text: 'Report submitted successfully to regulatory administrators.' });
        setComplaintForm({ medicine_id: '', batch_number: '', complaint_type: 'SUSPECTED_COUNTERFEIT', description: '' });
        loadComplaints();
      }
    } catch (err: any) {
      setComplaintMsg({ type: 'error', text: err.message });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      const res = await api.changePassword({ current_password: oldPassword, new_password: newPassword });
      if (res.success) {
        setPwdMsg({ type: 'success', text: 'Password successfully updated!' });
        setOldPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white shadow-sm border border-emerald-200 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold shadow-lg">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Patient & Consumer Medicine Portal</h1>
            <p className="text-xs text-slate-600">Logged in as <strong className="text-teal-600">{currentUser.username}</strong> ({currentUser.user_id})</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Authorized Recipient
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-emerald-100 text-sm font-semibold space-x-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('search')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'search' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Medicine Catalog & Safety</span>
        </button>

        <button
          onClick={() => setActiveTab('verify')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'verify' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Batch & Recall Authenticator</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'history' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>My Dispensing History</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'complaints' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Report Counterfeit / Complaint</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'profile' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile & Security</span>
        </button>
      </div>

      {/* TAB 1: MEDICINE SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, composition, brand, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition shadow-sm"
            >
              Search
            </button>
          </form>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading medicines...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {medicines.map((m) => (
                <div key={m.medicine_id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-teal-300 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{m.medicine_name}</h3>
                      <p className="text-xs text-slate-500">{m.brand_name} • {m.generic_name}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      m.prescription_required ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {m.prescription_required ? 'Rx Required' : 'OTC'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div><strong>Composition:</strong> {m.composition || 'Standard formula'}</div>
                    <div><strong>Category:</strong> {m.category}</div>
                    <div><strong>Dosage & Strength:</strong> {m.dosage_form} ({m.strength})</div>
                    <div><strong>Manufacturer:</strong> {m.manufacturer_name}</div>
                    <div><strong>Storage:</strong> {m.storage_temperature_min}°C to {m.storage_temperature_max}°C</div>
                  </div>

                  {m.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{m.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFY BATCH */}
      {activeTab === 'verify' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Check Medicine Batch & Recall Status</h2>
            <p className="text-xs text-slate-500">
              Enter the batch number printed on your medicine strip or packaging to verify its authenticity, expiry date, and check if any safety recall has been issued.
            </p>

            <form onSubmit={handleVerifyBatch} className="flex gap-3">
              <input
                type="text"
                placeholder="e.g. DOL-2024-001 or AUG-2024-002"
                value={verifyBatchNo}
                onChange={(e) => setVerifyBatchNo(e.target.value)}
                required
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 shadow-sm"
              >
                Verify Batch
              </button>
            </form>

            {batchError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{batchError}</span>
              </div>
            )}

            {batchResult && (
              <div className={`p-5 rounded-2xl border ${
                batchResult.is_recalled ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              } space-y-3`}>
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {batchResult.is_recalled ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 font-bold">RECALL / SAFETY WARNING</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Batch Verified Authentic</span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><strong>Batch Number:</strong> {batchResult.batch_number}</div>
                  <div><strong>Medicine:</strong> {batchResult.medicine_name}</div>
                  <div><strong>Manufacturer:</strong> {batchResult.manufacturer_name}</div>
                  <div><strong>Expiry Date:</strong> {batchResult.expiry_date}</div>
                  <div><strong>Status:</strong> {batchResult.batch_status}</div>
                </div>

                <div className="p-3 bg-white/70 rounded-xl text-xs font-medium">
                  {batchResult.safety}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DISPENSING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">My Authorized Dispensing History</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[15px]">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Pharmacy</th>
                  <th className="p-4">Prescription / Doctor</th>
                  <th className="p-4">Medicines Received</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[15px]">
                {dispensingHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 text-sm">
                      No dispensing records found for your account.
                    </td>
                  </tr>
                ) : (
                  dispensingHistory.map((row) => (
                    <tr key={row.dispensing_id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600">{new Date(row.dispensing_date).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold text-slate-900">{row.pharmacy_name}</td>
                      <td className="p-4 text-xs">
                        <div>{row.prescription_number || 'Direct OTC'}</div>
                        <div className="text-slate-400">{row.doctor_name}</div>
                      </td>
                      <td className="p-4 text-xs">
                        {row.items?.map((it: any, i: number) => (
                          <div key={i} className="text-slate-700">
                            • {it.medicine_name} ({it.batch_number}) — {it.quantity} units
                          </div>
                        ))}
                      </td>
                      <td className="p-4 font-bold text-slate-900">₹{row.total_amount}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLAINTS / REPORT COUNTERFEIT */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Submit Safety Report / Counterfeit Alert</h3>
            <p className="text-xs text-slate-500">
              Report suspected counterfeit medicines, damaged packaging, or unexpected adverse reactions directly to system administrators.
            </p>

            {complaintMsg && (
              <div className={`p-4 rounded-xl text-xs flex items-center space-x-2 border ${
                complaintMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {complaintMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{complaintMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medicine Name / ID</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 650 or MED_001"
                  value={complaintForm.medicine_id}
                  onChange={(e) => setComplaintForm({ ...complaintForm, medicine_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Batch Number (From packaging)</label>
                <input
                  type="text"
                  placeholder="e.g. DOL-2024-001"
                  value={complaintForm.batch_number}
                  onChange={(e) => setComplaintForm({ ...complaintForm, batch_number: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Report Category</label>
                <select
                  value={complaintForm.complaint_type}
                  onChange={(e) => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="SUSPECTED_COUNTERFEIT">Suspected Counterfeit / Fake Product</option>
                  <option value="QUALITY_DEFECT">Quality Defect / Packaging Damaged</option>
                  <option value="ADVERSE_REACTION">Adverse Reaction / Health Concern</option>
                  <option value="OVERCHARGING">Overcharging / Pricing Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue or suspected counterfeit details in depth..."
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Report to Authorities</span>
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Your Submitted Reports</h3>
            <div className="space-y-3">
              {complaints.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
                  No reports submitted yet.
                </div>
              ) : (
                complaints.map((c) => (
                  <div key={c.complaint_id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{c.complaint_type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-slate-600">{c.description}</div>
                    {c.admin_notes && (
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-500 text-[11px] border border-slate-100">
                        <strong>Admin Response:</strong> {c.admin_notes}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE & SECURITY */}
      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Account Details</h3>
            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><strong>User ID:</strong> {currentUser.user_id}</div>
              <div><strong>Username:</strong> {currentUser.username}</div>
              <div><strong>Email:</strong> {currentUser.email}</div>
              <div><strong>Full Name:</strong> {profileData?.full_name || profileData?.patient?.full_name || 'Registered Recipient'}</div>
              <div><strong>Phone:</strong> {profileData?.patient?.phone || 'Not provided'}</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <span>Update Password</span>
            </h3>

            {pwdMsg && (
              <div className={`p-4 rounded-xl text-xs flex items-center space-x-2 border ${
                pwdMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {pwdMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition"
              >
                Save New Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
