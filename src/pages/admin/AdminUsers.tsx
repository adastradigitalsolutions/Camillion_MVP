import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  UserWithDetails,
  TrainingProgram,
  TrainingSession,
  Exercise,
  TrainingExercise,
  ExerciseParameter,
} from '../../types/database';
import {
  Search,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Camera,
  Scale,
  Target,
  Info,
  DumbbellIcon,
  Trash2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrainingProgramWithDetails extends TrainingProgram {
  sessions?: (TrainingSession & {
    training_exercises?: (TrainingExercise & {
      exercise?: Exercise;
      exercise_parameters?: ExerciseParameter[];
    })[];
  })[];
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterSubscription, setFilterSubscription] = useState<string>('all');
  const [filterExpiringProgram, setFilterExpiringProgram] =
    useState<boolean>(false);
  const [filterExpiringSubscription, setFilterExpiringSubscription] =
    useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    '1m' | '3m' | '6m' | '1y' | 'all'
  >('all');
  const [userProgram, setUserProgram] =
    useState<TrainingProgramWithDetails | null>(null);
  const [isEditingProgram, setIsEditingProgram] = useState(false);
  const [editedProgram, setEditedProgram] =
    useState<TrainingProgramWithDetails | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchExercises();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*');

      if (userError) throw userError;

      // Fetch subscription and program data for each user
      const usersWithDetails: UserWithDetails[] = [];

      for (const user of userData) {
        // Get subscription data
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select('subscription_type, end_date')
          .eq('user_id', user.user_id)
          .single();

        // Get program data
        let programData = undefined;
        if (subscriptionData && subscriptionData.subscription_type !== 'Free') {
          const { data: program } = await supabase
            .from('training_programs')
            .select('name, end_date')
            .eq('user_id', user.user_id)
            .gte('end_date', new Date().toISOString().split('T')[0])
            .order('end_date', { ascending: true })
            .limit(1)
            .single();

          programData = program;
        }

        usersWithDetails.push({
          ...user,
          subscription: subscriptionData || undefined,
          program: programData,
        });
      }

      setUsers(usersWithDetails);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .order('title');

      if (exercisesError) throw exercisesError;
      setAvailableExercises(exercisesData || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoading(true);

      // Fetch onboarding responses
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_responses')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (onboardingError) throw onboardingError;

      // Fetch weight history
      const { data: weightData, error: weightError } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: true });

      if (weightError) throw weightError;

      // Fetch progress photos
      const { data: photoData, error: photoError } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', userId)
        .order('check_date', { ascending: false });

      if (photoError) throw photoError;

      // Fetch training program
      const { data: programData, error: programError } = await supabase
        .from('training_programs')
        .select(
          `
          *,
          sessions:training_sessions(
            *,
            training_exercises(
              *,
              exercise:exercises(*),
              exercise_parameters(*)
            )
          )
        `
        )
        .eq('user_id', userId)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (programError && programError.code !== 'PGRST116') {
        console.error('Error fetching program:', programError);
      }

      setUserDetails(onboardingData);
      setWeightHistory(weightData || []);
      setProgressPhotos(photoData || []);
      setUserProgram(programData || null);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Failed to load user details');
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
      day: 'numeric',
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ? (
      <ChevronUp size={16} className="inline" />
    ) : (
      <ChevronDown size={16} className="inline" />
    );
  };

  const handleUserClick = async (user: any) => {
    setSelectedUser(user);
    await fetchUserDetails(user.user_id);
  };

  const filterWeightData = (data: any[]) => {
    if (selectedTimeRange === 'all') return data;

    const now = new Date();
    const ranges = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
    };

    const daysToSubtract = ranges[selectedTimeRange];
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));

    return data.filter((entry) => new Date(entry.log_date) >= cutoffDate);
  };

  const getPoseDisplayName = (pose: string) => {
    const poseNames: { [key: string]: string } = {
      'front-arms-down': 'Front with arms down',
      'front-biceps': 'Front double biceps',
      'side-left-arms-down': 'Left side with arms down',
      'side-left-arms-forward': 'Left side with arms forward',
      'side-right-arms-down': 'Right side with arms down',
      'side-right-arms-forward': 'Right side with arms forward',
      'back-arms-down': 'Back with arms down',
      'back-arms-extended': 'Back with arms extended',
      'back-biceps': 'Back double biceps',
    };

    return (
      poseNames[pose] ||
      pose
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  const renderTrainingProgram = () => {
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Training Program</h2>
          {userProgram && (
            <button
              onClick={() => {
                setEditedProgram(JSON.parse(JSON.stringify(userProgram)));
                setIsEditingProgram(true);
              }}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:scale-105 transition-transform duration-200"
            >
              Edit Program
            </button>
          )}
        </div>

        {isEditingProgram && editedProgram ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Name
                </label>
                <input
                  type="text"
                  value={editedProgram.name}
                  onChange={(e) =>
                    setEditedProgram({ ...editedProgram, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Weeks
                </label>
                <input
                  type="number"
                  value={editedProgram.total_weeks}
                  onChange={(e) =>
                    setEditedProgram({
                      ...editedProgram,
                      total_weeks: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editedProgram.start_date.split('T')[0]}
                  onChange={(e) =>
                    setEditedProgram({
                      ...editedProgram,
                      start_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={editedProgram.end_date.split('T')[0]}
                  onChange={(e) =>
                    setEditedProgram({
                      ...editedProgram,
                      end_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                />
              </div>
            </div>

            <div className="space-y-6">
              {editedProgram.sessions?.map((session, sessionIndex) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Name
                      </label>
                      <input
                        type="text"
                        value={session.name}
                        onChange={(e) => {
                          const newSessions = [
                            ...(editedProgram.sessions || []),
                          ];
                          newSessions[sessionIndex] = {
                            ...session,
                            name: e.target.value,
                          };
                          setEditedProgram({
                            ...editedProgram,
                            sessions: newSessions,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Week
                      </label>
                      <select
                        value={session.day_of_week}
                        onChange={(e) => {
                          const newSessions = [
                            ...(editedProgram.sessions || []),
                          ];
                          newSessions[sessionIndex] = {
                            ...session,
                            day_of_week: parseInt(e.target.value),
                          };
                          setEditedProgram({
                            ...editedProgram,
                            sessions: newSessions,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                      >
                        <option value={0}>Monday</option>
                        <option value={1}>Tuesday</option>
                        <option value={2}>Wednesday</option>
                        <option value={3}>Thursday</option>
                        <option value={4}>Friday</option>
                        <option value={5}>Saturday</option>
                        <option value={6}>Sunday</option>
                      </select>
                    </div>
                  </div>

                  {/* Exercise List */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium">Exercises</h4>
                      <button
                        onClick={() => {
                          const newSessions = [
                            ...(editedProgram.sessions || []),
                          ];
                          const newExercises = [
                            ...(newSessions[sessionIndex].training_exercises ||
                              []),
                            {
                              id: `new-${Date.now()}`,
                              exercise_id: '',
                              exercise_parameters: [],
                            },
                          ];
                          newSessions[sessionIndex] = {
                            ...newSessions[sessionIndex],
                            training_exercises: newExercises,
                          };
                          setEditedProgram({
                            ...editedProgram,
                            sessions: newSessions,
                          });
                        }}
                        className="px-3 py-1 text-sm bg-[var(--primary)] text-white rounded-md hover:scale-105 transition-transform duration-200"
                      >
                        Add Exercise
                      </button>
                    </div>

                    {session.training_exercises?.map(
                      (exercise, exerciseIndex) => (
                        <div key={exercise.id} className="border rounded p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="w-full">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Exercise
                              </label>
                              <select
                                value={exercise.exercise_id}
                                onChange={(e) => {
                                  const newSessions = [
                                    ...(editedProgram.sessions || []),
                                  ];
                                  const newExercises = [
                                    ...(newSessions[sessionIndex]
                                      .training_exercises || []),
                                  ];
                                  newExercises[exerciseIndex] = {
                                    ...exercise,
                                    exercise_id: e.target.value,
                                  };
                                  newSessions[sessionIndex] = {
                                    ...newSessions[sessionIndex],
                                    training_exercises: newExercises,
                                  };
                                  setEditedProgram({
                                    ...editedProgram,
                                    sessions: newSessions,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                              >
                                <option value="">Select Exercise</option>
                                {availableExercises.map((ex) => (
                                  <option key={ex.id} value={ex.id}>
                                    {ex.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                const newSessions = [
                                  ...(editedProgram.sessions || []),
                                ];
                                const newExercises = newSessions[
                                  sessionIndex
                                ].training_exercises?.filter(
                                  (_, idx) => idx !== exerciseIndex
                                );
                                newSessions[sessionIndex] = {
                                  ...newSessions[sessionIndex],
                                  training_exercises: newExercises,
                                };
                                setEditedProgram({
                                  ...editedProgram,
                                  sessions: newSessions,
                                });
                              }}
                              className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>

                          {/* Parameters */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h5 className="text-sm font-medium text-gray-700">
                                Parameters
                              </h5>
                              <button
                                onClick={() => {
                                  const newSessions = [
                                    ...(editedProgram.sessions || []),
                                  ];
                                  const newExercises = [
                                    ...(newSessions[sessionIndex]
                                      .training_exercises || []),
                                  ];
                                  const newParams = [
                                    ...(exercise.exercise_parameters || []),
                                    {
                                      id: `new-${Date.now()}`,
                                      sets: 3,
                                      reps: 10,
                                      rest_seconds: 60,
                                      tempo: '2-0-2-0',
                                      notes: '',
                                    },
                                  ];
                                  newExercises[exerciseIndex] = {
                                    ...exercise,
                                    exercise_parameters: newParams,
                                  };
                                  newSessions[sessionIndex] = {
                                    ...newSessions[sessionIndex],
                                    training_exercises: newExercises,
                                  };
                                  setEditedProgram({
                                    ...editedProgram,
                                    sessions: newSessions,
                                  });
                                }}
                                className="px-2 py-1 text-xs bg-[var(--primary)] text-white rounded-md hover:scale-105 transition-transform duration-200"
                              >
                                Add Parameter Set
                              </button>
                            </div>

                            {exercise.exercise_parameters?.map(
                              (param, paramIndex) => (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  <div className="relative border rounded-lg p-6 col-span-full bg-white shadow-sm">
                                    <button
                                      onClick={() => {
                                        const newSessions = [
                                          ...(editedProgram.sessions || []),
                                        ];
                                        const newExercises = [
                                          ...(newSessions[sessionIndex]
                                            .training_exercises || []),
                                        ];
                                        const newParams =
                                          exercise.exercise_parameters?.filter(
                                            (_, idx) => idx !== paramIndex
                                          );
                                        newExercises[exerciseIndex] = {
                                          ...exercise,
                                          exercise_parameters: newParams,
                                        };
                                        newSessions[sessionIndex] = {
                                          ...newSessions[sessionIndex],
                                          training_exercises: newExercises,
                                        };
                                        setEditedProgram({
                                          ...editedProgram,
                                          sessions: newSessions,
                                        });
                                      }}
                                      className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-full"
                                    >
                                      <X size={20} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Week Number
                                        </label>
                                        <input
                                          type="number"
                                          value={param.week_number}
                                          onChange={(e) => {
                                            const newSessions = [
                                              ...(editedProgram.sessions || []),
                                            ];
                                            const newExercises = [
                                              ...(newSessions[sessionIndex]
                                                .training_exercises || []),
                                            ];
                                            const newParams =
                                              exercise.exercise_parameters?.map(
                                                (p) =>
                                                  p.id === param.id
                                                    ? {
                                                        ...p,
                                                        week_number: parseInt(
                                                          e.target.value
                                                        ),
                                                      }
                                                    : p
                                              );
                                            newExercises[exerciseIndex] = {
                                              ...exercise,
                                              exercise_parameters: newParams,
                                            };
                                            newSessions[sessionIndex] = {
                                              ...newSessions[sessionIndex],
                                              training_exercises: newExercises,
                                            };
                                            setEditedProgram({
                                              ...editedProgram,
                                              sessions: newSessions,
                                            });
                                          }}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Weight (kg)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          value={param.weight}
                                          onChange={(e) => {
                                            const newSessions = [
                                              ...(editedProgram.sessions || []),
                                            ];
                                            const newExercises = [
                                              ...(newSessions[sessionIndex]
                                                .training_exercises || []),
                                            ];
                                            const newParams =
                                              exercise.exercise_parameters?.map(
                                                (p) =>
                                                  p.id === param.id
                                                    ? {
                                                        ...p,
                                                        weight: parseFloat(
                                                          e.target.value
                                                        ),
                                                      }
                                                    : p
                                              );
                                            newExercises[exerciseIndex] = {
                                              ...exercise,
                                              exercise_parameters: newParams,
                                            };
                                            newSessions[sessionIndex] = {
                                              ...newSessions[sessionIndex],
                                              training_exercises: newExercises,
                                            };
                                            setEditedProgram({
                                              ...editedProgram,
                                              sessions: newSessions,
                                            });
                                          }}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Sets
                                        </label>
                                        <input
                                          type="number"
                                          value={param.sets}
                                          onChange={(e) => {
                                            const newSessions = [
                                              ...(editedProgram.sessions || []),
                                            ];
                                            const newExercises = [
                                              ...(newSessions[sessionIndex]
                                                .training_exercises || []),
                                            ];
                                            const newParams =
                                              exercise.exercise_parameters?.map(
                                                (p) =>
                                                  p.id === param.id
                                                    ? {
                                                        ...p,
                                                        sets: parseInt(
                                                          e.target.value
                                                        ),
                                                      }
                                                    : p
                                              );
                                            newExercises[exerciseIndex] = {
                                              ...exercise,
                                              exercise_parameters: newParams,
                                            };
                                            newSessions[sessionIndex] = {
                                              ...newSessions[sessionIndex],
                                              training_exercises: newExercises,
                                            };
                                            setEditedProgram({
                                              ...editedProgram,
                                              sessions: newSessions,
                                            });
                                          }}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Reps
                                        </label>
                                        <input
                                          type="number"
                                          value={param.reps}
                                          onChange={(e) => {
                                            const newSessions = [
                                              ...(editedProgram.sessions || []),
                                            ];
                                            const newExercises = [
                                              ...(newSessions[sessionIndex]
                                                .training_exercises || []),
                                            ];
                                            const newParams =
                                              exercise.exercise_parameters?.map(
                                                (p) =>
                                                  p.id === param.id
                                                    ? {
                                                        ...p,
                                                        reps: parseInt(
                                                          e.target.value
                                                        ),
                                                      }
                                                    : p
                                              );
                                            newExercises[exerciseIndex] = {
                                              ...exercise,
                                              exercise_parameters: newParams,
                                            };
                                            newSessions[sessionIndex] = {
                                              ...newSessions[sessionIndex],
                                              training_exercises: newExercises,
                                            };
                                            setEditedProgram({
                                              ...editedProgram,
                                              sessions: newSessions,
                                            });
                                          }}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Rest (s)
                                        </label>
                                        <input
                                          type="number"
                                          value={param.rest_seconds}
                                          onChange={(e) => {
                                            const newSessions = [
                                              ...(editedProgram.sessions || []),
                                            ];
                                            const newExercises = [
                                              ...(newSessions[sessionIndex]
                                                .training_exercises || []),
                                            ];
                                            const newParams =
                                              exercise.exercise_parameters?.map(
                                                (p) =>
                                                  p.id === param.id
                                                    ? {
                                                        ...p,
                                                        rest_seconds: parseInt(
                                                          e.target.value
                                                        ),
                                                      }
                                                    : p
                                              );
                                            newExercises[exerciseIndex] = {
                                              ...exercise,
                                              exercise_parameters: newParams,
                                            };
                                            newSessions[sessionIndex] = {
                                              ...newSessions[sessionIndex],
                                              training_exercises: newExercises,
                                            };
                                            setEditedProgram({
                                              ...editedProgram,
                                              sessions: newSessions,
                                            });
                                          }}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Tempo
                                        </label>
                                        <input
                                          type="text"
                                          value={param.tempo}
                                          onChange={(e) => {
                                            const newSessions = [
                                              ...(editedProgram.sessions || []),
                                            ];
                                            const newExercises = [
                                              ...(newSessions[sessionIndex]
                                                .training_exercises || []),
                                            ];
                                            const newParams =
                                              exercise.exercise_parameters?.map(
                                                (p) =>
                                                  p.id === param.id
                                                    ? {
                                                        ...p,
                                                        tempo: e.target.value,
                                                      }
                                                    : p
                                              );
                                            newExercises[exerciseIndex] = {
                                              ...exercise,
                                              exercise_parameters: newParams,
                                            };
                                            newSessions[sessionIndex] = {
                                              ...newSessions[sessionIndex],
                                              training_exercises: newExercises,
                                            };
                                            setEditedProgram({
                                              ...editedProgram,
                                              sessions: newSessions,
                                            });
                                          }}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
                                        />
                                      </div>
                                      <div className="col-span-full space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Notes
                                        </label>
                                        <input
                                          type="text"
                                          value={param.notes || ''}
                                          onChange={(e) => {
                                            const newSessions = [
                                              ...(editedProgram.sessions || []),
                                            ];
                                            const newExercises = [
                                              ...(newSessions[sessionIndex]
                                                .training_exercises || []),
                                            ];
                                            const newParams =
                                              exercise.exercise_parameters?.map(
                                                (p) =>
                                                  p.id === param.id
                                                    ? {
                                                        ...p,
                                                        notes: e.target.value,
                                                      }
                                                    : p
                                              );
                                            newExercises[exerciseIndex] = {
                                              ...exercise,
                                              exercise_parameters: newParams,
                                            };
                                            newSessions[sessionIndex] = {
                                              ...newSessions[sessionIndex],
                                              training_exercises: newExercises,
                                            };
                                            setEditedProgram({
                                              ...editedProgram,
                                              sessions: newSessions,
                                            });
                                          }}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {editError && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setIsEditingProgram(false);
                  setEditedProgram(null);
                  setEditError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editedProgram || !selectedUser) return;

                  try {
                    setLoading(true);
                    setEditError(null);

                    // Update the program in the database
                    const { error: programError } = await supabase
                      .from('training_programs')
                      .update({
                        name: editedProgram.name,
                        total_weeks: editedProgram.total_weeks,
                        start_date: editedProgram.start_date,
                        end_date: editedProgram.end_date,
                      })
                      .eq('id', editedProgram.id);

                    if (programError) throw programError;

                    // Update or create sessions
                    for (const session of editedProgram.sessions || []) {
                      if (session.id.startsWith('new-')) {
                        // Create new session
                        const { data: newSession, error: sessionError } =
                          await supabase
                            .from('training_sessions')
                            .insert({
                              program_id: editedProgram.id,
                              name: session.name,
                              day_of_week: session.day_of_week,
                              order_index: 0, // You might want to calculate this based on existing sessions
                            })
                            .select()
                            .single();

                        if (sessionError) throw sessionError;

                        // Update exercises for this new session
                        for (const exercise of session.training_exercises ||
                          []) {
                          if (!exercise.exercise_id) continue; // Skip if no exercise is selected

                          const { data: newExercise, error: exerciseError } =
                            await supabase
                              .from('training_exercises')
                              .insert({
                                session_id: newSession.id,
                                exercise_id: exercise.exercise_id,
                                order_index: 0, // You might want to calculate this
                              })
                              .select()
                              .single();

                          if (exerciseError) throw exerciseError;

                          // Create parameters for this new exercise
                          for (const param of exercise.exercise_parameters ||
                            []) {
                            const { error: paramError } = await supabase
                              .from('exercise_parameters')
                              .insert({
                                training_exercise_id: newExercise.id,
                                week_number: param.week_number || 1,
                                sets: param.sets || 3,
                                reps: param.reps || '10',
                                rest_seconds: param.rest_seconds || 60,
                                tempo: param.tempo || '2-0-2-0',
                                weight: param.weight || null,
                                notes: param.notes || '',
                              });

                            if (paramError) throw paramError;
                          }
                        }
                      } else {
                        // Update existing session
                        const { error: sessionError } = await supabase
                          .from('training_sessions')
                          .update({
                            name: session.name,
                            day_of_week: session.day_of_week,
                          })
                          .eq('id', session.id);

                        if (sessionError) throw sessionError;

                        // Update or create exercises
                        for (const exercise of session.training_exercises ||
                          []) {
                          if (exercise.id.startsWith('new-')) {
                            if (!exercise.exercise_id) continue; // Skip if no exercise is selected

                            // Create new exercise
                            const { data: newExercise, error: exerciseError } =
                              await supabase
                                .from('training_exercises')
                                .insert({
                                  session_id: session.id,
                                  exercise_id: exercise.exercise_id,
                                  order_index: 0, // You might want to calculate this
                                })
                                .select()
                                .single();

                            if (exerciseError) throw exerciseError;

                            // Create parameters for this new exercise
                            for (const param of exercise.exercise_parameters ||
                              []) {
                              const { error: paramError } = await supabase
                                .from('exercise_parameters')
                                .insert({
                                  training_exercise_id: newExercise.id,
                                  week_number: param.week_number || 1,
                                  sets: param.sets || 3,
                                  reps: param.reps || '10',
                                  rest_seconds: param.rest_seconds || 60,
                                  tempo: param.tempo || '2-0-2-0',
                                  weight: param.weight || null,
                                  notes: param.notes || '',
                                });

                              if (paramError) throw paramError;
                            }
                          } else {
                            // Update existing exercise
                            const { error: exerciseError } = await supabase
                              .from('training_exercises')
                              .update({
                                exercise_id: exercise.exercise_id,
                              })
                              .eq('id', exercise.id);

                            if (exerciseError) throw exerciseError;

                            // Update or create parameters
                            for (const param of exercise.exercise_parameters ||
                              []) {
                              if (param.id.startsWith('new-')) {
                                // Create new parameter
                                const { error: paramError } = await supabase
                                  .from('exercise_parameters')
                                  .insert({
                                    training_exercise_id: exercise.id,
                                    week_number: param.week_number || 1,
                                    sets: param.sets || 3,
                                    reps: param.reps || '10',
                                    rest_seconds: param.rest_seconds || 60,
                                    tempo: param.tempo || '2-0-2-0',
                                    weight: param.weight || null,
                                    notes: param.notes || '',
                                  });

                                if (paramError) throw paramError;
                              } else {
                                // Update existing parameter
                                const { error: paramError } = await supabase
                                  .from('exercise_parameters')
                                  .update({
                                    week_number: param.week_number,
                                    sets: param.sets,
                                    reps: param.reps,
                                    rest_seconds: param.rest_seconds,
                                    tempo: param.tempo,
                                    weight: param.weight,
                                    notes: param.notes,
                                  })
                                  .eq('id', param.id);

                                if (paramError) throw paramError;
                              }
                            }
                          }
                        }
                      }
                    }

                    // Refresh the program data
                    await fetchUserDetails(selectedUser.user_id);
                    setIsEditingProgram(false);
                  } catch (err: any) {
                    console.error('Error updating program:', err);
                    setEditError(err.message || 'Failed to update program');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-4 py-2 bg-[--primary] text-white rounded-md hover:bg-[--primary-dark] transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Add Session Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  const newSessions = [
                    ...(editedProgram.sessions || []),
                    {
                      id: `new-${Date.now()}`,
                      name: `Session ${
                        (editedProgram.sessions?.length || 0) + 1
                      }`,
                      day_of_week: 0,
                      training_exercises: [],
                    },
                  ];
                  setEditedProgram({
                    ...editedProgram,
                    sessions: newSessions,
                  });
                }}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:scale-105 transition-transform duration-200"
              >
                Add New Session
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {userProgram ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {userProgram.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(userProgram.start_date).toLocaleDateString()} -{' '}
                      {new Date(userProgram.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {userProgram.total_weeks} weeks program
                  </div>
                </div>

                {userProgram.sessions?.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">{session.name}</h4>
                      <span className="text-sm text-gray-600">
                        Day {session.day_of_week + 1}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {session.training_exercises?.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={exercise.exercise?.image_url}
                                alt={exercise.exercise?.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium mb-2">
                                {exercise.exercise?.title}
                              </h5>

                              {exercise.exercise_parameters?.map((param) => (
                                <div
                                  key={param.id}
                                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4"
                                >
                                  <div className="p-2">
                                    <span className="text-gray-600 block mb-1">
                                      Week:
                                    </span>
                                    <span className="font-medium text-lg">
                                      {param.week_number}
                                    </span>
                                  </div>
                                  <div className="p-2">
                                    <span className="text-gray-600 block mb-1">
                                      Weight:
                                    </span>
                                    <span className="font-medium text-lg">
                                      {param.weight}kg
                                    </span>
                                  </div>
                                  <div className="p-2">
                                    <span className="text-gray-600 block mb-1">
                                      Sets:
                                    </span>
                                    <span className="font-medium text-lg">
                                      {param.sets}
                                    </span>
                                  </div>
                                  <div className="p-2">
                                    <span className="text-gray-600 block mb-1">
                                      Reps:
                                    </span>
                                    <span className="font-medium text-lg">
                                      {param.reps}
                                    </span>
                                  </div>
                                  <div className="p-2">
                                    <span className="text-gray-600 block mb-1">
                                      Rest:
                                    </span>
                                    <span className="font-medium text-lg">
                                      {param.rest_seconds}s
                                    </span>
                                  </div>
                                  <div className="p-2">
                                    <span className="text-gray-600 block mb-1">
                                      Tempo:
                                    </span>
                                    <span className="font-medium text-lg">
                                      {param.tempo}
                                    </span>
                                  </div>
                                  {param.notes && (
                                    <div className="col-span-2 md:col-span-3 lg:col-span-4 p-2">
                                      <span className="text-gray-600 block mb-1">
                                        Notes:
                                      </span>
                                      <span className="font-medium">
                                        {param.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DumbbellIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  No training program assigned yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const groupPhotosByPose = (photos: any[]) => {
    const photosByPose: { [key: string]: any } = {};

    // First, group all photos by pose
    photos.forEach((photo) => {
      if (!photosByPose[photo.pose]) {
        photosByPose[photo.pose] = [];
      }
      photosByPose[photo.pose].push(photo);
    });

    // For each pose, sort photos by date and get first, previous, and current
    const result: {
      [key: string]: { first: any; previous: any; current: any };
    } = {};

    Object.keys(photosByPose).forEach((pose) => {
      const posePhotos = photosByPose[pose].sort(
        (a: any, b: any) =>
          new Date(a.check_date).getTime() - new Date(b.check_date).getTime()
      );

      result[pose] = {
        first: posePhotos[0] || null,
        previous: posePhotos[posePhotos.length - 2] || null,
        current: posePhotos[posePhotos.length - 1] || null,
      };
    });

    return result;
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter((user) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);

      // Subscription filter
      const matchesSubscription =
        filterSubscription === 'all' ||
        (filterSubscription === 'free' &&
          user.subscription?.subscription_type === 'Free') ||
        (filterSubscription === 'paid' &&
          user.subscription?.subscription_type !== 'Free');

      // Expiring program filter
      const matchesExpiringProgram =
        !filterExpiringProgram || isExpiringSoon(user.program?.end_date || '');

      // Expiring subscription filter
      const matchesExpiringSubscription =
        !filterExpiringSubscription ||
        isExpiringSoon(user.subscription?.end_date || '');

      return (
        matchesSearch &&
        matchesSubscription &&
        matchesExpiringProgram &&
        matchesExpiringSubscription
      );
    })
    .sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case 'full_name':
          valueA = a.full_name || '';
          valueB = b.full_name || '';
          break;
        case 'email':
          valueA = a.email;
          valueB = b.email;
          break;
        case 'subscription_type':
          valueA = a.subscription?.subscription_type || 'Free';
          valueB = b.subscription?.subscription_type || 'Free';
          break;
        case 'subscription_end':
          valueA = a.subscription?.end_date || '';
          valueB = b.subscription?.end_date || '';
          break;
        case 'program_end':
          valueA = a.program?.end_date || '';
          valueB = b.program?.end_date || '';
          break;
        default:
          valueA = a.full_name || '';
          valueB = b.full_name || '';
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  if (loading && users.length === 0) {
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

  if (selectedUser) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSelectedUser(null)}
            className="text-[--primary] hover:underline flex items-center gap-2"
          >
            <ChevronDown size={20} />
            Back to Users List
          </button>
          <h2 className="text-2xl font-bold">User Profile</h2>
        </div>

        {/* User Info Card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
              <img
                src="https://via.placeholder.com/150"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{selectedUser.full_name}</h3>
              <p className="text-gray-600">{selectedUser.email}</p>
              <div className="mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${
                    selectedUser.subscription?.subscription_type === 'Free'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {selectedUser.subscription?.subscription_type || 'Free'} Plan
                </span>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          {userDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>Gender: {userDetails.gender || 'Not specified'}</li>
                  <li>
                    Date of Birth:{' '}
                    {userDetails.date_of_birth
                      ? new Date(userDetails.date_of_birth).toLocaleDateString()
                      : 'Not specified'}
                  </li>
                  <li>Height: {userDetails.height || 'Not specified'} cm</li>
                  <li>
                    Initial Weight: {userDetails.weight || 'Not specified'} kg
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Lifestyle & Training</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>Job Type: {userDetails.job_type || 'Not specified'}</li>
                  <li>Lifestyle: {userDetails.lifestyle || 'Not specified'}</li>
                  <li>
                    Training Experience:{' '}
                    {userDetails.training_experience_months || 0} months
                  </li>
                  <li>
                    Training Type:{' '}
                    {userDetails.training_type || 'Not specified'}
                  </li>
                  <li>
                    Preferred Training Days:{' '}
                    {userDetails.preferred_training_days || 'Not specified'}
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Goals</h4>
                <div className="flex flex-wrap gap-2">
                  {userDetails.goals?.map((goal: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-[--primary] bg-opacity-10 text-[--primary] rounded-full text-sm text-white"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Health Information</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>
                    Medical Conditions:{' '}
                    {userDetails.medical_conditions || 'None reported'}
                  </li>
                  <li>
                    Medications: {userDetails.medications || 'None reported'}
                  </li>
                  <li>
                    Joint Pain: {userDetails.joint_pain || 'None reported'}
                  </li>
                  <li>
                    Past Surgeries:{' '}
                    {userDetails.past_surgeries || 'None reported'}
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Nutrition & Lifestyle</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>
                    Diet Description:{' '}
                    {userDetails.diet_description || 'Not specified'}
                  </li>
                  <li>
                    Supplements: {userDetails.supplements || 'None reported'}
                  </li>
                  <li>
                    Food Intolerances:{' '}
                    {userDetails.food_intolerances || 'None reported'}
                  </li>
                  <li>
                    Alcohol Consumption:{' '}
                    {userDetails.alcohol_consumption || 'Not specified'}
                  </li>
                  <li>
                    Menstrual Cycle:{' '}
                    {userDetails.menstrual_cycle || 'Not applicable'}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Training Program Section */}
        {renderTrainingProgram()}

        {/* Weight History */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Weight History</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="log_date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: any) => [`${value} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--primary)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Photos */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Progress Photos</h2>
          {progressPhotos.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupPhotosByPose(progressPhotos)).map(
                ([pose, photos]) => (
                  <div key={pose} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        const element = document.getElementById(
                          `photos-${pose}`
                        );
                        if (element) {
                          element.classList.toggle('hidden');
                        }
                      }}
                      className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
                    >
                      <h3 className="font-semibold">
                        {getPoseDisplayName(pose)}
                      </h3>
                      <ChevronDown size={20} className="text-gray-600" />
                    </button>

                    <div id={`photos-${pose}`} className="hidden">
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* First Check */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-600">
                              First Check
                            </h4>
                            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                              {photos.first && (
                                <img
                                  src={photos.first.photo_url}
                                  alt={`${pose} first check`}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            {photos.first && (
                              <p className="text-sm text-center text-gray-600">
                                {new Date(
                                  photos.first.check_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {/* Previous Check */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-600">
                              Previous Check
                            </h4>
                            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                              {photos.previous &&
                                photos.previous.id !== photos.first?.id && (
                                  <img
                                    src={photos.previous.photo_url}
                                    alt={`${pose} previous check`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                            </div>
                            {photos.previous &&
                              photos.previous.id !== photos.first?.id && (
                                <p className="text-sm text-center text-gray-600">
                                  {new Date(
                                    photos.previous.check_date
                                  ).toLocaleDateString()}
                                </p>
                              )}
                          </div>

                          {/* Current Check */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-600">
                              Current
                            </h4>
                            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                              {photos.current &&
                                photos.current.id !== photos.previous?.id &&
                                photos.current.id !== photos.first?.id && (
                                  <img
                                    src={photos.current.photo_url}
                                    alt={`${pose} current`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                            </div>
                            {photos.current &&
                              photos.current.id !== photos.previous?.id &&
                              photos.current.id !== photos.first?.id && (
                                <p className="text-sm text-center text-gray-600">
                                  {new Date(
                                    photos.current.check_date
                                  ).toLocaleDateString()}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              No progress photos uploaded yet.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">User Management</h2>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                />
              </div>
            </div>

            {/* Subscription Filter */}
            <div>
              <label
                htmlFor="subscription-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subscription Type
              </label>
              <select
                id="subscription-filter"
                value={filterSubscription}
                onChange={(e) => setFilterSubscription(e.target.value)}
                className="px-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
              >
                <option value="all">All Subscriptions</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>
            </div>

            {/* Expiring Program Filter */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterExpiringProgram}
                  onChange={(e) => setFilterExpiringProgram(e.target.checked)}
                  className="h-4 w-4 text-[--primary] focus:ring-[--primary] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Expiring Programs (7 days)
                </span>
              </label>
            </div>

            {/* Expiring Subscription Filter */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterExpiringSubscription}
                  onChange={(e) =>
                    setFilterExpiringSubscription(e.target.checked)
                  }
                  className="h-4 w-4 text-[--primary] focus:ring-[--primary] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Expiring Subscriptions (7 days)
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('full_name')}
                >
                  User {getSortIcon('full_name')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  Email {getSortIcon('email')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('subscription_type')}
                >
                  Subscription {getSortIcon('subscription_type')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('subscription_end')}
                >
                  Subscription Expiry {getSortIcon('subscription_end')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('program_end')}
                >
                  Program Expiry {getSortIcon('program_end')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 ">
              {filteredAndSortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleUserClick(user)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscription?.subscription_type === 'Free'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user.subscription?.subscription_type || 'Free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${
                        isExpiringSoon(user.subscription?.end_date || '')
                          ? 'text-red-600 font-medium flex items-center'
                          : 'text-gray-500'
                      }`}
                    >
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
                    <div
                      className={`text-sm ${
                        isExpiringSoon(user.program?.end_date || '')
                          ? 'text-red-600 font-medium flex items-center'
                          : 'text-gray-500'
                      }`}
                    >
                      {isExpiringSoon(user.program?.end_date || '') && (
                        <AlertCircle size={16} className="mr-1" />
                      )}
                      {formatDate(user.program?.end_date || '')}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAndSortedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No users found matching the current filters
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

export default AdminUsers;
