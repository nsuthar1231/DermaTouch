import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Download, Calendar, RefreshCw,
  TrendingUp, Package, AlertTriangle, Percent, Clock,
  ArrowUpRight, ArrowDownRight, ChevronRight
} from 'lucide-react';

// StatCard Component defined outside to prevent re-renders
const StatCard = ({ title, value, subtext, icon: Icon, color, trend, trendValue, progress }) => (
  <div className="card hover-scale" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}>
    <div className="flex justify-between items-start">
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '4px' }}>{title}</p>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{value}</h2>
      </div>
      <div style={{ backgroundColor: `${color}15`, padding: '10px', borderRadius: '10px' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
    <div className="flex items-center gap-sm">
      {trend && (
        <span className="flex items-center" style={{ fontSize: '0.75rem', fontWeight: 600, color: trend === 'up' ? '#10b981' : '#ef4444' }}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </span>
      )}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtext}</span>
    </div>
    {progress !== undefined && (
      <div style={{ width: '100%', height: '4px', backgroundColor: '#f3f4f6', borderRadius: '2px', marginTop: '4px' }}>
        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: color, borderRadius: '2px', transition: 'width 1s ease-in-out' }} />
      </div>
    )}
  </div>
);

const ReportsPage = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch latest available date from DB on mount
  useEffect(() => {
    const getLatest = async () => {
      try {
        const res = await api.get('/orders/latest-date');
        if (res.data.latestDate) {
          setFromDate(res.data.latestDate);
          setToDate(res.data.latestDate);
          // Auto-switch to single date to show latest data
          setTimeRange('single');
        }
      } catch (err) {
        console.error("Error fetching latest date", err);
      }
    };
    getLatest();
  }, []);

  const fetchData = useCallback(async () => {
    // Basic validation for custom ranges
    if (timeRange === 'custom' && (!fromDate || !toDate)) return;
    if (timeRange === 'single' && !fromDate) return;

    setIsRefreshing(true);
    try {
      let baseUrl = '';
      let params = `?range=${timeRange}`;
      
      if (timeRange === 'custom') {
        params += `&from=${fromDate}&to=${toDate}`;
      } else if (timeRange === 'single') {
        params += `&from=${fromDate}&to=${fromDate}`;
      }

      console.log(`[Reports] Loading: ${baseUrl}/stats${params}`);

      const [statsRes, analyticsRes] = await Promise.all([
        api.get(`/orders/stats${params}`),
        api.get(`/orders/analytics${params}`)
      ]);

      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setError(null);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Loading State
  if (loading && !stats) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" size={40} color="var(--primary-color)" />
        <p style={{ marginTop: '20px', color: '#666' }}>Initializing Reports...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header & Controls */}
      <div className="flex justify-between items-end" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Logistics Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Operational performance and data insights.</p>
        </div>
        
        <div className="flex gap-md" style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6' }}>
          {(timeRange === 'custom' || timeRange === 'single') && (
            <div className="flex items-center gap-sm" style={{ padding: '0 12px', borderRight: '1px solid #f3f4f6' }}>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ border: 'none', fontWeight: 600, outline: 'none' }} />
              {timeRange === 'custom' && (
                <>
                  <span style={{ color: '#9ca3af' }}>to</span>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ border: 'none', fontWeight: 600, outline: 'none' }} />
                </>
              )}
            </div>
          )}
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ border: 'none', fontWeight: 600, outline: 'none', padding: '8px' }}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="month">Current Month</option>
            <option value="single">Single Date</option>
            <option value="custom">Custom Range</option>
            <option value="all">Lifetime History</option>
          </select>
          <button onClick={fetchData} disabled={isRefreshing} className="btn" style={{ minWidth: '120px' }}>
            {isRefreshing ? <RefreshCw className="animate-spin" size={16} /> : 'Run Report'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontWeight: 600 }}>
          Error: {error}
        </div>
      )}

      {stats && stats.totalQty === 0 && (timeRange === 'custom' || timeRange === 'single') && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '12px 20px', marginBottom: '20px', color: '#92400e', fontWeight: 500 }}>
          💡 <strong>No data found for this period.</strong> Try selecting <strong>April 27, 2026</strong> (27-04-2026) to see your PO data.
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid-5" style={{ marginBottom: '32px' }}>
          <StatCard title="Total PO QTY" value={stats.totalQty?.toLocaleString() || 0} subtext="Ordered items" icon={Package} color="#6366f1" />
          <StatCard title="Dispatched" value={stats.fulfilledQty?.toLocaleString() || 0} subtext="Actual volume" icon={TrendingUp} color="#10b981" />
          <StatCard title="Unfulfilled" value={((stats.totalQty || 0) - (stats.fulfilledQty || 0)).toLocaleString()} subtext="Shortage" icon={AlertTriangle} color="#f59e0b" />
          <StatCard title="Fill Rate" value={stats.fulfillmentRate || '0%'} subtext="Efficiency" icon={Percent} color="#8b5cf6" progress={parseFloat(stats.fulfillmentRate) || 0} />
          <StatCard title="Pending PO" value={stats.pendingPOs || 0} subtext="Waitlist" icon={Clock} color="#ef4444" />
        </div>
      )}

      {/* Analytics Tables & Charts */}
      {analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="grid-2" style={{ gap: '32px', gridTemplateColumns: '1.4fr 1fr' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px' }}>Portal Performance</h3>
              <div className="table-container" style={{ border: 'none' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                      <th style={{ padding: '10px' }}>Portal</th>
                      <th style={{ padding: '10px' }}>Ordered</th>
                      <th style={{ padding: '10px' }}>Dispatched</th>
                      <th style={{ padding: '10px' }}>Fill %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.portalDetailed?.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '12px' }}>{p.poQty.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: '#10b981' }}>{p.dispatched.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>{p.fillRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px' }}>Portal Distribution</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.portalDetailed}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="poQty" name="Ordered" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="dispatched" name="Dispatched" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Top SKUs */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Top Performing SKUs</h3>
            <div className="table-container" style={{ border: 'none' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px' }}>Product SKU</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Total Ordered</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Total Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topSKUs?.map((sku, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{sku._id}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{sku.totalOrdered.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>{sku.totalDispatched.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
