import { supabase } from './supabase';

export const chatService = {
  async getRooms() {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        teams(name)
      `)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createRoom({ name, type = 'GROUP', team_id }) {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({ name, type, team_id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMessages(room_id, { page = 1, limit = 50 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles(full_name, specialization)
      `)
      .eq('room_id', room_id)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) throw error;

    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room_id);

    return {
      messages: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  },

  async sendMessage(room_id, { content, type = 'TEXT', sender_id, sender_type = 'MEMBER' }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id,
        sender_id,
        sender_type,
        content,
        type,
      })
      .select(`
        *,
        profiles(full_name, specialization)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMessage(message_id) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', message_id);
    if (error) throw error;
  },

  async markAsRead(room_id, user_id) {
    const { error } = await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('room_id', room_id)
      .neq('sender_id', user_id)
      .is('read_at', null);
    if (error) throw error;
  },

  subscribeToMessages(room_id, callback) {
    const subscription = supabase
      .channel(`room:${room_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room_id}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  subscribeToNewRooms(callback) {
    const subscription = supabase
      .channel('rooms')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_rooms',
        },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },
};

export default chatService;