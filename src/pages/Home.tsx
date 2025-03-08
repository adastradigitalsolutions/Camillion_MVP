import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Home = () => {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }
        
        // Get user data from localStorage
        const localUserData = localStorage.getItem('user');
        if (localUserData) {
          setUserData(JSON.parse(localUserData));
          const userData = JSON.parse(localUserData);
          
          // Check if user is admin
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', userData?.id)
            .single();
          
          if (adminData) {
            navigate('/admin');
            return;
          }
          
          // Check onboarding status
          const { data: onboardingData } = await supabase
            .from('onboarding_responses')
            .select('onboarding_completed')
            .eq('user_id', userData?.id)
            .single();
          
          if (!onboardingData?.onboarding_completed) {
            navigate('/onboarding');
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const carouselItems = [
    {
      type: 'tip',
      title: 'Nutrition Tip',
      content: 'Eat protein within 30 minutes after your workout to maximize muscle recovery.',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2940&auto=format&fit=crop'
    },
    {
      type: 'product',
      title: 'Premium Resistance Bands',
      content: 'Perfect for home workouts and mobility training.',
      price: '$29.99',
      image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?q=80&w=2940&auto=format&fit=crop'
    },
    {
      type: 'news',
      title: 'New Training Method',
      content: 'Discover how time under tension can transform your results.',
      image: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?q=80&w=2940&auto=format&fit=crop'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  // Mock training progress data
  const trainingProgress = {
    currentWeek: 3,
    totalWeeks: 12,
    completedWorkouts: 8,
    totalWorkouts: 36,
    percentage: 22
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowWelcome(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="aspect-video bg-gray-200 rounded-lg mb-4">
              <img
                src="https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?q=80&w=2940&auto=format&fit=crop"
                alt="Motivational"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Camillion!</h2>
            <p className="text-gray-600 mb-4">
              Ready to transform your life? Let's create your perfect fitness plan together.
            </p>
            <button
              onClick={() => {
                setShowWelcome(false);
                navigate('/onboarding');
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Start Your Journey
            </button>
          </div>
        </motion.div>
      )}

      <div className="max-w-screen-xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Hello, {userData?.name || 'there'}! 👋
          </h1>
          <p className="text-gray-600">
            Let's crush today's goals together!
          </p>
        </div>

        {/* Training Progress */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Training Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Week {trainingProgress.currentWeek} of {trainingProgress.totalWeeks}</span>
                <span>{trainingProgress.percentage}% Complete</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[--primary]" 
                  style={{ width: `${trainingProgress.percentage}%` }}
                />
              </div>
            </div>
            <p className="text-gray-600">
              {trainingProgress.completedWorkouts} of {trainingProgress.totalWorkouts} workouts completed
            </p>
          </div>
        </div>

        {/* Carousel */}
        <div className="card relative">
          <h2 className="text-xl font-bold mb-4">Featured Content</h2>
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselItems.map((item, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <div className="aspect-video mb-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      {item.type === 'product' && (
                        <span className="text-[--primary] font-bold">{item.price}</span>
                      )}
                    </div>
                    <p className="text-gray-600">{item.content}</p>
                    {item.type === 'product' && (
                      <button className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                        <ShoppingBag size={20} />
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-4 gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;