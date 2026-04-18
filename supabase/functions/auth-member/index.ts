import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    if (action === 'login') {
      const { email, accessCode } = data

      const { data: member } = await supabase
        .from('team_members')
        .select('id, email, name, phone, specialization, team_id, is_active, has_set_password, access_code_hash')
        .eq('email', email)
        .single()

      if (!member) {
        return new Response(
          JSON.stringify({ error: 'Member not found. Contact your team lead for access.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const codeHash = hashCode(accessCode)
      if (member.access_code_hash !== codeHash) {
        return new Response(
          JSON.stringify({ error: 'Invalid access code' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!member.is_active) {
        return new Response(
          JSON.stringify({ error: 'Your access has been disabled. Contact your team lead.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: team } = await supabase
        .from('teams')
        .select('id, name, code')
        .eq('id', member.team_id)
        .single()

      const { data: teamLead } = await supabase
        .from('team_leads')
        .select('name')
        .eq('team_id', member.team_id)
        .single()

      const token = btoa(JSON.stringify({ id: member.id, email: member.email, role: 'MEMBER', teamId: member.team_id }))

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: member.id, 
            email: member.email, 
            name: member.name, 
            phone: member.phone,
            specialization: member.specialization,
            role: 'MEMBER',
            teamId: member.team_id,
            hasSetPassword: member.has_set_password
          },
          team,
          teamLeadName: teamLead?.name,
          token
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'set-password') {
      const { memberId, newPassword } = data

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