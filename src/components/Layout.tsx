import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Search, Dumbbell, User } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Dumbbell, label: 'Training', path: '/training' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 pb-20">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex justify-around items-center">
            {navItems.map(({ icon: Icon, label, path }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center p-2 ${
                  isActive(path)
                    ? 'text-[--primary]'
                    : 'text-gray-600 hover:text-[--primary]'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;