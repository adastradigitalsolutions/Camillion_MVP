import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Dumbbell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Dumbbell, label: 'Exercises', path: '/admin/exercises' }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      {/*} <div className="w-64 bg-white shadow-lg">*/}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[--primary]">Admin Panel</h1>
          <p className="text-gray-600 text-sm">Camillion Fitness</p>
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-2">
            {navItems.map(({ icon: Icon, label, path }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                    isActive(path) ? 'bg-gray-100 border-l-4 border-[--primary]' : ''
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-64 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            <LogOut size={20} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      {/* <div className="flex-1 overflow-x-hidden">*/}
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {navItems.find(item => isActive(item.path))?.label || 'Admin'}
            </h2>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;