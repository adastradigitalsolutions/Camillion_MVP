import React, { useState, useEffect, useMemo } from 'react';
import { SearchIcon, ChevronRight, X, ChevronLeft, Play, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MuscleGroup, Exercise } from '../types/database';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<string>('Free');
  const [viewedExercises, setViewedExercises] = useState<{[key: string]: string}>({});
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Fetch muscle groups and exercises on component mount
  useEffect(() => {
    const fetchMuscleGroups = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('No authenticated user');
        }
        
        // Fetch user subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('subscription_type')
          .eq('user_id', user.id)
          .single();
        
        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          console.error('Error fetching subscription:', subscriptionError);
        } else if (subscriptionData) {
          setUserSubscription(subscriptionData.subscription_type);
        }
        
        // Fetch viewed exercises
        const { data: viewedData, error: viewedError } = await supabase
          .from('viewed_exercises')
          .select('muscle_group_id, exercise_id')
          .eq('user_id', user.id);
        
        if (viewedError) {
          console.error('Error fetching viewed exercises:', viewedError);
        } else {
          const viewedMap: {[key: string]: string} = {};
          viewedData?.forEach(item => {
            viewedMap[item.muscle_group_id] = item.exercise_id;
          });
          setViewedExercises(viewedMap);
        }
        
        // Fetch all muscle groups
        const { data: muscleGroupsData, error: muscleGroupsError } = await supabase
          .from('muscle_groups')
          .select('*')
          .order('name');
        
        if (muscleGroupsError) throw muscleGroupsError;
        
        // Fetch all exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .order('title');
        
        if (exercisesError) throw exercisesError;
        
        setMuscleGroups(muscleGroupsData);
        setExercises(exercisesData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMuscleGroups();
  }, []);

  // Fetch exercises for a specific muscle group when selected
  useEffect(() => {
    const fetchExercisesForMuscleGroup = async () => {
      if (!selectedMuscleGroup) return;
      
      try {
        setLoading(true);
        
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .eq('muscle_group_id', selectedMuscleGroup.id)
          .order('title');
        
        if (exercisesError) throw exercisesError;
        
        setExercises(exercisesData);
      } catch (err: any) {
        console.error('Error fetching exercises:', err);
        setError(err.message || 'Failed to load exercises');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercisesForMuscleGroup();
  }, [selectedMuscleGroup]);

  // Filter based on search query
  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    if (!selectedMuscleGroup) {
      // On main page, show muscle groups and matching exercises from search
      const matchingGroups = muscleGroups.filter(group =>
        group.name.toLowerCase().includes(query)
      );

      const matchingExercises = !query ? [] : exercises.filter(exercise =>
        exercise.title.toLowerCase().includes(query)
      );

      return {
        muscleGroups: matchingGroups,
        exercises: matchingExercises
      };
    } else {
      // On muscle group page, only show exercises from that group
      const filteredExercises = exercises.filter(exercise =>
        exercise.title.toLowerCase().includes(query)
      );

      return {
        muscleGroups: [],
        exercises: filteredExercises
      };
    }
  }, [searchQuery, selectedMuscleGroup, muscleGroups, exercises]);

  const handleExerciseClick = async (exercise: Exercise) => {
    // Check if user is on free plan and has already viewed an exercise from this muscle group
    if (userSubscription === 'Free') {
      const muscleGroupId = exercise.muscle_group_id;
      const viewedExerciseId = viewedExercises[muscleGroupId];
      
      // If user has viewed a different exercise from this muscle group
      if (viewedExerciseId && viewedExerciseId !== exercise.id) {
        setShowSubscriptionModal(true);
        return;
      }
      
      // If this is the first exercise viewed for this muscle group, record it
      if (!viewedExerciseId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            throw new Error('No authenticated user');
          }
          
          const { error } = await supabase
            .from('viewed_exercises')
            .upsert({
              user_id: user.id,
              muscle_group_id: muscleGroupId,
              exercise_id: exercise.id
            }, {
              onConflict: 'user_id, muscle_group_id'
            });
          
          if (error) throw error;
          
          // Update local state
          setViewedExercises(prev => ({
            ...prev,
            [muscleGroupId]: exercise.id
          }));
        } catch (err) {
          console.error('Error recording viewed exercise:', err);
        }
      }
    }
    
    // Show the exercise
    setSelectedExercise(exercise);
  };

  const handleMuscleGroupClick = (group: MuscleGroup) => {
    setSelectedMuscleGroup(group);
    setSearchQuery(''); // Clear search when entering a muscle group
  };

  // Find muscle group name for an exercise
  const getMuscleGroupName = (muscleGroupId: string) => {
    const group = muscleGroups.find(g => g.id === muscleGroupId);
    return group ? group.name : '';
  };

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    // If it's already an embed URL, return it
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      // Return embed URL with additional parameters for better embedding
      return `https://www.youtube.com/embed/${match[2]}?autoplay=0&origin=${window.location.origin}`;
    }
    
    // Return original URL if we couldn't parse it
    return url;
  };

  // Check if an exercise is viewable by the current user
  const isExerciseViewable = (exercise: Exercise) => {
    // Premium users can view all exercises
    if (userSubscription !== 'Free') {
      return true;
    }
    
    // Free users can view an exercise if:
    // 1. They haven't viewed any exercise from this muscle group yet
    // 2. This is the exercise they've already viewed from this muscle group
    const muscleGroupId = exercise.muscle_group_id;
    const viewedExerciseId = viewedExercises[muscleGroupId];
    
    return !viewedExerciseId || viewedExerciseId === exercise.id;
  };

  if (loading && muscleGroups.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>Error: {error}</p>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <div className="mb-6">
        {selectedMuscleGroup && (
          <button
            onClick={() => {
              setSelectedMuscleGroup(null);
              setSearchQuery('');
            }}
            className="flex items-center text-[--primary] hover:underline mb-4"
          >
            <ChevronLeft size={20} className="mr-2" />
            Back to Muscle Groups
          </button>
        )}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={selectedMuscleGroup ? 
              `Search ${selectedMuscleGroup.name} exercises...` : 
              "Search muscle groups or exercises..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-4">{selectedExercise.title}</h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-4">
              <iframe
                src={getEmbedUrl(selectedExercise.video_url)}
                title={selectedExercise.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className="text-gray-600">{selectedExercise.description}</p>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <Crown className="w-16 h-16 mx-auto mb-4 text-[--primary]" />
              <h2 className="text-2xl font-bold mb-2">Upgrade to Access More Exercises</h2>
              <p className="text-gray-600">
                With the Free plan, you can only view one exercise per muscle group.
                Upgrade now to unlock all exercises and premium features!
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Free Plan</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• One exercise per muscle group</li>
                  <li>• Basic workout tracking</li>
                  <li>• Limited exercise library</li>
                </ul>
              </div>
              
              <div className="p-4 bg-[--primary] bg-opacity-10 rounded-lg border-2 border-[--primary]">
                <h3 className="font-semibold mb-2">Premium Plans</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Full exercise library</li>
                  <li>• Custom workout plans</li>
                  <li>• Progress tracking</li>
                  <li>• And much more!</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-all"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  navigate('/subscription');
                }}
                className="flex-1 btn-primary"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {!selectedMuscleGroup ? (
          // Main page view
          <>
            {/* Show matching exercises from search if any */}
            {searchQuery && filteredResults.exercises.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Matching Exercises</h2>
                {filteredResults.exercises.map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      const group = muscleGroups.find(g => g.id === exercise.muscle_group_id);
                      if (group) {
                        setSelectedMuscleGroup(group);
                      }
                      handleExerciseClick(exercise);
                    }}
                    className="w-full card hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{exercise.title}</h3>
                        <p className="text-sm text-gray-600">{getMuscleGroupName(exercise.muscle_group_id)}</p>
                      </div>
                      <ChevronRight size={20} className="text-[--primary]" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Show muscle groups */}
            <div>
              <h2 className="text-xl font-bold mb-4">Muscle Groups</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredResults.muscleGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleMuscleGroupClick(group)}
                    className="card hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-4">
                      <img
                        src={group.image_url}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{group.name}</h3>
                      <ChevronRight size={20} className="text-[--primary]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Muscle group exercises view
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedMuscleGroup.name} Exercises</h2>
              
              {userSubscription === 'Free' && (
                <div className="text-sm text-gray-600 flex items-center">
                  <span className="mr-2">Free Plan:</span>
                  <span className="bg-gray-100 px-2 py-1 rounded-full">
                    1 exercise per muscle group
                  </span>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredResults.exercises.length > 0 ? (
              <div className="grid gap-6">
                {filteredResults.exercises.map(exercise => {
                  const isViewable = isExerciseViewable(exercise);
                  const isViewed = viewedExercises[exercise.muscle_group_id] === exercise.id;
                  
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => handleExerciseClick(exercise)}
                      className={`card hover:shadow-xl transition-all duration-300 ${!isViewable ? 'opacity-70' : ''}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="aspect-video md:w-1/3 rounded-lg overflow-hidden relative">
                          <img 
                            src={exercise.image_url} 
                            alt={exercise.title}
                            className="w-full h-full object-cover"
                          />
                          {!isViewable && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="bg-white p-2 rounded-full">
                                <Crown size={24} className="text-[--primary]" />
                              </div>
                            </div>
                          )}
                          {isViewed && userSubscription === 'Free' && (
                            <div className="absolute top-2 right-2 bg-[--primary] text-white text-xs px-2 py-1 rounded-full">
                              Viewed
                            </div>
                          )}
                        </div>
                        <div className="md:w-2/3 text-left">
                          <h3 className="text-lg font-semibold mb-2">{exercise.title}</h3>
                          <div className="flex items-center">
                            {isViewable ? (
                              <div className="flex items-center text-[--primary]">
                                <Play size={16} className="mr-2" />
                                <span className="text-sm">Watch video</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-[--primary]">
                                <Crown size={16} className="mr-2" />
                                <span className="text-sm">Upgrade to unlock</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No exercises found for this muscle group.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;