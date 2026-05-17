import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'admin' | 'client';
  content: string;
  created_at: string;
  client_name?: string;
  read_by_admin?: boolean;
  client_phone?: string;
  client_email?: string;
  subject?: string;
}

interface ChatPanelProps {
  sessions: Record<string, ChatMessage[]>;
  activeSession: string | null;
  setActiveSession: (id: string | null) => void;
  chatLoading: boolean;
  chatReply: string;
  setChatReply: (reply: string) => void;
  replyToSession: (sessionId: string, content: string, clientName: string) => Promise<void>;
  markSessionRead: (sessionId: string) => Promise<void>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  sessions,
  activeSession,
  setActiveSession,
  chatLoading,
  chatReply,
  setChatReply,
  replyToSession,
  markSessionRead
}) => {
  return (
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
            {(() => {
              const activeMsgs = sessions[activeSession] || [];
              const firstMsg = activeMsgs[0];
              const phone = firstMsg?.client_phone;
              const email = firstMsg?.client_email;
              const clientName = activeMsgs.find(m => m.client_name)?.client_name || 'Client';
              return (
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8EDF5', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61' }}>
                      {clientName[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1D3E61' }}>
                      {clientName}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#818181', marginTop: '2px' }}>
                      <span>{activeMsgs.length} message(s)</span>
                      {phone && (
                        <>
                          <span style={{ color: '#E8EDF5' }}>|</span>
                          <a href={`tel:${phone}`} style={{ color: '#D97706', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            📞 {phone}
                          </a>
                        </>
                      )}
                      {email && (
                        <>
                          <span style={{ color: '#E8EDF5' }}>|</span>
                          <a href={`mailto:${email}`} style={{ color: '#6B7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            📧 {email}
                          </a>
                        </>
                      )}
                      {phone && (
                        <>
                          <span style={{ color: '#E8EDF5' }}>|</span>
                          <a href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10B981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            💬 WhatsApp
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

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
  );
};

export default ChatPanel;
