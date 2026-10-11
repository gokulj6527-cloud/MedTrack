import React, { useState, useEffect } from 'react';
import { Truck, Package, Thermometer, CheckCircle, ArrowDownRight, ArrowUpRight, Building2 } from 'lucide-react';
import { api, type UserToken } from '../../services/api';

interface DistributorPortalProps {
  currentUser: UserToken;
}

export const DistributorPortal: React.FC<DistributorPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'incoming' | 'orders' | 'temperature' | 'profile'>('inventory');
  const [inventory, setInventory] = useState<any[]>([]);
  const [incomingShipments, setIncomingShipments] = useState<any[]>([]);
  const [pharmacyOrders, setPharmacyOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Temperature form
  const [selectedShipment, setSelectedShipment] = useState('');
  const [tempReading, setTempReading] = useState<number>(5.0);
  const [tempMessage, setTempMessage] = useState<string | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    warehouse_address: '',
    email: '',
    phone: ''
  });

  const loadData = async () => {
    try {
      const distId = currentUser.organization_id;
      const invRes = await api.getDistributorInventory(distId);
      setInventory(invRes.inventory || []);

      const incRes = await api.getIncomingShipments(distId);
      setIncomingShipments(incRes.shipments || []);

      const ordRes = await api.getPharmacyOrders(distId);
      setPharmacyOrders(ordRes.orders || []);

      const sRes = await api.getDistributorDashboard();
      setStats(sRes.stats || null);

      const pRes = await api.getDistributorProfile();
      if (pRes.profile) {
        setProfile(pRes.profile);
        setProfileForm({
          company_name: pRes.profile.company_name || '',
          warehouse_address: pRes.profile.warehouse_address || '',
          email: pRes.profile.email || '',
          phone: pRes.profile.phone || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReceiveShipment = async (shipmentId: string) => {
    try {
      const res = await api.receiveShipment(shipmentId);
      if (res.success) {
        alert('Shipment accepted! Batch numbers verified & warehouse stock incremented.');
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleShipOrder = async (orderId: string) => {
    try {
      const res = await api.shipPharmacyOrder(orderId);
      if (res.success) {
        alert('Pharmacy order approved & shipped! Warehouse inventory decremented atomically.');
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordTemp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTempMessage(null);
    try {
      const res = await api.recordTemperature({
        shipment_id: selectedShipment,
        recorded_temperature: Number(tempReading),
        acceptable_min: 2.0,
        acceptable_max: 8.0
      });

      setTempMessage(res.message);
      loadData();
    } catch (err: any) {
      setTempMessage(err.message);
    }
  };

  const handleQuarantine = async (inventoryId: string) => {
    const reason = prompt('Enter quarantine or damage reason:');
    if (!reason) return;
    try {
      await api.quarantineDistributorBatch(inventoryId, reason);
      alert('Batch quarantined. It cannot be supplied to pharmacies.');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStockAdjustment = async (inventoryId: string) => {
    const qty = prompt('Enter reduction quantity (damaged/missing):');
    if (!qty || isNaN(Number(qty))) return;
    const reason = prompt('Enter reason (e.g. Broken in transit / Spoilage):');
    if (!reason) return;

    try {
      await api.adjustDistributorStock(inventoryId, { quantity: Number(qty), reason });
      alert('Stock adjustment recorded.');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateDistributorProfile(profileForm);
      alert('Warehouse details updated successfully.');
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
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shadow-lg">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Distributor Logistics & Warehouse Hub</h1>
            <p className="text-xs text-slate-600">Distributor: <strong className="text-amber-600">{currentUser.organization_name || profile?.company_name || 'Distributor'}</strong> ({currentUser.user_id})</p>
          </div>
        </div>
      </div>

      {/* Dashboard Statistics Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Total Distributors</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalDistributors}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Units Received</div>
            <div className="text-2xl font-bold text-emerald-700">{stats.totalUnitsReceived}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Units Supplied</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUnitsSupplied}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Warehouse Stock</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalWarehouseStock}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Pending Shipments</div>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingShipments}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Temp Violations</div>
            <div className="text-2xl font-bold text-red-600">{stats.temperatureViolations}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold space-x-6 overflow-x-auto">
        <button onClick={() => setActiveTab('inventory')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'inventory' ? 'border-amber-600 text-amber-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Package className="w-4 h-4" />
          <span>Distributor Inventory & Supply Table</span>
        </button>
        <button onClick={() => setActiveTab('incoming')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'incoming' ? 'border-amber-600 text-amber-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <ArrowDownRight className="w-4 h-4 text-emerald-800" />
          <span>Incoming Deliveries</span>
        </button>
        <button onClick={() => setActiveTab('orders')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-amber-600 text-amber-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <ArrowUpRight className="w-4 h-4 text-blue-600" />
          <span>Pharmacy Supply Orders</span>
        </button>
        <button onClick={() => setActiveTab('temperature')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'temperature' ? 'border-amber-600 text-amber-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Thermometer className="w-4 h-4 text-red-600" />
          <span>Temperature Readings</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`py-3 px-2 border-b-2 flex items-center space-x-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-amber-600 text-amber-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <Building2 className="w-4 h-4" />
          <span>Warehouse Details</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY & SUPPLY TABLE (Section 3) */}
      {activeTab === 'inventory' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
          <table className="w-full text-left">
            <thead className="bg-[#059669] text-white font-semibold text-[14px]">
              <tr>
                <th className="p-3.5">Distributor ID / Name</th>
                <th className="p-3.5">Warehouse Location</th>
                <th className="p-3.5">Medicine Name</th>
                <th className="p-3.5">Batch Number</th>
                <th className="p-3.5 text-right">Quantity Received</th>
                <th className="p-3.5 text-right">Quantity Supplied</th>
                <th className="p-3.5 text-right">Available Stock</th>
                <th className="p-3.5">Received Date</th>
                <th className="p-3.5">Last Supply Date</th>
                <th className="p-3.5">Temp Status</th>
                <th className="p-3.5">Inventory Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[13px]">
              {inventory.map((item) => (
                <tr key={item.inventory_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{currentUser.organization_name || 'Distributor'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{currentUser.organization_id || 'DIST_ID'}</div>
                  </td>
                  <td className="p-3.5 text-xs text-slate-600 max-w-xs">{profile?.warehouse_address || 'Central Warehouse'}</td>
                  <td className="p-3.5 font-bold text-slate-900">
                    {item.medicine_name}
                    <div className="text-[11px] text-slate-400 font-normal">Mfr: {item.manufacturer_name}</div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-emerald-800">{item.batch_number}</td>
                  <td className="p-3.5 text-right font-bold text-slate-900">{item.quantity_received}</td>
                  <td className="p-3.5 text-right text-blue-700 font-semibold">{item.quantity_supplied}</td>
                  <td className="p-3.5 text-right font-bold text-slate-800">{item.available_warehouse_stock}</td>
                  <td className="p-3.5 text-xs text-slate-500">{item.received_date ? String(item.received_date).slice(0, 10) : '—'}</td>
                  <td className="p-3.5 text-xs text-slate-500">{item.last_supply_date ? String(item.last_supply_date).slice(0, 10) : '—'}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.temperature_status === 'NORMAL' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                    }`}>
                      {item.temperature_status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.inventory_status === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                      item.inventory_status === 'LOW_STOCK' ? 'bg-amber-50 text-amber-700 border border-amber-300' :
                      item.inventory_status === 'RECALLED' ? 'bg-red-100 text-red-800 border border-red-400' :
                      item.inventory_status === 'EXPIRED' ? 'bg-red-50 text-red-700 border border-red-300' :
                      'bg-orange-50 text-orange-700 border border-orange-300'
                    }`}>
                      {item.inventory_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => handleStockAdjustment(item.inventory_id)}
                      className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-semibold"
                    >
                      Damage
                    </button>
                    {item.batch_status !== 'QUARANTINED' && (
                      <button
                        onClick={() => handleQuarantine(item.inventory_id)}
                        className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 text-[11px] font-semibold"
                      >
                        Quarantine
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: INCOMING DELIVERIES */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incomingShipments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
              No incoming shipments from manufacturers.
            </div>
          ) : (
            incomingShipments.map((shp) => (
              <div key={shp.shipment_id} className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{shp.tracking_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      shp.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {shp.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">From Manufacturer: <strong>{shp.sender_name}</strong></div>
                  <div className="text-xs text-slate-500">
                    Items: {shp.items?.map((it: any) => `${it.medicine_name} (${it.batch_number}): ${it.quantity} units`).join(', ')}
                  </div>
                </div>

                {shp.status !== 'DELIVERED' && (
                  <button onClick={() => handleReceiveShipment(shp.shipment_id)} className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 flex items-center space-x-1 shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept & Verify Delivery</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PHARMACY SUPPLY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {pharmacyOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
              No pending pharmacy orders.
            </div>
          ) : (
            pharmacyOrders.map((ord) => (
              <div key={ord.order_id} className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{ord.order_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ord.status === 'SHIPPED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">Pharmacy: <strong>{ord.pharmacy_name}</strong> | Total: ₹{ord.total_amount}</div>
                  <div className="text-xs text-slate-500">
                    {ord.items?.map((it: any) => `${it.medicine_name} (Batch: ${it.batch_number || 'Unassigned'}): ${it.quantity} units`).join(', ')}
                  </div>
                </div>

                {ord.status !== 'SHIPPED' && (
                  <button onClick={() => handleShipOrder(ord.order_id)} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 flex items-center space-x-1 shadow-sm">
                    <Truck className="w-4 h-4" />
                    <span>Approve & Dispatch Supply</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: COLD CHAIN TEMPERATURE */}
      {activeTab === 'temperature' && (
        <form onSubmit={handleRecordTemp} className="p-8 rounded-3xl bg-white shadow-sm border border-slate-200 max-w-xl mx-auto space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-red-600" />
            <span>Record Cold-Chain IoT Temperature Sensor Reading</span>
          </h3>

          {tempMessage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              {tempMessage}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Select Active Shipment</label>
              <select value={selectedShipment} onChange={(e) => setSelectedShipment(e.target.value)} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
                <option value="">-- Choose Shipment --</option>
                {incomingShipments.map((s) => (
                  <option key={s.shipment_id} value={s.shipment_id}>{s.tracking_number} (From {s.sender_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Recorded Temperature (°C)</label>
              <input type="number" step="0.1" value={tempReading} onChange={(e) => setTempReading(Number(e.target.value))} required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
              <div className="text-[11px] text-slate-400 mt-1">Acceptable threshold: 2.0°C to 8.0°C. Outside threshold triggers automatic VIOLATION alert.</div>
            </div>

            <button type="submit" className="w-full py-3.5 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 transition">
              Log Temperature Sensor Event
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: WAREHOUSE DETAILS */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="p-8 rounded-3xl bg-white shadow-sm border border-slate-200 max-w-xl mx-auto space-y-4 text-xs">
          <h3 className="text-lg font-bold text-slate-900">Manage Warehouse Details & Logistics Profile</h3>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
            <input type="text" value={profileForm.company_name} onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Warehouse Address / Location</label>
            <textarea rows={3} value={profileForm.warehouse_address} onChange={(e) => setProfileForm({ ...profileForm, warehouse_address: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Email</label>
            <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Phone</label>
            <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition">
            Save Warehouse Details
          </button>
        </form>
      )}
    </div>
  );
};
