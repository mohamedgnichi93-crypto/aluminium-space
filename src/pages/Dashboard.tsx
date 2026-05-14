import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus, updateOrder, moveToTrash, getTrashedOrders, restoreFromTrash, permanentlyDelete, emptyTrash, cleanOldTrash, syncOrdersFromSupabase, syncTrashedFromSupabase } from '../store/ordersStore';
import type { Order } from '../store/ordersStore';
import { generatePDF } from '../utils/pdfGenerator';
import { toast } from '../hooks/useToast';
import OrderDetailModal from '../components/dashboard/OrderDetailModal';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import AuthPanel from '../components/dashboard/AuthPanel';
import QuickActions from '../components/dashboard/QuickActions';
import KpiCards from '../components/dashboard/KpiCards';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import OrdersTable from '../components/dashboard/OrdersTable';
import MeasureRequestsTable from '../components/dashboard/MeasureRequestsTable';
import TrashTable from '../components/dashboard/TrashTable';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import ChatPanel from '../components/dashboard/ChatPanel';
import EditOrderModal from '../components/dashboard/EditOrderModal';
import PageSEO from '../components/ui/PageSEO';
import {
  LayoutDashboard, ShoppingBag, BarChart3, LogOut,
  Bell, Search, CheckCircle, Clock, Trash2, Eye, FileText, Pencil, Plus, Minus, X as XIcon
} from 'lucide-react';
import { getSettings, saveSettings, resetSettings, type BusinessSettings } from '../store/settingsStore';
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
  const navigate = useNavigate();
  // --- SESSION & AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Security
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);
  const lockoutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- UI STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const [settingsSection, setSettingsSection] = useState<'finances' | 'contact' | 'horaires' | 'legales'>('finances');

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

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <AuthPanel
        password={password}
        lockoutTimer={lockoutTimer}
        setPassword={setPassword}
        handleLogin={handleLogin}
      />
    );
  }

  // --- DASHBOARD LAYOUT ---
  const sidebarWidth = isSidebarCollapsed ? '64px' : '220px';

  return (
    <>
    <PageSEO titleFr="Dashboard — Aluminium Space" path="/dashboard" noIndex />
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F7FB' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* MOBILE OVERLAY */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 39
          }} 
        />
      )}

      {/* SIDEBAR */}
      <DashboardSidebar
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        isSidebarCollapsed={isSidebarCollapsed}
        unreadSessions={unreadSessions}
        trashedOrdersCount={trashedOrders.length}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (isMobile) setSidebarOpen(false);
        }}
        toggleSidebar={toggleSidebar}
        handleLogout={handleLogout}
      />

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
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(prev => !prev)}
          isMobile={isMobile}
          activeTab={activeTab}
          currentTime={currentTime}
          isOnline={isOnline}
          isSyncing={isSyncing}
          handleSync={handleSync}
          handleLogout={handleLogout}
        />

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
              <SettingsPanel
                settings={settings}
                setSettings={setSettings}
                settingsSection={settingsSection}
                setSettingsSection={setSettingsSection}
                saveSettings={saveSettings}
                resetSettings={resetSettings}
                getSettings={getSettings}
                settingsSaved={settingsSaved}
                setSettingsSaved={setSettingsSaved}
              />
            )}

            {activeTab === 'corbeille' ? (
              <TrashTable
                trashedOrders={trashedOrders}
                handleEmptyTrash={handleEmptyTrash}
                handleRestore={handleRestore}
                handlePermanentDelete={handlePermanentDelete}
              />
            ) : activeTab === 'demandes' ? (
              <MeasureRequestsTable />
            ) : activeTab === 'stats' && (
              <>
                <QuickActions setActiveTab={setActiveTab} />

                <KpiCards
                  totalOrders={totalOrders}
                  pendingOrders={pendingOrders}
                  confirmedOrders={confirmedOrders}
                  totalRevenue={totalRevenue}
                  orders={orders}
                  formatDT={formatDT}
                />

                <DashboardCharts
                  orders={orders}
                  activeTab={activeTab}
                  totalOrders={totalOrders}
                  barChartData={barChartData}
                  pieChartData={pieChartData}
                  formatDT={formatDT}
                  COLORS={COLORS}
                />
              </>
            )}

            {activeTab === 'chat' && (
              <ChatPanel
                sessions={sessions}
                activeSession={activeSession}
                setActiveSession={setActiveSession}
                chatLoading={chatLoading}
                chatReply={chatReply}
                setChatReply={setChatReply}
                replyToSession={replyToSession}
                markSessionRead={markSessionRead}
              />
            )}

            {(activeTab === 'dashboard' || activeTab === 'orders') && (
              <>
                {activeTab === 'dashboard' && (
                  <KpiCards
                    totalOrders={totalOrders}
                    pendingOrders={pendingOrders}
                    confirmedOrders={confirmedOrders}
                    totalRevenue={totalRevenue}
                    orders={orders}
                    formatDT={formatDT}
                  />
                )}

                <OrdersTable
                  filteredOrders={filteredOrders}
                  currentItems={currentItems}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  setCurrentPage={setCurrentPage}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  handleStatusChange={handleStatusChange}
                  handleMoveToTrash={handleMoveToTrash}
                  handleDownloadPDF={handleDownloadPDF}
                  setSelectedOrder={setSelectedOrder}
                  setEditingOrder={setEditingOrder}
                  formatDT={formatDT}
                />
              </>
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

      {editingOrder && (
        <EditOrderModal
          editingOrder={editingOrder}
          setEditingOrder={setEditingOrder}
          updateOrder={updateOrder}
          loadData={loadData}
        />
      )}
    </div>
    </>
  );
};

export default Dashboard;
