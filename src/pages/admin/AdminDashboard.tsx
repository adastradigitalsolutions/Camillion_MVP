import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserWithDetails } from '../../types/database';
import { Calendar, Clock, AlertCircle, Users, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    expiringPrograms: 0,
    expiringSubscriptions: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with subscription and program data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (userError) throw userError;
      
      // Fetch subscription data for each user
      const usersWithDetails: UserWithDetails[] = [];
      
      for (const user of userData) {
        // Get subscription data
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select('subscription_type, end_date')
          .eq('user_id', user.user_id)
          .single();
        
        // Get program data
        const { data: programData } = await supabase
          .from('training_programs')
          .select('name, end_date')
          .eq('user_id', user.user_id)
          .gte('end_date', new Date().toISOString().split('T')[0])
          .order('end_date', { ascending: true })
          .limit(1)
          .single();
        
        usersWithDetails.push({
          ...user,
          subscription: subscriptionData || undefined,
          program: programData || undefined
        });
      }
      
      setUsers(usersWithDetails);
      
      // Calculate stats
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      // Count total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // Count active subscriptions (not free)
      const { count: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .neq('subscription_type', 'Free');
      
      // Count expiring programs
      const { count: expiringPrograms } = await supabase
        .from('training_programs')
        .select('*', { count: 'exact', head: true })
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', nextWeek.toISOString().split('T')[0]);
      
      // Count expiring subscriptions
      const { count: expiringSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .neq('subscription_type', 'Free')
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', nextWeek.toISOString().split('T')[0]);
      
      setStats({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        expiringPrograms: expiringPrograms || 0,
        expiringSubscriptions: expiringSubscriptions || 0
      });
      
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (dateString: string) => {
    if (!dateString) return false;
    
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 7 && diffDays >= 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p>Error: {error}</p>
        <p>Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Subscriptions</p>
              <h3 className="text-2xl font-bold">{stats.activeSubscriptions}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Expiring Programs</p>
              <h3 className="text-2xl font-bold">{stats.expiringPrograms}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Expiring Subscriptions</p>
              <h3 className="text-2xl font-bold">{stats.expiringSubscriptions}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Users</h2>
          <Link to="/admin/users" className="text-[--primary] hover:underline">
            View All
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program Expiry
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.subscription?.subscription_type === 'Free'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.subscription?.subscription_type || 'Free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      isExpiringSoon(user.subscription?.end_date || '') 
                        ? 'text-red-600 font-medium flex items-center'
                        : 'text-gray-500'
                    }`}>
                      {isExpiringSoon(user.subscription?.end_date || '') && (
                        <AlertCircle size={16} className="mr-1" />
                      )}
                      {formatDate(user.subscription?.end_date || '')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.program?.name || 'No active program'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      isExpiringSoon(user.program?.end_date || '') 
                        ? 'text-red-600 font-medium flex items-center'
                        : 'text-gray-500'
                    }`}>
                      {isExpiringSoon(user.program?.end_date || '') && (
                        <AlertCircle size={16} className="mr-1" />
                      )}
                      {formatDate(user.program?.end_date || '')}
                    </div>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;