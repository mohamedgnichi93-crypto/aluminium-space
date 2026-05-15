import React from 'react';
import {
  Search, Eye, Pencil, FileText, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { Order } from '../../store/ordersStore';

interface OrdersTableProps {
  filteredOrders: Order[];
  currentItems: Order[];
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  handleStatusChange: (orderId: string, status: Order['status']) => Promise<void>;
  handleMoveToTrash: (orderId: string) => Promise<void>;
  handleDownloadPDF: (order: Order) => void;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>> | ((order: Order | null) => void);
  setEditingOrder: React.Dispatch<React.SetStateAction<Order | null>> | ((order: Order | null) => void);
  formatDT: (num: number) => string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  filteredOrders,
  currentItems,
  totalPages,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  handleStatusChange,
  handleMoveToTrash,
  handleDownloadPDF,
  setSelectedOrder,
  setEditingOrder,
  formatDT
}) => {
  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>
          Dernières Commandes ({filteredOrders.length})
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher (Nom, Tél...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: '1px solid #E8EDF5', borderRadius: '8px', padding: '8px 12px 8px 36px', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', width: '220px' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1D3E61'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8EDF5'; }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ border: '1px solid #E8EDF5', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'white' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="en_fabrication">En fabrication</option>
            <option value="pret">Prêt</option>
            <option value="installe">Installé</option>
            <option value="livree">Livrée</option>
            <option value="cancelled">Annulée</option>
          </select>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ border: '1px solid #E8EDF5', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', background: 'white' }}
          >
            <option value="all">Toutes les dates</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F4F7FB' }}>
              <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>N° Devis</th>
              <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
              <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produit</th>
              <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TTC</th>
              <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</th>
              <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((order, idx) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #F0F4F8', background: idx % 2 === 0 ? 'white' : '#FAFBFC', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px 24px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1D3E61' }}>
                  {order.id}
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#0D1B2A' }}>{order.clientInfo?.fullName}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{order.clientInfo?.phone}</div>
                </td>
                <td style={{ padding: '16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3D5166' }}>
                  {(order.items || []).length > 0 ? (
                    <>
                      <div>{order.items[0].productName}</div>
                      {order.items.length > 1 && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>+{order.items.length - 1} autre(s)</div>}
                    </>
                  ) : 'Aucun'}
                </td>
                <td style={{ padding: '16px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D1B2A' }}>
                  {formatDT(order.totalTTC || 0)}
                </td>
                <td style={{ padding: '16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#3D5166' }}>
                  {new Date(order.date).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '16px' }}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    style={{
                      padding: '6px 10px', borderRadius: '20px', border: '1px solid #E8EDF5',
                      fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, outline: 'none',
                      background: order.status === 'pending' || (order.status as any) === 'en_attente' ? '#FEF3C7' :
                        order.status === 'confirmed' || (order.status as any) === 'confirme' ? '#D1FAE5' :
                          order.status === 'en_fabrication' ? '#DBEAFE' :
                            order.status === 'pret' ? '#EDE9FE' :
                              order.status === 'installe' || order.status === 'livree' ? '#D1FAE5' : '#FEE2E2',
                      color: order.status === 'pending' || (order.status as any) === 'en_attente' ? '#92400E' :
                        order.status === 'confirmed' || (order.status as any) === 'confirme' ? '#065F46' :
                          order.status === 'en_fabrication' ? '#1E40AF' :
                            order.status === 'pret' ? '#5B21B6' :
                              order.status === 'installe' || order.status === 'livree' ? '#065F46' : '#991B1B'
                    }}
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="en_fabrication">En fabrication</option>
                    <option value="pret">Prêt</option>
                    <option value="installe">Installé</option>
                    <option value="livree">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setSelectedOrder(order)} title="Voir détails" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D3E61', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#EEF4FF'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <Eye size={16} />
                    </button>
                    <button onClick={() => setEditingOrder(JSON.parse(JSON.stringify(order)))} title="Modifier" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#FEF3C7'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDownloadPDF(order)} title="Télécharger PDF" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#27AE60', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#E8F8F0'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <FileText size={16} />
                    </button>
                    <button onClick={() => handleMoveToTrash(order.id)} title="Corbeille" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                  Aucune commande trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
            Affichage {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} sur {filteredOrders.length} commandes
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', background: 'white', border: '1px solid #E8EDF5', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#C8D9F0' : '#3D5166', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', background: 'white', border: '1px solid #E8EDF5', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#C8D9F0' : '#3D5166', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
