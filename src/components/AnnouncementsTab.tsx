import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { Announcement } from '../types';
import { Bell, Plus, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export default function AnnouncementsTab() {
  const { isManager, employee } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });
    return () => unsubscribe();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Broadcasting</h2>
          <p className="text-text-dim font-medium">Stay updated with latest corporate mandates.</p>
        </div>
        {isManager && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-accent-indigo text-white px-6 py-2.5 rounded-xl font-bold hover:bg-accent-indigo/80 transition-all shadow-lg shadow-accent-indigo/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Broadcast
          </button>
        )}
      </div>

      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-text-dim font-medium uppercase tracking-widest text-xs">
            Frequency is silent. No active broadcasts.
          </div>
        ) : (
          announcements.map(ann => (
            <motion.div 
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card !p-8 hover:bg-white/15 transition-colors border-l-4 border-l-accent-indigo"
            >
              <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase italic">{ann.title}</h3>
              <p className="text-text-dim leading-relaxed mb-6 whitespace-pre-wrap text-sm font-medium">{ann.content}</p>
              <div className="flex items-center gap-6 text-[10px] font-black text-white/40 uppercase tracking-widest pt-6 border-t border-white/5">
                <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <User className="w-3.5 h-3.5" />
                  Source: {ann.authorName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Date: {format(new Date(ann.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {showAddModal && <AddAnnouncementModal onClose={() => setShowAddModal(false)} employee={employee!} />}
    </motion.div>
  );
}

function AddAnnouncementModal({ onClose, employee }: any) {
  const [formData, setFormData] = useState({ title: '', content: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'announcements'), {
      ...formData,
      authorId: employee.id,
      authorName: employee.name,
      createdAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden !border-white/20">
        <div className="bg-white/10 p-6 text-white text-center border-b border-white/10"><h3 className="text-xl font-black uppercase tracking-tighter">Initiate Broadcast</h3></div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Transmission Title</label>
            <input required className="glass-input w-full" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2 block">Payload Content</label>
            <textarea required className="glass-input w-full h-48 resize-none" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
          </div>
          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-text-dim hover:text-white transition-colors uppercase tracking-widest text-xs">Abort</button>
            <button type="submit" className="flex-1 py-4 bg-accent-indigo font-black text-white rounded-xl shadow-lg shadow-accent-indigo/30 hover:bg-accent-indigo/80 transition-all uppercase tracking-widest text-xs">Execute Broadcast</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
