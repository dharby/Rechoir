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
      const { teamId, weekStartDate } = data
      let query = supabase
        .from('weekly_checklists')
        .select('*')
        .eq('team_id', teamId)
        .order('week_start_date', { ascending: false })

      if (weekStartDate) query = query.eq('week_start_date', weekStartDate)

      const { data: checklists, error } = await query
      if (error) throw error

      const checklistsWithItems = await Promise.all(
        (checklists || []).map(async (checklist: any) => {
          const { data: items } = await supabase
            .from('checklist_items')
            .select('*, team_members(id, name, email)')
            .eq('checklist_id', checklist.id)
          
          return { ...checklist, items }
        })
      )

      return new Response(
        JSON.stringify({ success: true, checklists: checklistsWithItems }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { checklistId } = data
      const { data: checklist, error } = await supabase
        .from('weekly_checklists')
        .select('*')
        .eq('id', checklistId)
        .single()

      if (error) throw error

      const { data: items } = await supabase
        .from('checklist_items')
        .select('*, team_members(id, name, email)')
        .eq('checklist_id', checklistId)

      return new Response(
        JSON.stringify({ success: true, checklist: { ...checklist, items } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'create') {
      const { title, weekStartDate, teamId, memberIds, items } = data
      
      const { data: checklist, error } = await supabase
        .from('weekly_checklists')
        .insert({ title, week_start_date: weekStartDate, team_id: teamId })
        .select()
        .single()

      if (error) throw error

      if (items && items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          checklist_id: checklist.id,
          description: item.description,
          member_id: item.memberId
        }))
        await supabase.from('checklist_items').insert(itemsToInsert)
      }

      return new Response(
        JSON.stringify({ success: true, checklist }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'toggle-item') {
      const { itemId } = data
      
      const { data: existing } = await supabase
        .from('checklist_items')
        .select('is_completed')
        .eq('id', itemId)
        .single()

      const newStatus = !existing?.is_completed
      
      const { data: item, error } = await supabase
        .from('checklist_items')
        .update({ 
          is_completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, item }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
      const { checklistId } = data
      const { error } = await supabase.from('weekly_checklists').delete().eq('id', checklistId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})