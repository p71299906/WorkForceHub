import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { LeaveRequest, LeaveStatus } from '../types';
import { Calendar, Plus, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export default function LeavesTab() {
  const { employee, isManager } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!employee) return;

    let q;
    if (isManager) {
      q = query(collection(db, 'leaveRequests'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'leaveRequests'), where('employeeId', '==', employee.id), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
      setLeaves(data);
    });

    return () => unsubscribe();
  }, [employee, isManager]);

  const updateStatus = async (id: string, status: LeaveStatus) => {
    await updateDoc(doc(db, 'leaveRequests', id), {
      status,
      approvedBy: employee?.name || 'Manager'
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Clearance Requests</h2>
          <p className="text-text-dim font-medium">Submit and track your time-off requests.</p>
        </div>
        {!isManager && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-accent-indigo text-white px-6 py-2.5 rounded-xl font-bold hover:bg-accent-indigo/80 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Request Leave
          </button>
        )}
      </div>

      <div className="glass-card !p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10 text-white">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Personnel</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Category</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Schedule</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Status</th>
              {isManager && <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Auth</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-text-dim font-medium uppercase tracking-widest text-xs">No active request records found.</td>
              </tr>
            ) : (
              leaves.map(leave => (
                <tr key={leave.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5">
                    <p className="font-bold text-white text-sm">{leave.employeeName}</p>
                    <p className="text-[10px] text-text-dim uppercase tracking-wider">{leave.type}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-white/80 font-medium">{leave.type}</td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-white/30" />
                      {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd')}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                      leave.status === 'approved' ? 'bg-success-green/10 text-success-green border-success-green/20' :
                      leave.status === 'rejected' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                      'bg-orange-400/10 text-orange-400 border-orange-400/20'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  {isManager && (
                    <td className="px-6 py-5">
                      {leave.status === 'pending' && (
                        <div className="flex gap-2 text-white">
                          <button onClick={() => updateStatus(leave.id, 'approved')} className="p-2.5 bg-success-green/20 text-success-green border border-success-green/30 rounded-lg hover:bg-success-green/30 transition-all"><Check className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(leave.id, 'rejected')} className="p-2.5 bg-red-400/20 text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/30 transition-all"><X className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && <AddLeaveModal onClose={() => setShowAddModal(false)} employee={employee!} />}
    </motion.div>
  );
}

function AddLeaveModal({ onClose, employee }: any) {
  const [formData, setFormData] = useState({
    type: 'Sick Leave',
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'leaveRequests'), {
      ...formData,
      employeeId: employee.id,
      employeeName: employee.name,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-3xl w-full max-w-md shadow-2xl overflow-hidden !border-white/20">
        <div className="bg-white/10 p-6 text-white text-center border-b border-white/10"><h3 className="text-xl font-black uppercase tracking-tighter">Submit Request</h3></div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Leave Classification</label>
            <select className="glass-input w-full appearance-none select-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option value="Sick Leave" className="bg-slate-900">Sick Leave</option>
              <option value="Annual Leave" className="bg-slate-900">Annual Leave</option>
              <option value="Personal Leave" className="bg-slate-900">Personal Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Deployment Start</label>
              <input type="date" required className="glass-input w-full" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">End Date</label>
              <input type="date" required className="glass-input w-full" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Operational Justification</label>
            <textarea className="glass-input w-full h-24 resize-none" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
          </div>
          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-text-dim hover:text-white transition-colors uppercase tracking-widest text-xs">Cancel</button>
            <button type="submit" className="flex-1 py-4 bg-accent-indigo font-black text-white rounded-xl shadow-lg shadow-accent-indigo/30 hover:bg-accent-indigo/80 transition-all uppercase tracking-widest text-xs">Transmit</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
