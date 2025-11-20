import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User, ViewState, UserRole } from './types';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { WorkerDashboard } from './pages/WorkerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotificationDropdown } from './components/NotificationDropdown';
import { LogOut, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [viewState, setViewState] = useState<ViewState>('LOGIN');

  useEffect(() => {
    const init = async () => {
      // Ensure default admin exists in Cloud DB
      await db.ensureAdminExists();
      
      // Check for existing session
      const sessionUser = await db.getCurrentUser();
      if (sessionUser) {
        setUser(sessionUser);
        setViewState('DASHBOARD');
      }
    };
    init();
  }, []);

  const handleLoginSuccess = async () => {
    const sessionUser = await db.getCurrentUser();
    setUser(sessionUser);
    setViewState('DASHBOARD');
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setViewState('LOGIN');
  };

  // RENDER LOGIC
  
  if (viewState === 'LOGIN') {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        onSwitchToRegister={() => setViewState('REGISTER')} 
      />
    );
  }

  if (viewState === 'REGISTER') {
    return (
      <Register 
        onRegisterSuccess={handleLoginSuccess}
        onSwitchToLogin={() => setViewState('LOGIN')}
      />
    );
  }

  // DASHBOARD LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center text-indigo-600 font-bold text-xl">
                <LayoutDashboard className="w-8 h-8 mr-2" />
                <span>AUI</span>
              </div>
              <div className="ml-6 hidden md:flex items-center space-x-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {user?.role}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && <NotificationDropdown user={user} />}
              
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.phoneNumber}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {user?.role === UserRole.ADMIN ? (
          <AdminDashboard />
        ) : (
          user && <WorkerDashboard user={user} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} AUI Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;