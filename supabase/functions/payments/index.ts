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
      const { data: payments, error } = await supabase
        .from('due_payments')
        .select('*')
        .eq('team_id', teamId)
        .order('due_date', { ascending: true })

      if (error) throw error

      const paymentsWithRecords = await Promise.all(
        (payments || []).map(async (payment: any) => {
          const { data: records } = await supabase
            .from('payment_records')
            .select('*, team_members(id, name, email)')
            .eq('payment_id', payment.id)
          
          const paidCount = records?.filter((r: any) => r.is_paid).length || 0
          const totalCount = records?.length || 0
          
          return { 
            ...payment, 
            records,
            progress: totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0,
            paidCount,
            totalCount
          }
        })
      )

      return new Response(
        JSON.stringify({ success: true, payments: paymentsWithRecords }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { paymentId } = data
      const { data: payment, error } = await supabase
        .from('due_payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (error) throw error

      const { data: records } = await supabase
        .from('payment_records')
        .select('*, team_members(id, name, email)')
        .eq('payment_id', paymentId)

      return new Response(
        JSON.stringify({ success: true, payment: { ...payment, records } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

     if (action === 'create') {
       const { title, amount, dueDate, teamId, memberIds, paymentType, accountName, accountNumber, bankName, recurrence } = data
       
       const { data: payment, error } = await supabase
         .from('due_payments')
         .insert({ title, amount, due_date: dueDate, team_id: teamId, payment_type: paymentType, account_name: accountName, account_number: accountNumber, bank_name: bankName, recurrence: recurrence })
         .select()
         .single()

      if (error) throw error

      if (memberIds && memberIds.length > 0) {
        const records = memberIds.map((memberId: string) => ({
          payment_id: payment.id,
          member_id: memberId,
          is_paid: false
        }))

        await supabase.from('payment_records').insert(records)
      }

      return new Response(
        JSON.stringify({ success: true, payment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      const { paymentId, title, amount, dueDate } = data
      const { data: payment, error } = await supabase
        .from('due_payments')
        .update({ title, amount, due_date: dueDate })
        .eq('id', paymentId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, payment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      const { paymentId } = data
      const { error } = await supabase.from('due_payments').delete().eq('id', paymentId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update-record') {
      const { recordId, isPaid, paidAt } = data
      const { data: record, error } = await supabase
        .from('payment_records')
        .update({ is_paid: isPaid, paid_at: paidAt || (isPaid ? new Date().toISOString() : null) })
        .eq('id', recordId)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, record }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})