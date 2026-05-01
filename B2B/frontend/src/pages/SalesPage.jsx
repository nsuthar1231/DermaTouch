import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Clock, CheckCircle, X, Trash2 } from 'lucide-react';

const SalesPage = () => {
  const [formData, setFormData] = useState({
    PO_NO: '',
    Portal: '',
    PO_Date: '',
    SKU: '',
    PO_Qty: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [recentEntries, setRecentEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkMessage, setBulkMessage] = useState('');
  const [deletePOToConfirm, setDeletePOToConfirm] = useState(null);

  const fetchRecentEntries = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/orders/latest');
      setRecentEntries(data);
    } catch (error) {
      console.error('Error fetching recent entries', error);
    }
  };

  const handleDeletePO = (poNo) => {
    setDeletePOToConfirm(poNo);
  };

  const confirmDeletePO = async () => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/orders/by-po/${deletePOToConfirm}`);
      setDeletePOToConfirm(null);
      fetchRecentEntries();
    } catch (error) {
      console.error('Error deleting PO:', error);
      alert(error.response?.data?.message || 'Error deleting PO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMessage('');
    setFormData({ PO_NO: '', Portal: '', PO_Date: '', SKU: '', PO_Qty: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:5000/api/orders/create-order', formData);
      setMessage('Order created successfully!');
      fetchRecentEntries();
      setTimeout(() => closeModal(), 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating order');
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
      const { data } = await axios.post('http://localhost:5000/api/orders/bulk-sales', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBulkMessage(data.message);
      fetchRecentEntries();
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
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Order Entry</h2>
          <p>Record new purchase orders into the central logistics system.</p>
        </div>
        <div className="flex gap-md">
          <button className="btn btn-secondary" onClick={() => setIsBulkModalOpen(true)}>
            Bulk Upload
          </button>
          <button className="btn" onClick={openModal}>
            <Plus size={18} /> Add New PO
          </button>
        </div>
      </div>

      {/* Main Page: Recent Entries Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
        <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-sm">
            <span style={{ color: 'var(--text-secondary)' }}><Clock size={18} /></span>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Entries</h3>
          </div>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>TODAY</span>
        </div>
        
        <div className="table-container">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px' }}>PO NO</th>
                <th style={{ padding: '16px' }}>PORTAL</th>
                <th style={{ padding: '16px' }}>DATE</th>
                <th style={{ padding: '16px' }}>SKU</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>QTY</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>STATUS</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
               {(() => {
                 const grouped = recentEntries.reduce((acc, order) => {
                   if (!acc[order.PO_NO]) {
                     acc[order.PO_NO] = {
                       PO_NO: order.PO_NO,
                       Portal: order.Portal,
                       PO_Date: order.PO_Date,
                       SKUs: [],
                       PO_Qty: 0,
                       Status: order.Status
                     };
                   }
                   acc[order.PO_NO].SKUs.push(order.SKU);
                   acc[order.PO_NO].PO_Qty += order.PO_Qty;
                   // Keep status least advanced
                   if (order.Status === 'Pending') acc[order.PO_NO].Status = 'Pending';
                   else if (order.Status === 'Packed' && acc[order.PO_NO].Status === 'Dispatched') acc[order.PO_NO].Status = 'Packed';
                   return acc;
                 }, {});

                 const groupedArray = Object.values(grouped);

                 if (groupedArray.length === 0) {
                   return (
                     <tr>
                       <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>No recent entries</td>
                     </tr>
                   );
                 }

                 return groupedArray.map((order) => (
                   <tr key={order.PO_NO}>
                     <td style={{ padding: '16px 24px', fontWeight: 600 }}>{order.PO_NO}</td>
                     <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{order.Portal}</td>
                     <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{new Date(order.PO_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                     <td style={{ padding: '16px' }}>
                       <span style={{ backgroundColor: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', maxWidth: '150px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.SKUs.join(', ')}>
                         {order.SKUs.join(', ')}
                       </span>
                     </td>
                     <td style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>{order.PO_Qty}</td>
                     <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                       {order.Status === 'Pending' ? (
                         <span className="badge badge-pending" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>• Pending</span>
                       ) : order.Status === 'Packed' ? (
                         <span className="badge" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info-color)', padding: '4px 10px', fontSize: '0.7rem' }}>• Processed</span>
                       ) : (
                         <span className="badge badge-dispatched" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>• Dispatched</span>
                       )}
                     </td>
                     <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                       <button 
                         onClick={() => handleDeletePO(order.PO_NO)}
                         style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '4px' }}
                         title="Delete PO"
                       >
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 ));
               })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add New PO */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%', padding: '24px', backgroundColor: 'var(--surface-color)', position: 'relative' }}>
            <button 
              onClick={closeModal} 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-sm" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>📄</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create New PO</h3>
            </div>

            {message && (
              <div style={{ 
                padding: '12px 16px', 
                marginBottom: '20px', 
                borderRadius: '8px', 
                backgroundColor: message.includes('success') ? 'var(--success-light)' : 'var(--danger-light)', 
                color: message.includes('success') ? 'var(--success-color)' : 'var(--danger-color)',
                border: `1px solid ${message.includes('success') ? 'var(--success-color)' : 'var(--danger-color)'}33`
              }}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700 }}>PO NO</label>
                <input type="text" name="PO_NO" value={formData.PO_NO} onChange={handleChange} required placeholder="e.g. PO-2023-1042" style={{ padding: '10px 14px' }} />
              </div>
              
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700 }}>PORTAL</label>
                <select name="Portal" value={formData.Portal} onChange={handleChange} required style={{ padding: '10px 14px' }}>
                  <option value="" disabled>Select Origin Portal</option>
                  <option value="Nykaa">Nykaa</option>
                  <option value="Myntra">Myntra</option>
                  <option value="Purplle">Purplle</option>
                  <option value="FirstCry">FirstCry</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="B2B Wholesale">B2B Wholesale</option>
                  <option value="Retail Direct">Retail Direct</option>
                  <option value="Partner Network">Partner Network</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700 }}>PO DATE</label>
                  <input type="date" name="PO_Date" value={formData.PO_Date} onChange={handleChange} required style={{ padding: '10px 14px' }} />
                </div>
                
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700 }}>PO QTY</label>
                  <input type="number" name="PO_Qty" value={formData.PO_Qty} onChange={handleChange} required placeholder="0" min="1" style={{ padding: '10px 14px' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700 }}>PO SKU</label>
                <input type="text" name="SKU" value={formData.SKU} onChange={handleChange} required placeholder="Scan or enter SKU" style={{ padding: '10px 14px' }} />
              </div>

              <div className="flex justify-end gap-md">
                <button type="button" className="btn btn-secondary" onClick={closeModal} style={{ padding: '10px 24px', fontWeight: 600 }}>Cancel</button>
                <button type="submit" className="btn" disabled={loading} style={{ padding: '10px 24px', fontWeight: 600 }}>
                  {loading ? 'Adding...' : 'Add Line Item'}
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
              <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>📊</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Bulk Upload Sales Orders</h3>
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
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700 }}>Select File (.xlsx, .xls, .csv)</label>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => setBulkFile(e.target.files[0])} 
                  required 
                  style={{ padding: '10px 14px' }} 
                />
              </div>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', marginBottom: '32px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Expected Columns:</p>
                <p><code>PO_NO</code>, <code>Portal</code>, <code>PO_Date</code>, <code>SKU</code>, <code>PO_Qty</code></p>
              </div>

              <div className="flex justify-end gap-md">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setIsBulkModalOpen(false); setBulkMessage(''); setBulkFile(null); }} 
                  style={{ padding: '10px 24px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={loading} style={{ padding: '10px 24px', fontWeight: 600 }}>
                  {loading ? 'Uploading...' : 'Upload Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {deletePOToConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', width: '100%', padding: '32px', backgroundColor: '#ffffff', position: 'relative', textAlign: 'center' }}>
            <div style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>
              <Trash2 size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '8px', fontWeight: 600 }}>Delete Purchase Order</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to delete Purchase Order <strong style={{ color: '#111827' }}>{deletePOToConfirm}</strong>? This action will remove all associated line items and cannot be undone.
            </p>
            <div className="flex justify-center gap-md" style={{ justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeletePOToConfirm(null)}
                disabled={loading}
                style={{ padding: '10px 24px', fontWeight: 600, border: '1px solid #e5e7eb', color: '#374151' }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                onClick={confirmDeletePO}
                disabled={loading}
                style={{ padding: '10px 24px', fontWeight: 600, backgroundColor: 'var(--danger-color)', color: '#ffffff' }}
              >
                {loading ? 'Deleting...' : 'Delete PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
