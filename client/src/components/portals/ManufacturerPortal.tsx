import React, { useState, useEffect } from 'react';
import { Factory, Plus, Truck, Package, AlertCircle, Building2, Layers } from 'lucide-react';
import { api, type UserToken } from '../../services/api';

interface ManufacturerPortalProps {
  currentUser: UserToken;
}

export const ManufacturerPortal: React.FC<ManufacturerPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'create_batch' | 'medicines' | 'create_medicine' | 'shipment' | 'shipments_list' | 'profile'>('batches');
  const [batches, setBatches] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Batch Form state
  const [medId, setMedId] = useState('');
  const [batchNum, setBatchNum] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expDate, setExpDate] = useState('');
  const [qty, setQty] = useState<number>(1000);
  const [unitCost, setUnitCost] = useState<number>(5.0);

  // New Medicine Form
  const [newMed, setNewMed] = useState({
    medicine_name: '',
    generic_name: '',
    brand_name: '',
    dosage_form: 'Tablet',
    strength: '500 mg',
    category: 'Analgesic',
    description: '',
    prescription_required: false,
    storage_temperature_min: 15,
    storage_temperature_max: 25,
    unit_price: 15.0,
    min_stock_level: 100
  });

  // Shipment Form
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [shipQty, setShipQty] = useState<number>(500);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    license_number: '',
    email: '',
    phone: '',
    address: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const mfrId = currentUser.organization_id;
      const bRes = await api.getBatches(mfrId);
      setBatches(bRes.batches || []);

      const mRes = await api.getMedicines(mfrId);
      setMedicines(mRes.medicines || []);

      const nRes = await api.getDistributorNetwork();
      setDistributors(nRes.network || []);

      const sRes = await api.getManufacturerDashboard();
      setStats(sRes.stats || null);

      const shpRes = await api.getManufacturerShipments();
      setShipments(shpRes.shipments || []);

      const pRes = await api.getManufacturerProfile();
      if (pRes.profile) {
        setProfile(pRes.profile);
        setProfileForm({
          company_name: pRes.profile.company_name || '',
          license_number: pRes.profile.license_number || '',
          email: pRes.profile.email || '',
          phone: pRes.profile.phone || '',
          address: pRes.profile.address || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.createBatch({
        medicine_id: medId,
        batch_number: batchNum,
        manufacturing_date: mfgDate,
        expiry_date: expDate,
        quantity_produced: Number(qty),
        unit_cost: Number(unitCost)
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Batch ${batchNum} created successfully!` });
        setBatchNum('');
        loadData();
        setActiveTab('batches');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.createMedicine(newMed);
      if (res.success) {
        setMessage({ type: 'success', text: `Medicine ${newMed.medicine_name} created successfully!` });
        loadData();
        setActiveTab('medicines');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.createShipmentToDistributor({
        batch_id: selectedBatch,
        distributor_id: selectedDist,
        quantity: Number(shipQty)
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Shipment dispatched! Tracking: ${res.tracking_number}` });
        loadData();
        setActiveTab('batches');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleRecallBatch = async (batchId: string) => {
    const reason = prompt('Enter defect reason for recall:');
    if (!reason) return;

    try {
      const res = await api.initiateRecall({ batch_id: batchId, reason });
      if (res.success) {
        alert(`Recall initiated for batch. Alerts dispatched to distributors and pharmacists.`);
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReportDefective = async (batchId: string) => {
    const reason = prompt('Enter defect description:');
    if (!reason) return;
    try {
      await api.reportDefectiveBatch(batchId, reason);
      alert('Batch marked defective.');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateManufacturerProfile(profileForm);
      alert('Company profile updated successfully.');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white shadow-sm border border-emerald-200 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shadow-lg">
            <Factory className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Pharmaceutical Manufacturing Console</h1>
            <p className="text-xs text-slate-600">Company: <strong className="text-blue-600">{currentUser.organization_name || profile?.company_name || 'Manufacturer'}</strong> ({currentUser.user_id})</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button onClick={() => setActiveTab('create_batch')} className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs shadow-md hover:bg-emerald-800 transition flex items-center space-x-1.5">
            <Plus className="w-4 h-4" />
            <span>Produce Batch</span>
          </button>
          <button onClick={() => setActiveTab('create_medicine')} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition flex items-center space-x-1.5">
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Dashboard Statistics Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Total Manufacturers</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalManufacturers}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Medicines Produced</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMedicinesProduced}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Batches Created</div>
            <div className="text-2xl font-bold text-emerald-700">{stats.totalBatchesCreated}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Units Produced</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalUnitsProduced}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Units Dispatched</div>
            <div className="text-2xl font-bold text-teal-600">{stats.totalUnitsDispatched}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Defective / Recalled</div>
            <div className="text-2xl font-bold text-red-600">{stats.defectiveOrRecalledBatches}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold space-x-6 overflow-x-auto">
        <button onClick={() => setActiveTab('batches')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'batches' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Package className="w-4 h-4" />
          <span>Manufacturer Production Table</span>
        </button>
        <button onClick={() => setActiveTab('medicines')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'medicines' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Layers className="w-4 h-4" />
          <span>Medicines Catalog</span>
        </button>
        <button onClick={() => setActiveTab('shipment')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'shipment' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Truck className="w-4 h-4" />
          <span>Dispatch Stock to Distributor</span>
        </button>
        <button onClick={() => setActiveTab('shipments_list')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'shipments_list' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Truck className="w-4 h-4" />
          <span>Shipment Records</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Building2 className="w-4 h-4" />
          <span>Company Profile & License</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <AlertCircle className="w-4 h-4" />
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: MANUFACTURER PRODUCTION TABLE */}
      {activeTab === 'batches' && (
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
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
              {batches.map((b) => (
                <tr key={b.batch_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{b.manufacturer_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{b.manufacturer_id}</div>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{b.medicine_name}</td>
                  <td className="p-3.5 font-mono font-bold text-emerald-800">{b.batch_number}</td>
                  <td className="p-3.5 text-slate-600">{b.manufacturing_date}</td>
                  <td className="p-3.5 text-slate-600">{b.expiry_date}</td>
                  <td className="p-3.5 text-right font-bold text-slate-900">{b.quantity_produced}</td>
                  <td className="p-3.5 text-right text-blue-700 font-semibold">{b.quantity_sent_to_distributors}</td>
                  <td className="p-3.5 text-right font-bold text-slate-800">{b.remaining_quantity}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      b.batch_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                      b.batch_status === 'RECALLED' ? 'bg-red-100 text-red-800 border border-red-400' :
                      b.batch_status === 'DEFECTIVE' ? 'bg-orange-50 text-orange-800 border border-orange-300' :
                      'bg-gray-100 text-slate-600'
                    }`}>
                      {b.display_status || b.batch_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                    {b.batch_status === 'ACTIVE' && (
                      <>
                        <button onClick={() => handleReportDefective(b.batch_id)} className="px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-300 text-[11px] font-semibold hover:bg-orange-100">
                          Defective
                        </button>
                        <button onClick={() => handleRecallBatch(b.batch_id)} className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-300 text-[11px] font-semibold hover:bg-red-100">
                          Recall
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: MEDICINES CATALOG */}
      {activeTab === 'medicines' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
          <table className="w-full text-left">
            <thead className="bg-[#059669] text-white font-semibold text-[14px]">
              <tr>
                <th className="p-3.5">Medicine ID</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Brand</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Dosage / Strength</th>
                <th className="p-3.5">Rx Required</th>
                <th className="p-3.5">Unit Price</th>
                <th className="p-3.5">Available Stock</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
              {medicines.map((m) => (
                <tr key={m.medicine_id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-slate-900 font-bold">{m.medicine_id}</td>
                  <td className="p-3.5 font-bold text-slate-900">{m.medicine_name}</td>
                  <td className="p-3.5 text-slate-600">{m.brand_name}</td>
                  <td className="p-3.5">{m.category}</td>
                  <td className="p-3.5 text-slate-600">{m.dosage_form} ({m.strength})</td>
                  <td className="p-3.5 font-semibold text-slate-700">{m.prescription_required ? 'Yes (Rx)' : 'No (OTC)'}</td>
                  <td className="p-3.5 font-bold text-slate-900">₹{m.unit_price}</td>
                  <td className="p-3.5 font-bold text-emerald-800">{m.available_stock}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {m.medicine_status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: CREATE BATCH FORM */}
      {activeTab === 'create_batch' && (
        <form onSubmit={handleCreateBatch} className="p-8 rounded-3xl bg-white shadow-sm border border-slate-200 max-w-2xl mx-auto space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-700" />
            <span>Produce New Production Batch</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Select Medicine *</label>
              <select value={medId} onChange={(e) => setMedId(e.target.value)} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500">
                <option value="">-- Choose Medicine --</option>
                {medicines.map((m) => (
                  <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} ({m.brand_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Batch Number (Must be Unique) *</label>
              <input type="text" placeholder="e.g. DOL-2026-901" value={batchNum} onChange={(e) => setBatchNum(e.target.value)} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Manufacturing Date *</label>
                <input type="date" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Expiry Date (Must be &gt; Mfg Date) *</label>
                <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Quantity Produced *</label>
                <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={1} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Unit Production Cost (₹)</label>
                <input type="number" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} min={0.1} step={0.1} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 transition">
              Save Batch Record to Database
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: CREATE MEDICINE FORM */}
      {activeTab === 'create_medicine' && (
        <form onSubmit={handleCreateMedicine} className="p-8 rounded-3xl bg-white shadow-sm border border-slate-200 max-w-2xl mx-auto space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-700" />
            <span>Register New Medicine in Master Catalog</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Medicine Name *</label>
                <input type="text" required value={newMed.medicine_name} onChange={(e) => setNewMed({ ...newMed, medicine_name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Brand Name *</label>
                <input type="text" required value={newMed.brand_name} onChange={(e) => setNewMed({ ...newMed, brand_name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Generic / Active Molecule *</label>
                <input type="text" required value={newMed.generic_name} onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Category *</label>
                <input type="text" required value={newMed.category} onChange={(e) => setNewMed({ ...newMed, category: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dosage Form</label>
                <input type="text" value={newMed.dosage_form} onChange={(e) => setNewMed({ ...newMed, dosage_form: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Strength</label>
                <input type="text" value={newMed.strength} onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Unit Price (₹)</label>
                <input type="number" step={0.1} value={newMed.unit_price} onChange={(e) => setNewMed({ ...newMed, unit_price: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Storage Temp Min (°C)</label>
                <input type="number" value={newMed.storage_temperature_min} onChange={(e) => setNewMed({ ...newMed, storage_temperature_min: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Storage Temp Max (°C)</label>
                <input type="number" value={newMed.storage_temperature_max} onChange={(e) => setNewMed({ ...newMed, storage_temperature_max: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" id="rx_req" checked={newMed.prescription_required} onChange={(e) => setNewMed({ ...newMed, prescription_required: e.target.checked })} />
              <label htmlFor="rx_req" className="text-slate-700 font-semibold">Prescription (Rx) Required</label>
            </div>

            <button type="submit" className="w-full py-3.5 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 transition">
              Register Medicine in System Master
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: SHIPMENT DISPATCH FORM */}
      {activeTab === 'shipment' && (
        <form onSubmit={handleCreateShipment} className="p-8 rounded-3xl bg-white shadow-sm border border-slate-200 max-w-xl mx-auto space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-emerald-700" />
            <span>Dispatch Shipment to Approved Distributor</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Select Batch *</label>
              <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
                <option value="">-- Choose Active Batch --</option>
                {batches.filter(b => b.batch_status === 'ACTIVE' && b.remaining_quantity > 0).map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>{b.batch_number} - {b.medicine_name} (Remaining: {b.remaining_quantity})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Select Approved Distributor *</label>
              <select value={selectedDist} onChange={(e) => setSelectedDist(e.target.value)} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
                <option value="">-- Choose Distributor --</option>
                {distributors.map((d) => (
                  <option key={d.distributor_id} value={d.distributor_id}>{d.company_name} ({d.distributor_id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Quantity to Ship * (Guaranteed &lt;= Remaining)</label>
              <input type="number" value={shipQty} onChange={(e) => setShipQty(Number(e.target.value))} min={1} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
            </div>

            <button type="submit" className="w-full py-3.5 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 transition">
              Dispatch B2B Shipment
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: SHIPMENTS LIST */}
      {activeTab === 'shipments_list' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
          <table className="w-full text-left">
            <thead className="bg-[#059669] text-white font-semibold text-[14px]">
              <tr>
                <th className="p-3.5">Tracking Number</th>
                <th className="p-3.5">Receiver Distributor</th>
                <th className="p-3.5">Cold Chain</th>
                <th className="p-3.5">Shipped Items</th>
                <th className="p-3.5">Shipment Date</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
              {shipments.map((s) => (
                <tr key={s.shipment_id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-slate-900 font-bold">{s.tracking_number}</td>
                  <td className="p-3.5 font-medium text-slate-800">{s.receiver_name || s.receiver_id}</td>
                  <td className="p-3.5">{s.cold_chain_required ? 'Yes (2-8°C)' : 'No (Ambient)'}</td>
                  <td className="p-3.5 text-xs">
                    {s.items?.map((it: any, i: number) => (
                      <div key={i}>• {it.medicine_name} ({it.batch_number}): {it.quantity} units</div>
                    ))}
                  </td>
                  <td className="p-3.5 text-slate-500 text-xs">{s.shipment_date || s.created_at}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
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
      )}

      {/* TAB 7: PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="p-8 rounded-3xl bg-white shadow-sm border border-slate-200 max-w-xl mx-auto space-y-4 text-xs">
          <h3 className="text-lg font-bold text-slate-900">Manage Company Profile & Manufacturing License</h3>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
            <input type="text" value={profileForm.company_name} onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Manufacturing License Number</label>
            <input type="text" value={profileForm.license_number} onChange={(e) => setProfileForm({ ...profileForm, license_number: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
            <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Phone</label>
            <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Manufacturing Facility Address</label>
            <textarea rows={3} value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition">
            Save Company Details
          </button>
        </form>
      )}
    </div>
  );
};
