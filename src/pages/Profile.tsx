import React, { useState, useEffect } from 'react';
import { Camera, Scale, ChevronRight, ArrowLeft, LogOut, ClipboardEdit, X, Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

interface WeightLog {
  id?: string;
  user_id?: string;
  weight: number;
  log_date: string;
  created_at?: string;
}

interface ProgressPhoto {
  id?: string;
  user_id?: string;
  pose: string;
  photo_url: string;
  check_date: string;
  created_at?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightError, setWeightError] = useState('');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [showProgressPhotos, setShowProgressPhotos] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [showPeriodicCheckModal, setShowPeriodicCheckModal] = useState(false);
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
  const [nextPhotoCheckDate, setNextPhotoCheckDate] = useState<Date | null>(null);
  const [nextWeightCheckDate, setNextWeightCheckDate] = useState<Date | null>(null);
  const [missingChecks, setMissingChecks] = useState<{photos: boolean, weight: boolean}>({photos: false, weight: false});

  // Get pose display name
  const getPoseDisplayName = (pose: string) => {
    const poseNames: {[key: string]: string} = {
      'front-arms-down': 'Front with arms down',
      'front-biceps': 'Front double biceps',
      'side-left-arms-down': 'Left side with arms down',
      'side-left-arms-forward': 'Left side with arms forward',
      'side-right-arms-down': 'Right side with arms down',
      'side-right-arms-forward': 'Right side with arms forward',
      'back-arms-down': 'Back with arms down',
      'back-arms-extended': 'Back with arms extended',
      'back-biceps': 'Back double biceps'
    };
    
    return poseNames[pose] || pose.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Define poses based on gender
  const getPoses = () => {
    const commonPoses = [
      'front-arms-down',
      'side-left-arms-down',
      'side-left-arms-forward',
      'side-right-arms-down',
      'side-right-arms-forward',
      'back-arms-down'
    ];
    
    const malePoses = [
      ...commonPoses,
      'front-biceps',
      'back-biceps'
    ];
    
    const femalePoses = [
      ...commonPoses,
      'back-arms-extended'
    ];
    
    if (userGender === 'male') return malePoses;
    if (userGender === 'female') return femalePoses;
    return commonPoses;
  };

  const poses = getPoses();

  // Pose demonstration images
  const poseGuideImages = {
    'front-arms-down': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop',
    'front-biceps': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop',
    'side-left-arms-down': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop',
    'side-left-arms-forward': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop',
    'side-right-arms-down': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop',
    'side-right-arms-forward': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop',
    'back-arms-down': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop',
    'back-arms-extended': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop',
    'back-biceps': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop'
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Load onboarding responses
      const { data: onboarding, error: onboardingError } = await supabase
        .from('onboarding_responses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (onboardingError && onboardingError.code !== 'PGRST116') {
        console.error('Error fetching onboarding data:', onboardingError);
      } else if (onboarding) {
        setOnboardingData(onboarding);
        setOnboardingCompleted(onboarding.onboarding_completed || false);
        // Set user gender from onboarding data
        if (onboarding.gender) {
          setUserGender(onboarding.gender as 'male' | 'female');
        }
      }

      // Load subscription data
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription data:', subscriptionError);
      } else if (subscription) {
        setSubscriptionData(subscription);
      }

      // Load weight history
      const { data: weightLogs, error: weightError } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true });

      if (weightError) {
        console.error('Error fetching weight logs:', weightError);
      } else {
        setWeightHistory(weightLogs || []);
        calculateNextWeightCheck(weightLogs || []);
      }

      // Load progress photos
      const { data: photos, error: photosError } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('check_date', { ascending: false });

      if (photosError) {
        console.error('Error fetching progress photos:', photosError);
      } else {
        setProgressPhotos(photos || []);
        calculateNextPhotoCheck(photos || []);
      }

      setUserData(user);
      checkMissingChecks(weightLogs || [], photos || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextWeightCheck = (weightLogs: WeightLog[]) => {
    if (weightLogs.length === 0) {
      setNextWeightCheckDate(new Date());
      return;
    }

    // Sort by date descending
    const sortedLogs = [...weightLogs].sort((a, b) => 
      new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );

    // Get the most recent log
    const lastLogDate = new Date(sortedLogs[0].log_date);
    
    // Next check is 7 days after the last log
    const nextCheck = new Date(lastLogDate);
    nextCheck.setDate(nextCheck.getDate() + 7);
    
    // If next check is in the past, set it to today
    const today = new Date();
    if (nextCheck < today) {
      setNextWeightCheckDate(today);
    } else {
      setNextWeightCheckDate(nextCheck);
    }
  };

  const calculateNextPhotoCheck = (photos: ProgressPhoto[]) => {
    if (photos.length === 0) {
      setNextPhotoCheckDate(new Date());
      return;
    }

    // Group photos by check_date
    const photosByDate: {[key: string]: ProgressPhoto[]} = {};
    photos.forEach(photo => {
      if (!photosByDate[photo.check_date]) {
        photosByDate[photo.check_date] = [];
      }
      photosByDate[photo.check_date].push(photo);
    });

    // Find the most recent complete check (all required poses)
    const dates = Object.keys(photosByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    let lastCompleteCheckDate = null;
    for (const date of dates) {
      const posesForDate = photosByDate[date].map(p => p.pose);
      const allPosesPresent = poses.every(pose => posesForDate.includes(pose));
      
      if (allPosesPresent) {
        lastCompleteCheckDate = new Date(date);
        break;
      }
    }

    // If no complete check found, use today
    if (!lastCompleteCheckDate) {
      setNextPhotoCheckDate(new Date());
      return;
    }

    // Next check is 28 days (4 weeks) after the last complete check
    const nextCheck = new Date(lastCompleteCheckDate);
    nextCheck.setDate(nextCheck.getDate() + 28);
    
    // If next check is in the past, set it to today
    const today = new Date();
    if (nextCheck < today) {
      setNextPhotoCheckDate(today);
    } else {
      setNextPhotoCheckDate(nextCheck);
    }
  };

  const checkMissingChecks = (weightLogs: WeightLog[], photos: ProgressPhoto[]) => {
    const today = new Date();
    
    // Check if weight log is missing
    let missingWeight = true;
    if (weightLogs.length > 0) {
      const lastWeightDate = new Date(weightLogs[weightLogs.length - 1].log_date);
      const daysSinceLastWeight = Math.floor((today.getTime() - lastWeightDate.getTime()) / (1000 * 60 * 60 * 24));
      missingWeight = daysSinceLastWeight > 7;
    }

    // Check if any required pose is missing or outdated
    let missingPhotos = true;
    
    // Get the most recent photos for each pose
    const latestPhotosByPose: {[pose: string]: ProgressPhoto | null} = {};
    poses.forEach(pose => {
      const photosForPose = photos.filter(p => p.pose === pose);
      if (photosForPose.length > 0) {
        // Sort by date descending
        photosForPose.sort((a, b) => 
          new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
        );
        latestPhotosByPose[pose] = photosForPose[0];
      } else {
        latestPhotosByPose[pose] = null;
      }
    });
    
    // Check if all poses have recent photos
    const allPosesHaveRecentPhotos = poses.every(pose => {
      const latestPhoto = latestPhotosByPose[pose];
      if (!latestPhoto) {
        return false;
      }
      
      // Check if photo is outdated (older than 28 days)
      const photoDate = new Date(latestPhoto.check_date);
      const daysSincePhoto = Math.floor((today.getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSincePhoto <= 28;
    });
    
    missingPhotos = !allPosesHaveRecentPhotos;

    setMissingChecks({
      weight: missingWeight,
      photos: missingPhotos
    });
  };

  const handleLogWeight = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight)) || parseFloat(newWeight) <= 0) {
      setWeightError('Please enter a valid weight');
      return;
    }

    setWeightLoading(true);
    setWeightError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const weight = parseFloat(newWeight);

      // Check if there's already an entry for today
      const { data: existingEntries, error: fetchError } = await supabase
        .from('weight_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('log_date', today);

      if (fetchError) throw fetchError;

      let result;
      
      if (existingEntries && existingEntries.length > 0) {
        // Update existing entry for today
        result = await supabase
          .from('weight_logs')
          .update({ weight })
          .eq('id', existingEntries[0].id);
      } else {
        // Insert new entry for today
        result = await supabase
          .from('weight_logs')
          .insert({
            user_id: user.id,
            weight,
            log_date: today
          });
      }

      if (result.error) throw result.error;

      // Reload weight history
      const { data: updatedLogs, error: logsError } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true });

      if (logsError) throw logsError;

      setWeightHistory(updatedLogs || []);
      calculateNextWeightCheck(updatedLogs || []);
      setShowWeightModal(false);
      setNewWeight('');
      
      // Update missing checks
      checkMissingChecks(updatedLogs || [], progressPhotos);
    } catch (error: any) {
      console.error('Error logging weight:', error);
      setWeightError(error.message || 'Failed to log weight');
    } finally {
      setWeightLoading(false);
    }
  };

   /* const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };*/

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  const handleModifyQuestionnaire = () => {
    navigate('/onboarding');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (showProgressPhotos) {
    navigate('/progress-photos');
    return null;
  }

  // Get the most recent photos for each pose
  const getLatestPhotos = () => {
    const latestByPose: {[key: string]: ProgressPhoto} = {};
    
    // Group by pose and find the most recent for each
    poses.forEach(pose => {
      const photosForPose = progressPhotos.filter(p => p.pose === pose);
      if (photosForPose.length > 0) {
        // Sort by date descending
        photosForPose.sort((a, b) => 
          new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
        );
        latestByPose[pose] = photosForPose[0];
      }
    });
    
    return latestByPose;
  };

  const latestPhotos = getLatestPhotos();

  // Format weight history data for the chart
  const chartData = weightHistory.map(log => ({
    date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: log.weight
  }));

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
            <img
              src={userData?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2940&auto=format&fit=crop"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold">{onboardingData?.full_name || userData?.user_metadata?.name || 'User'}</h1>
          <p className="text-gray-600">{userData?.email}</p>
        </div>

        {/* Periodic Checks Reminder */}
        {(missingChecks.photos || missingChecks.weight) && (
          <div className="card mb-6 border-2 border-[--primary]">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-[--primary] flex-shrink-0 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold mb-2">Periodic Checks Due</h2>
                <div className="space-y-2">
                  {missingChecks.weight && (
                    <p className="text-gray-700">
                      Your weekly weight check is due. Please log your current weight.
                    </p>
                  )}
                  {missingChecks.photos && (
                    <p className="text-gray-700">
                      Your 4-week progress photos are due. Please upload new photos for all required poses.
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => setShowPeriodicCheckModal(true)}
                  className="btn-primary mt-4"
                >
                  Complete Periodic Checks
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {/* Periodic Checks */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Periodic Checks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Scale size={20} className="text-[--primary]" />
                  <h3 className="font-semibold">Weekly Weight Check</h3>
                </div>
                <p className="text-gray-600 mb-2">
                  Next check: {nextWeightCheckDate ? formatDate(nextWeightCheckDate) : 'Today'}
                </p>
                <button 
                  onClick={() => setShowWeightModal(true)}
                  className="text-[--primary] hover:underline text-sm flex items-center"
                >
                  Log weight now <ChevronRight size={16} />
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Camera size={20} className="text-[--primary]" />
                  <h3 className="font-semibold">4-Week Photo Check</h3>
                </div>
                <p className="text-gray-600 mb-2">
                  Next check: {nextPhotoCheckDate ? formatDate(nextPhotoCheckDate) : 'Today'}
                </p>
                <button 
                  onClick={() => navigate('/photo-upload')}
                  className="text-[--primary] hover:underline text-sm flex items-center"
                >
                  Upload photos now <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPeriodicCheckModal(true)}
              className="btn-primary w-full"
            >
              View Periodic Check Details
            </button>
          </div>

          {/* Weight Tracking */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Weight History</h2>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--primary)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <button 
              className="btn-primary w-full"
              onClick={() => setShowWeightModal(true)}
            >
              Log Weight
            </button>
          </div>

          {/* Progress Photos */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Progress Photos</h2>
              <button
                onClick={() => navigate('/progress-photos')}
                className="text-[--primary] hover:underline flex items-center"
              >
                View All <ChevronRight size={20} />
              </button>
            </div>
            
            {/* Latest photos grid */}
            {Object.keys(latestPhotos).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {Object.entries(latestPhotos).slice(0, 3).map(([pose, photo]) => (
                  <div key={pose} className="space-y-1">
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt={pose}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-600">
                      {getPoseDisplayName(pose)} - {new Date(photo.check_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 mb-4">No progress photos uploaded yet.</p>
            )}
            
            <button
              onClick={() => navigate('/photo-upload')}
              className="btn-primary w-full"
            >
              Upload New Photos
            </button>
          </div>

          {/* Questionnaire */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Questionnaire</h2>
              <button
                onClick={handleModifyQuestionnaire}
                className="text-[--primary] hover:underline flex items-center gap-2"
              >
                <ClipboardEdit size={20} />
                {onboardingCompleted ? "Modify Questionnaire" : "Complete Questionnaire"}
              </button>
            </div>
            <p className="text-gray-600">
              {onboardingCompleted 
                ? "Review and update your fitness profile and preferences"
                : "Complete your fitness profile to get personalized recommendations"}
            </p>
          </div>

          {/* Subscription */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">My Plan</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {subscriptionData?.subscription_type || 'Free'} Plan
                </p>
                <p className="text-sm text-gray-600">
                  {subscriptionData?.subscription_type === 'Free' 
                    ? 'Basic features included'
                    : `Valid until ${new Date(subscriptionData?.end_date).toLocaleDateString()}`
                  }
                </p>
              </div>
              <button
                onClick={() => navigate('/subscription')}
                className="flex items-center text-[--primary]"
              >
                Upgrade <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-semibold py-3 px-6 rounded-lg border-2 border-red-600 hover:border-red-700 transition-colors"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </div>

      {/* Weight Log Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Log Weight</h2>
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setNewWeight('');
                  setWeightError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            {weightError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {weightError}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Current Weight (kg)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  id="weight"
                  value={newWeight}
                  onChange={(e) => {
                    setNewWeight(e.target.value);
                    setWeightError('');
                  }}
                  placeholder="Enter your weight"
                  className="input-field pl-10"
                  step="0.1"
                  min="0"
                  required
                  disabled={weightLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Today's date: {new Date().toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setNewWeight('');
                  setWeightError('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                disabled={weightLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleLogWeight}
                className="flex-1 btn-primary"
                disabled={weightLoading}
              >
                {weightLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Periodic Check Modal */}
      {showPeriodicCheckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Periodic Checks</h2>
              <button
                onClick={() => setShowPeriodicCheckModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 max-h-80 overflow-y-auto">
              <div className="space-y-6">
                {/* Weight Check Section */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Scale size={24} className="text-[--primary]" />
                    <h3 className="text-xl font-bold">Weekly Weight Check</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Track your weight weekly to monitor your progress. Consistency is key - try to weigh yourself at the same time of day each week.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Next check due:</p>
                        <p className="text-gray-600">{nextWeightCheckDate ? formatDate(nextWeightCheckDate) : 'Today'}</p>
                      </div>
                      <div className={`flex items-center gap-2 ${missingChecks.weight ? 'text-red-600' : 'text-green-500'}`}>
                        {missingChecks.weight ? (
                          <>
                            <AlertCircle size={20} />
                            <span>Overdue</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={20} />
                            <span>Up to date</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setShowPeriodicCheckModal(false);
                        setShowWeightModal(true);
                      }}
                      className="btn-primary"
                    >
                      Log Weight Now
                    </button>
                  </div>
                </div>
                
                
                {/* Photo Check Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Camera size={24} className="text-[--primary]" />
                    <h3 className="text-xl font-bold">4-Week Photo Check</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Take progress photos every 4 weeks to visually track your body composition changes. Use consistent lighting, background, and poses.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="font-semibold">Next check due:</p>
                        <p className="text-gray-600">{nextPhotoCheckDate ? formatDate(nextPhotoCheckDate) : 'Today'}</p>
                      </div>
                      <div className={`flex items-center gap-2 ${missingChecks.photos ? 'text-red-600' : 'text-green-500'}`}>
                        {missingChecks.photos ? (
                          <>
                            <AlertCircle size={20} />
                            <span>Overdue</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={20} />
                            <span>Up to date</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-semibold">Required poses:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {poses.map(pose => {
                          const hasPhoto = Object.keys(latestPhotos).includes(pose);
                          const photoDate = hasPhoto ? new Date(latestPhotos[pose].check_date) : null;
                          const isRecent = photoDate ? 
                            (new Date().getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24) <= 28 
                            : 
                            false;
                          
                          return (
                            <div 
                              key={pose} 
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 "
                            >
                              <span>{getPoseDisplayName(pose)}</span>
                              {hasPhoto && isRecent ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : (
                                <X size={16} className="text-red-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setShowPeriodicCheckModal(false);
                        navigate('/photo-upload');
                      }}
                      className="btn-primary"
                    >
                      Upload Photos Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Reminder Popup */}
      {!onboardingCompleted && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {/*<div className="flex justify-between items-center mb-6">*/}
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            {/* <button
                onClick={() => navigate('/onboarding')}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>*/}
            </div>
            
            <p className="text-gray-600 mb-6">
              To provide you with a personalized experience and tailored recommendations, please complete your fitness profile questionnaire.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/onboarding')}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Complete Questionnaire
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;