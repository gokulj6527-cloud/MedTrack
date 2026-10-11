import React, { useState, useEffect } from 'react';
import {
  Users, ShieldCheck, FileSpreadsheet, Activity, Search, CheckCircle, XCircle, Ban,
  RefreshCw, Eye, Pill, Layers, AlertOctagon, ArrowLeftRight, Settings, MessageSquare, Download, Plus
} from 'lucide-react';
import { api, type UserToken } from '../../services/api';

interface AdminPortalProps {
  currentUser: UserToken;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    'users' | 'medicines' | 'batches' | 'movement' | 'recalls' | 'interactions' | 'reports' | 'audit' | 'complaints' | 'settings'
  >('users');

  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  // Filters & selection
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

  // Medicine Master & Batch tables
  const [medicines, setMedicines] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [stockMovement, setStockMovement] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);

  // Search terms for sub-tables
  const [medSearch, setMedSearch] = useState('');
  const [batchSearch, setBatchSearch] = useState('');

  // Modals & Forms
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role_name: 'MANUFACTURER',
    full_name: '',
    company_name: '',
    license_number: '',
    phone: '',
    address: ''
  });

  const [isAddRecallOpen, setIsAddRecallOpen] = useState(false);
  const [newRecallForm, setNewRecallForm] = useState({
    batch_id: '',
    reason: '',
    severity: 'CLASS_I'
  });

  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [newInteractionForm, setNewInteractionForm] = useState({
    medicine_id_1: '',
    medicine_id_2: '',
    severity: 'HIGH',
    description: '',
    recommendation: ''
  });

  const loadUsers = async () => {
    try {
      const res = await api.getUsers({ role: roleFilter, status: statusFilter, search: searchTerm });
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMetrics = async () => {
    try {
      const res = await api.getMetrics();
      setMetrics(res.metrics);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      setAuditLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMedicines = async () => {
    try {
      const res = await api.getAdminMedicines();
      setMedicines(res.medicines || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBatches = async () => {
    try {
      const res = await api.getAdminBatches();
      setBatches(res.batches || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecalls = async () => {
    try {
      const res = await api.getAdminRecalls();
      setRecalls(res.recalls || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStockMovement = async () => {
    try {
      const res = await api.getStockMovement();
      setStockMovement(res.movement || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInteractions = async () => {
    try {
      const res = await api.getDrugInteractions();
      setInteractions(res.interactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadComplaints = async () => {
    try {
      const res = await api.getAdminComplaints();
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.settings || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAll = () => {
    loadUsers();
    loadMetrics();
    loadAuditLogs();
    loadMedicines();
    loadBatches();
    loadRecalls();
    loadStockMovement();
    loadInteractions();
    loadComplaints();
    loadSettings();
  };

  useEffect(() => {
    refreshAll();
  }, [statusFilter, roleFilter]);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    const reason = newStatus === 'REJECTED' ? prompt('Enter rejection reason:') : undefined;
    try {
      await api.updateUserStatus(userId, newStatus, reason || undefined);
      loadUsers();
      loadMetrics();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewProfile = async (userId: string) => {
    try {
      const res = await api.getUserProfile(userId);
      setSelectedUserProfile(res.profile);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleMedicineStatus = async (medId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to mark medicine as ${nextStatus}? (Historical batch records remain safe)`)) return;
    try {
      await api.updateMedicineStatus(medId, nextStatus);
      loadMedicines();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        username: newUserForm.username,
        email: newUserForm.email,
        password: newUserForm.password,
        role_name: newUserForm.role_name,
        full_name: newUserForm.full_name
      };
      if (['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACIST'].includes(newUserForm.role_name)) {
        payload.organization = {
          company_name: newUserForm.company_name,
          license_number: newUserForm.license_number,
          phone: newUserForm.phone,
          address: newUserForm.address
        };
      }
      await api.createUser(payload);
      alert('User created and approved!');
      setIsAddUserOpen(false);
      setNewUserForm({
        username: '',
        email: '',
        password: '',
        role_name: 'MANUFACTURER',
        full_name: '',
        company_name: '',
        license_number: '',
        phone: '',
        address: ''
      });
      loadUsers();
      loadMetrics();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminRecall(newRecallForm);
      alert('Recall initiated! System alerts dispatched.');
      setIsAddRecallOpen(false);
      setNewRecallForm({ batch_id: '', reason: '', severity: 'CLASS_I' });
      loadRecalls();
      loadBatches();
      loadMetrics();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDrugInteraction(newInteractionForm);
      alert('Drug interaction registered!');
      setIsAddInteractionOpen(false);
      setNewInteractionForm({ medicine_id_1: '', medicine_id_2: '', severity: 'HIGH', description: '', recommendation: '' });
      loadInteractions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await api.updateSetting(key, value);
      loadSettings();
      alert('Setting updated.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const loadReport = async (reportType: 'inventory' | 'dispensing' | 'production' | 'expiry' | 'recalls') => {
    try {
      let res;
      if (reportType === 'inventory') res = await api.getReportInventory();
      else if (reportType === 'dispensing') res = await api.getReportDispensing();
      else if (reportType === 'production') res = await api.getReportProduction();
      else if (reportType === 'expiry') res = await api.getReportExpiry();
      else res = await api.getReportRecalls();
      setReportData(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredMeds = medicines.filter((m) =>
    [m.medicine_name, m.generic_name, m.brand_name, m.composition, m.manufacturer_name, m.category]
      .some((v) => String(v || '').toLowerCase().includes(medSearch.toLowerCase()))
  );

  const filteredBatches = batches.filter((b) =>
    [b.batch_number, b.medicine_name, b.manufacturer_name, b.display_status]
      .some((v) => String(v || '').toLowerCase().includes(batchSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Admin Welcome Header */}
      <div className="p-6 rounded-3xl bg-white shadow-sm border border-emerald-200 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-amber-400 font-bold shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">System Governance & Control Center</h1>
            <p className="text-xs text-slate-600">
              Logged in as Administrator <strong className="text-amber-600">{currentUser.username}</strong> ({currentUser.user_id})
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>

          <a
            href="/api/admin/export/medicines"
            download
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={refreshAll}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title="Refresh All Real-time Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comprehensive Enterprise Metrics Bar */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Total Users</div>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalUsers}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{metrics.activeUsers} active • {metrics.pendingUsers} pending</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Manufacturers</div>
            <div className="text-2xl font-bold text-blue-600">{metrics.totalManufacturers}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{metrics.manufacturerStock} mfr stock</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Distributors</div>
            <div className="text-2xl font-bold text-amber-600">{metrics.totalDistributors}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{metrics.distributorStock} wh stock</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Pharmacists</div>
            <div className="text-2xl font-bold text-teal-600">{metrics.totalPharmacists}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{metrics.pharmacyStock} rx stock</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Medicines / Batches</div>
            <div className="text-2xl font-bold text-emerald-700">{metrics.totalMedicines} / {metrics.totalBatches}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Total stock: {metrics.totalStockAcrossChain || metrics.totalInventoryUnits}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Risk / Recalls</div>
            <div className="text-2xl font-bold text-red-600">{metrics.recalledBatches || metrics.activeRecalls}</div>
            <div className="text-[10px] text-red-500 mt-0.5">{metrics.expiredMedicines} expired • {metrics.temperatureViolations} temp alerts</div>
          </div>
        </div>
      )}

      {/* Portal Tabs Bar */}
      <div className="flex border-b border-slate-200 text-sm font-semibold space-x-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'users' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Approvals</span>
        </button>

        <button
          onClick={() => setActiveTab('medicines')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'medicines' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Medicine Master Table</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'batches' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Production Batches</span>
        </button>

        <button
          onClick={() => setActiveTab('movement')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'movement' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Stock Movement Chain</span>
        </button>

        <button
          onClick={() => setActiveTab('recalls')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'recalls' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Recalls & Quarantines</span>
        </button>

        <button
          onClick={() => setActiveTab('interactions')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'interactions' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Drug Interactions</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'reports' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>SQL System Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'audit' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'complaints' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Consumer Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'settings' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Thresholds & Alerts</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                  className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="BANNED">BANNED</option>
                <option value="REJECTED">REJECTED</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="MANUFACTURER">MANUFACTURER</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                <option value="PHARMACIST">PHARMACIST</option>
                <option value="USER">USER</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[15px]">
                <tr>
                  <th className="p-4">User ID / Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[15px]">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-emerald-50 transition-colors">
                    <td className="p-4 text-[#0f172a]">
                      {u.user_id}
                      <span className="block text-xs font-normal text-slate-500">{u.username}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-xs">
                        {u.role_name}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-900">{u.organization_name}</td>
                    <td className="p-4 text-slate-500">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        u.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                        u.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-300' :
                        u.status === 'BANNED' ? 'bg-red-50 text-red-700 border border-red-300' :
                        'bg-gray-100 text-slate-500 border border-gray-300'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleViewProfile(u.user_id)} title="View Profile" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {u.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleUpdateStatus(u.user_id, 'APPROVED')} title="Approve Registration" className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleUpdateStatus(u.user_id, 'REJECTED')} title="Reject Registration" className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {u.status === 'APPROVED' && u.role_name !== 'ADMIN' && (
                        <button onClick={() => handleUpdateStatus(u.user_id, 'BANNED')} title="Suspend / Deactivate Account" className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-300">
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {u.status === 'BANNED' && (
                        <button onClick={() => handleUpdateStatus(u.user_id, 'APPROVED')} title="Reactivate Account" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MEDICINE MASTER TABLE */}
      {activeTab === 'medicines' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative max-w-md flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by medicine, category, composition, manufacturer..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">Real Database Records ({filteredMeds.length})</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                <tr>
                  <th className="p-3.5">Medicine ID</th>
                  <th className="p-3.5">Medicine Name</th>
                  <th className="p-3.5">Composition</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Manufacturer</th>
                  <th className="p-3.5">Batches</th>
                  <th className="p-3.5">Produced</th>
                  <th className="p-3.5">Distributed</th>
                  <th className="p-3.5">Dispensed</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Min Level</th>
                  <th className="p-3.5">Mfg / Exp Date</th>
                  <th className="p-3.5">Storage Temp</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                {filteredMeds.map((m) => (
                  <tr key={m.medicine_id} className="hover:bg-emerald-50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-900 font-bold">{m.medicine_id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{m.medicine_name}</div>
                      <div className="text-[11px] text-slate-500">{m.brand_name}</div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-600 max-w-[180px] truncate" title={m.composition}>{m.composition || '—'}</td>
                    <td className="p-3.5">{m.category || m.dosage_form}</td>
                    <td className="p-3.5 font-medium text-slate-800">{m.manufacturer_name}</td>
                    <td className="p-3.5 text-center font-bold">{m.total_batches}</td>
                    <td className="p-3.5 text-right">{m.total_quantity_produced}</td>
                    <td className="p-3.5 text-right">{m.total_quantity_distributed}</td>
                    <td className="p-3.5 text-right text-teal-700 font-bold">{m.total_quantity_dispensed}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{m.available_stock}</td>
                    <td className="p-3.5 text-right text-slate-500">{m.min_stock_level}</td>
                    <td className="p-3.5 text-xs text-slate-500">
                      <div>Mfg: {m.manufacturing_date || '—'}</div>
                      <div>Exp: {m.expiry_date || '—'}</div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-600">{m.storage_temperature_min}°C - {m.storage_temperature_max}°C</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        m.medicine_status === 'Active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                        m.medicine_status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border border-amber-300' :
                        m.medicine_status === 'Near Expiry' ? 'bg-orange-50 text-orange-700 border border-orange-300' :
                        m.medicine_status === 'Expired' ? 'bg-red-50 text-red-700 border border-red-300' :
                        m.medicine_status === 'Recalled' ? 'bg-red-100 text-red-800 border border-red-400' :
                        'bg-gray-100 text-slate-600'
                      }`}>
                        {m.medicine_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleMedicineStatus(m.medicine_id, m.catalog_status || 'ACTIVE')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          m.catalog_status === 'DISCONTINUED'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
                        }`}
                      >
                        {m.catalog_status === 'DISCONTINUED' ? 'Reactivate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTION BATCHES */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative max-w-md flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search batch number, medicine, manufacturer..."
                value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => setIsAddRecallOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition flex items-center space-x-1"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Initiate Recall</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                <tr>
                  <th className="p-3.5">Manufacturer ID / Name</th>
                  <th className="p-3.5">Medicine Name</th>
                  <th className="p-3.5">Batch Number</th>
                  <th className="p-3.5">Manufacturing Date</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 text-right">Quantity Produced</th>
                  <th className="p-3.5 text-right">Sent to Distributors</th>
                  <th className="p-3.5 text-right">Remaining Quantity</th>
                  <th className="p-3.5">Batch Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                {filteredBatches.map((b) => (
                  <tr key={b.batch_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-800">
                      <div>{b.manufacturer_name}</div>
                      <div className="text-[11px] text-slate-400">{b.manufacturer_id}</div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{b.medicine_name}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-800">{b.batch_number}</td>
                    <td className="p-3.5 text-slate-600">{b.manufacturing_date}</td>
                    <td className="p-3.5 text-slate-600">{b.expiry_date}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{b.quantity_produced}</td>
                    <td className="p-3.5 text-right text-blue-700 font-semibold">{b.quantity_sent_to_distributors}</td>
                    <td className="p-3.5 text-right font-bold text-slate-800">{b.remaining_quantity}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        b.batch_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                        b.batch_status === 'RECALLED' ? 'bg-red-100 text-red-800 border border-red-400' :
                        b.batch_status === 'DEFECTIVE' ? 'bg-orange-50 text-orange-800 border border-orange-300' :
                        'bg-gray-100 text-slate-600 border border-gray-300'
                      }`}>
                        {b.display_status || b.batch_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK MOVEMENT */}
      {activeTab === 'movement' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Multi-tier Supply Chain Stock Movements</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                <tr>
                  <th className="p-3.5">Shipment / Tracking</th>
                  <th className="p-3.5">Source Tier</th>
                  <th className="p-3.5">Destination Tier</th>
                  <th className="p-3.5">Medicine & Batch</th>
                  <th className="p-3.5 text-right">Units Moved</th>
                  <th className="p-3.5">Shipment Date</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                {stockMovement.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-xs text-slate-800 font-bold">{s.tracking_number}</td>
                    <td className="p-3.5 text-slate-700">{s.sender_type} ({s.sender_id})</td>
                    <td className="p-3.5 text-slate-700">{s.receiver_type} ({s.receiver_id})</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{s.medicine_name}</div>
                      <div className="text-[11px] font-mono text-emerald-800">{s.batch_number}</div>
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{s.quantity}</td>
                    <td className="p-3.5 text-slate-500 text-xs">{s.shipment_date || s.created_at}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        s.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RECALLS */}
      {activeTab === 'recalls' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Safety Recalls & Quarantines</h3>
            <button
              onClick={() => setIsAddRecallOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Recall</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                <tr>
                  <th className="p-3.5">Recall ID</th>
                  <th className="p-3.5">Batch Number</th>
                  <th className="p-3.5">Medicine</th>
                  <th className="p-3.5">Manufacturer</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Defect Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                {recalls.map((r) => (
                  <tr key={r.recall_id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-slate-900 font-bold">{r.recall_id}</td>
                    <td className="p-3.5 font-mono text-red-700 font-bold">{r.batch_number}</td>
                    <td className="p-3.5 font-bold text-slate-800">{r.medicine_name}</td>
                    <td className="p-3.5 text-slate-600">{r.manufacturer_name}</td>
                    <td className="p-3.5 font-bold text-red-700">{r.severity}</td>
                    <td className="p-3.5 text-slate-700 text-xs max-w-xs">{r.reason}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-300">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      {r.status !== 'COMPLETED' && (
                        <button
                          onClick={async () => {
                            await api.updateAdminRecall(r.recall_id, 'COMPLETED');
                            loadRecalls();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold hover:bg-emerald-100"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DRUG INTERACTIONS */}
      {activeTab === 'interactions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Drug-Drug Interaction Reference Registry</h3>
            <button
              onClick={() => setIsAddInteractionOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Drug Pair Interaction</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                <tr>
                  <th className="p-3.5">Medicine 1</th>
                  <th className="p-3.5">Medicine 2</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Clinical Description</th>
                  <th className="p-3.5">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                {interactions.map((it) => (
                  <tr key={it.interaction_id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{it.med1_name}</td>
                    <td className="p-3.5 font-bold text-slate-900">{it.med2_name}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        it.severity === 'CONTRAINDICATED' ? 'bg-red-100 text-red-800 border border-red-300' :
                        it.severity === 'HIGH' ? 'bg-orange-50 text-orange-800 border border-orange-300' :
                        'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {it.severity}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-700">{it.description}</td>
                    <td className="p-3.5 text-xs text-slate-600">{it.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => loadReport('inventory')} className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100">
              Report 1: System Inventory
            </button>
            <button onClick={() => loadReport('dispensing')} className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100">
              Report 2: Monthly Dispensing
            </button>
            <button onClick={() => loadReport('production')} className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100">
              Report 3: Production Yield
            </button>
            <button onClick={() => loadReport('expiry')} className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100">
              Report 4: Expiry Risk
            </button>
            <button onClick={() => loadReport('recalls')} className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100">
              Report 5: Recalls Audit
            </button>
          </div>

          {reportData && (
            <div className="space-y-4 p-6 rounded-2xl bg-white shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{reportData.report}</h3>
              <div className="p-4 rounded-xl bg-slate-900 text-xs text-amber-300 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Executed Database SQL Query</div>
                <code className="block overflow-x-auto whitespace-pre-wrap">{reportData.sql}</code>
              </div>

              <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                    <tr>
                      {reportData.data && reportData.data.length > 0 && Object.keys(reportData.data[0]).map((col) => (
                        <th key={col} className="p-3 border-r border-emerald-600/30">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                    {reportData.data?.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {Object.keys(row).map((col) => (
                          <td key={col} className="p-3 border-r border-slate-100 truncate max-w-xs">{String(row[col] ?? 'NULL')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">System Activity Audit Trail</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {auditLogs.map((log) => (
              <div key={log.log_id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-emerald-800">{log.action}</div>
                  <div className="text-slate-700 text-xs">{log.description}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    User: {log.username} ({log.user_id}) | Entity: {log.entity_type} ({log.entity_id})
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap ml-4">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Consumer Safety & Counterfeit Incident Reports</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Medicine / Batch</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                {complaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-slate-900 font-bold">{c.complaint_id}</td>
                    <td className="p-3.5 text-slate-700">{c.username}</td>
                    <td className="p-3.5 font-bold text-red-700">{c.complaint_type}</td>
                    <td className="p-3.5 text-xs">
                      <div>{c.medicine_name || c.medicine_id || '—'}</div>
                      <div className="font-mono text-slate-400">{c.batch_number}</div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-700 max-w-xs">{c.description}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {c.status !== 'RESOLVED' && (
                        <button
                          onClick={async () => {
                            const note = prompt('Enter resolution notes:');
                            if (!note) return;
                            await api.updateComplaint(c.complaint_id, { status: 'RESOLVED', admin_notes: note });
                            loadComplaints();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 10: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Stock Thresholds & System Safety Settings</h3>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {settings.map((s) => (
              <div key={s.setting_key} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-900 text-xs font-mono">{s.setting_key}</div>
                  <div className="text-[11px] text-slate-500">{s.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    defaultValue={s.setting_value}
                    id={`setting-${s.setting_key}`}
                    className="w-24 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-center focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`setting-${s.setting_key}`) as HTMLInputElement;
                      if (input) handleUpdateSetting(s.setting_key, input.value);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Add User */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Create New System Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role *</label>
                  <select
                    value={newUserForm.role_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="MANUFACTURER">MANUFACTURER</option>
                    <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="USER">USER</option>
                  </select>
                </div>
              </div>

              {newUserForm.role_name !== 'USER' && (
                <>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Organization / Company Name</label>
                    <input
                      type="text"
                      value={newUserForm.company_name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, company_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">License Number</label>
                      <input
                        type="text"
                        value={newUserForm.license_number}
                        onChange={(e) => setNewUserForm({ ...newUserForm, license_number: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                      <input
                        type="text"
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
                >
                  Create & Approve Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Initiate Recall */}
      {isAddRecallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-red-700 flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5" />
              <span>Admin Batch Recall Action</span>
            </h3>
            <form onSubmit={handleCreateRecall} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Batch *</label>
                <select
                  required
                  value={newRecallForm.batch_id}
                  onChange={(e) => setNewRecallForm({ ...newRecallForm, batch_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="">Select a batch...</option>
                  {batches.map((b) => (
                    <option key={b.batch_id} value={b.batch_id}>
                      {b.batch_number} - {b.medicine_name} ({b.manufacturer_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Severity *</label>
                <select
                  value={newRecallForm.severity}
                  onChange={(e) => setNewRecallForm({ ...newRecallForm, severity: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="CLASS_I">Class I (Dangerous / Life-threatening defect)</option>
                  <option value="CLASS_II">Class II (Temporary or reversible adverse reaction)</option>
                  <option value="CLASS_III">Class III (Minor quality / labelling defect)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Recall Reason / Defect Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={newRecallForm.reason}
                  onChange={(e) => setNewRecallForm({ ...newRecallForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddRecallOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                >
                  Confirm Recall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Drug Interaction */}
      {isAddInteractionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Register Drug-Drug Interaction</h3>
            <form onSubmit={handleCreateInteraction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medicine 1 *</label>
                <select
                  required
                  value={newInteractionForm.medicine_id_1}
                  onChange={(e) => setNewInteractionForm({ ...newInteractionForm, medicine_id_1: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="">Select medicine 1...</option>
                  {medicines.map((m) => (
                    <option key={m.medicine_id} value={m.medicine_id}>
                      {m.medicine_name} ({m.brand_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medicine 2 *</label>
                <select
                  required
                  value={newInteractionForm.medicine_id_2}
                  onChange={(e) => setNewInteractionForm({ ...newInteractionForm, medicine_id_2: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="">Select medicine 2...</option>
                  {medicines.map((m) => (
                    <option key={m.medicine_id} value={m.medicine_id}>
                      {m.medicine_name} ({m.brand_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Severity *</label>
                <select
                  value={newInteractionForm.severity}
                  onChange={(e) => setNewInteractionForm({ ...newInteractionForm, severity: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="CONTRAINDICATED">CONTRAINDICATED (Blocks Dispensing)</option>
                  <option value="HIGH">HIGH (Severe Adverse Risk)</option>
                  <option value="MODERATE">MODERATE (Caution Advised)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={newInteractionForm.description}
                  onChange={(e) => setNewInteractionForm({ ...newInteractionForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddInteractionOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
                >
                  Save Interaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Detail Modal */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 text-xs shadow-xl">
            <button
              onClick={() => setSelectedUserProfile(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">Organization & Account Dossier</h3>
            <div className="space-y-2 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div><strong className="text-emerald-800">User ID:</strong> {selectedUserProfile.user_id}</div>
              <div><strong className="text-emerald-800">Role:</strong> {selectedUserProfile.role_name}</div>
              <div><strong className="text-emerald-800">Email:</strong> {selectedUserProfile.email}</div>
              <div><strong className="text-emerald-800">Status:</strong> {selectedUserProfile.status}</div>
              {selectedUserProfile.details && (
                <>
                  <div className="pt-2 border-t border-slate-200 text-slate-900 font-bold">Organization Record</div>
                  <div><strong>Name:</strong> {selectedUserProfile.details.company_name || selectedUserProfile.details.pharmacy_name}</div>
                  <div><strong>License:</strong> {selectedUserProfile.details.license_number}</div>
                  <div><strong>Phone:</strong> {selectedUserProfile.details.phone}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
