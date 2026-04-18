import { supabase } from './supabase';

export const checklistsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('weekly_checklists')
      .select(`
        *,
        checklist_items(
          *,
          profiles(full_name, email)
        )
      `)
      .order('week_start_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('weekly_checklists')
      .select(`
        *,
        checklist_items(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ title, week_start_date, team_id, items }) {
    const { data: checklist, error } = await supabase
      .from('weekly_checklists')
      .insert({ title, week_start_date, team_id })
      .select()
      .single();

    if (error) throw error;

    if (items?.length > 0) {
      const checklistItems = items.map(item => ({
        checklist_id: checklist.id,
        member_id: item.member_id,
        description: item.description,
        is_completed: false,
      }));
      await supabase.from('checklist_items').insert(checklistItems);
    }

    return checklistsService.getById(checklist.id);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('weekly_checklists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('weekly_checklists').delete().eq('id', id);
    if (error) throw error;
  },

  async addItem(checklist_id, { member_id, description }) {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({ checklist_id, member_id, description, is_completed: false })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async toggleItem(item_id) {
    const { data: item } = await supabase
      .from('checklist_items')
      .select('is_completed')
      .eq('id', item_id)
      .single();

    const { data, error } = await supabase
      .from('checklist_items')
      .update({ is_completed: !item.is_completed, completed_at: !item.is_completed ? new Date().toISOString() : null })
      .eq('id', item_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteItem(item_id) {
    const { error } = await supabase.from('checklist_items').delete().eq('id', item_id);
    if (error) throw error;
  },

  async getMemberItems(memberId) {
    const { data, error } = await supabase
      .from('checklist_items')
      .select(`
        *,
        weekly_checklists(title, week_start_date)
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

export default checklistsService;