import { X, Phone, Mail, FileText, Calendar, MapPin, MessageCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { Order } from '../../store/ordersStore';

interface Props {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: Order['status']) => void;
  onDownloadPDF: (order: Order) => void;
}

const formatDT = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num / 1000) + ' DT';
};

const OrderDetailModal = ({ order, onClose, onStatusChange, onDownloadPDF }: Props) => {
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>(order.status);

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#FEF3C7', color: '#92400E', label: 'En attente' },
    confirmed: { bg: '#D1FAE5', color: '#065F46', label: 'Confirmé' },
    en_fabrication: { bg: '#DBEAFE', color: '#1E40AF', label: 'En fabrication' },
    pret: { bg: '#EDE9FE', color: '#5B21B6', label: 'Prêt' },
    installe: { bg: '#D1FAE5', color: '#065F46', label: 'Installé' },
    livree: { bg: '#DBEAFE', color: '#1E3A5F', label: 'Livrée' },
    cancelled: { bg: '#FEE2E2', color: '#991B1B', label: 'Annulé' },
  };

  const getStatusBadge = (status: string) => {
    const s = statusConfig[status] || statusConfig.pending;
    return (
      <span style={{
        background: s.bg, color: s.color, borderRadius: '20px', padding: '6px 14px',
        fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
      }}>
        {s.label}
      </span>
    );
  };

  const handleUpdateStatus = () => {
    onStatusChange(order.id, selectedStatus);
    onClose();
  };

  const brutHT = order.totalHT || 0;
  const remise = order.remise || 0;
  const netHT = brutHT - remise;
  const fodec = order.fodec || 0;
  const tva = order.tva || 0;
  const timbre = order.timbre || 1000;
  const totalTTC = order.totalTTC || 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(13,27,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '20px', maxWidth: '680px', width: '100%',
          maxHeight: '90vh', overflowY: 'auto', position: 'relative',
          padding: 0,
        }}
      >
        {/* Header */}
        <div style={{ background: '#1A5DA8', padding: '24px 32px', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: 'white', margin: 0 }}>
              Devis AS-{order.id}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
              <Calendar size={14} />
              {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section: Produit */}
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', borderBottom: '1px solid #E8EDF5', paddingBottom: '8px', marginBottom: '16px' }}>
              Produits
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ background: '#F4F7FB', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '15px', color: '#0D1B2A' }}>{item.productName}</span>
                      <span style={{ background: '#1A5DA8', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{item.width} × {item.height} cm</span>
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#3D5166' }}>
                      Qté: {item.quantity} × {formatDT(item.unitPrice)}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0D1B2A' }}>
                    {formatDT(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Client */}
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', borderBottom: '1px solid #E8EDF5', paddingBottom: '8px', marginBottom: '16px' }}>
              Client
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '15px', color: '#0D1B2A' }}>{order.clientInfo.fullName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3D5166', fontSize: '14px' }}>
                  <Phone size={14} /> <a href={`tel:${order.clientInfo.phone}`} style={{ color: '#1A5DA8', textDecoration: 'none' }}>{order.clientInfo.phone}</a>
                </div>
                {order.clientInfo.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3D5166', fontSize: '14px' }}>
                    <Mail size={14} /> {order.clientInfo.email}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3D5166', fontSize: '14px' }}>
                  <MapPin size={14} /> {order.clientInfo.address}
                </div>
                {order.clientInfo.notes && (
                  <div style={{ marginTop: '8px', background: '#FFFBEB', color: '#92400E', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
                    <strong>Note:</strong> {order.clientInfo.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`tel:${order.clientInfo.phone}`} style={{ background: '#EEF4FF', color: '#1A5DA8', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} />
                </a>
                <a href={`https://wa.me/${order.clientInfo.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: '#E8F8F0', color: '#27AE60', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={18} />
                </a>
                {order.clientInfo.email && (
                  <a href={`mailto:${order.clientInfo.email}`} style={{ background: '#F5F3FF', color: '#8B5CF6', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Section: Calcul financier */}
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', borderBottom: '1px solid #E8EDF5', paddingBottom: '8px', marginBottom: '16px' }}>
              Calcul financier
            </h3>
            <div style={{ border: '1px solid #E8EDF5', borderRadius: '12px', overflow: 'hidden', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F4F7FB' }}>
                <span style={{ color: '#7A8FA6' }}>Brut HT</span>
                <span style={{ color: '#0D1B2A', fontWeight: 500 }}>{formatDT(brutHT)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F4F7FB' }}>
                <span style={{ color: '#7A8FA6' }}>Remise</span>
                <span style={{ color: '#EF4444', fontWeight: 500 }}>- {formatDT(remise)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F4F7FB', background: '#FAFBFC' }}>
                <span style={{ color: '#3D5166', fontWeight: 600 }}>Net HT</span>
                <span style={{ color: '#0D1B2A', fontWeight: 600 }}>{formatDT(netHT)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F4F7FB' }}>
                <span style={{ color: '#7A8FA6' }}>FODEC (1%)</span>
                <span style={{ color: '#0D1B2A', fontWeight: 500 }}>{formatDT(fodec)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F4F7FB' }}>
                <span style={{ color: '#7A8FA6' }}>TVA (19%)</span>
                <span style={{ color: '#0D1B2A', fontWeight: 500 }}>{formatDT(tva)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
                <span style={{ color: '#7A8FA6' }}>Timbre fiscal</span>
                <span style={{ color: '#0D1B2A', fontWeight: 500 }}>{formatDT(timbre)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#EEF4FF', borderTop: '1px solid #C8D9F0' }}>
                <span style={{ color: '#1A5DA8', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px' }}>TOTAL TTC</span>
                <span style={{ color: '#1A5DA8', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px' }}>{formatDT(totalTTC)}</span>
              </div>
            </div>
          </div>

          {/* Section: Statut */}
          <div style={{ background: '#FAFBFC', border: '1px solid #E8EDF5', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7A8FA6', marginBottom: '8px' }}>Statut actuel</div>
              {getStatusBadge(order.status)}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none' }}
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="en_fabrication">En fabrication</option>
                <option value="pret">Prêt</option>
                <option value="installe">Installé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <button
                onClick={handleUpdateStatus}
                style={{ background: '#1A5DA8', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Mettre à jour
              </button>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 32px', borderTop: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', gap: '12px', background: '#FAFBFC', borderRadius: '0 0 20px 20px' }}>
          <div>
            {order.status !== 'livree' && (
              <button
                onClick={() => {
                  onStatusChange(order.id, 'livree');
                  onClose();
                }}
                style={{
                  background: '#E8F8F0', color: '#27AE60', border: 'none', borderRadius: '8px',
                  padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                }}
              >
                <CheckCircle size={16} /> Marquer comme livrée
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => onDownloadPDF(order)}
              style={{
                background: 'white', color: '#1A5DA8', border: '1px solid #1A5DA8', borderRadius: '8px',
                padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
              }}
            >
              <FileText size={16} /> Télécharger PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#1A5DA8', color: 'white', border: 'none', borderRadius: '8px',
                padding: '10px 24px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
