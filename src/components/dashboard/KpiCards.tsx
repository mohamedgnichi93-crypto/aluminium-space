import React from 'react';
import { ShoppingBag, TrendingUp, Clock, CheckCircle, DollarSign } from 'lucide-react';
import type { Order } from '../../store/ordersStore';

interface KpiCardsProps {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  totalRevenue: number;
  orders: Order[];
  formatDT: (num: number) => string;
}

const KpiCards: React.FC<KpiCardsProps> = ({
  totalOrders,
  pendingOrders,
  confirmedOrders,
  totalRevenue,
  orders,
  formatDT
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
      <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #E8EDF5', borderLeft: '4px solid #1D3E61', boxShadow: '0 2px 8px rgba(13,27,42,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingBag size={24} color="#1D3E61" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '32px', color: '#0D1B2A', lineHeight: 1.1 }}>{totalOrders}</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Total Commandes</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#27AE60', fontSize: '12px', marginTop: '4px', fontWeight: 500 }}>
            <TrendingUp size={12} /> +{orders.filter(o => new Date(o.date).getMonth() === new Date().getMonth()).length} ce mois
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #E8EDF5', borderLeft: '4px solid #F59E0B', boxShadow: '0 2px 8px rgba(13,27,42,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Clock size={24} color="#F59E0B" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '32px', color: '#0D1B2A', lineHeight: 1.1 }}>{pendingOrders}</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>En Attente</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #E8EDF5', borderLeft: '4px solid #27AE60', boxShadow: '0 2px 8px rgba(13,27,42,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E8F8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle size={24} color="#27AE60" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '32px', color: '#0D1B2A', lineHeight: 1.1 }}>{confirmedOrders}</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Confirmées</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #E8EDF5', borderLeft: '4px solid #8B5CF6', boxShadow: '0 2px 8px rgba(13,27,42,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <DollarSign size={24} color="#8B5CF6" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '24px', color: '#0D1B2A', lineHeight: 1.2 }}>{formatDT(totalRevenue)}</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>CA Total HT</div>
        </div>
      </div>
    </div>
  );
};

export default KpiCards;
