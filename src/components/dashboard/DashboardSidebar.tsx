import React from 'react';
import {
  LayoutDashboard, ShoppingBag, MessageSquare, BarChart3, Trash2, Settings,
  LogOut, ChevronLeft, ChevronRight, Ruler
} from 'lucide-react';

interface DashboardSidebarProps {
  activeTab: string;
  isSidebarCollapsed: boolean;
  unreadSessions: number;
  trashedOrdersCount: number;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  handleLogout: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  isSidebarCollapsed,
  unreadSessions,
  trashedOrdersCount,
  setActiveTab,
  toggleSidebar,
  handleLogout
}) => {
  const sidebarWidth = isSidebarCollapsed ? '64px' : '220px';

  return (
    <aside
      style={{
        width: sidebarWidth,
        background: '#0D1B2A',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        zIndex: 40
      }}
    >
      <div style={{ padding: isSidebarCollapsed ? '24px 0' : '32px 24px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: isSidebarCollapsed ? 'center' : 'flex-start' }}>
        {/* LOGO IN SIDEBAR */}
        <img
          src="/logo-aluminium-space.png"
          alt="Aluminium Space"
          style={{
            width: isSidebarCollapsed ? '36px' : '48px',
            height: isSidebarCollapsed ? '36px' : '48px',
            objectFit: 'contain',
            background: 'white',
            borderRadius: '8px',
            padding: '2px',
            transition: 'all 0.3s ease',
            marginBottom: isSidebarCollapsed ? '0' : '12px'
          }}
        />

        {!isSidebarCollapsed && (
          <>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '20px', letterSpacing: '1px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>ALU SPACE</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#6B7280', letterSpacing: '2px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>MENUISERIE</div>
          </>
        )}

        <button
          onClick={toggleSidebar}
          style={{ position: 'absolute', top: '32px', right: isSidebarCollapsed ? 'auto' : '16px', background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer' }}
        >
          {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        <div style={{ width: isSidebarCollapsed ? '32px' : '100%', height: '1px', background: 'rgba(26, 93, 168, 0.3)', margin: '24px 0' }} />
      </div>

      <nav style={{ flex: 1, padding: isSidebarCollapsed ? '0' : '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
          { id: 'orders', icon: ShoppingBag, label: 'Commandes' },
          { id: 'demandes', icon: Ruler, label: 'Demandes' },
          { id: 'chat', icon: MessageSquare, label: 'Messages', count: unreadSessions },
          { id: 'stats', icon: BarChart3, label: 'Statistiques' },
          { id: 'corbeille', icon: Trash2, label: 'Corbeille', count: trashedOrdersCount },
          { id: 'parametres', icon: Settings, label: 'Paramètres' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isSidebarCollapsed ? '0' : '12px',
              padding: isSidebarCollapsed ? '12px' : '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              background: activeTab === item.id ? '#1D3E61' : 'transparent',
              color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.85)',
              transition: 'all 0.2s',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              width: '100%',
              overflow: 'hidden',
              position: 'relative'
            }}
            onMouseEnter={(e) => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={(e) => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ flexShrink: 0, width: '20px', display: 'flex', justifyContent: 'center' }}>
              <item.icon size={18} />
            </div>

            {!isSidebarCollapsed && (
              <span style={{
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'left'
              }}>
                {item.label}
              </span>
            )}

            {!isSidebarCollapsed && (item.count || 0) > 0 && (
              <div style={{
                background: '#EF4444', color: 'white', fontSize: '10px', fontWeight: 'bold',
                borderRadius: '10px', padding: '2px 6px',
                marginLeft: 'auto',
                flexShrink: 0
              }}>
                {item.count}
              </div>
            )}

            {isSidebarCollapsed && (item.count || 0) > 0 && (
              <div style={{
                position: 'absolute', top: '8px', right: '8px',
                width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444'
              }} />
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: isSidebarCollapsed ? '24px 0' : '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleLogout}
          title="Se déconnecter"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isSidebarCollapsed ? '0' : '12px',
            color: '#EF4444',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            width: '100%',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            padding: isSidebarCollapsed ? '0' : '8px'
          }}
        >
          <div style={{ flexShrink: 0, width: '20px', display: 'flex', justifyContent: 'center' }}>
            <LogOut size={18} />
          </div>
          {!isSidebarCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Se déconnecter</span>}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
