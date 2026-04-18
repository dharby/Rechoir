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
      const { teamId } = data
      const { data: chains, error } = await supabase
        .from('prayer_chains')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const chainsWithAssignments = await Promise.all(
        (chains || []).map(async (chain: any) => {
          const { data: assignments } = await supabase
            .from('prayer_chain_assignments')
            .select('*, team_members(id, name, email, phone)')
            .eq('chain_id', chain.id)
          
          return { ...chain, assignments }
        })
      )

      return new Response(
        JSON.stringify({ success: true, prayerChains: chainsWithAssignments }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { chainId } = data
      const { data: chain, error } = await supabase
        .from('prayer_chains')
        .select('*')
        .eq('id', chainId)
        .single()

      if (error) throw error

      const { data: assignments } = await supabase
        .from('prayer_chain_assignments')
        .select('*, team_members(id, name, email, phone)')
        .eq('chain_id', chainId)

      return new Response(
        JSON.stringify({ success: true, chain: { ...chain, assignments } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

     if (action === 'create') {
       const { name, description, type, startDate, endDate, teamId, dayOption, startTime, endTime } = data
       const { data: chain, error } = await supabase
         .from('prayer_chains')
         .insert({ name, description, type, start_date: startDate, end_date: endDate, team_id: teamId, day_option: dayOption, start_time: startTime, end_time: endTime })
         .select()
         .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, prayerChain: chain }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      const { chainId, name, description, type, startDate, endDate } = data
      const { data: chain, error } = await supabase
        .from('prayer_chains')
        .update({ name, description, type, start_date: startDate, end_date: endDate })
        .eq('id', chainId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, prayerChain: chain }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      const { chainId } = data
      const { error } = await supabase.from('prayer_chains').delete().eq('id', chainId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'add-assignment') {
      const { chainId, memberId, scheduledTime } = data
      const { data: assignment, error } = await supabase
        .from('prayer_chain_assignments')
        .insert({ chain_id: chainId, member_id: memberId, scheduled_time: scheduledTime })
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, assignment }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update-assignment') {
      const { assignmentId, scheduledTime, status } = data
      const { data: assignment, error } = await supabase
        .from('prayer_chain_assignments')
        .update({ scheduled_time: scheduledTime, status })
        .eq('id', assignmentId)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, assignment }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'complete') {
      const { chainId } = data
      const { error } = await supabase
        .from('prayer_chain_assignments')
        .update({ status: 'COMPLETED' })
        .eq('chain_id', chainId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})