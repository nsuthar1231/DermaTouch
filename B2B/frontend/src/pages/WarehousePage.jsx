import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PackageOpen, X, CheckCircle, Clock } from 'lucide-react';

const WarehousePage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    Packing_Date: '',
    Dispatched_Qty: '',
    Unfulfilled_Qty: '',
    Reason: '',
    Remarks: '',
    Unfulfilled_SKU: ''
  });
  const [loading, setLoading] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkMessage, setBulkMessage] = useState('');

  const fetchPendingOrders = async () => {
    try {
      const { data } = await api.get('/orders/pending-orders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching pending orders', error);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const openModal = (order) => {
    setSelectedOrder(order);
    setFormData({
      Packing_Date: new Date().toISOString().split('T')[0],
      Dispatched_Qty: order.PO_Qty,
      Unfulfilled_Qty: 0,
      Reason: '',
      Remarks: '',
      Unfulfilled_SKU: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQtyChange = (e) => {
    const dQty = parseInt(e.target.value) || 0;
    const poQty = selectedOrder?.PO_Qty || 0;
    setFormData({
      ...formData,
      Dispatched_Qty: dQty,
      Unfulfilled_Qty: Math.max(0, poQty - dQty)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/orders/update-packing', {
        PO_NO: selectedOrder.PO_NO,
        ...formData
      });
      setSelectedOrder(null);
      fetchPendingOrders();
    } catch (error) {
      console.error('Error updating packing details', error);
      alert(error.response?.data?.message || 'Error updating packing details');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) return setBulkMessage('Please select a file first.');
    setLoading(true);
    setBulkMessage('');
    
    const submitData = new FormData();
    submitData.append('file', bulkFile);

    try {
      const { data } = await api.post('/orders/bulk-warehouse', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBulkMessage(data.message);
      fetchPendingOrders();
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkFile(null);
        setBulkMessage('');
      }, 2000);
    } catch (error) {
      setBulkMessage(error.response?.data?.message || 'Error during bulk upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Pending Processing</h2>
          <p>Review and pack pending purchase orders.</p>
        </div>
        <div className="flex gap-md">
          <button className="btn btn-secondary flex items-center gap-sm" onClick={() => setIsBulkModalOpen(true)}>
            Bulk Upload
          </button>
          <button className="btn btn-secondary flex items-center gap-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> Filter
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>PO NO</th>
                <th>PORTAL</th>
                <th>SKU</th>
                <th>PO QTY</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
               {(() => {
                 const grouped = orders.reduce((acc, order) => {
                   if (!acc[order.PO_NO]) {
                     acc[order.PO_NO] = {
                       PO_NO: order.PO_NO,
                       Portal: order.Portal,
                       SKUs: [],
                       PO_Qty: 0
                     };
                   }
                   acc[order.PO_NO].SKUs.push(order.SKU);
                   acc[order.PO_NO].PO_Qty += order.PO_Qty;
                   return acc;
                 }, {});
                 
                 const groupedArray = Object.values(grouped);
                 
                 if (groupedArray.length === 0) {
                   return (
                     <tr>
                       <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>No pending orders found</td>
                     </tr>
                   );
                 }
                 
                 return groupedArray.map((order) => (
                   <tr key={order.PO_NO}>
                     <td style={{ fontWeight: 600 }}>{order.PO_NO}</td>
                     <td>{order.Portal}</td>
                     <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.SKUs.join(', ')}>
                       {order.SKUs.join(', ')}
                     </td>
                     <td>{order.PO_Qty}</td>
                     <td><span className="badge badge-pending"><Clock size={12}/> Processing</span></td>
                     <td style={{ textAlign: 'right' }}>
                       <button 
                         style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }} 
                         onClick={() => openModal(order)}
                       >
                         Pack Now
                       </button>
                     </td>
                   </tr>
                 ));
               })()}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', padding: '32px', backgroundColor: '#ffffff', position: 'relative' }}>
            <button 
              onClick={() => setSelectedOrder(null)} 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.35rem', color: '#111827', marginBottom: '8px', fontWeight: 600 }}>Process Packing</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                PO NO: <strong style={{ color: '#111827' }}>{selectedOrder.PO_NO}</strong> · SKU(s): <strong style={{ color: '#111827' }}>{selectedOrder.SKUs ? selectedOrder.SKUs.join(', ') : selectedOrder.SKU}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>PO Packing Date</label>
                  <input type="date" name="Packing_Date" value={formData.Packing_Date} onChange={handleChange} required style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Target PO Qty</label>
                  <input type="number" value={selectedOrder.PO_Qty} disabled style={{ padding: '12px 14px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#6b7280', fontWeight: 600 }} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Dispatched Qty <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="number" name="Dispatched_Qty" value={formData.Dispatched_Qty} onChange={handleQtyChange} required min="0" max={selectedOrder.PO_Qty} style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontWeight: 600 }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: formData.Unfulfilled_Qty > 0 ? 'var(--danger-color)' : '#111827', fontWeight: 700, marginBottom: '8px' }}>Unfulfilled Qty</label>
                  <input
                    type="number"
                    value={formData.Unfulfilled_Qty}
                    disabled
                    style={{
                      padding: '12px 14px',
                      backgroundColor: formData.Unfulfilled_Qty > 0 ? '#fff5f5' : '#f9fafb',
                      border: `1px solid ${formData.Unfulfilled_Qty > 0 ? 'var(--danger-color)' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      color: formData.Unfulfilled_Qty > 0 ? 'var(--danger-color)' : '#6b7280',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              {formData.Unfulfilled_Qty > 0 && (
                <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Unfulfilled SKU <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                    <select name="Unfulfilled_SKU" value={formData.Unfulfilled_SKU} onChange={handleChange} required style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontWeight: 500 }}>
                      <option value="" disabled>Select SKU</option>
                      {selectedOrder.SKUs && selectedOrder.SKUs.map((sku, idx) => (
                        <option key={idx} value={sku}>{sku}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Reason of Unfulfilled <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                    <select name="Reason" value={formData.Reason} onChange={handleChange} required style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontWeight: 500 }}>
                      <option value="" disabled>Select reason</option>
                      <option value="Inventory Shortage / Mismatch">Inventory Shortage / Mismatch</option>
                      <option value="Damaged Goods">Damaged Goods</option>
                      <option value="Partial Order Request">Partial Order Request</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Remarks</label>
                <textarea name="Remarks" value={formData.Remarks} onChange={handleChange} rows="3" placeholder="Enter remarks..." style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', resize: 'vertical' }}></textarea>
              </div>

              <div className="flex gap-md justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)} style={{ padding: '10px 24px', fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#111827' }}>Cancel</button>
                <button type="submit" className="btn" disabled={loading} style={{ padding: '10px 24px', fontWeight: 600, backgroundColor: '#6d28d9' }}>
                  <CheckCircle size={18} />
                  {loading ? 'Updating...' : 'Confirm & Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal for Bulk Upload */}
      {isBulkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%', padding: '24px', backgroundColor: 'var(--surface-color)', position: 'relative' }}>
            <button 
              onClick={() => { setIsBulkModalOpen(false); setBulkMessage(''); setBulkFile(null); }} 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-sm" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>📦</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Bulk Pack Orders</h3>
            </div>

            {bulkMessage && (
              <div style={{ 
                padding: '12px 16px', 
                marginBottom: '20px', 
                borderRadius: '8px', 
                backgroundColor: bulkMessage.includes('Successfully') ? 'var(--success-light)' : 'var(--danger-light)', 
                color: bulkMessage.includes('Successfully') ? 'var(--success-color)' : 'var(--danger-color)',
                border: `1px solid ${bulkMessage.includes('Successfully') ? 'var(--success-color)' : 'var(--danger-color)'}33`
              }}>
                {bulkMessage}
              </div>
            )}

            <form onSubmit={handleBulkSubmit}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#111827', fontWeight: 700 }}>Select File (.xlsx, .xls, .csv)</label>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => setBulkFile(e.target.files[0])} 
                  required 
                  style={{ padding: '10px 14px' }} 
                />
              </div>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', marginBottom: '32px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <p style={{ fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Expected Columns:</p>
                <p><code>PO_NO</code>, <code>Packing_Date</code>, <code>Dispatched_Qty</code>, <code>Unfulfilled_Qty</code>, <code>Unfulfilled_SKU</code>, <code>Reason</code>, <code>Remarks</code></p>
                <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  💡 <strong>Unfulfilled_SKU</strong> — shortage wale SKU ka naam likho (optional)
                </p>
              </div>

              <div className="flex justify-end gap-md">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setIsBulkModalOpen(false); setBulkMessage(''); setBulkFile(null); }} 
                  style={{ padding: '10px 24px', fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={loading} style={{ padding: '10px 24px', fontWeight: 600, backgroundColor: '#6d28d9' }}>
                  {loading ? 'Uploading...' : 'Upload Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehousePage;
