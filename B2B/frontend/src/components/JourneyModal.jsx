import React from 'react';
import { X } from 'lucide-react';

const JourneyModal = ({ selectedPOJourney, journeyData, journeyLoading, onClose }) => {
  if (!selectedPOJourney) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ 
        maxWidth: '650px', 
        width: '90%', 
        padding: '32px', 
        backgroundColor: '#ffffff', 
        position: 'relative',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '4px', fontWeight: 600 }}>Order Journey</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Tracking milestones for PO: <strong style={{ color: 'var(--primary-color)' }}>{selectedPOJourney}</strong></p>

        {journeyLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading journey details...</div>
        ) : journeyData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e5e7eb' }}>
            
            {/* Milestone 1: Ordered */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-33px', top: '4px', backgroundColor: 'var(--primary-color)', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>1</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>Ordered (Sales Upload)</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Placed on: {journeyData.orders?.[0] ? new Date(journeyData.orders[0].PO_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px 16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Line Items ({journeyData.orders?.length || 0})</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {journeyData.orders?.map((o, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '4px 8px', borderRadius: '4px', color: '#4b5563' }}>
                      {o.SKU} ({o.PO_Qty} qty)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Milestone 2: Packed */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-33px', top: '4px', backgroundColor: journeyData.packing?.length > 0 ? 'var(--primary-color)' : '#d1d5db', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>2</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: journeyData.packing?.length > 0 ? '#111827' : '#9ca3af', marginBottom: '6px' }}>Packed (Warehouse Milestone)</h4>
              {journeyData.packing?.length > 0 ? (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '4px' }}>
                    <strong>Packed Date:</strong> {new Date(journeyData.packing[0].Packing_Date).toLocaleDateString()}
                  </p>
                  {journeyData.packing[0].Unfulfilled_Qty > 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--danger-color)', marginTop: '4px' }}>
                      ⚠️ Unfulfilled: {journeyData.packing[0].Unfulfilled_Qty} units ({journeyData.packing[0].Unfulfilled_SKU || 'N/A'}) - {journeyData.packing[0].Reason}
                    </p>
                  )}
                  {journeyData.packing[0].Remarks && (
                    <p style={{ fontSize: '0.75rem', color: '#4b5563', fontStyle: 'italic', marginTop: '6px' }}>&quot;{journeyData.packing[0].Remarks}&quot;</p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>Awaiting warehouse processing...</p>
              )}
            </div>

            {/* Milestone 3: Dispatched */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-33px', top: '4px', backgroundColor: journeyData.dispatch?.length > 0 ? 'var(--primary-color)' : '#d1d5db', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>3</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: journeyData.dispatch?.length > 0 ? '#111827' : '#9ca3af', marginBottom: '6px' }}>Dispatched (Transit Milestone)</h4>
              {journeyData.dispatch?.length > 0 ? (
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '4px' }}>
                    <strong>Carrier:</strong> {journeyData.dispatch[0].Transporter} ({journeyData.dispatch[0].Mode})
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#1e40af' }}>
                    <strong>Vehicle:</strong> {journeyData.dispatch[0].Vehicle_No || 'N/A'} | <strong>Boxes:</strong> {journeyData.dispatch[0].Box}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>Awaiting dispatch operations...</p>
              )}
            </div>

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>No journey details found.</div>
        )}
      </div>
    </div>
  );
};

export default JourneyModal;
