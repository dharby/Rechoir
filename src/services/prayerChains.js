import { supabase } from './supabase';

export const prayerChainsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('prayer_chains')
      .select(`
        *,
        prayer_chain_assignments(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('prayer_chains')
      .select(`
        *,
        prayer_chain_assignments(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ name, description, type, start_date, end_date, member_ids }) {
    const { data: chain, error } = await supabase
      .from('prayer_chains')
      .insert({ name, description, type, start_date, end_date })
      .select()
      .single();

    if (error) throw error;

    if (member_ids?.length > 0) {
      const assignments = member_ids.map(member_id => ({
        chain_id: chain.id,
        member_id,
        status: 'ACTIVE',
      }));
      await supabase.from('prayer_chain_assignments').insert(assignments);
    }

    return prayerChainsService.getById(chain.id);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('prayer_chains')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('prayer_chains').delete().eq('id', id);
    if (error) throw error;
  },

  async addAssignment(chain_id, { member_id, scheduled_time }) {
    const { data, error } = await supabase
      .from('prayer_chain_assignments')
      .insert({ chain_id, member_id, scheduled_time, status: 'ACTIVE' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAssignment(assignment_id, updates) {
    const { data, error } = await supabase
      .from('prayer_chain_assignments')
      .update(updates)
      .eq('id', assignment_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async complete(chain_id) {
    await supabase
      .from('prayer_chain_assignments')
      .update({ status: 'COMPLETED' })
      .eq('chain_id', chain_id);

    const { data, error } = await supabase
      .from('prayer_chains')
      .update({ end_date: new Date().toISOString() })
      .eq('id', chain_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export default prayerChainsService;