import { supabase } from './supabase';

export const membersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ email, full_name, phone, specialization = 'SINGER' }) {
    const { data: code } = await supabase
      .from('member_access_codes')
      .select('access_code')
      .limit(1);

    const accessCode = Math.random().toString().slice(2, 8).padStart(6, '0');

    const { data: authData } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name, specialization },
    });

    if (authData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name,
          phone,
          specialization,
          role: 'MEMBER',
          has_set_password: false,
        })
        .select()
        .single();

      if (profile) {
        await supabase.from('member_access_codes').insert({
          member_id: profile.id,
          access_code: accessCode,
        });
      }

      return { profile, accessCode };
    }
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async toggleAccess(id) {
    const { data: member } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: !member.is_active })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async regenerateCode(id) {
    const newCode = Math.random().toString().slice(2, 8).padStart(6, '0');

    const { data: existing } = await supabase
      .from('member_access_codes')
      .select('member_id')
      .eq('member_id', id)
      .single();

    if (existing) {
      await supabase
        .from('member_access_codes')
        .update({ access_code: newCode })
        .eq('member_id', id);
    } else {
      await supabase.from('member_access_codes').insert({
        member_id: id,
        access_code: newCode,
      });
    }

    return newCode;
  },

  async bulkImport(members) {
    const results = { imported: [], errors: [] };

    for (const member of members) {
      try {
        const accessCode = Math.random().toString().slice(2, 8).padStart(6, '0');

        const { data: authData } = await supabase.auth.admin.createUser({
          email: member.email,
          email_confirm: true,
          user_metadata: { full_name: member.name },
        });

        if (authData.user) {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            email: member.email,
            full_name: member.name,
            phone: member.phone || null,
            specialization: member.specialization || 'SINGER',
            role: 'MEMBER',
          });

          await supabase.from('member_access_codes').insert({
            member_id: authData.user.id,
            access_code: accessCode,
          });

          results.imported.push(member);
        }
      } catch (error) {
        results.errors.push({ member, error: error.message });
      }
    }

    return results;
  },
};

export default membersService;