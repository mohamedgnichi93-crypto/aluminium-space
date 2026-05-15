import React, { useState } from 'react';
import { LayoutDashboard, Loader2 } from 'lucide-react';

interface AuthPanelProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  handleLogin: (e: React.FormEvent) => void;
  authError: string;
  loading: boolean;
}

const AuthPanel: React.FC<AuthPanelProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  authError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleLogin(e);
    setIsSubmitting(false);
  };

  const isDisabled = email.trim() === '' || password.trim() === '' || isSubmitting;

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '64px', height: '64px', background: '#EEF4FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <LayoutDashboard size={32} color="#1D3E61" />
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '24px', color: '#0D1B2A', marginBottom: '8px' }}>Administration</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#6B7280', fontSize: '15px', marginBottom: '16px' }}>Veuillez vous connecter pour accéder au tableau de bord</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#27AE60', fontSize: '13px', fontWeight: 600, marginBottom: '24px', background: '#E8F8F0', padding: '8px', borderRadius: '8px' }}>
          🔒 Connexion sécurisée — Aluminium Space Admin
        </div>

        {authError && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', fontWeight: 500, textAlign: 'left' }}>
            {authError}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '15px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }}
            required
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '15px', marginBottom: '20px', outline: 'none', boxSizing: 'border-box' }}
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={isDisabled}
            style={{
              width: '100%',
              background: isDisabled ? '#C8D9F0' : '#1D3E61',
              color: 'white',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthPanel;
