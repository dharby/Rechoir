import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function hashCode(code: string): string {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
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

    if (action === 'register') {
      const { email, password, name, teamName, phone } = data

      const { data: existingAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('email', email)
        .single()

      if (existingAdmin) {
        return new Response(
          JSON.stringify({ error: 'Email already registered in super_admins' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: existingLead } = await supabase
        .from('team_leads')
        .select('id')
        .eq('email', email)
        .single()

      if (existingLead) {
        return new Response(
          JSON.stringify({ error: 'Email already registered in team_leads' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const teamCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      const accessCode = generateAccessCode()

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName, code: teamCode })
        .select()
        .single()

      if (teamError) {
        return new Response(
          JSON.stringify({ error: teamError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: admin, error: adminError } = await supabase
        .from('super_admins')
        .insert({ email, password_hash: password, name })
        .select()
        .single()

      if (adminError) {
        await supabase.from('teams').delete().eq('id', team.id)
        return new Response(
          JSON.stringify({ error: adminError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabase
        .from('team_leads')
        .insert({ email, password_hash: password, name, phone, team_id: team.id, access_code: accessCode })

      await supabase
        .from('chat_rooms')
        .insert({ name: 'General', type: 'TEAM', team_id: team.id })

      const token = btoa(JSON.stringify({ id: admin.id, email: admin.email, name: admin.name, role: 'SUPER_ADMIN' }))

      return new Response(
        JSON.stringify({ 
          success: true, 
          team: { id: team.id, name: team.name, code: teamCode },
          accessCode,
          user: { id: admin.id, email: admin.email, name: admin.name, role: 'SUPER_ADMIN' },
          token
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'login') {
      const { email, password } = data

      const { data: admin } = await supabase
        .from('super_admins')
        .select('id, email, name, password_hash')
        .eq('email', email)
        .single()

      if (!admin || admin.password_hash !== password) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Try to get team from super_admins -> teams
      const { data: adminTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('super_admin_id', admin.id)
        .single()

      // Also try team_leads
      const { data: teamLead } = await supabase
        .from('team_leads')
        .select('team_id, access_code')
        .eq('email', email)
        .single()

      let team = adminTeam
      let accessCode = teamLead?.access_code || null

      // If team_leads has a different team, use that
      if (teamLead?.team_id && (!team || team.id !== teamLead.team_id)) {
        const { data: leadTeam } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamLead.team_id)
          .single()
        if (leadTeam) {
          team = leadTeam
        }
      }

      const token = btoa(JSON.stringify({ id: admin.id, email: admin.email, role: 'SUPER_ADMIN' }))

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { id: admin.id, email: admin.email, name: admin.name, role: 'SUPER_ADMIN' },
          team,
          accessCode,
          token
        }),
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