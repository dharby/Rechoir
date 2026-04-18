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

    if (action === 'register') {
      const { email, password, name, phone, teamCode } = data

      const { data: team } = await supabase
        .from('teams')
        .select('id, name')
        .eq('code', teamCode)
        .single()

      if (!team) {
        return new Response(
          JSON.stringify({ error: 'Invalid team code' }),
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
          JSON.stringify({ error: 'Email already registered' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const accessCode = Math.floor(100000 + Math.random() * 900000).toString()

      const { error } = await supabase
        .from('team_leads')
        .insert({ email, password_hash: password, name, phone, team_id: team.id, access_code: accessCode })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          accessCode,
          team: { id: team.id, name: team.name }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'login') {
      const { email, password } = data

      const { data: lead } = await supabase
        .from('team_leads')
        .select('id, email, name, phone, team_id, password_hash, is_active, access_code')
        .eq('email', email)
        .single()

      if (!lead || lead.password_hash !== password) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!lead.is_active) {
        return new Response(
          JSON.stringify({ error: 'Account has been disabled' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: team } = await supabase
        .from('teams')
        .select('id, name, code')
        .eq('id', lead.team_id)
        .single()

      const token = btoa(JSON.stringify({ id: lead.id, email: lead.email, role: 'TEAM_LEAD', teamId: lead.team_id }))

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: lead.id, 
            email: lead.email, 
            name: lead.name, 
            phone: lead.phone,
            role: 'TEAM_LEAD',
            teamId: lead.team_id
          },
          team,
          accessCode: lead.access_code,
          token
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify-email') {
      const { email } = data

      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: lead } = await supabase
        .from('team_leads')
        .select('id, email')
        .eq('email', email)
        .single()

      if (!lead) {
        return new Response(
          JSON.stringify({ exists: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ exists: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'set-password') {
      const { memberId, email, newPassword } = data

      if (memberId) {
        const { error } = await supabase
          .from('team_members')
          .update({ password_hash: newPassword, has_set_password: true })
          .eq('id', memberId)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else if (email && newPassword) {
        const { error } = await supabase
          .from('team_leads')
          .update({ password_hash: newPassword })
          .eq('email', email)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'change-password') {
      const { email, currentPassword, newPassword } = data

      if (!email || !currentPassword || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: lead } = await supabase
        .from('team_leads')
        .select('password_hash')
        .eq('email', email)
        .single()

      if (!lead) {
        return new Response(
          JSON.stringify({ error: 'Team lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (lead.password_hash !== currentPassword) {
        return new Response(
          JSON.stringify({ error: 'Current password is incorrect' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('team_leads')
        .update({ password_hash: newPassword })
        .eq('email', email)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get-access-code') {
      const { teamId } = data

      const { data: lead } = await supabase
        .from('team_leads')
        .select('access_code')
        .eq('team_id', teamId)
        .single()

      if (!lead) {
        return new Response(
          JSON.stringify({ error: 'Team lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ accessCode: lead.access_code }),
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