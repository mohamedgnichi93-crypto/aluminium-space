import React, { useEffect, useState } from 'react';
import { getMeasureRequests, updateMeasureRequestStatus, type MeasureRequest } from '../../store/measureRequestsStore';

const MeasureRequestsTable = () => {
  const [requests, setRequests] = useState<MeasureRequest[]>([]);

  const loadRequests = () => {
    const data = getMeasureRequests();
    setRequests(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    loadRequests();
    // Refresh periodically
    const interval = setInterval(loadRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkContacted = async (id: string) => {
    await updateMeasureRequestStatus(id, 'contacted');
    loadRequests();
  };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '20px' }}>📐 Demandes de mesure</h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nom client</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Téléphone</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Produit</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>L × H (mm)</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Statut</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>Aucune demande trouvée</td>
              </tr>
            ) : requests.map(req => (
              <tr key={req.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '12px 16px' }}>{new Date(req.date).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>{req.clientName}</td>
                <td style={{ padding: '12px 16px' }}>{req.clientPhone}</td>
                <td style={{ padding: '12px 16px' }}>{req.productName}</td>
                <td style={{ padding: '12px 16px' }}>{req.width ?? '—'} × {req.height ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: req.status === 'new' ? '#FEF3C7' : req.status === 'contacted' ? '#DBEAFE' : '#D1FAE5',
                    color: req.status === 'new' ? '#92400E' : req.status === 'contacted' ? '#1E40AF' : '#065F46'
                  }}>
                    {req.status === 'new' ? 'Nouveau' : req.status === 'contacted' ? 'Contacté' : 'Converti'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {req.status === 'new' && (
                    <button
                      onClick={() => handleMarkContacted(req.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#2563EB',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Marquer contacté
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MeasureRequestsTable;
