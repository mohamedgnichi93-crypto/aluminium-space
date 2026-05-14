import React from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';

interface DashboardHeaderProps {
  activeTab: string;
  onMenuClick: () => void;
  isMobile: boolean;
  currentTime: Date;
  isOnline: boolean;
  isSyncing: boolean;
  handleSync: () => Promise<void>;
  handleLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  onMenuClick,
  isMobile,
  currentTime,
  isOnline,
  isSyncing,
  handleSync,
  handleLogout
}) => {
  return (
    <header className="dashboard-header-bar" style={{
      height: '64px',
      background: 'white',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isMobile && (
          <button
            onClick={onMenuClick}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', padding: '8px',
              borderRadius: '8px', marginRight: '12px',
              display: 'flex', alignItems: 'center'
            }}
          >
            <Menu size={22} color="#3D5166" />
          </button>
        )}
        <h2 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: '18px',
        color: '#0D1B2A',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
          {activeTab === 'dashboard' ? 'Tableau de bord' : activeTab === 'orders' ? 'Commandes' : activeTab === 'stats' ? 'Statistiques' : activeTab === 'corbeille' ? 'Corbeille' : activeTab === 'chat' ? 'Messages Clients' : activeTab === 'parametres' ? 'Paramètres' : 'Tableau de bord'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }} className="hidden lg:inline-block">
          {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} • {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Online / Offline indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: isOnline ? '#27AE60' : '#EF4444' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOnline ? '#27AE60' : '#EF4444' }} />
          <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        </div>

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
          title="Synchroniser avec Supabase"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E8EDF5', background: 'white', color: '#3D5166', cursor: isSyncing || !isOnline ? 'not-allowed' : 'pointer', opacity: isSyncing || !isOnline ? 0.5 : 1, fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (!isSyncing && isOnline) e.currentTarget.style.background = '#F5F7FA'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span className="hidden sm:inline">{isSyncing ? 'Sync...' : 'Sync'}</span>
        </button>

        <div style={{ position: 'relative' }}>
          <Bell size={20} color="#3D5166" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* LOGO IMAGE AS AVATAR */}
          <img
            src="/logo-aluminium-space.png"
            alt="Aluminium Space"
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              borderRadius: '8px',
              background: 'white',
              border: '1px solid #E8EDF5',
              padding: '2px'
            }}
            onError={(e) => {
              // fallback to AS text if image fails
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.style.width = '38px';
                fallback.style.height = '38px';
                fallback.style.borderRadius = '50%';
                fallback.style.background = '#0D1B2A';
                fallback.style.color = 'white';
                fallback.style.display = 'flex';
                fallback.style.alignItems = 'center';
                fallback.style.justifyContent = 'center';
                fallback.style.fontSize = '14px';
                fallback.style.fontWeight = '600';
                fallback.textContent = 'AS';
                parent.prepend(fallback);
              }
            }}
          />

          <button
            onClick={handleLogout}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
