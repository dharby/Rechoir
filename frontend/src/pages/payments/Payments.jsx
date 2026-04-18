import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, Clock, Check, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';

const Payments = () => {
  const { team } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [viewingPayment, setViewingPayment] = useState(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', team?.id],
     queryFn: async () => {
       if (!team?.id) return [];
       const { data } = await supabase
         .from('due_payments')
         .select(`
           *,
           payment_records(
             *,
             team_members(id, name, email)
           )
         `)
         .eq('team_id', team.id)
         .order('due_date', { ascending: true });
       return data || [];
     },
     enabled: !!team?.id,
  });

  const createMutation = useMutation({
    mutationFn: async ({ title, amount, due_date, member_ids, payment_type, account_name, account_number, bank_name }) => {
      if (!team?.id) {
        throw new Error('No team found. Please login again.');
      }
      
      const { data: payment, error } = await supabase
        .from('due_payments')
        .insert({ 
          title, 
          amount, 
          due_date,
          team_id: team.id,
          payment_type: payment_type || 'GENERAL',
          account_name: account_name || null,
          account_number: account_number || null,
          bank_name: bank_name || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Payment insert error:', error);
        throw new Error(error.message);
      }

      if (member_ids?.length > 0) {
        const records = member_ids.map(member_id => ({
          payment_id: payment.id,
          member_id,
          is_paid: false,
        }));
        await supabase.from('payment_records').insert(records);
      }

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      setShowAddModal(false);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, amount, due_date, payment_type, account_name, account_number, bank_name }) => {
      const { data, error } = await supabase
        .from('due_payments')
        .update({ 
          title, 
          amount, 
          due_date,
          payment_type: payment_type || 'GENERAL',
          account_name: account_name || null,
          account_number: account_number || null,
          bank_name: bank_name || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (paymentId) => {
      await supabase.from('payment_records').delete().eq('payment_id', paymentId);
      const { error } = await supabase.from('due_payments').delete().eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: async ({ recordId, is_paid, amount_paid }) => {
      const { error } = await supabase
        .from('payment_records')
        .update({ is_paid, amount_paid: amount_paid || null })
        .eq('id', recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
    },
  });

   const getStatusBadge = (payment) => {
     const paid = payment.payment_records?.filter(r => r.is_paid).length || 0;
     const total = payment.payment_records?.length || 0;
     
     if (payment.is_verified) {
       return <Badge variant="success">Verified</Badge>;
     }
     
     if (paid === total && total > 0) return <Badge variant="success">Paid</Badge>;
     if (new Date(payment.due_date) < new Date()) return <Badge variant="danger">Overdue</Badge>;
     if (paid > 0) return <Badge variant="warning">Partial</Badge>;
     return <Badge variant="default">Pending</Badge>;
   };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Due Payments
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Track and manage choir payments and dues
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Payment
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>
      ) : payments?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {payments.map((payment) => {
            const paid = payment.payment_records?.filter(r => r.is_paid).length || 0;
            const total = payment.payment_records?.length || 0;
            return (
              <Card key={payment.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <DollarSign size={24} color="#f59e0b" />
                    </div>
                    <div>
                      <h3 style={{ color: '#f8fafc', fontWeight: '600' }}>{payment.title}</h3>
                      {getStatusBadge(payment)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Amount</span>
                  <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '18px' }}>
                    ₦{Number(payment.amount).toLocaleString('en-NG')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
                  <Clock size={14} />
                  Due {format(new Date(payment.due_date), 'MMM d, yyyy')}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Collection Progress</span>
                    <span style={{ color: '#f8fafc', fontSize: '14px' }}>
                      {paid}/{total} paid
                    </span>
                  </div>
                  <ProgressBar value={(paid / total) * 100 || 0} />
                </div>

                <Button variant="ghost" size="sm" style={{ width: '100%' }} onClick={() => setViewingPayment(payment)}>
                  View Details
                </Button>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingPayment(payment)}
                    style={{ flex: 1, color: '#1e40af' }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this payment? This will also delete all payment records.')) {
                        deleteMutation.mutate(payment.id);
                      }
                    }}
                    style={{ flex: 1, color: '#ef4444' }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <DollarSign size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Payments Yet
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Create your first payment to start tracking dues
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Payment
          </Button>
        </Card>
      )}

      <AddPaymentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
      />
      
      <AddPaymentModal
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        onSubmit={(data) => updateMutation.mutate({ id: editingPayment.id, ...data })}
        isLoading={updateMutation.isPending}
        editMode={true}
        payment={editingPayment}
      />

      {viewingPayment && (
        <PaymentDetailsModal
          payment={viewingPayment}
          onClose={() => setViewingPayment(null)}
          updateRecordMutation={updateRecordMutation}
        />
      )}
    </div>
  );
};

const AddPaymentModal = ({ isOpen, onClose, onSubmit, isLoading, editMode = false, payment }) => {
  const [formData, setFormData] = useState(() => {
    if (editMode && payment) {
      return {
        title: payment.title || '',
        amount: payment.amount?.toString() || '',
        due_date: payment.due_date ? payment.due_date.split('T')[0] : '',
        payment_type: payment.payment_type || 'GENERAL',
        account_name: payment.account_name || '',
        account_number: payment.account_number || '',
        bank_name: payment.bank_name || '',
        recurrence: payment.recurrence || 'ONCE',
      };
    }
    return {
      title: '',
      amount: '',
      due_date: '',
      payment_type: 'GENERAL',
      account_name: '',
      account_number: '',
      bank_name: '',
      recurrence: 'ONCE',
    };
  });

   const handleSubmit = (e) => {
     e.preventDefault();
     onSubmit({
       ...formData,
       amount: parseFloat(formData.amount),
       payment_type: formData.payment_type,
       account_name: formData.account_name,
       account_number: formData.account_number,
       bank_name: formData.bank_name,
       recurrence: formData.recurrence,
     });
   };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editMode ? 'Edit Payment' : 'Add Payment'} size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Payment Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Uniform Fee - Easter 2025"
          required
        />
        <Input
          label="Amount (₦)"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />
         <Input
           label="Due Date"
           type="date"
           value={formData.due_date}
           onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
           required
         />
         
         <div>
           <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
             Payment Type
           </label>
           <select
             value={formData.payment_type}
             onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
             style={{
               width: '100%',
               padding: '10px 12px',
               borderRadius: '6px',
               border: '1px solid #334155',
               backgroundColor: '#1e293b',
               color: '#f8fafc',
               fontSize: '14px',
             }}
           >
             <option value="GENERAL">General Offering</option>
             <option value="TITHE">Tithe</option>
             <option value="PROJECT">Project Fund</option>
             <option value="MISSIONS">Missions</option>
             <option value="BUILDING">Building Fund</option>
           </select>
         </div>
         
         <div>
           <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
             Bank Account Details (Optional)
           </label>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
             <Input
               label="Account Name"
               value={formData.account_name}
               onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
             />
             <Input
               label="Account Number"
               value={formData.account_number}
               onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
             />
           </div>
           <Input
             label="Bank Name"
             value={formData.bank_name}
             onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
           />
         </div>
         
         <div>
           <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
             Recurrence
           </label>
           <select
             value={formData.recurrence}
             onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
             style={{
               width: '100%',
               padding: '10px 12px',
               borderRadius: '6px',
               border: '1px solid #334155',
               backgroundColor: '#1e293b',
               color: '#f8fafc',
               fontSize: '14px',
             }}
           >
             <option value="ONCE">One Time</option>
             <option value="MONTHLY">Monthly</option>
             <option value="WEEKLY">Weekly</option>
             <option value="DAILY">Daily</option>
           </select>
         </div>
         
<div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
           <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
             Cancel
           </Button>
           <Button type="submit" isLoading={isLoading} style={{ flex: 1 }}>
             {editMode ? 'Save Changes' : 'Create Payment'}
           </Button>
         </div>
      </form>
    </Modal>
  );
};

const PaymentDetailsModal = ({ payment, onClose, updateRecordMutation }) => {
  const [selectedMember, setSelectedMember] = useState(null);

  const records = payment.payment_records || [];
  const members = records.map(r => r.team_members).filter(Boolean);

  const handleStatusToggle = (recordId, currentStatus) => {
    let newStatus;
    if (currentStatus === 'PAID') {
      newStatus = 'PARTIAL';
    } else if (currentStatus === 'PARTIAL') {
      newStatus = 'NOT_PAID';
    } else {
      newStatus = 'PAID';
    }
    
    const isPaid = newStatus === 'PAID';
    updateRecordMutation.mutate({ recordId, is_paid: isPaid, amount_paid: isPaid ? payment.amount : null });
  };

  const getStatus = (record) => {
    if (record.is_paid) return 'PAID';
    if (record.amount_paid && record.amount_paid > 0) return 'PARTIAL';
    return 'NOT_PAID';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return '#10b981';
      case 'PARTIAL': return '#f59e0b';
      case 'NOT_PAID': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <Modal isOpen={!!payment} onClose={onClose} title={`${payment.title} - Details`} size="lg">
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Amount</span>
            <p style={{ color: '#f8fafc', fontWeight: '600', fontSize: '18px' }}>
              ₦{Number(payment.amount).toLocaleString('en-NG')}
            </p>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Due Date</span>
            <p style={{ color: '#f8fafc', fontWeight: '600' }}>
              {format(new Date(payment.due_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Collected</span>
            <p style={{ color: '#10b981', fontWeight: '600', fontSize: '18px' }}>
              ₦{records.filter(r => r.is_paid).length * payment.amount || 0}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Click status to cycle: Not Paid → Partial → Paid</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            Paid ({records.filter(r => r.is_paid).length})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
            Partial ({records.filter(r => !r.is_paid && r.amount_paid).length})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
            Not Paid ({records.filter(r => !r.is_paid && !r.amount_paid).length})
          </span>
        </div>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Member</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Email</th>
              <th style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No payment records found
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const status = getStatus(record);
                const member = record.team_members;
                return (
                  <tr key={record.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', color: '#f8fafc', fontSize: '14px' }}>
                      {member?.name || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '14px' }}>
                      {member?.email || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleStatusToggle(record.id, status)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: `${getStatusColor(status)}20`,
                          color: getStatusColor(status),
                        }}
                      >
                        {status === 'PAID' && 'Paid'}
                        {status === 'PARTIAL' && 'Partial'}
                        {status === 'NOT_PAID' && 'Not Paid'}
                      </button>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#f8fafc', fontSize: '14px' }}>
                      {record.amount_paid ? `₦${Number(record.amount_paid).toLocaleString('en-NG')}` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default Payments;