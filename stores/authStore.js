import { create } from 'zustand';
import { supabase } from '../services/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  team: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const storedUser = localStorage.getItem('rechoir_user');
      const storedTeam = localStorage.getItem('rechoir_team');
      
      console.log('AuthStore init - storedUser:', storedUser);
      console.log('AuthStore init - storedTeam:', storedTeam);
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const team = storedTeam ? JSON.parse(storedTeam) : null;
        
        console.log('AuthStore init - parsed user:', user);
        console.log('AuthStore init - parsed team:', team);
        
        set({
          user,
          profile: user,
          team,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  signUp: async ({ email, password, fullName, teamName, phone, role = 'MEMBER' }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        if (role === 'SUPER_ADMIN') {
          const { data: team } = await supabase
            .from('teams')
            .insert({ name: teamName || 'My Choir', code: generateTeamCode() })
            .select()
            .single();

          await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            full_name: fullName,
            phone,
            role: 'SUPER_ADMIN',
            team_id: team?.id,
          });

          const { data: profile } = await supabase
            .from('profiles')
            .select('*, teams(*)')
            .eq('id', data.user.id)
            .single();

          set({ user: data.user, profile, team: profile?.teams });
        } else if (role === 'TEAM_LEAD') {
          const { data: team } = await supabase
            .from('teams')
            .insert({ name: teamName, code: generateTeamCode() })
            .select()
            .single();

          await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            full_name: fullName,
            phone,
            role: 'TEAM_LEAD',
            team_id: team.id,
          });

          await supabase.from('chat_rooms').insert({
            name: 'General',
            type: 'TEAM',
            team_id: team.id,
          });

          const { data: profile } = await supabase
            .from('profiles')
            .select('*, teams(*)')
            .eq('id', data.user.id)
            .single();

          set({ user: data.user, profile, team: profile?.teams });
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  signIn: async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', data.user.id)
          .single();

        set({
          user: data.user,
          profile: profile,
          team: profile?.teams || null,
          isAuthenticated: true,
        });
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  signInWithCode: async ({ email, accessCode }) => {
    try {
      const { data: codeRecord } = await supabase
        .from('member_access_codes')
        .select('*, profiles(*)')
        .eq('access_code', accessCode)
        .single();

      if (!codeRecord || codeRecord.profiles?.email !== email) {
        return { success: false, error: 'Invalid access code' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: accessCode,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', data.user.id)
          .single();

        set({
          user: data.user,
          profile: profile,
          team: profile?.teams || null,
          isAuthenticated: true,
        });
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign in with code error:', error);
      return { success: false, error: error.message };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, team: null, isAuthenticated: false });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    set({ profile: data });
    return { success: true, data };
  },
}));

function generateTeamCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default useAuthStore;