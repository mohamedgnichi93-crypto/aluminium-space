import React from 'react';
import { 
  Calendar, DollarSign, Award, BarChart2, PieChart as PieChartIcon 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import type { Order } from '../../store/ordersStore';

interface DashboardChartsProps {
  orders: Order[];
  activeTab: string;
  totalOrders: number;
  barChartData: any[];
  pieChartData: any[];
  formatDT: (num: number) => string;
  COLORS: string[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  orders,
  activeTab,
  totalOrders,
  barChartData,
  pieChartData,
  formatDT,
  COLORS
}) => {
  return (
    <>
      {/* QUICK STATS ROW */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', border: '1px solid #E8EDF5', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#1D3E61" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3D5166' }}><strong style={{ color: '#0D1B2A' }}>{orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()).length}</strong> commandes aujourd'hui</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} color="#27AE60" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3D5166' }}>CA ce mois: <strong style={{ color: '#0D1B2A' }}>{formatDT(orders.filter(o => new Date(o.date).getMonth() === new Date().getMonth()).reduce((sum, o) => sum + (o.totalHT || 0), 0))}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="#F59E0B" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3D5166' }}>Top produit: <strong style={{ color: '#0D1B2A' }}>{pieChartData[0]?.name || 'N/A'}</strong></span>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 60%', background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #E8EDF5', minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>Évolution des Commandes</h3>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6B7280', background: '#F4F7FB', padding: '4px 10px', borderRadius: '20px' }}>6 derniers mois</span>
          </div>
          <div style={{ width: '100%', height: '260px' }}>
            {barChartData.every(d => d.Commandes === 0) ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#6B7280' }}>
                <BarChart2 size={40} color="#CBD5E1" />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Aucune commande ce mois-ci</p>
                  <small style={{ fontSize: '12px', opacity: 0.8 }}>Les données apparaîtront dès la première commande</small>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1D3E61" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1D3E61" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EDF5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontFamily: 'DM Sans, sans-serif' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontFamily: 'DM Sans, sans-serif' }} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(29,62,97,0.04)' }}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}
                  />
                  <Bar dataKey="Commandes" fill="url(#barGrad)" radius={[5, 5, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 30%', background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #E8EDF5', minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>Répartition Produits</h3>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6B7280', background: '#F4F7FB', padding: '4px 10px', borderRadius: '20px' }}>Top 5</span>
          </div>
          {pieChartData.length === 0 ? (
            <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#6B7280' }}>
              <PieChartIcon size={40} color="#CBD5E1" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Aucun produit commandé</p>
                <small style={{ fontSize: '12px', opacity: 0.8 }}>La répartition apparaîtra avec les premières commandes</small>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="42%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }} />
                  <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '12px', fontFamily: 'DM Sans, sans-serif', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* STATS TAB EXTRA: status breakdown + top products */}
      {activeTab === 'stats' && (
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {/* Status breakdown */}
          <div style={{ flex: '1 1 280px', background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #E8EDF5' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', marginBottom: '20px' }}>Statut des Commandes</h3>
            {[
              { label: 'En attente', value: orders.filter(o => o.status === 'pending').length, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Confirmées', value: orders.filter(o => o.status === 'confirmed').length, color: '#27AE60', bg: '#E8F8F0' },
              { label: 'En fabrication', value: orders.filter(o => o.status === 'en_fabrication').length, color: '#3B82F6', bg: '#DBEAFE' },
              { label: 'Prêtes', value: orders.filter(o => o.status === 'pret').length, color: '#8B5CF6', bg: '#EDE9FE' },
              { label: 'Installées', value: orders.filter(o => o.status === 'installe').length, color: '#1D3E61', bg: '#EEF2F8' },
              { label: 'Livrées', value: orders.filter(o => o.status === 'livree').length, color: '#81C063', bg: '#EFF7E8' },
              { label: 'Annulées', value: orders.filter(o => o.status === 'cancelled').length, color: '#EF4444', bg: '#FEE2E2' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <div style={{ flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#3D5166' }}>{item.label}</div>
                <div style={{ background: item.bg, color: item.color, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', padding: '2px 10px', borderRadius: '12px' }}>{item.value}</div>
                <div style={{ width: '80px', height: '6px', background: '#F0F4F8', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalOrders > 0 ? (item.value / totalOrders) * 100 : 0}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Top products table */}
          <div style={{ flex: '2 1 400px', background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #E8EDF5' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', marginBottom: '20px' }}>Top Produits Commandés</h3>
            {pieChartData.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>Aucune donnée disponible</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pieChartData.map((p, i) => {
                  const maxVal = pieChartData[0]?.value || 1;
                  return (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${COLORS[i % COLORS.length]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '12px', color: COLORS[i % COLORS.length], flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, color: '#0D1B2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: COLORS[i % COLORS.length], flexShrink: 0, marginLeft: '8px' }}>{p.value} unité{p.value > 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ height: '6px', background: '#F0F4F8', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(p.value / maxVal) * 100}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: '3px', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardCharts;
