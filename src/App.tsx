import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import { Employee, UserRole } from './types';
import { 
  Building2, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  Bell, 
  Clock, 
  LogOut, 
  LayoutDashboard,
  User as UserIcon,
  ChevronRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TasksTab from './components/TasksTab';
import LeavesTab from './components/LeavesTab';
import AnnouncementsTab from './components/AnnouncementsTab';
import AdminTab from './components/AdminTab';

// Context
interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  employee: null,
  loading: true,
  isAdmin: false,
  isManager: false,
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or Create employee profile
        const empRef = doc(db, 'employees', u.uid);
        const empSnap = await getDoc(empRef);
        
        if (empSnap.exists()) {
          const data = empSnap.data() as Employee;
          setEmployee(data);
          
          // Auto clock-in if not already
          if (!data.isClockedIn) {
            await updateDoc(empRef, {
              isClockedIn: true,
              lastClockIn: new Date().toISOString()
            });
            // Update local state
            setEmployee({ ...data, isClockedIn: true, lastClockIn: new Date().toISOString() });
          }
        } else {
          // New employee - bootstrap
          const isFirstUser = u.email === 'asadpasha2004@gmail.com'; 
          const newEmp: Employee = {
            id: u.uid,
            name: u.displayName || 'Anonymous',
            email: u.email || '',
            role: isFirstUser ? 'CEO' : 'Employee',
            department: 'General',
            salary: 0,
            joinedAt: new Date().toISOString(),
            isClockedIn: true,
            lastClockIn: new Date().toISOString()
          };
          await setDoc(empRef, newEmp);
          setEmployee(newEmp);
        }
      } else {
        setEmployee(null);
      }
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    if (user) {
      // Clock out on logout
      const empRef = doc(db, 'employees', user.uid);
      await updateDoc(empRef, {
        isClockedIn: false,
        lastClockOut: new Date().toISOString()
      });
    }
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Building2 className="w-12 h-12 text-accent-indigo animate-pulse" />
          <p className="text-text-dim font-medium tracking-tight">Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-card overflow-hidden !p-0"
        >
          <div className="bg-accent-indigo/20 p-8 text-center text-white border-b border-white/10">
            <Building2 className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold tracking-tighter">NEXUS CORE</h1>
            <p className="text-text-dim mt-2 font-medium">Enterprise Management</p>
          </div>
          <div className="p-8">
            <p className="text-text-dim text-center mb-8">
              Welcome back. Please sign in with your corporate account to access your workspace.
            </p>
            <button 
              onClick={signInWithGoogle}
              className="w-full py-4 px-6 glass-panel rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-white/20 transition-all active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-6 h-6" referrerPolicy="no-referrer" />
              Sign in with Google
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      employee, 
      loading, 
      isAdmin: employee?.role === 'CEO',
      isManager: employee?.role === 'Manager' || employee?.role === 'CEO'
    }}>
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="glass-panel border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-accent-indigo" />
                <span className="text-xl font-black text-white tracking-tighter uppercase italic">Nexus</span>
                {employee && (
                  <span className="ml-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90 uppercase tracking-widest border border-white/10">
                    {employee.role}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-white">{employee?.name}</span>
                  <span className="text-[10px] text-text-dim font-mono uppercase tracking-widest">
                    {employee?.isClockedIn ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all"
                  title="Clock Out & Sign Out"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Floating Action Menu for Admin/Manager */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PortalContent />
        </main>
      </div>
    </AuthContext.Provider>
  );
}

function PortalContent() {
  const { employee, isAdmin, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'leaves' | 'announcements' | 'admin'>('overview');

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 flex flex-col gap-2">
        <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label="Overview" />
        <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={ClipboardCheck} label="My Tasks" />
        <NavButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={Calendar} label="Leave Requests" />
        <NavButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={Bell} label="Announcements" />
        {isManager && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Management</p>
            <NavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={Users} label="Team Management" />
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" onNavigate={setActiveTab} />}
          {activeTab === 'tasks' && <TasksTab key="tasks" />}
          {activeTab === 'leaves' && <LeavesTab key="leaves" />}
          {activeTab === 'announcements' && <AnnouncementsTab key="announcements" />}
          {activeTab === 'admin' && <AdminTab key="admin" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all group
        ${active 
          ? 'bg-white/10 text-white border border-white/20' 
          : 'text-text-dim hover:bg-white/5 hover:text-white'}
      `}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-white/40 group-hover:text-white'}`} />
      {label}
    </button>
  );
}

// --- Placeholder Content Components (To be implemented in separate views/components) ---

function OverviewTab({ onNavigate }: { onNavigate: (tab: any) => void, key?: string }) {
  const { employee } = useAuth();

  const toggleClock = async () => {
    if (!employee) return;
    const empRef = doc(db, 'employees', employee.id);
    await updateDoc(empRef, {
      isClockedIn: !employee.isClockedIn,
      [employee.isClockedIn ? 'lastClockOut' : 'lastClockIn']: new Date().toISOString()
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">GOOD MORNING, {employee?.name?.toUpperCase()}</h2>
          <p className="text-text-dim mt-1 font-medium">Systems are optimal. Employee sync complete.</p>
        </div>
        <button 
          onClick={toggleClock}
          className={`px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all border ${
            employee?.isClockedIn 
              ? 'bg-red-400/10 text-red-400 border-red-400/30' 
              : 'bg-success-green/10 text-success-green border-success-green/30'
          }`}
        >
          {employee?.isClockedIn ? '● Clock Out' : '○ Clock In'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard icon={Clock} label="Status" value={employee?.isClockedIn ? 'Online' : 'Offline'} color={employee?.isClockedIn ? 'emerald' : 'orange'} />
        <StatsCard icon={ClipboardCheck} label="Task Queue" value="Active" color="blue" />
        <StatsCard icon={Calendar} label="Schedule" value="Manage" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent-indigo" />
            Mission Briefing
          </h3>
          <div className="space-y-4 flex-1">
            <ActionButton label="Company Announcements" icon={Bell} onClick={() => onNavigate('announcements')} />
            <ActionButton label="Logistics & Leave" icon={Calendar} onClick={() => onNavigate('leaves')} />
            <ActionButton label="Executive Console" icon={Users} onClick={() => onNavigate('admin')} />
          </div>
        </div>

        <div className="glass-card">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-accent-indigo" />
            Security Profile
          </h3>
          <div className="space-y-4">
            <DetailRow label="Unit" value={employee?.department || 'N/A'} />
            <DetailRow label="Clearance" value={employee?.role || ''} />
            <DetailRow label="Compensation" value={`$${employee?.salary?.toLocaleString()}`} />
            <DetailRow label="Session Start" value={employee?.lastClockIn ? new Date(employee.lastClockIn).toLocaleTimeString() : 'N/A'} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({ label, icon: Icon, onClick }: { label: string, icon: any, onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all group shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
          <Icon className="w-5 h-5 text-white/40 group-hover:text-white" />
        </div>
        <span className="text-sm font-bold text-white/90">{label}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function StatsCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: 'blue' | 'emerald' | 'orange' }) {
  const colors = {
    blue: 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20',
    emerald: 'bg-success-green/10 text-success-green border-success-green/20',
    orange: 'bg-orange-400/10 text-orange-400 border-orange-400/20'
  };
  return (
    <div className="glass-card flex items-center gap-4">
      <div className={`p-4 rounded-2xl border ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-xs font-bold text-text-dim uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}
