import { useState, useEffect } from 'react';
import api from '../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Plus, ArrowUpRight, CheckCircle, Clock, Truck, Eye, PackageOpen, X } from 'lucide-react';
import JourneyModal from '../components/JourneyModal';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPOs: 0,
    pendingPOs: 0,
    packedPOs: 0,
    dispatchedPOs: 0
  });
  const [latestOrders, setLatestOrders] = useState([]);
  const [selectedPOJourney, setSelectedPOJourney] = useState(null);
  const [journeyData, setJourneyData] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    salesOverTime: [],
    portalBreakdown: []
  });

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/orders/stats');
      setStats(statsRes.data);
      
      const ordersRes = await api.get('/orders/latest');
      setLatestOrders(ordersRes.data);

      const analyticsRes = await api.get('/orders/analytics');
      setAnalyticsData(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    }
  };

  const fetchPOJourney = async (poNo) => {
    setSelectedPOJourney(poNo);
    setJourneyLoading(true);
    try {
      const { data } = await api.get(`/orders/journey/${poNo}`);
      setJourneyData(data);
    } catch (error) {
      console.error('Error fetching PO journey', error);
      alert('Failed to load order journey details');
    } finally {
      setJourneyLoading(false);
    }
  };

  const handleExport = () => {
    if (!latestOrders || latestOrders.length === 0) {
      alert("No data available to export");
      return;
    }
    
    // Create CSV content with proper escaping
    const headers = ["PO NO", "PO Date", "Party Name", "Quantity", "Amount", "Status"];
    const rows = latestOrders.map(order => [
      `"${order.PO_NO || ''}"`,
      `"${new Date(order.PO_Date).toLocaleDateString()}"`,
      `"${order.Party_Name || ''}"`,
      order.Order_Quantity || 0,
      order.Order_Amount || 0,
      `"${order.Status || ''}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Proper way to handle download with filename
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `DermaTouch_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Overview</h2>
          <p>Summary of current operations and pending tasks.</p>
        </div>
        <div className="flex gap-md">
          {/* Export Report removed as requested */}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="stat-card flex items-center justify-between">
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Total POs</p>
            <div className="flex items-center gap-sm">
              <h2 style={{ fontSize: '1.8rem' }}>{stats.totalPOs}</h2>
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--bg-color)' }}>
            <span style={{ fontSize: '1.2rem' }}>📋</span>
          </div>
        </div>
        
        <div className="stat-card flex items-center justify-between">
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Total Qty</p>
            <div className="flex items-center gap-sm">
              <h2 style={{ fontSize: '1.8rem' }}>
                {stats.totalQty || 0}
              </h2>
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(94, 23, 235, 0.1)' }}>
            <span style={{ fontSize: '1.2rem' }}>📦</span>
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Ready for Dispatch</p>
            <div className="flex items-center gap-sm">
              <h2 style={{ fontSize: '1.8rem' }}>{stats.packedPOs}</h2>
              <span style={{ color: 'var(--info-color)', fontSize: '0.75rem', fontWeight: 600 }}>
                {stats.totalPOs > 0 ? ((stats.packedPOs / stats.totalPOs) * 100).toFixed(0) : 0}% rate
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>In staging area</p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--info-light)' }}>
            <Truck color="var(--info-color)" size={20} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Completed</p>
            <div className="flex items-center gap-sm">
              <h2 style={{ fontSize: '1.8rem' }}>{stats.dispatchedPOs}</h2>
              <span style={{ color: 'var(--success-color)', fontSize: '0.75rem', fontWeight: 600 }}>
                {stats.totalPOs > 0 ? ((stats.dispatchedPOs / stats.totalPOs) * 100).toFixed(0) : 0}% rate
              </span>
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)' }}>
            <CheckCircle color="var(--success-color)" size={20} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
        {/* Sales Trend */}
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Order Volume Trend</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live Updates</span>
          </div>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.salesOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="value" name="QTY" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portal Breakdown */}
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Customer / Portal Allocation</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Item Quantities</span>
          </div>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.portalBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" name="QTY" fill="#5e17eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-md">
            <h3 style={{ fontSize: '1.1rem' }}>Latest 10 Orders</h3>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>Live Feed</span>
          </div>
          <a href="#" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View Full Master Sheet →</a>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>ORDER DATE</th>
                <th>ITEMS</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const grouped = latestOrders.reduce((acc, order) => {
                  if (!acc[order.PO_NO]) {
                    acc[order.PO_NO] = {
                      PO_NO: order.PO_NO,
                      Portal: order.Portal,
                      PO_Date: order.PO_Date,
                      PO_Qty: 0,
                      Actual_Qty: 0,
                      Status: order.Status
                    };
                  }
                  acc[order.PO_NO].PO_Qty += order.PO_Qty;
                  acc[order.PO_NO].Actual_Qty += (order.Actual_Qty !== undefined ? order.Actual_Qty : order.PO_Qty);
                  
                  if (order.Status === 'Pending') acc[order.PO_NO].Status = 'Pending';
                  else if (order.Status === 'Packed' && acc[order.PO_NO].Status === 'Dispatched') acc[order.PO_NO].Status = 'Packed';
                  
                  return acc;
                }, {});
                
                const groupedArray = Object.values(grouped);
                
                return groupedArray.map((order) => (
                  <tr key={order.PO_NO}>
                    <td style={{ fontWeight: 600 }}>#{order.PO_NO}</td>
                    <td>{order.Portal}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(order.PO_Date).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.PO_Qty} Units</div>
                      {order.Actual_Qty < order.PO_Qty && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--danger-color)', fontWeight: 700 }}>
                          ({order.Actual_Qty} Packed)
                        </div>
                      )}
                    </td>
                    <td>
                      {order.Status === 'Pending' && <span className="badge badge-pending"><Clock size={12}/> Processing</span>}
                      {order.Status === 'Packed' && (
                        order.Actual_Qty === 0 ? (
                          <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 700 }}>
                            <X size={12}/> OUT OF STOCK
                          </span>
                        ) : (
                          <span className="badge badge-packed" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info-color)' }}>
                            <PackageOpen size={12}/> Packed
                          </span>
                        )
                      )}
                      {order.Status === 'Dispatched' && <span className="badge badge-dispatched"><Truck size={12}/> Dispatched</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => fetchPOJourney(order.PO_NO)} 
                        className="icon-btn" 
                        style={{ marginLeft: 'auto' }}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
              {latestOrders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Journey Tracking Modal */}
      <JourneyModal 
        selectedPOJourney={selectedPOJourney}
        journeyData={journeyData}
        journeyLoading={journeyLoading}
        onClose={() => { setSelectedPOJourney(null); setJourneyData(null); }}
      />
    </div>
  );
};

export default AdminDashboard;
