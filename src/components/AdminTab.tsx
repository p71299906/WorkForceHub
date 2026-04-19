import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { Employee, LeaveRequest } from '../types';
import { Users, DollarSign, Download, Edit2, Check, X, Shield, TrendingUp } from 'lucide-react';
import { exportToExcel } from '../lib/excel';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminTab() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [tempSalary, setTempSalary] = useState<number>(0);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    const unsubEmp = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    });

    const unsubLeaves = onSnapshot(collection(db, 'leaveRequests'), (snap) => {
      setLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest)));
    });

    return () => { unsubEmp(); unsubLeaves(); };
  }, []);

  const handleSalaryUpdate = async (id: string) => {
    await updateDoc(doc(db, 'employees', id), {
      salary: Number(tempSalary)
    });
    setEditingId(null);
  };

  const handleRoleUpdate = async (id: string, newRole: any) => {
    if (confirm(`Change role to ${newRole}? This affects system permissions.`)) {
      await updateDoc(doc(db, 'employees', id), {
        role: newRole
      });
      setEditingRole(null);
    }
  };

  const handleExport = () => {
    exportToExcel(leaves, employees);
  };

  // Performance monitoring mock data (aggregating attendance or roles)
  const chartData = [
    { name: 'Managers', count: employees.filter(e => e.role === 'Manager').length },
    { name: 'Employees', count: employees.filter(e => e.role === 'Employee').length },
    { name: 'Active', count: employees.filter(e => e.isClockedIn).length },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Executive Command</h2>
          <p className="text-text-dim font-medium">Monitor performance and manage employee logistics.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-success-green/20 text-success-green px-6 py-2.5 rounded-xl font-bold hover:bg-success-green/30 transition-all border border-success-green/30 shadow-lg shadow-success-green/10"
          >
            <Download className="w-5 h-5" />
            Export Protocol
          </button>
        )}
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card">
          <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <TrendingUp className="w-4 h-4 text-accent-indigo" />
            Identity Metrics
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#34d399' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card text-center flex flex-col items-center justify-center gap-2">
            <Users className="w-8 h-8 text-accent-indigo" />
            <p className="text-4xl font-black text-white tracking-tighter">{employees.length}</p>
            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Total Units</p>
          </div>
          <div className="glass-card text-center flex flex-col items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-success-green" />
            <p className="text-4xl font-black text-white tracking-tighter">{employees.filter(e => e.isClockedIn).length}</p>
            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Active Ops</p>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="glass-card !p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10 text-white">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Personnel</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Clearance</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Division</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Credits</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-5">
                  <p className="font-bold text-white">{emp.name}</p>
                  <p className="text-[10px] text-text-dim uppercase tracking-widest font-mono">{emp.email}</p>
                </td>
                <td className="px-6 py-5">
                  {isAdmin ? (
                    editingRole === emp.id ? (
                      <select 
                        className="glass-input !py-1 !px-2 text-[10px] font-black uppercase tracking-widest appearance-none"
                        value={emp.role}
                        onChange={(e) => handleRoleUpdate(emp.id, e.target.value)}
                        onBlur={() => setEditingRole(null)}
                      >
                        <option value="Employee" className="bg-slate-900">Employee</option>
                        <option value="Manager" className="bg-slate-900">Manager</option>
                        <option value="CEO" className="bg-slate-900">CEO</option>
                      </select>
                    ) : (
                      <button 
                        onClick={() => setEditingRole(emp.id)}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${
                          emp.role === 'CEO' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' :
                          emp.role === 'Manager' ? 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20' :
                          'bg-white/5 text-white/50 border-white/10'
                        }`}
                      >
                        {emp.role}
                      </button>
                    )
                  ) : (
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                      emp.role === 'CEO' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' :
                      emp.role === 'Manager' ? 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20' :
                      'bg-white/5 text-white/50 border-white/10'
                    }`}>
                      {emp.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-5 text-xs font-bold text-white/80 uppercase tracking-wider">{emp.department}</td>
                <td className="px-6 py-5">
                  {isAdmin ? (
                    editingId === emp.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="glass-input !py-1 !px-2 w-24 text-sm"
                          value={tempSalary}
                          onChange={e => setTempSalary(Number(e.target.value))}
                        />
                        <button onClick={() => handleSalaryUpdate(emp.id)} className="text-success-green"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/salary">
                        <span className="font-mono text-white font-bold text-sm">${emp.salary.toLocaleString()}</span>
                        <button 
                          onClick={() => { setEditingId(emp.id); setTempSalary(emp.salary); }}
                          className="p-1 opacity-0 group-hover/salary:opacity-100 text-white/20 hover:text-accent-indigo transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="text-text-dim italic font-black text-[10px] uppercase tracking-widest">Restricted</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${emp.isClockedIn ? 'text-success-green' : 'text-text-dim'}`}>
                    <span className={`w-2 h-2 rounded-full ${emp.isClockedIn ? 'bg-success-green shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse' : 'bg-white/10'}`}></span>
                    {emp.isClockedIn ? 'Linked' : 'Offline'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
