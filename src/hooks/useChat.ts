import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from './useToast';

export interface ChatMessage {
  id: string;
  session_id: string;
  client_name: string;
  sender: 'client' | 'admin';
  content: string;
  created_at: string;
  read_by_admin: boolean;
  read_by_client: boolean;
  client_phone?: string;
  client_email?: string;
  subject?: string;
}

const getSessionId = (): string => {
  let id = localStorage.getItem('chat_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('chat_session_id', id);
  }
  return id;
};

export const useChat = () => {
  const sessionId = getSessionId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = localStorage.getItem('chat_client_name') || '';
  const setClientName = (name: string) => localStorage.setItem('chat_client_name', name);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) console.warn('Chat: failed to load messages', error.message);
    else if (data) setMessages(data as ChatMessage[]);
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, fetchMessages]);

  const sendMessage = async (content: string, name?: string) => {
    const finalName = name || clientName || 'Client';
    if (name) setClientName(name);
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.from('messages').insert({
      session_id: sessionId,
      client_name: finalName,
      sender: 'client',
      content,
    });
    if (error) {
      setError('Erreur lors de l\'envoi');
      toast.error('Message non envoyé. Vérifiez votre connexion.');
    }
    setIsLoading(false);
  };

  const unreadCount = messages.filter(m => m.sender === 'admin' && !m.read_by_client).length;

  return { messages, isLoading, error, sendMessage, sessionId, clientName, setClientName, unreadCount };
};

// Admin hook — all sessions
export const useAdminChat = () => {
  const [sessions, setSessions] = useState<Record<string, ChatMessage[]>>({});
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      const grouped: Record<string, ChatMessage[]> = {};
      (data as ChatMessage[]).forEach(m => {
        if (!grouped[m.session_id]) grouped[m.session_id] = [];
        grouped[m.session_id].push(m);
      });
      setSessions(grouped);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('admin_chat_all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as ChatMessage;
        setSessions(prev => ({
          ...prev,
          [msg.session_id]: [...(prev[msg.session_id] || []), msg],
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const replyToSession = async (sessionId: string, content: string, clientName: string) => {
    await supabase.from('messages').insert({
      session_id: sessionId,
      client_name: clientName,
      sender: 'admin',
      content,
    });
  };

  const markSessionRead = async (sessionId: string) => {
    await supabase.from('messages')
      .update({ read_by_admin: true })
      .eq('session_id', sessionId)
      .eq('sender', 'client');
    setSessions(prev => ({
      ...prev,
      [sessionId]: prev[sessionId]?.map(m =>
        m.sender === 'client' ? { ...m, read_by_admin: true } : m
      ) || [],
    }));
  };

  const unreadSessions = Object.entries(sessions).filter(
    ([, msgs]) => msgs.some(m => m.sender === 'client' && !m.read_by_admin)
  ).length;

  return { sessions, activeSession, setActiveSession, replyToSession, markSessionRead, isLoading, unreadSessions, refetch: fetchAll };
};
