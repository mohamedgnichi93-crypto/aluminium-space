import React from 'react';
import type { Order } from '../../store/ordersStore';

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
  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>Corbeille (Les éléments sont supprimés après 10 jours)</h3>
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
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>La corbeille est vide.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrashTable;
