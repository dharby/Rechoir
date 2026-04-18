import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, ...data } = await req.json()

    if (action === 'list') {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id, name, code, created_at,
          team_leads(id, name, email, phone),
          super_admins(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const teamsWithCounts = await Promise.all(
        (teams || []).asyncMap(async (team: any) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)

          return { ...team, memberCount: count || 0 }
        })
      )

      return new Response(
        JSON.stringify({ success: true, teams: teamsWithCounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { teamId } = data

      const { data: team, error } = await supabase
        .from('teams')
        .select(`
          id, name, code, created_at, updated_at,
          team_leads(id, name, email, phone),
          super_admins(id, name, email)
        `)
        .eq('id', teamId)
        .single()

      if (error) throw error

      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)

      return new Response(
        JSON.stringify({ success: true, team: { ...team, memberCount } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'create') {
      const { name, superAdminId } = data

      const teamCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      const { data: team, error } = await supabase
        .from('teams')
        .insert({ name, code: teamCode, super_admin_id: superAdminId })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, team }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      const { teamId, name } = data

      const { data: team, error } = await supabase
        .from('teams')
        .update({ name })
        .eq('id', teamId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, team }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      const { teamId } = data

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

declare global {
  interface Array<T> {
    asyncMap(callback: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>
  }
}

Array.prototype.asyncMap = async function<T>(callback: (item: T, index: number, array: T[]) => Promise<any>) {
  return Promise.all(this.map(callback))
}