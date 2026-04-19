import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { Task, TaskStatus, TaskPriority } from '../types';
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus, Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export default function TasksTab() {
  const { employee, isManager } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (!employee) return;

    let q;
    if (isManager) {
      // Managers see all tasks they assigned or are assigned to
      q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    } else {
      // Employees see only their tasks
      q = query(collection(db, 'tasks'), where('assigneeId', '==', employee.id));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(data);
    });

    if (isManager) {
      const empUnsub = onSnapshot(collection(db, 'employees'), (snap) => {
        setEmployees(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      });
      return () => { unsubscribe(); empUnsub(); };
    }

    return () => unsubscribe();
  }, [employee, isManager]);

  const toggleStatus = async (task: Task) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      'todo': 'in_progress',
      'in_progress': 'completed',
      'completed': 'todo'
    };
    await updateDoc(doc(db, 'tasks', task.id), {
      status: nextStatus[task.status]
    });
  };

  const deleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Operations Queue</h2>
          <p className="text-text-dim font-medium">Manage and track your project responsibilities.</p>
        </div>
        {isManager && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-accent-indigo text-white px-6 py-2.5 rounded-xl font-bold hover:bg-accent-indigo/80 transition-all shadow-lg shadow-accent-indigo/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Assign Task
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-text-dim font-medium uppercase tracking-widest text-xs">
            No active assignments in queue.
          </div>
        ) : (
          tasks.map(task => (
            <motion.div 
              key={task.id}
              layout
              className="glass-card flex items-center gap-5 group !p-5"
            >
              <button 
                onClick={() => toggleStatus(task)}
                className={`flex-shrink-0 transition-colors ${task.status === 'completed' ? 'text-success-green' : 'text-white/20 hover:text-accent-indigo'}`}
              >
                {task.status === 'completed' ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className={`font-bold text-white text-lg truncate ${task.status === 'completed' ? 'line-through opacity-30 font-medium' : ''}`}>
                    {task.title}
                  </h3>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                    task.priority === 'high' ? 'bg-red-400/10 text-red-400 border-red-400/20' : 
                    task.priority === 'medium' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' : 
                    'bg-white/5 text-white/50 border-white/10'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-[11px] font-bold text-text-dim uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Deadline: {format(new Date(task.dueDate), 'MMM dd')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Agent: {task.assigneeName}
                  </span>
                </div>
              </div>

              {isManager && (
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>

      {showAddModal && (
        <AddTaskModal 
          onClose={() => setShowAddModal(false)} 
          employees={employees} 
          currentUserId={employee!.id}
          currentUserName={employee!.name}
        />
      )}
    </motion.div>
  );
}

function AddTaskModal({ onClose, employees, currentUserId, currentUserName }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as TaskPriority,
    dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignee = employees.find((emp: any) => emp.id === formData.assigneeId);
    
    await addDoc(collection(db, 'tasks'), {
      ...formData,
      assigneeName: assignee?.name || 'Unknown',
      managerId: currentUserId,
      managerName: currentUserName,
      status: 'todo',
      createdAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel rounded-3xl w-full max-w-md shadow-2xl overflow-hidden !border-white/20"
      >
        <div className="bg-white/10 p-6 text-white text-center border-b border-white/10">
          <h3 className="text-xl font-black uppercase tracking-tighter">Assign Mission</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Objective Title</label>
            <input 
              required
              className="glass-input w-full"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Assigned Agent</label>
            <select 
              required
              className="glass-input w-full appearance-none"
              value={formData.assigneeId}
              onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
            >
              <option value="" className="bg-slate-900">Select Entity</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id} className="bg-slate-900">{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Priority Grade</label>
              <select 
                className="glass-input w-full appearance-none"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="low" className="bg-slate-900">Low</option>
                <option value="medium" className="bg-slate-900">Medium</option>
                <option value="high" className="bg-slate-900">High</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Deadline</label>
              <input 
                type="datetime-local"
                className="glass-input w-full"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-text-dim hover:text-white transition-colors uppercase tracking-widest text-xs">Cancel</button>
            <button type="submit" className="flex-1 py-4 bg-accent-indigo font-black text-white rounded-xl shadow-lg shadow-accent-indigo/30 hover:bg-accent-indigo/80 transition-all uppercase tracking-widest text-xs">Authorize</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
