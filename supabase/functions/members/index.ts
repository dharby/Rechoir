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

    if (action === 'list') {
      const { teamId, search, specialization } = data

      console.log('list action - teamId:', teamId, 'search:', search, 'specialization:', specialization)

      let query = supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('name')

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      if (specialization) {
        query = query.eq('specialization', specialization)
      }

      const { data: members, error } = await query

      console.log('Query result - members:', members, 'error:', error)

      if (error) {
        console.error('Query error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, members }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { memberId } = data

      const { data: member, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, member }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'create') {
      const { email, name, phone, specialization, teamId, accessCode } = data

      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', email)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'A member with this email already exists in your team' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const accessCodeHash = hashCode(accessCode)

      const { data: member, error } = await supabase
        .from('team_members')
        .insert({ 
          email, 
          name, 
          phone, 
          specialization: specialization || 'SINGER',
          team_id: teamId,
          access_code_hash: accessCodeHash,
          has_set_password: false,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'A member with this email already exists' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, member }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'bulk-create') {
      const { members, teamId, accessCode } = data

      const accessCodeHash = hashCode(accessCode)

      const membersToInsert = members.map((m: any) => ({
        email: m.email,
        name: m.name,
        phone: m.phone || null,
        specialization: m.specialization || 'SINGER',
        team_id: teamId,
        access_code_hash: accessCodeHash
      }))

      const { data: created, error } = await supabase
        .from('team_members')
        .upsert(membersToInsert, { onConflict: 'email', ignoreDuplicates: true })
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, members: created, count: membersToInsert.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      const { memberId, name, phone, specialization } = data

      const { data: member, error } = await supabase
        .from('team_members')
        .update({ name, phone, specialization })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, member }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'toggle-access') {
      const { memberId, isActive } = data

      const { data: member, error } = await supabase
        .from('team_members')
        .update({ is_active: isActive })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, member }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      const { memberId } = data

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

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