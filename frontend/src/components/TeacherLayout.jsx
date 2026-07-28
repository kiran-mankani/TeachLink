import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/teacher/dashboard', icon: '⊞' },
  { key: 'find-students', label: 'Find Students', path: '/teacher/find-students', icon: '🔍' },
  { key: 'classes', label: 'My Classes', path: '/teacher/sessions', icon: '📅' },
  { key: 'schedule', label: 'Schedule', path: '/teacher/schedule', icon: '⏰' },
  { key: 'payments', label: 'Payments', path: '/teacher/payments', icon: '💳' },
  { key: 'messages', label: 'Messages', path: '/teacher/messages', icon: '💬' },
  { key: 'profile', label: 'Profile', path: '/teacher/profile', icon: '👤' },
  { key: 'reviews', label: 'Reviews', path: '/teacher/reviews', icon: '⭐' },
  { key: 'settings', label: 'Settings', path: '/teacher/settings', icon: '⚙️' },
];

export default function TeacherLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex min-h-screen font-sans bg-slate-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 overflow-y-auto">
        <div className="p-6 cursor-pointer" onClick={() => navigate('/')}>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="text-blue-500">📚</span> TeachLink
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {sidebarItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* TOP NAVBAR */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3 text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-sm w-48 text-slate-700 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <span className="text-xl">🔔</span>
            </button>

            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
              onClick={() => navigate('/teacher/profile')}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name || 'Teacher'}</p>
                <p className="text-xs text-slate-500 font-medium">Teacher Account</p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}