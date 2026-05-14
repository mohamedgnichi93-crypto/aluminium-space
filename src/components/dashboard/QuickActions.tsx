import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, ShoppingBag, Package, Users, Settings } from 'lucide-react';

interface QuickActionsProps {
  setActiveTab: (tab: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ setActiveTab }) => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Nouveau Devis', icon: FilePlus, color: '#81C063', path: '/devis' },
    { label: 'Commandes', icon: ShoppingBag, color: '#3B82F6', action: () => setActiveTab('orders') },
    { label: 'Produits', icon: Package, color: '#8B5CF6', path: '/produits' },
    { label: 'Clients', icon: Users, color: '#F59E0B', action: () => setActiveTab('chat') },
    { label: 'Paramètres', icon: Settings, color: '#64748B', action: () => setActiveTab('parametres') },
  ];

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', marginBottom: '12px' }}>Accès rapides</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {actions.map((item, idx) => (
          <div
            key={idx}
            onClick={() => item.path ? navigate(item.path) : item.action?.()}
            style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#81C063';
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(129,192,99,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              background: `${item.color}10`, color: item.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <item.icon size={20} />
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#0D1B2A' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
