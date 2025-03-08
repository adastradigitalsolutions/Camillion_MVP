import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { AdminUser } from '../types/database';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          setUser(null);
          setIsAdmin(false);
          return;
        }
        
        setUser(currentUser);
        
        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        
        setIsAdmin(!!adminData);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getUser();
    
    // Set up auth state change listener
   /* const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // Check if user is admin
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          setIsAdmin(!!adminData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
        }
      }
    );*/
    
   /* return () => {
      subscription.unsubscribe();
    };*/
  }, []);
  
  return { user, loading, isAdmin };
};