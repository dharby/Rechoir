import { supabase } from './supabase';

export const rehearsalsService = {
  async getAll(startDate, endDate) {
    let query = supabase
      .from('rehearsals')
      .select(`
        *,
        attendance(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .order('date', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('rehearsals')
      .select(`
        *,
        attendance(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ title, date, start_time, end_time, location, agenda, team_id }) {
    const { data: rehearsal, error } = await supabase
      .from('rehearsals')
      .insert({ title, date, start_time, end_time, location, agenda, team_id })
      .select()
      .single();

    if (error) throw error;

    const { data: members } = await supabase
      .from('profiles')
      .select('id')
      .eq('team_id', team_id)
      .eq('is_active', true);

    if (members?.length > 0) {
      const attendanceRecords = members.map(m => ({
        rehearsal_id: rehearsal.id,
        member_id: m.id,
        status: 'ABSENT',
      }));
      await supabase.from('attendance').insert(attendanceRecords);
    }

    return rehearsalsService.getById(rehearsal.id);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('rehearsals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('rehearsals').delete().eq('id', id);
    if (error) throw error;
  },

  async markAttendance(rehearsal_id, member_id, { status, arrival_time }) {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        rehearsal_id,
        member_id,
        status,
        arrival_time: arrival_time || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAttendanceReport(memberId) {
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select(`
        *,
        rehearsals(title, date)
      `)
      .eq('member_id', memberId)
      .order('rehearsals.date', { ascending: false });

    if (error) throw error;
    return attendance || [];
  },
};

export default rehearsalsService;