import { supabase } from './supabase';

export const uniformsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('uniform_events')
      .select(`
        *,
        uniform_readiness(
          *,
          profiles(full_name, email)
        )
      `)
      .order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('uniform_events')
      .select(`
        *,
        uniform_readiness(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ name, date, description, image_url, team_id, member_ids }) {
    const { data: event, error } = await supabase
      .from('uniform_events')
      .insert({ name, date, description, image_url, team_id })
      .select()
      .single();

    if (error) throw error;

    if (member_ids?.length > 0) {
      const readiness = member_ids.map(member_id => ({
        event_id: event.id,
        member_id,
        is_ready: false,
      }));
      await supabase.from('uniform_readiness').insert(readiness);
    }

    return uniformsService.getById(event.id);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('uniform_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('uniform_events').delete().eq('id', id);
    if (error) throw error;
  },

  async toggleReadiness(readiness_id) {
    const { data: readiness } = await supabase
      .from('uniform_readiness')
      .select('is_ready')
      .eq('id', readiness_id)
      .single();

    const { data, error } = await supabase
      .from('uniform_readiness')
      .update({ is_ready: !readiness.is_ready })
      .eq('id', readiness_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addMembers(event_id, member_ids) {
    const readiness = member_ids.map(member_id => ({
      event_id,
      member_id,
      is_ready: false,
    }));
    const { error } = await supabase.from('uniform_readiness').insert(readiness);
    if (error) throw error;
  },
};

export default uniformsService;