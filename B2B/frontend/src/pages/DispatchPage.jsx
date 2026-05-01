import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Upload, X, CheckCircle, PackageOpen } from 'lucide-react';

const DispatchPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    Date: '',
    Box: '',
    Transporter: '',
    Mode: 'Road - LTL',
    Vehicle_No: '',
    Pickup_Time: '',
    Pickup_Person: '',
    Driver_Phone: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPackedOrders = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/orders/packed-orders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching packed orders', error);
    }
  };

  useEffect(() => {
    fetchPackedOrders();
  }, []);

  const openModal = (order) => {
    setSelectedOrder(order);
    setFormData({
      Date: new Date().toISOString().split('T')[0],
      Box: '',
      Transporter: '',
      Mode: 'Road - LTL',
      Vehicle_No: '',
      Pickup_Time: '',
      Pickup_Person: '',
      Driver_Phone: ''
    });
    setFile(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const submitData = new FormData();
    submitData.append('PO_NO', selectedOrder.PO_NO);
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });

    try {
      await axios.put('http://localhost:5000/api/orders/update-dispatch', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedOrder(null);
      fetchPackedOrders();
    } catch (error) {
      console.error('Error updating dispatch details', error);
      alert(error.response?.data?.message || 'Error updating dispatch. Note: Cloudinary setup might be missing in .env');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Ready for Dispatch</h2>
          <p>Assign transporter and upload manifest for packed orders.</p>
        </div>
        <div className="flex gap-md">
          <button className="btn btn-secondary flex items-center gap-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> Filter
          </button>
          <button className="btn btn-secondary flex items-center gap-sm">Export</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px' }}>PO NO</th>
                <th>DATE</th>
                <th>PORTAL</th>
                <th>SKU</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right', padding: '16px 24px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
             {(() => {
                 const grouped = orders.reduce((acc, order) => {
                   if (!acc[order.PO_NO]) {
                     acc[order.PO_NO] = {
                       PO_NO: order.PO_NO,
                       Portal: order.Portal,
                       PO_Date: order.PO_Date,
                       SKUs: [],
                       PO_Qty: 0
                     };
                   }
                   
                   // Actual_Qty = PO_Qty - Unfulfilled_Qty (if this was the shortage SKU)
                   // Backend sets Actual_Qty = 0 if entire SKU qty was unfulfilled
                   const actualQty = order.Actual_Qty !== undefined ? order.Actual_Qty : order.PO_Qty;
                   
                   // Only show SKU if it has qty remaining (not fully unfulfilled)
                   if (actualQty > 0) {
                     acc[order.PO_NO].SKUs.push(
                       actualQty < order.PO_Qty 
                         ? `${order.SKU} (${actualQty})` // Show reduced qty next to SKU
                         : order.SKU
                     );
                   }
                   
                   acc[order.PO_NO].PO_Qty += actualQty;
                   return acc;
                 }, {});
                 
                 const groupedArray = Object.values(grouped).filter(group => group.PO_Qty > 0 && group.SKUs.length > 0);
                 
                 if (groupedArray.length === 0) {
                   return (
                     <tr>
                       <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>No packed orders waiting for dispatch</td>
                     </tr>
                   );
                 }
                 
                 return groupedArray.map((order) => (
                   <tr key={order.PO_NO}>
                     <td style={{ padding: '16px 24px', fontWeight: 600 }}>{order.PO_NO}</td>
                     <td>{new Date(order.PO_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                     <td>{order.Portal}</td>
                     <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.SKUs.join(', ')}>
                       <span style={{ backgroundColor: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                         {order.SKUs.join(', ')}
                       </span>
                     </td>
                     <td><span className="badge badge-packed" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info-color)' }}><PackageOpen size={12}/> PACKED ({order.PO_Qty})</span></td>
                     <td style={{ textAlign: 'right', padding: '16px 24px' }}>
                       <button 
                         style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }} 
                         onClick={() => openModal(order)}
                       >
                         Dispatch Now
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
          <div className="modal-content" style={{ maxWidth: '650px', padding: '32px 32px 24px 32px', backgroundColor: 'var(--surface-color)', position: 'relative' }}>
            <button 
              onClick={() => setSelectedOrder(null)} 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.35rem', color: '#111827', marginBottom: '8px', fontWeight: 600 }}>Dispatch Order Details</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Ref: <strong style={{ color: '#111827' }}>{selectedOrder.PO_NO}</strong> | <strong style={{ color: 'var(--primary-color)' }}>{selectedOrder.PO_Qty} Units (Actual Packed)</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Dispatch Date <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="date" name="Date" value={formData.Date} onChange={handleChange} required style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Total Box Count <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="number" name="Box" value={formData.Box} onChange={handleChange} required min="1" style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Transporter / Carrier <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <select name="Transporter" value={formData.Transporter} onChange={handleChange} required style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    <option value="" disabled>Select Carrier</option>
                    <option value="FedEx Freight">FedEx Freight</option>
                    <option value="Delhivery">Delhivery</option>
                    <option value="Blue Dart">Blue Dart</option>
                    <option value="Local Logistics">Local Logistics</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Mode of Transport</label>
                  <select name="Mode" value={formData.Mode} onChange={handleChange} required style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    <option value="Road - LTL">Road - LTL</option>
                    <option value="Road - FTL">Road - FTL</option>
                    <option value="Air">Air</option>
                    <option value="Train">Train</option>
                    <option value="Sea">Sea</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Vehicle Registration No.</label>
                  <input type="text" name="Vehicle_No" value={formData.Vehicle_No} onChange={handleChange} placeholder="E.g., CA-12345" style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Actual Pickup Time</label>
                  <input type="time" name="Pickup_Time" value={formData.Pickup_Time} onChange={handleChange} style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Driver / Contact Name</label>
                  <input type="text" name="Pickup_Person" value={formData.Pickup_Person} onChange={handleChange} placeholder="Driver's Full Name" style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700, marginBottom: '8px' }}>Driver Contact Phone</label>
                  <input type="text" name="Driver_Phone" value={formData.Driver_Phone} onChange={handleChange} placeholder="+1 (555) 000-0000" style={{ padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}></div>

              <div className="flex gap-md justify-start">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)} style={{ padding: '10px 24px', fontWeight: 600, color: '#111827', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn" disabled={loading} style={{ padding: '10px 24px', fontWeight: 600, backgroundColor: '#6d28d9' }}>
                  <CheckCircle size={18} />
                  {loading ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchPage;
