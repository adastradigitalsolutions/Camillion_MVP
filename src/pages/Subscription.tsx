import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Star, Zap, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    icon: Star,
    features: [
      'Basic workout tracking',
      'Limited exercise library',
      'Basic progress tracking',
      'Community access'
    ]
  },
  {
    id: 'level1',
    name: 'Level 1',
    price: '9.99',
    icon: Zap,
    features: [
      'Everything in Free',
      'Full exercise library',
      'Custom workout plans',
      'Progress photos',
      'Weight tracking'
    ]
  },
  {
    id: 'level2',
    name: 'Level 2',
    price: '19.99',
    icon: Star,
    features: [
      'Everything in Level 1',
      'Nutrition tracking',
      'Weekly check-ins',
      'Video form checks',
      'Priority support'
    ]
  },
  {
    id: 'level3',
    name: 'Level 3',
    price: '29.99',
    icon: Crown,
    features: [
      'Everything in Level 2',
      'Personal training sessions',
      'Custom meal plans',
      '24/7 coach access',
      'Advanced analytics'
    ]
  }
];

const Subscription = () => {
  const navigate = useNavigate();

  const handleSelectPlan = async (planId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Convert planId to subscription type
      const subscriptionType = planId === 'free' ? 'Free' :
        planId === 'level1' ? 'Level1' :
        planId === 'level2' ? 'Level2' :
        planId === 'level3' ? 'Level3' : 'Free';

      // Update user subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          subscription_type: subscriptionType,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          payment_method: planId === 'free' ? null : 'credit_card' // Simplified for demo
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      navigate('/home');
    } catch (error) {
      console.error('Error updating subscription:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-[--primary] hover:underline"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-600">
            Select the perfect plan to achieve your fitness goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className="card transform hover:scale-105 transition-all duration-300"
              >
                <div className="text-center mb-6">
                  <Icon className="w-12 h-12 mx-auto mb-4 text-[--primary]" />
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="text-green-500 flex-shrink-0" size={20} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className="btn-primary w-full"
                >
                  Select Plan
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Subscription;