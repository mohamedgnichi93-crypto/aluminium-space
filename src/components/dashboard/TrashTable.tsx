import React, { useState, useEffect } from 'react';
import type { Order } from '../../store/ordersStore';
import { ShoppingCart, Ruler } from 'lucide-react';
import type { MeasureRequest } from '../../store/measureRequestsStore';
import { getDeletedMeasureRequests, restoreMeasureRequest, permanentDeleteMeasureRequest } from '../../store/measureRequestsStore';

interface TrashTableProps {
  trashedOrders: Order[];
  handleEmptyTrash: () => Promise<void>;
  handleRestore: (orderId: string) => Promise<void>;
  handlePermanentDelete: (orderId: string) => Promise<void>;
}

const TrashTable: React.FC<TrashTableProps> = ({
  trashedOrders,
  handleEmptyTrash,
  handleRestore,
  handlePermanentDelete
}) => {
  const [trashedMeasureRequests, setTrashedMeasureRequests] = useState<MeasureRequest[]>([]);
  const [loadingMeasures, setLoadingMeasures] = useState(false);

  const loadMeasureRequests = async () => {
    try {
      setLoadingMeasures(true);
      const data = await getDeletedMeasureRequests();
      setTrashedMeasureRequests(data);
    } catch (err) {
      console.error('Failed to load deleted measure requests:', err);
    } finally {
      setLoadingMeasures(false);
    }
  };

  useEffect(() => {
    loadMeasureRequests();
  }, []);

  const handleRestoreMeasure = async (id: string) => {
    try {
      await restoreMeasureRequest(id);
      await loadMeasureRequests();
    } catch (err) {
      console.error('Failed to restore measure request:', err);
    }
  };

  const handlePermanentDeleteMeasure = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette demande ?')) return;
    try {
      await permanentDeleteMeasureRequest(id);
      await loadMeasureRequests();
    } catch (err) {
      console.error('Failed to permanently delete measure request:', err);
    }
  };

  const handleEmptyMeasureTrash = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir vider la corbeille des demandes ?')) return;
    try {
      for (const req of trashedMeasureRequests) {
        await permanentDeleteMeasureRequest(req.id);
      }
      await loadMeasureRequests();
    } catch (err) {
      console.error('Failed to empty measure requests trash:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SECTION 1: Commandes supprimées */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingCart size={20} color="#0D1B2A" />
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>Commandes supprimées</h3>
            <span style={{ background: '#F4F7FB', color: '#6B7280', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '20px' }}>{trashedOrders.length}</span>
          </div>
          <button
            onClick={handleEmptyTrash}
            disabled={trashedOrders.length === 0}
            style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '8px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, cursor: trashedOrders.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Vider la corbeille
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F4F7FB' }}>
                <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>N° Devis</th>
                <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Client</th>
                <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Supprimé le</th>
                <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trashedOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #F0F4F8' }}>
                  <td style={{ padding: '16px 24px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: '#1D3E61' }}>AS-{order.id}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{order.clientInfo?.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{order.clientInfo?.phone}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280' }}>
                    {order.deletedAt ? new Date(order.deletedAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleRestore(order.id)} style={{ background: '#E8F8F0', color: '#27AE60', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Restaurer</button>
                      <button onClick={() => handlePermanentDelete(order.id)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {trashedOrders.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>Aucune commande supprimée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Demandes de mesure supprimées */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Ruler size={20} color="#0D1B2A" />
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>Demandes de mesure supprimées</h3>
            <span style={{ background: '#F4F7FB', color: '#6B7280', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '20px' }}>{trashedMeasureRequests.length}</span>
          </div>
          <button
            onClick={handleEmptyMeasureTrash}
            disabled={trashedMeasureRequests.length === 0}
            style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '8px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, cursor: trashedMeasureRequests.length === 0 ? 'not-allowed' : 'pointer', opacity: trashedMeasureRequests.length === 0 ? 0.5 : 1 }}
          >
            Vider la corbeille
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F4F7FB' }}>
                <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Client</th>
                <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Produit</th>
                <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Dimensions</th>
                <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Supprimé le</th>
                <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingMeasures ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>Chargement...</td></tr>
              ) : trashedMeasureRequests.length > 0 ? (
                trashedMeasureRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #F0F4F8' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#1D3E61' }}>{req.clientName}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{req.clientPhone}</div>
                    </td>
                    <td style={{ padding: '16px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: '#1D3E61' }}>
                      {req.productName}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280' }}>
                      {req.width && req.height
                        ? `${(req.width / 10).toFixed(1)} x ${(req.height / 10).toFixed(1)} cm`
                        : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280' }}>
                      {req.deletedAt ? new Date(req.deletedAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleRestoreMeasure(req.id)} style={{ background: '#E8F8F0', color: '#27AE60', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Restaurer</button>
                        <button onClick={() => handlePermanentDeleteMeasure(req.id)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>Aucune demande supprimée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default TrashTable;
