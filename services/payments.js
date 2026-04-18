import { supabase } from './supabase';

export const paymentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('due_payments')
      .select(`
        *,
        payment_records(
          *,
          profiles(full_name, email)
        )
      `)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('due_payments')
      .select(`
        *,
        payment_records(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ title, amount, due_date, member_ids }) {
    const { data: payment, error } = await supabase
      .from('due_payments')
      .insert({ title, amount, due_date })
      .select()
      .single();

    if (error) throw error;

    if (member_ids?.length > 0) {
      const records = member_ids.map(member_id => ({
        payment_id: payment.id,
        member_id,
        is_paid: false,
      }));
      await supabase.from('payment_records').insert(records);
    }

    return paymentsService.getById(payment.id);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('due_payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('due_payments').delete().eq('id', id);
    if (error) throw error;
  },

  async updateRecord(record_id, { is_paid }) {
    const { data, error } = await supabase
      .from('payment_records')
      .update({ is_paid, paid_at: is_paid ? new Date().toISOString() : null })
      .eq('id', record_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addRecords(payment_id, member_ids) {
    const records = member_ids.map(member_id => ({
      payment_id,
      member_id,
      is_paid: false,
    }));
    const { error } = await supabase.from('payment_records').insert(records);
    if (error) throw error;
  },
};

export default paymentsService;