import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Hash, Paperclip, Image, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

const Chat = () => {
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: rooms } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', selectedRoom?.id],
    queryFn: async () => {
      if (!selectedRoom) return [];
      const { data } = await supabase
        .from('chat_messages')
        .select(`
          *,
          team_members(name, specialization)
        `)
        .eq('room_id', selectedRoom.id)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!selectedRoom,
  });

  useEffect(() => {
    if (selectedRoom) {
      const subscription = supabase
        .channel(`room:${selectedRoom.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${selectedRoom.id}`,
          },
          async (payload) => {
            const { data: sender } = await supabase
              .from('team_members')
              .select('name, specialization')
              .eq('id', payload.new.sender_id)
              .single();
            
            queryClient.setQueryData(['chat-messages', selectedRoom.id], (old) => [
              ...(old || []),
              { ...payload.new, team_members: sender },
            ]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedRoom, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user.id,
          sender_type: profile?.role || 'MEMBER',
          content,
          type: 'TEXT',
        })
        .select(`
          *,
          team_members(name, specialization)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setMessage('');
      refetchMessages();
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedRoom) return;
    sendMessageMutation.mutate(message);
  };

  useEffect(() => {
    if (!selectedRoom && rooms?.length > 0) {
      setSelectedRoom(rooms[0]);
    }
  }, [rooms, selectedRoom]);

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 120px)' }}>
      <div style={{ width: '300px', flexShrink: 0 }}>
        <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '16px', padding: '0 4px' }}>
            Chat Rooms
          </h2>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {rooms?.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: selectedRoom?.id === room.id ? 'rgba(30, 64, 175, 0.2)' : 'transparent',
                  border: selectedRoom?.id === room.id ? '1px solid #1e40af' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left',
                }}
              >
                <Hash size={18} color="#94a3b8" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: '#f8fafc',
                    fontWeight: '500',
                    fontSize: '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {room.name}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                    {room.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedRoom ? (
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Hash size={20} color="#94a3b8" />
                <div>
                  <h3 style={{ color: '#f8fafc', fontWeight: '600' }}>{selectedRoom.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                    {selectedRoom.type === 'TEAM' ? 'Team General Chat' : selectedRoom.type}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
                  <Phone size={18} />
                </button>
                <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
                  <Video size={18} />
                </button>
                <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {messages?.map((msg) => {
                const isOwnMessage = msg.sender_id === user.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                      marginBottom: '16px',
                    }}
                  >
                    {!isOwnMessage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Avatar name={msg.team_members?.name || 'User'} size="sm" />
                        <span style={{ color: '#f8fafc', fontSize: '12px', fontWeight: '500' }}>
                          {msg.team_members?.name || 'Unknown'}
                        </span>
                        {msg.team_members?.specialization && (
                          <span style={{ color: '#94a3b8', fontSize: '10px', backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>
                            {msg.team_members.specialization}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isOwnMessage ? '#1e40af' : '#334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      {msg.content}
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '16px',
                borderTop: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
                <Paperclip size={20} />
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} />
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button type="button" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
                <Smile size={20} />
              </button>
              <Button type="submit" disabled={!message.trim()}>
                <Send size={18} />
              </Button>
            </form>
          </Card>
        ) : (
          <Card style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <Hash size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Select a chat room to start messaging</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Chat;