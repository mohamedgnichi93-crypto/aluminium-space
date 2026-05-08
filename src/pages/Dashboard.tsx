import { useState, useEffect, useMemo, useRef } from 'react';
import { getOrders, updateOrderStatus, updateOrder, moveToTrash, getTrashedOrders, restoreFromTrash, permanentlyDelete, emptyTrash, cleanOldTrash, syncOrdersFromSupabase, syncTrashedFromSupabase } from '../store/ordersStore';
import type { Order } from '../store/ordersStore';
import { generatePDF } from '../utils/pdfGenerator';
import { toast } from '../hooks/useToast';
import OrderDetailModal from '../components/dashboard/OrderDetailModal';
import {
  LayoutDashboard, ShoppingBag, BarChart3, LogOut,
  Bell, Search, CheckCircle, Clock, Trash2, Eye, FileText, Pencil, Plus, Minus, X as XIcon,
  DollarSign, TrendingUp, Calendar, ChevronLeft, ChevronRight, Award, MessageSquare, Send,
  Settings, RotateCcw, Phone
} from 'lucide-react';
import { getSettings, saveSettings, resetSettings, type BusinessSettings } from '../store/settingsStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAdminChat } from '../hooks/useChat';

const COLORS = ['#1D3E61', '#81C063', '#F59E0B', '#8B5CF6', '#EF4444'];

const formatDT = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num / 1000) + ' DT';
};

// NOTE: This password check is client-side only.
// For production, implement server-side authentication.
// --- SECURITY UTILS ---
const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

const Dashboard = () => {
  // --- SESSION & AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Security
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);
  const lockoutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- UI STATE ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth < 768;
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- DATA STATE ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [trashedOrders, setTrashedOrders] = useState<Order[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // --- TABS & FILTERS ---
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- SETTINGS ---
  const [settings, setSettings] = useState<BusinessSettings>(getSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'finances' | 'contact' | 'horaires'>('finances');

  // --- CHAT ---
  const { sessions, activeSession, setActiveSession, replyToSession, markSessionRead, isLoading: chatLoading, unreadSessions } = useAdminChat();
  const [chatReply, setChatReply] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- INIT EFFECT ---
  useEffect(() => {
    // Check existing session
    const sessionStr = sessionStorage.getItem('dashboard_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session.authenticated && session.expiresAt > Date.now()) {
        setIsAuthenticated(true);
      }
    }

    // Clean old trash
    cleanOldTrash();

    // Check rate limit lockout
    checkLockout();

    // Clock interval
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearInterval(clockInterval);
      if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
    };
  }, []);

  const checkLockout = () => {
    const attemptsStr = localStorage.getItem('login_attempts');
    if (!attemptsStr) return;
    const attempts = JSON.parse(attemptsStr);
    if (attempts.count >= 5 && attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      setLockoutTimer(Math.ceil((attempts.lockedUntil - Date.now()) / 1000));
      if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
      lockoutIntervalRef.current = setInterval(() => {
        const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(lockoutIntervalRef.current!);
          lockoutIntervalRef.current = null;
          setLockoutTimer(null);
          localStorage.setItem('login_attempts', JSON.stringify({ count: 0, lastAttempt: Date.now(), lockedUntil: null }));
        } else {
          setLockoutTimer(remaining);
        }
      }, 1000);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer !== null) return;

    const envPassword = import.meta.env.VITE_DASHBOARD_PASSWORD || '';
    if (secureCompare(password, envPassword)) {
      setIsAuthenticated(true);
      toast.success('Connexion réussie');
      localStorage.setItem('login_attempts', JSON.stringify({ count: 0, lastAttempt: Date.now(), lockedUntil: null }));
      
      sessionStorage.setItem('aluminium_space_auth', 'true');
      sessionStorage.setItem('dashboard_session', JSON.stringify({
        authenticated: true,
        loginTime: Date.now(),
        expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
        lastActivity: Date.now()
      }));
    } else {
      toast.error('Mot de passe incorrect');
      handleFailedLogin();
    }
    setPassword('');
  };

  const handleFailedLogin = () => {
    const attemptsStr = localStorage.getItem('login_attempts');
    let attempts = attemptsStr ? JSON.parse(attemptsStr) : { count: 0, lastAttempt: Date.now(), lockedUntil: null };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    
    if (attempts.count >= 5) {
      attempts.lockedUntil = Date.now() + (15 * 60 * 1000); // 15 mins
      toast.error('Trop de tentatives. Réessayez dans 15 minutes.');
    }
    localStorage.setItem('login_attempts', JSON.stringify(attempts));
    checkLockout();
  };

  const handleLogout = () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) {
      sessionStorage.removeItem('aluminium_space_auth');
      sessionStorage.removeItem('dashboard_session');
      setIsAuthenticated(false);
      setPassword('');
      setOrders([]);
      setTrashedOrders([]);
    }
  };

  // --- SESSION TRACKER ---
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkSession = () => {
      const sessionStr = sessionStorage.getItem('dashboard_session');
      if (!sessionStr) {
        setIsAuthenticated(false);
        return;
      }
      const session = JSON.parse(sessionStr);
      if (Date.now() > session.expiresAt) {
        toast.error('Session expirée');
        setIsAuthenticated(false);
      } else if (session.expiresAt - Date.now() < 5 * 60 * 1000 && session.expiresAt - Date.now() > 4 * 60 * 1000) {
        toast.error('⚠️ Session expire dans 5 minutes');
      }
    };

    const updateActivity = () => {
      const sessionStr = sessionStorage.getItem('dashboard_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.lastActivity = Date.now();
        session.expiresAt = Date.now() + (2 * 60 * 60 * 1000);
        sessionStorage.setItem('dashboard_session', JSON.stringify(session));
      }
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    
    const interval = setInterval(checkSession, 60000);
    
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // --- ONLINE / OFFLINE LISTENER ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- DATA LOADING ---
  const loadData = () => {
    const currentOrders = getOrders().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setOrders(currentOrders);

    const trashed = getTrashedOrders().sort((a, b) => new Date(b.deletedAt || b.date).getTime() - new Date(a.deletedAt || a.date).getTime());
    setTrashedOrders(trashed);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await Promise.all([syncOrdersFromSupabase(), syncTrashedFromSupabase()]);
    loadData();
    setIsSyncing(false);
    toast.success('Synchronisé avec le serveur');
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Initial sync from Supabase then load
      (async () => {
        setIsSyncing(true);
        await Promise.all([syncOrdersFromSupabase(), syncTrashedFromSupabase()]);
        loadData();
        setIsSyncing(false);
      })();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // --- ACTIONS ---
  const handleStatusChange = (id: string, newStatus: Order['status']) => {
    updateOrderStatus(id, newStatus);
    loadData();
    toast.success('Statut mis à jour');
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleMoveToTrash = (id: string) => {
    if (window.confirm('Voulez-vous déplacer cette commande vers la corbeille ?')) {
      moveToTrash(id);
      loadData();
      toast.success('Commande déplacée vers la corbeille');
    }
  };

  const handleRestore = (id: string) => {
    restoreFromTrash(id);
    loadData();
    toast.success('Commande restaurée');
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm('Voulez-vous supprimer définitivement cette commande ? Cette action est irréversible.')) {
      permanentlyDelete(id);
      loadData();
      toast.success('Commande supprimée définitivement');
    }
  };

  const handleEmptyTrash = () => {
    if (window.confirm('Voulez-vous vider toute la corbeille ? Cette action est irréversible.')) {
      emptyTrash();
      loadData();
      toast.success('Corbeille vidée');
    }
  };

  const handleDownloadPDF = async (order: Order) => {
    try {
      generatePDF(order);
      toast.success('PDF téléchargé');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', newState ? 'true' : 'false');
  };

  // --- KPI & Charts Calculations ---
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || (o.status as any) === 'en_attente').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed' || (o.status as any) === 'confirme' || o.status === 'en_fabrication' || o.status === 'pret').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalHT || 0), 0);

  const barChartData = useMemo(() => {
    const monthsMap: Record<string, number> = {};
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const monthStr = monthDate.toLocaleDateString('fr-FR', { month: 'short' });
      monthsMap[monthStr] = 0;
    }
    orders.forEach(o => {
      const oDate = new Date(o.date);
      const mStr = oDate.toLocaleDateString('fr-FR', { month: 'short' });
      if (monthsMap[mStr] !== undefined) {
        monthsMap[mStr]++;
      }
    });
    return Object.keys(monthsMap).map(k => ({ name: k, Commandes: monthsMap[k] }));
  }, [orders]);

  const pieChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
      });
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [orders]);

  // Filtering
  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.clientInfo?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (o.clientInfo?.phone || '').includes(searchTerm) || 
                          o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    
    let matchesDate = true;
    const orderDate = new Date(o.date);
    const today = new Date();
    if (dateFilter === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = orderDate >= weekAgo;
    } else if (dateFilter === 'month') {
      matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentItems = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatLockoutTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ width: '64px', height: '64px', background: '#EEF4FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <LayoutDashboard size={32} color="#1D3E61" />
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '24px', color: '#0D1B2A', marginBottom: '8px' }}>Administration</h1>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#7A8FA6', fontSize: '15px', marginBottom: '16px' }}>Veuillez vous connecter pour accéder au tableau de bord</p>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#27AE60', fontSize: '13px', fontWeight: 600, marginBottom: '24px', background: '#E8F8F0', padding: '8px', borderRadius: '8px' }}>
            🔒 Connexion sécurisée — Aluminium Space Admin
          </div>

          {lockoutTimer !== null ? (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
              Trop de tentatives. Réessayez dans {formatLockoutTime(lockoutTimer)}
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '15px', marginBottom: '20px', outline: 'none' }}
                required
              />
              
              <button
                type="submit"
                disabled={password.trim() === ''}
                style={{ 
                  width: '100%', 
                  background: password.trim() === '' ? '#C8D9F0' : '#1D3E61', 
                  color: 'white', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  fontFamily: 'Inter, sans-serif', 
                  fontWeight: 600, 
                  fontSize: '16px', 
                  cursor: password.trim() === '' ? 'not-allowed' : 'pointer', 
                  transition: 'background 0.3s' 
                }}
              >
                Se connecter
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- DASHBOARD LAYOUT ---
  const sidebarWidth = isSidebarCollapsed ? '64px' : '220px';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F7FB' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      
      {/* SIDEBAR */}
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
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#7A8FA6', letterSpacing: '2px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>MENUISERIE</div>
            </>
          )}
          
          <button 
            onClick={toggleSidebar}
            style={{ position: 'absolute', top: '32px', right: isSidebarCollapsed ? 'auto' : '16px', background: 'transparent', border: 'none', color: '#7A8FA6', cursor: 'pointer' }}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          <div style={{ width: isSidebarCollapsed ? '32px' : '100%', height: '1px', background: 'rgba(26, 93, 168, 0.3)', margin: '24px 0' }} />
        </div>

        <nav style={{ flex: 1, padding: isSidebarCollapsed ? '0' : '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
            { id: 'orders', icon: ShoppingBag, label: 'Commandes' },
            { id: 'chat', icon: MessageSquare, label: 'Messages', count: unreadSessions },
            { id: 'stats', icon: BarChart3, label: 'Statistiques' },
            { id: 'corbeille', icon: Trash2, label: 'Corbeille', count: trashedOrders.length },
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
                color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.2s',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                width: '100%',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => { if(activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={(e) => { if(activeTab !== item.id) e.currentTarget.style.background = 'transparent' }}
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

      {/* MAIN CONTENT AREA */}
      <main 
        style={{ 
          flex: 1, 
          minWidth: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden' 
        }} 
      >
        {/* HEADER BAR */}
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7A8FA6' }} className="hidden lg:inline-block">
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

            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="#3D5166" />
              <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
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
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7A8FA6', padding: '4px' }} 
                title="Se déconnecter"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA SCROLLABLE */}
        <div className="dashboard-content-area" style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '32px'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* ── PARAMÈTRES ─────────────────────────────────────────────────── */}
            {activeTab === 'parametres' && (
              <div style={{ maxWidth: '1000px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#7A8FA6', marginBottom: '28px' }}>
                  Gérez tous les paramètres de votre site depuis ce panneau. Les modifications s'appliquent immédiatement.
                </p>

                {/* Section Tabs */}
                <div className="params-section-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
                  {([
                    { id: 'finances' as const, label: 'Finances', icon: DollarSign },
                    { id: 'contact' as const, label: 'Contact', icon: Phone },
                    { id: 'horaires' as const, label: 'Horaires', icon: Clock },
                  ]).map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setSettingsSection(sec.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 22px', borderRadius: '10px',
                        border: `2px solid ${settingsSection === sec.id ? '#1D3E61' : '#E8EDF5'}`,
                        cursor: 'pointer',
                        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px',
                        background: settingsSection === sec.id ? '#1D3E61' : 'white',
                        color: settingsSection === sec.id ? 'white' : '#7A8FA6',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <sec.icon size={15} />
                      {sec.label}
                    </button>
                  ))}
                </div>

                {/* ── FINANCES ── */}
                {settingsSection === 'finances' && (
                  <div className="params-finance-outer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
                      <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(29,62,97,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <DollarSign size={17} color="#1D3E61" />
                        </div>
                        <div>
                          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Taxes & Remise</h4>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A8FA6', margin: 0 }}>Appliqués automatiquement sur tous les devis</p>
                        </div>
                      </div>
                      <div className="params-finance-inner-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {([
                          { key: 'remisePercent' as keyof BusinessSettings, label: 'Remise commerciale', unit: '%', min: 0, max: 50, step: 1, desc: 'Réduction accordée aux clients' },
                          { key: 'tvaPercent' as keyof BusinessSettings, label: 'TVA', unit: '%', min: 0, max: 30, step: 0.5, desc: 'Taxe sur la valeur ajoutée' },
                          { key: 'fodecPercent' as keyof BusinessSettings, label: 'FODEC', unit: '%', min: 0, max: 5, step: 0.25, desc: 'Fonds de développement' },
                          { key: 'timbreFiscal' as keyof BusinessSettings, label: 'Timbre fiscal', unit: 'DT', min: 0, max: 5, step: 0.1, desc: 'Taxe fixe par devis' },
                        ]).map(field => (
                          <div key={String(field.key)} style={{ background: '#F8FAFD', borderRadius: '12px', padding: '16px', border: '1px solid #EDF2F7' }}>
                            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1D3E61', marginBottom: '2px' }}>{field.label}</div>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9AA5B4', marginBottom: '10px' }}>{field.desc}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button type="button"
                                onClick={() => setSettings(s => ({ ...s, [field.key]: Math.max(field.min, Number(((s[field.key] as number) - field.step).toFixed(3))) }))}
                                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #D0D9E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#1D3E61', flexShrink: 0, transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,62,97,0.06)'; e.currentTarget.style.borderColor = '#1D3E61'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D0D9E8'; }}
                              >−</button>
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', border: '1.5px solid #D0D9E8', borderRadius: '8px', overflow: 'hidden' }}>
                                <input type="number" value={settings[field.key] as number} min={field.min} max={field.max} step={field.step}
                                  onChange={e => setSettings(s => ({ ...s, [field.key]: parseFloat(e.target.value) || 0 }))}
                                  style={{ flex: 1, padding: '8px 4px', border: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '17px', color: '#1D3E61', textAlign: 'center', outline: 'none', background: 'transparent', minWidth: 0 }}
                                />
                                <span style={{ padding: '0 8px 0 0', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#8896A5', flexShrink: 0 }}>{field.unit}</span>
                              </div>
                              <button type="button"
                                onClick={() => setSettings(s => ({ ...s, [field.key]: Math.min(field.max, Number(((s[field.key] as number) + field.step).toFixed(3))) }))}
                                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #D0D9E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#1D3E61', flexShrink: 0, transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,62,97,0.06)'; e.currentTarget.style.borderColor = '#1D3E61'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D0D9E8'; }}
                              >+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Validity */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
                      <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(129,192,99,0.04)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(129,192,99,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={17} color="#81C063" />
                        </div>
                        <div>
                          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Validité du devis</h4>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A8FA6', margin: 0 }}>Durée avant expiration</p>
                        </div>
                      </div>
                      <div style={{ padding: '24px' }}>
                        <div style={{ background: '#F8FAFD', borderRadius: '12px', padding: '16px', border: '1px solid #EDF2F7' }}>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9AA5B4', marginBottom: '10px' }}>Nombre de jours avant expiration</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button type="button" onClick={() => setSettings(s => ({ ...s, validityDays: Math.max(7, (s.validityDays || 30) - 1) }))}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #D0D9E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#1D3E61' }}>−</button>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', border: '1.5px solid #D0D9E8', borderRadius: '8px', overflow: 'hidden' }}>
                              <input type="number" value={settings.validityDays || 30} min={7} max={90}
                                onChange={e => setSettings(s => ({ ...s, validityDays: parseInt(e.target.value) || 30 }))}
                                style={{ flex: 1, padding: '8px 4px', border: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '17px', color: '#1D3E61', textAlign: 'center', outline: 'none', background: 'transparent' }}
                              />
                              <span style={{ padding: '0 8px 0 0', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#8896A5' }}>jours</span>
                            </div>
                            <button type="button" onClick={() => setSettings(s => ({ ...s, validityDays: Math.min(90, (s.validityDays || 30) + 1) }))}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #D0D9E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#1D3E61' }}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live preview */}
                    <div style={{ background: 'linear-gradient(135deg, #1D3E61 0%, #0F2444 100%)', borderRadius: '16px', padding: '24px', color: 'white' }}>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                        Aperçu calcul (base 1 000 DT)
                      </div>
                      {(() => {
                        const base = 1000000;
                        const remise = base * (settings.remisePercent / 100);
                        const netHT = base - remise;
                        const fodec = netHT * (settings.fodecPercent / 100);
                        const baseTVA = netHT + fodec;
                        const tva = baseTVA * (settings.tvaPercent / 100);
                        const ttc = baseTVA + tva + (settings.timbreFiscal * 1000);
                        return (
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}><span>Base HT</span><span>1 000.000 DT</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FF8A8A' }}><span>− Remise {settings.remisePercent}%</span><span>−{(remise/1000).toFixed(3)} DT</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}><span>Net HT</span><span>{(netHT/1000).toFixed(3)} DT</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)' }}><span>+ FODEC {settings.fodecPercent}%</span><span>+{(fodec/1000).toFixed(3)} DT</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)' }}><span>+ TVA {settings.tvaPercent}%</span><span>+{(tva/1000).toFixed(3)} DT</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)' }}><span>+ Timbre</span><span>+{settings.timbreFiscal.toFixed(3)} DT</span></div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
                              <span>TOTAL TTC</span>
                              <span style={{ color: '#81C063' }}>{(ttc/1000).toFixed(3)} DT</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── CONTACT ── */}
                {settingsSection === 'contact' && (
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(29,62,97,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone size={17} color="#1D3E61" />
                      </div>
                      <div>
                        <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Coordonnées & Contact</h4>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A8FA6', margin: 0 }}>Affiché sur la page Contact, dans les devis et partout sur le site</p>
                      </div>
                    </div>
                    <div className="params-contact-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Téléphone principal</label>
                        <input type="tel" value={settings.phone1 || ''} placeholder="(+216) 53 186 611"
                          onChange={e => setSettings(s => ({ ...s, phone1: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Téléphone secondaire</label>
                        <input type="tel" value={settings.phone2 || ''} placeholder="(+216) 57 099 070"
                          onChange={e => setSettings(s => ({ ...s, phone2: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Numéro WhatsApp</label>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#F59E0B', marginBottom: '6px' }}>⚠ Sans + ni espaces (ex: 21657099070)</p>
                        <input type="text" value={settings.whatsapp || ''} placeholder="21657099070"
                          onChange={e => setSettings(s => ({ ...s, whatsapp: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                        <input type="email" value={settings.email || ''} placeholder="contact@aluminiumspace.com"
                          onChange={e => setSettings(s => ({ ...s, email: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adresse</label>
                        <input type="text" value={settings.address || ''} placeholder="125 lot Laaroussi, Mghira"
                          onChange={e => setSettings(s => ({ ...s, address: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ville / Gouvernorat</label>
                        <input type="text" value={settings.city || ''} placeholder="Ben Arous, Tunisie"
                          onChange={e => setSettings(s => ({ ...s, city: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── HORAIRES ── */}
                {settingsSection === 'horaires' && (
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(29,62,97,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={17} color="#1D3E61" />
                      </div>
                      <div>
                        <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Horaires d'ouverture</h4>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A8FA6', margin: 0 }}>Affichés sur la page Contact</p>
                      </div>
                    </div>
                    <div className="params-hours-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lundi – Vendredi</label>
                        <input type="text" value={settings.hoursWeekday || ''} placeholder="8h00 – 17h00"
                          onChange={e => setSettings(s => ({ ...s, hoursWeekday: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Samedi</label>
                        <input type="text" value={settings.hoursSaturday || ''} placeholder="8h00 – 12h00"
                          onChange={e => setSettings(s => ({ ...s, hoursSaturday: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#8896A5', marginBottom: '12px' }}>Aperçu horaires</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {[
                            { day: 'Lundi – Vendredi', hours: settings.hoursWeekday || '8h00 – 17h00', open: true },
                            { day: 'Samedi', hours: settings.hoursSaturday || '8h00 – 12h00', open: true },
                            { day: 'Dimanche', hours: 'Fermé', open: false },
                          ].map(row => (
                            <div key={row.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: row.open ? '#F0FFF4' : '#FFF5F5', borderRadius: '8px', border: `1px solid ${row.open ? '#A7F3D0' : '#FECACA'}` }}>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#1D3E61' }}>{row.day}</span>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: row.open ? '#059669' : '#EF4444' }}>{row.hours}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SAVE BUTTONS */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                  <button
                    onClick={() => {
                      saveSettings(settings);
                      setSettingsSaved(true);
                      setTimeout(() => setSettingsSaved(false), 2500);
                    }}
                    style={{
                      flex: 1, background: settingsSaved ? '#81C063' : '#1D3E61', color: 'white', border: 'none', borderRadius: '12px',
                      padding: '15px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px',
                      letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      transition: 'all 0.2s', boxShadow: settingsSaved ? '0 4px 16px rgba(129,192,99,0.3)' : '0 4px 16px rgba(29,62,97,0.2)',
                    }}
                    onMouseEnter={e => { if (!settingsSaved) { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(129,192,99,0.35)'; } }}
                    onMouseLeave={e => { if (!settingsSaved) { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,62,97,0.2)'; } }}
                  >
                    {settingsSaved ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Paramètres sauvegardés !</>
                    ) : (
                      <><Settings size={16} /> Enregistrer tous les paramètres</>
                    )}
                  </button>
                  <button
                    onClick={() => { resetSettings(); setSettings(getSettings()); }}
                    style={{ padding: '15px 20px', background: 'white', color: '#EF4444', border: '1.5px solid #FECACA', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#FECACA'; }}
                  >
                    <RotateCcw size={15} />
                    Réinitialiser
                  </button>
                </div>

                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8896A5', marginTop: '12px', textAlign: 'center' }}>
                  Les modifications s'appliquent immédiatement sur tous les nouveaux devis et pages.
                </p>
              </div>
            )}

            {activeTab === 'corbeille' ? (
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>Corbeille (Les éléments sont supprimés après 30 jours)</h3>
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
                        <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase' }}>N° Devis</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase' }}>Client</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase' }}>Supprimé le</th>
                        <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashedOrders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #F0F4F8' }}>
                          <td style={{ padding: '16px 24px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: '#1D3E61' }}>AS-{order.id}</td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{order.clientInfo?.fullName}</div>
                            <div style={{ fontSize: '12px', color: '#7A8FA6' }}>{order.clientInfo?.phone}</div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', color: '#7A8FA6' }}>
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
                        <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#7A8FA6' }}>La corbeille est vide.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (activeTab === 'dashboard' || activeTab === 'stats') && (
              <>
                {/* KPI CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #E8EDF5', borderLeft: '4px solid #1D3E61', boxShadow: '0 2px 8px rgba(13,27,42,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShoppingBag size={24} color="#1D3E61" />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '32px', color: '#0D1B2A', lineHeight: 1.1 }}>{totalOrders}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7A8FA6', marginTop: '4px' }}>Total Commandes</div>
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
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7A8FA6', marginTop: '4px' }}>En Attente</div>
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #E8EDF5', borderLeft: '4px solid #27AE60', boxShadow: '0 2px 8px rgba(13,27,42,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E8F8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={24} color="#27AE60" />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '32px', color: '#0D1B2A', lineHeight: 1.1 }}>{confirmedOrders}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7A8FA6', marginTop: '4px' }}>Confirmées</div>
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #E8EDF5', borderLeft: '4px solid #8B5CF6', boxShadow: '0 2px 8px rgba(13,27,42,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DollarSign size={24} color="#8B5CF6" />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '24px', color: '#0D1B2A', lineHeight: 1.2 }}>{formatDT(totalRevenue)}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7A8FA6' }}>CA Total HT</div>
                    </div>
                  </div>
                </div>

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
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#7A8FA6', background: '#F4F7FB', padding: '4px 10px', borderRadius: '20px' }}>6 derniers mois</span>
                    </div>
                    <div style={{ width: '100%', height: '260px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1D3E61" stopOpacity={1} />
                              <stop offset="100%" stopColor="#1D3E61" stopOpacity={0.5} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EDF5" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A8FA6', fontFamily: 'DM Sans, sans-serif' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A8FA6', fontFamily: 'DM Sans, sans-serif' }} allowDecimals={false} />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(29,62,97,0.04)' }}
                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}
                          />
                          <Bar dataKey="Commandes" fill="url(#barGrad)" radius={[5, 5, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ flex: '1 1 30%', background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #E8EDF5', minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>Répartition Produits</h3>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#7A8FA6', background: '#F4F7FB', padding: '4px 10px', borderRadius: '20px' }}>Top 5</span>
                    </div>
                    {pieChartData.length === 0 ? (
                      <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px dashed #E8EDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BarChart3 size={28} color="#C8D0DB" />
                        </div>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#AAB3BF', textAlign: 'center', margin: 0 }}>Aucune commande<br />pour le moment</p>
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
                        <div style={{ padding: '32px', textAlign: 'center', color: '#AAB3BF', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>Aucune donnée disponible</div>
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
            )}

            {activeTab === 'chat' && (
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: 'calc(100vh - 180px)', minHeight: '400px' }}>
                {/* Conversations list */}
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8EDF5', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8EDF5', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Conversations ({Object.keys(sessions).length})
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {chatLoading && Object.keys(sessions).length === 0 && (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#818181', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>Chargement...</div>
                    )}
                    {Object.keys(sessions).length === 0 && !chatLoading && (
                      <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                        <MessageSquare size={32} color="#DBDADA" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ color: '#818181', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', margin: 0 }}>Aucun message pour l'instant</p>
                      </div>
                    )}
                    {Object.entries(sessions).map(([sessionId, msgs]) => {
                      const last = msgs[msgs.length - 1];
                      const hasUnread = msgs.some(m => m.sender === 'client' && !m.read_by_admin);
                      const clientName = msgs.find(m => m.client_name)?.client_name || 'Client';
                      const isActive = activeSession === sessionId;
                      return (
                        <button
                          key={sessionId}
                          onClick={() => { setActiveSession(sessionId); markSessionRead(sessionId); }}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '14px 16px', border: 'none', borderBottom: '1px solid #F0F4F8',
                            background: isActive ? 'rgba(29,62,97,0.06)' : 'white',
                            cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8FAFD'; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61' }}>{clientName}</span>
                            {hasUnread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#81C063', flexShrink: 0 }} />}
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#818181', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {last?.content || ''}
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#B3B3B3', marginTop: '3px' }}>
                            {last ? new Date(last.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chat thread */}
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8EDF5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {!activeSession ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#818181' }}>
                      <MessageSquare size={48} color="#E8EDF5" />
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', marginTop: '12px' }}>Sélectionnez une conversation</p>
                    </div>
                  ) : (
                    <>
                      {/* Thread header */}
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8EDF5', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61' }}>
                            {(sessions[activeSession]?.find(m => m.client_name)?.client_name || 'C')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1D3E61' }}>
                            {sessions[activeSession]?.find(m => m.client_name)?.client_name || 'Client'}
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#818181' }}>
                            {sessions[activeSession]?.length || 0} message(s)
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(sessions[activeSession] || []).map(m => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              maxWidth: '65%',
                              background: m.sender === 'admin' ? '#1D3E61' : '#F5F7FA',
                              color: m.sender === 'admin' ? 'white' : '#1D3E61',
                              borderRadius: m.sender === 'admin' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              padding: '10px 14px',
                              fontFamily: 'DM Sans, sans-serif', fontSize: '13px', lineHeight: 1.5,
                            }}>
                              {m.content}
                              <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px' }}>
                                {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply input */}
                      <div style={{ padding: '14px 20px', borderTop: '1px solid #E8EDF5', display: 'flex', gap: '10px', flexShrink: 0 }}>
                        <input
                          value={chatReply}
                          onChange={e => setChatReply(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey && chatReply.trim() && activeSession) {
                              e.preventDefault();
                              const clientName = sessions[activeSession]?.find(m => m.client_name)?.client_name || 'Client';
                              replyToSession(activeSession, chatReply.trim(), clientName);
                              setChatReply('');
                            }
                          }}
                          placeholder="Votre réponse..."
                          style={{ flex: 1, border: '1px solid #E8EDF5', borderRadius: '10px', padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', outline: 'none' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; }}
                        />
                        <button
                          onClick={() => {
                            if (!chatReply.trim() || !activeSession) return;
                            const clientName = sessions[activeSession]?.find(m => m.client_name)?.client_name || 'Client';
                            replyToSession(activeSession, chatReply.trim(), clientName);
                            setChatReply('');
                          }}
                          style={{ background: '#1D3E61', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', transition: 'background 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#81C063'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#1D3E61'; }}
                        >
                          <Send size={14} />
                          Envoyer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab !== 'corbeille' && activeTab !== 'stats' && activeTab !== 'chat' && (activeTab === 'dashboard' || activeTab === 'orders') && (
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: '#0D1B2A', margin: 0 }}>
                    Dernières Commandes ({filteredOrders.length})
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} color="#7A8FA6" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F4F7FB' }}>
                        <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>N° Devis</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produit</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TTC</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</th>
                        <th style={{ padding: '12px 24px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7A8FA6', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((order, idx) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #F0F4F8', background: idx % 2 === 0 ? 'white' : '#FAFBFC', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 24px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1D3E61' }}>
                            AS-{order.id}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#0D1B2A' }}>{order.clientInfo?.fullName}</div>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A8FA6', marginTop: '2px' }}>{order.clientInfo?.phone}</div>
                          </td>
                          <td style={{ padding: '16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3D5166' }}>
                            {(order.items || []).length > 0 ? (
                              <>
                                <div>{order.items[0].productName}</div>
                                {order.items.length > 1 && <div style={{ fontSize: '11px', color: '#7A8FA6', marginTop: '2px' }}>+{order.items.length - 1} autre(s)</div>}
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
                          <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#7A8FA6', fontFamily: 'Inter, sans-serif' }}>
                            Aucune commande trouvée.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div style={{ padding: '16px 24px', borderTop: '1px solid #E8EDF5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7A8FA6' }}>
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
            )}
          </div>
        </div>
      </main>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {/* ── Edit Order Modal ─────────────────────────────────────────────────── */}
      {editingOrder && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setEditingOrder(null); }}
        >
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1D3E61', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Modifier Commande
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A8FA6', marginTop: '2px' }}>AS-{editingOrder.id}</div>
              </div>
              <button onClick={() => setEditingOrder(null)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F4F7FB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A8FA6' }}>
                <XIcon size={16} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Client Info */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: '#7A8FA6', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Informations client</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {(['fullName', 'phone', 'email', 'address'] as const).map(field => (
                    <div key={field} style={{ gridColumn: field === 'address' ? '1 / -1' : 'auto' }}>
                      <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#7A8FA6', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        {field === 'fullName' ? 'Nom' : field === 'phone' ? 'Téléphone' : field === 'email' ? 'Email' : 'Adresse'}
                      </label>
                      <input
                        value={editingOrder.clientInfo[field] ?? ''}
                        onChange={e => setEditingOrder(prev => prev ? { ...prev, clientInfo: { ...prev.clientInfo, [field]: e.target.value } } : null)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                        onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Remise */}
              <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { key: 'remise' as const, label: 'Remise (%)', max: 100 },
                  { key: 'fodec' as const, label: 'FODEC (%)', max: 100 },
                  { key: 'tva' as const, label: 'TVA (%)', max: 100 },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#7A8FA6', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{label}</label>
                    <input
                      type="number" min="0" max="100" step="0.1"
                      value={editingOrder[key]}
                      onChange={e => setEditingOrder(prev => prev ? { ...prev, [key]: parseFloat(e.target.value) || 0 } : null)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                      onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
                    />
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: '#7A8FA6', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Produits
                  <button
                    onClick={() => setEditingOrder(prev => prev ? {
                      ...prev, items: [...prev.items, { id: Math.random().toString(36).slice(2), productId: '', productName: '', width: 100, height: 100, quantity: 1, meshType: '', unitPrice: 0, totalPrice: 0 }]
                    } : null)}
                    style={{ background: '#1D3E61', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif' }}
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {editingOrder.items.map((item, idx) => (
                    <div key={item.id} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E8EDF5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#1D3E61' }}>Article {idx + 1}</span>
                        {editingOrder.items.length > 1 && (
                          <button
                            onClick={() => setEditingOrder(prev => prev ? { ...prev, items: prev.items.filter((_, i) => i !== idx) } : null)}
                            style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Minus size={12} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#7A8FA6', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Produit</label>
                          <input
                            value={item.productName}
                            onChange={e => setEditingOrder(prev => prev ? { ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, productName: e.target.value } : it) } : null)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                            onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
                          />
                        </div>
                        {[
                          { key: 'width' as const, label: 'Largeur (cm)' },
                          { key: 'height' as const, label: 'Hauteur (cm)' },
                          { key: 'quantity' as const, label: 'Quantité' },
                          { key: 'unitPrice' as const, label: 'Prix unitaire (mDT)' },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#7A8FA6', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{label}</label>
                            <input
                              type="number" min="0"
                              value={item[key]}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditingOrder(prev => prev ? { ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, [key]: val, totalPrice: key === 'unitPrice' ? val * it.quantity : key === 'quantity' ? it.unitPrice * val : it.totalPrice } : it) } : null);
                              }}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8EDF5', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                              onFocus={e => e.currentTarget.style.borderColor = '#1D3E61'}
                              onBlur={e => e.currentTarget.style.borderColor = '#E8EDF5'}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditingOrder(null)}
                  style={{ padding: '10px 20px', border: '1px solid #DBDADA', borderRadius: '9px', background: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', color: '#7A8FA6' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const saved = updateOrder(editingOrder.id, editingOrder);
                    if (saved) {
                      loadData();
                      setEditingOrder(null);
                      toast.success('Commande modifiée avec succès');
                    }
                  }}
                  style={{ padding: '10px 24px', border: 'none', borderRadius: '9px', background: '#1D3E61', color: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 2px 8px rgba(29,62,97,0.25)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#81C063'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1D3E61'}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
