import React, { useState, useEffect } from 'react';
import { Pill, Search, ShoppingCart, History, AlertCircle, ShieldCheck, Truck, AlertTriangle } from 'lucide-react';
import { api, type UserToken } from '../../services/api';

interface PharmacistPortalProps {
  currentUser: UserToken;
}

export const PharmacistPortal: React.FC<PharmacistPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'dispense' | 'history' | 'restock' | 'alerts'>('inventory');
  const [inventory, setInventory] = useState<any[]>([]);
  const [dispensingHistory, setDispensingHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dispensing Form state
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionVerified, setPrescriptionVerified] = useState(false);
  const [selectedBatchItem, setSelectedBatchItem] = useState<any>(null);
  const [dispenseQty, setDispenseQty] = useState<number>(10);

  // Restock Order Form state
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [restockQty, setRestockQty] = useState<number>(100);

  const [dispenseError, setDispenseError] = useState<string | null>(null);
  const [dispenseSuccess, setDispenseSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const pharmId = currentUser.organization_id;
      const invRes = await api.getPharmacyInventory(pharmId);
      setInventory(invRes.inventory || []);

      const histRes = await api.getDispensingHistory(pharmId);
      setDispensingHistory(histRes.history || []);

      const ordRes = await api.getPharmacistOrders();
      setOrders(ordRes.orders || []);

      const altRes = await api.getPharmacistAlerts();
      setAlerts(altRes.alerts || []);

      const distRes = await api.getDistributorsList();
      setDistributors(distRes.distributors || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispenseError(null);
    setDispenseSuccess(null);

    if (!selectedBatchItem) {
      setDispenseError('Please select a medicine batch to dispense.');
      return;
    }

    try {
      const res = await api.dispenseMedicine({
        pharmacy_id: currentUser.organization_id,
        patient_name: patientName,
        doctor_name: doctorName,
        prescription_verified: prescriptionVerified,
        items: [
          {
            batch_id: selectedBatchItem.batch_id,
            medicine_id: selectedBatchItem.medicine_id,
            quantity: Number(dispenseQty),
            unit_price: selectedBatchItem.unit_price || 12.5
          }
        ]
      });

      if (res.success) {
        setDispenseSuccess(`Dispensing Complete! Total: ₹${res.total_amount}. Verified stock decremented from database.`);
        setPatientName('');
        setDoctorName('');
        setPrescriptionVerified(false);
        setSelectedBatchItem(null);
        loadData();
        setActiveTab('history');
      }
    } catch (err: any) {
      setDispenseError(err.message);
    }
  };

  const handleCreateRestockOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createPharmacistOrder({
        distributor_id: selectedDistributor,
        items: [{ medicine_id: selectedMedId, quantity: Number(restockQty) }]
      });
      if (res.success) {
        alert('Restock request submitted to distributor.');
        loadData();
        setActiveTab('restock');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    [item.batch_number, item.medicine_name, item.generic_name, item.brand_name, item.safety_status]
      .some((v) => String(v || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white shadow-sm border border-emerald-200 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold shadow-lg">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Pharmacy Dispensing & Inventory Management</h1>
            <p className="text-xs text-slate-600">Pharmacy: <strong className="text-teal-600">{currentUser.organization_name || 'Licensed Pharmacy'}</strong> ({currentUser.user_id})</p>
          </div>
        </div>

        <button onClick={() => setActiveTab('dispense')} className="px-4 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-xs shadow-md hover:bg-teal-700 transition flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4" />
          <span>New Dispensing Transaction</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold space-x-6 overflow-x-auto">
        <button onClick={() => setActiveTab('inventory')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'inventory' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Pill className="w-4 h-4" />
          <span>Pharmacy & Dispensing Table</span>
        </button>
        <button onClick={() => setActiveTab('dispense')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'dispense' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <ShoppingCart className="w-4 h-4" />
          <span>Patient Dispensing</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'history' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <History className="w-4 h-4" />
          <span>Dispensing & Sales History</span>
        </button>
        <button onClick={() => setActiveTab('restock')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'restock' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Truck className="w-4 h-4" />
          <span>Restock Distributor Orders</span>
        </button>
        <button onClick={() => setActiveTab('alerts')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'alerts' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <AlertTriangle className="w-4 h-4" />
          <span>Safety & Recall Alerts ({alerts.length})</span>
        </button>
      </div>

      {/* TAB 1: PHARMACY INVENTORY & DISPENSING TABLE (Section 4) */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicine name, batch number, generic name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">Real Database Records ({filteredInventory.length})</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                <tr>
                  <th className="p-3.5">Pharmacy ID / Name</th>
                  <th className="p-3.5">Medicine Name</th>
                  <th className="p-3.5">Batch Number</th>
                  <th className="p-3.5 text-right">Quantity Received</th>
                  <th className="p-3.5 text-right">Quantity Dispensed</th>
                  <th className="p-3.5 text-right">Remaining Stock</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Rx Verification</th>
                  <th className="p-3.5">Safety Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                {filteredInventory.map((item) => (
                  <tr key={item.inventory_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{currentUser.organization_name || 'Pharmacy'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{currentUser.organization_id}</div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {item.medicine_name}
                      <div className="text-[11px] text-slate-400 font-normal">{item.brand_name}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-800">{item.batch_number}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{item.quantity_received}</td>
                    <td className="p-3.5 text-right text-teal-700 font-semibold">{item.quantity_dispensed}</td>
                    <td className="p-3.5 text-right font-bold text-slate-800">{item.remaining_stock}</td>
                    <td className="p-3.5 text-slate-600 text-xs">{item.expiry_date}</td>
                    <td className="p-3.5 text-xs">
                      {item.prescription_required ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                          Mandatory Rx
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          OTC
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.safety_status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                        item.safety_status === 'EXPIRED' ? 'bg-red-50 text-red-700 border border-red-300' :
                        item.safety_status === 'RECALLED' ? 'bg-red-100 text-red-800 border border-red-400' :
                        item.safety_status === 'NEAR_EXPIRY' ? 'bg-orange-50 text-orange-700 border border-orange-300' :
                        'bg-amber-50 text-amber-700 border border-amber-300'
                      }`}>
                        {item.safety_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {item.safety_status !== 'EXPIRED' && item.safety_status !== 'RECALLED' && item.remaining_stock > 0 && (
                        <button
                          onClick={() => {
                            setSelectedBatchItem(item);
                            setActiveTab('dispense');
                          }}
                          className="px-3 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold shadow-sm"
                        >
                          Dispense
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

      {/* TAB 2: DISPENSE WORKFLOW */}
      {activeTab === 'dispense' && (
        <form onSubmit={handleDispense} className="p-8 rounded-3xl bg-white shadow-sm border border-slate-200 max-w-xl mx-auto space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-teal-600" />
            <span>Dispense Medicine (ACID Database Transaction)</span>
          </h3>

          {dispenseError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{dispenseError}</span>
            </div>
          )}

          {dispenseSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <span>{dispenseSuccess}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Select Batch *</label>
              <select
                value={selectedBatchItem?.batch_id || ''}
                onChange={(e) => {
                  const b = inventory.find((i) => i.batch_id === e.target.value);
                  setSelectedBatchItem(b || null);
                }}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              >
                <option value="">-- Choose Stock Batch --</option>
                {inventory
                  .filter((i) => i.safety_status !== 'EXPIRED' && i.safety_status !== 'RECALLED' && i.remaining_stock > 0)
                  .map((i) => (
                    <option key={i.batch_id} value={i.batch_id}>
                      {i.batch_number} - {i.medicine_name} (Stock: {i.remaining_stock}) {i.prescription_required ? '[Rx Required]' : '[OTC]'}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Prescribing Doctor (Required for Rx)</label>
              <input
                type="text"
                placeholder="e.g. Dr. Ramesh Kumar, MD"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="rx_verify"
                checked={prescriptionVerified}
                onChange={(e) => setPrescriptionVerified(e.target.checked)}
              />
              <label htmlFor="rx_verify" className="text-slate-800 font-semibold cursor-pointer">
                I verify that a valid medical prescription has been reviewed and approved.
              </label>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Dispensing Quantity *</label>
              <input
                type="number"
                min={1}
                max={selectedBatchItem?.remaining_stock || 100}
                value={dispenseQty}
                onChange={(e) => setDispenseQty(Number(e.target.value))}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-bold text-sm shadow-md hover:bg-teal-700 transition"
            >
              Verify & Complete Dispense Transaction
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: DISPENSING & SALES HISTORY */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
          <table className="w-full text-left">
            <thead className="bg-[#059669] text-white font-semibold text-[14px]">
              <tr>
                <th className="p-3.5">Dispensation ID</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Patient Name</th>
                <th className="p-3.5">Dispensed Pharmacist</th>
                <th className="p-3.5">Items & Batches</th>
                <th className="p-3.5 text-right">Total Amount</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
              {dispensingHistory.map((d) => (
                <tr key={d.dispensing_id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-slate-900 font-bold">{d.dispensing_id}</td>
                  <td className="p-3.5 text-slate-600 text-xs">{new Date(d.dispensing_date).toLocaleString()}</td>
                  <td className="p-3.5 font-bold text-slate-900">{d.patient_name}</td>
                  <td className="p-3.5 text-slate-700">{d.pharmacist_name || currentUser.username}</td>
                  <td className="p-3.5 text-xs">
                    {d.items?.map((it: any, i: number) => (
                      <div key={i}>• {it.medicine_name} ({it.batch_number}): {it.quantity} units</div>
                    ))}
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900">₹{d.total_amount}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: RESTOCK ORDERS */}
      {activeTab === 'restock' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateRestockOrder} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-xl space-y-4 text-xs">
            <h3 className="text-lg font-bold text-slate-900">Place Supply Restock Order to Distributor</h3>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Select Distributor</label>
              <select value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)} required className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <option value="">-- Choose Distributor --</option>
                {distributors.map((d) => (
                  <option key={d.distributor_id} value={d.distributor_id}>{d.company_name} ({d.distributor_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Medicine</label>
              <select value={selectedMedId} onChange={(e) => setSelectedMedId(e.target.value)} required className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <option value="">-- Choose Medicine --</option>
                {inventory.map((i) => (
                  <option key={i.medicine_id} value={i.medicine_id}>{i.medicine_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Requested Restock Quantity</label>
              <input type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))} required className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition">
              Transmit Restock Order
            </button>
          </form>

          <h3 className="text-lg font-bold text-slate-900">Active Restock Orders</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#059669] text-white font-semibold text-[14px]">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Distributor</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
                {orders.map((o) => (
                  <tr key={o.order_id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-slate-900 font-bold">{o.order_id}</td>
                    <td className="p-3.5 font-bold text-slate-800">{o.distributor_name}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">₹{o.total_amount}</td>
                    <td className="p-3.5 text-xs text-slate-500">{o.created_at}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        o.status === 'SHIPPED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
              No active safety or recall alerts.
            </div>
          ) : (
            alerts.map((a) => (
              <div key={a.alert_id} className="p-4 rounded-xl bg-red-50 border border-red-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-red-700 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{a.alert_type} ALERT</span>
                  </div>
                  <div className="text-red-900 mt-1">{a.message}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  {a.severity}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
