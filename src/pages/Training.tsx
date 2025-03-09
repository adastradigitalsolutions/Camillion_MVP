import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  TrainingSession,
  Exercise,
  TrainingExercise,
  CompletedWorkout,
} from '../types/database';
import { useNavigate } from 'react-router-dom';

const Training = () => {
  const navigate = useNavigate();
  const [userSubscription, setUserSubscription] = useState<string>('Free');
  const [showProgramNotCreatedModal, setShowProgramNotCreatedModal] =
    useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [exerciseNotes, setExerciseNotes] = useState<{ [key: string]: string }>(
    {}
  );
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>(
    []
  );
  const [completedWorkouts, setCompletedWorkouts] = useState<
    CompletedWorkout[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showLogWorkoutModal, setShowLogWorkoutModal] = useState(false);
  const [logWorkoutDate, setLogWorkoutDate] = useState<Date | null>(null);
  const [logWorkoutStep, setLogWorkoutStep] = useState<
    'select-session' | 'confirm'
  >('select-session');
  const [selectedSession, setSelectedSession] =
    useState<TrainingSession | null>(null);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Fetch training sessions and completed workouts on component mount
  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('No authenticated user');
        }

        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('subscription_type')
          .eq('user_id', user.id)
          .single();

        if (subError && subError.code != 'PGRST116') {
          console.error('Error');
        } else if (subData) {
          setUserSubscription(subData.subscription_type);
        }

        // Fetch user's active training program
        const { data: programData, error: programError } = await supabase
          .from('training_programs')
          .select('*')
          .eq('user_id', user.id)
          .gte('end_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: false })
          .limit(1)
          .single();

        if (programError && programError.code !== 'PGRST116') {
          throw programError;
        }

        if (programData) {
          // Fetch training sessions for this program
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('training_sessions')
            .select(
              `
              *,
              training_exercises:training_exercises(
                *,
                exercise:exercises(*),
                exercise_parameters:exercise_parameters(*)
              )
            `
            )
            .eq('program_id', programData.id)
            .order('order_index');

          if (sessionsError) throw sessionsError;

          // Fetch completed workouts
          const { data: completedData, error: completedError } = await supabase
            .from('completed_workouts')
            .select(
              `
              *,
              session:training_sessions(*)
            `
            )
            .eq('user_id', user.id);

          if (completedError) throw completedError;

          setTrainingSessions(sessionsData || []);
          setCompletedWorkouts(completedData || []);
        }
      } catch (error) {
        console.error('Error fetching training data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingData();
  }, []);

  // Generate calendar days for the current week
  const generateWeekDays = (date: Date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = generateWeekDays(selectedDate);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  };

  const isTrainingCompleted = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return completedWorkouts.some(
      (workout) => workout.completed_date.split('T')[0] === dateString
    );
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleStartTraining = () => {
    if (userSubscription === 'Free') {
      setShowSubscriptionModal(true);
      return;
    }

    if (trainingSessions.length === 0) {
      setShowProgramNotCreatedModal(true);
      return;
    }

    setShowTrainingModal(true);
  };

  const handleSelectProgram = (program: any) => {
    setSelectedProgram(program);
    setCurrentExerciseIndex(0);
    setShowTrainingModal(false);
    setShowExerciseModal(true);
  };

  const handleNextExercise = async () => {
    if (selectedProgram) {
      const exercises =
        selectedProgram.training_exercises || selectedProgram.exercises;
      console.log(exercises);
      const isLastExercise = currentExerciseIndex >= exercises.length - 1;

      if (isLastExercise) {
        // This is the last exercise, complete the workout
        await completeWorkout();
      } else {
        // Move to the next exercise
        setCurrentExerciseIndex((prev) => prev + 1);
      }
    }
  };

  const completeWorkout = async () => {
    if (!selectedProgram) return;

    setSavingWorkout(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      const today = new Date().toISOString().split('T')[0];

      // Check if this workout was already completed today
      const { data: existingWorkout } = await supabase
        .from('completed_workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_id', selectedProgram.id)
        .eq('completed_date', today)
        .single();

      if (!existingWorkout) {
        // Insert new completed workout
        const { error } = await supabase.from('completed_workouts').insert({
          user_id: user.id,
          session_id: selectedProgram.id,
          completed_date: today,
        });

        if (error) throw error;
      }

      // Refresh completed workouts
      const { data: updatedWorkouts, error: fetchError } = await supabase
        .from('completed_workouts')
        .select(
          `
          *,
          session:training_sessions(*)
        `
        )
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      setCompletedWorkouts(updatedWorkouts || []);
      setShowExerciseModal(false);
    } catch (error) {
      console.error('Error completing workout:', error);
    } finally {
      setSavingWorkout(false);
    }
  };

  const handleViewExercise = (exercise: any) => {
    setSelectedExercise(exercise);
  };

  const handleUpdateNotes = (exerciseId: string, notes: string) => {
    setExerciseNotes((prev) => ({
      ...prev,
      [exerciseId]: notes,
    }));
  };

  const handleDayClick = (date: Date) => {
    // Only allow logging workouts for past dates
    if (isPastDate(date)) {
      if (userSubscription === 'Free') {
        setShowSubscriptionModal(true);
        return;
      }

      if (trainingSessions.length === 0) {
        setShowProgramNotCreatedModal(true);
        return;
      }

      setLogWorkoutDate(date);
      setLogWorkoutStep('select-session');
      setSelectedSession(null);
      setShowLogWorkoutModal(true);
    }
  };

  const handleSelectSession = (session: TrainingSession) => {
    setSelectedSession(session);
    setLogWorkoutStep('confirm');
  };

  const handleLogWorkoutConfirm = async () => {
    if (!logWorkoutDate || !selectedSession) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      const dateString = logWorkoutDate.toISOString().split('T')[0];

      // Check if workout already exists for this date and session
      const { data: existingWorkout } = await supabase
        .from('completed_workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_id', selectedSession.id)
        .eq('completed_date', dateString)
        .single();

      if (existingWorkout) {
        // Workout already exists, no need to insert
        setShowLogWorkoutModal(false);
        return;
      }

      // Insert new completed workout
      const { error } = await supabase.from('completed_workouts').insert({
        user_id: user.id,
        session_id: selectedSession.id,
        completed_date: dateString,
      });

      if (error) throw error;

      // Refresh completed workouts
      const { data: updatedWorkouts, error: fetchError } = await supabase
        .from('completed_workouts')
        .select(
          `
          *,
          session:training_sessions(*)
        `
        )
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      setCompletedWorkouts(updatedWorkouts || []);
      setShowLogWorkoutModal(false);
    } catch (error) {
      console.error('Error logging workout:', error);
    }
  };

  const trainingPrograms = [
    {
      name: 'Training A',
      exercises: [
        {
          name: 'Bench Press',
          sets: 4,
          reps: '8-10',
          rest: '90s',
          tempo: '2-1-2',
          videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
          description:
            'Perform with controlled movement, focusing on chest contraction.',
          ptNotes:
            'Keep your shoulders back and down throughout the movement. Focus on driving through your chest, not your shoulders.',
          userNotes: '',
        },
        {
          name: 'Squats',
          sets: 4,
          reps: '8-12',
          rest: '120s',
          tempo: '2-1-2',
          videoUrl: 'https://www.youtube.com/embed/gsNoPYwWXeM',
          description:
            'Keep your back straight and go as low as your mobility allows.',
          ptNotes:
            'Remember to keep your core tight and maintain a neutral spine. Drive through your heels.',
          userNotes: '',
        },
      ],
    },
    {
      name: 'Training B',
      exercises: [
        {
          name: 'Pull-ups',
          sets: 4,
          reps: '6-8',
          rest: '90s',
          tempo: '2-1-2',
          videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g',
          description: 'Focus on full range of motion and controlled descent.',
          ptNotes:
            'Initiate the movement by pulling your shoulder blades down. Keep your core engaged throughout.',
          userNotes: '',
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Your Training</h1>

        {/* Calendar Strip */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePreviousWeek} className="p-2">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold">
              {selectedDate.toLocaleString('default', { month: 'long' })}{' '}
              {selectedDate.getFullYear()}
            </h2>
            <button onClick={handleNextWeek} className="p-2">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date, index) => (
              <button
                key={index}
                onClick={() => handleDayClick(date)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  date.toDateString() === selectedDate.toDateString()
                    ? 'bg-[--primary] text-white'
                    : isPastDate(date)
                    ? 'hover:bg-gray-100 cursor-pointer'
                    : 'opacity-50 cursor-default'
                }`}
                disabled={!isPastDate(date)}
              >
                <span className="text-xs">{formatDate(date)}</span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                {isTrainingCompleted(date) && (
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-4">
          <button
            onClick={handleStartTraining}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Train Now
          </button>
          <button
            onClick={() => {
              if (userSubscription === 'Free') {
                setShowSubscriptionModal(true);
                return;
              }

              if (trainingSessions.length === 0) {
                setShowProgramNotCreatedModal(true);
                return;
              }

              setShowProgramModal(true);
            }}
            className="bg-white text-[--primary] border-2 border-[--primary] font-semibold py-2 px-6 rounded-lg 
              transform transition-all duration-200 hover:bg-[--primary] hover:text-white"
          >
            View My Program
          </button>
        </div>
      </div>

      {/* Training Selection Modal */}
      <AnimatePresence>
        {showTrainingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto"
          >
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Select Training</h2>
                <button
                  onClick={() => setShowTrainingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                {trainingSessions.length > 0
                  ? trainingSessions.map((session, index) => (
                      <button
                        key={session.id}
                        onClick={() => handleSelectProgram(session)}
                        className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-left"
                      >
                        <h3 className="text-lg font-semibold">
                          {session.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {session.training_exercises?.length || 0} exercises
                        </p>
                      </button>
                    ))
                  : trainingPrograms.map((program, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectProgram(program)}
                        className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-left"
                      >
                        <h3 className="text-lg font-semibold">
                          {program.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {program.exercises.length} exercises
                        </p>
                      </button>
                    ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Modal */}
      <AnimatePresence>
        {showExerciseModal && selectedProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-6">
                {selectedProgram.training_exercises ? (
                  <h2 className="text-2xl font-bold">
                    {selectedProgram.training_exercises[currentExerciseIndex]
                      ?.exercise?.title || 'Exercise'}
                  </h2>
                ) : (
                  <h2 className="text-2xl font-bold">
                    {selectedProgram.exercises[currentExerciseIndex]?.name ||
                      'Exercise'}
                  </h2>
                )}
                <button
                  onClick={() => setShowExerciseModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-6">
                {selectedProgram.training_exercises ? (
                  <iframe
                    src={
                      selectedProgram.training_exercises[currentExerciseIndex]
                        ?.exercise?.video_url || ''
                    }
                    title={
                      selectedProgram.training_exercises[currentExerciseIndex]
                        ?.exercise?.title || 'Exercise Video'
                    }
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    src={
                      selectedProgram.exercises[currentExerciseIndex]
                        ?.videoUrl || ''
                    }
                    title={
                      selectedProgram.exercises[currentExerciseIndex]?.name ||
                      'Exercise Video'
                    }
                    className="w-full h-full"
                    allowFullScreen
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Sets</p>
                  <p className="text-lg font-bold">
                    {selectedProgram.training_exercises
                      ? selectedProgram.training_exercises[currentExerciseIndex]
                          ?.exercise_parameters?.[0]?.sets || 4
                      : selectedProgram.exercises[currentExerciseIndex]?.sets ||
                        4}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Reps</p>
                  <p className="text-lg font-bold">
                    {selectedProgram.training_exercises
                      ? selectedProgram.training_exercises[currentExerciseIndex]
                          ?.exercise_parameters?.[0]?.reps || '8-12'
                      : selectedProgram.exercises[currentExerciseIndex]?.reps ||
                        '8-12'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Rest</p>
                  <p className="text-lg font-bold">
                    {selectedProgram.training_exercises
                      ? `${
                          selectedProgram.training_exercises[
                            currentExerciseIndex
                          ]?.exercise_parameters?.[0]?.rest_seconds || 90
                        }s`
                      : selectedProgram.exercises[currentExerciseIndex]?.rest ||
                        '90s'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tempo</p>
                  <p className="text-lg font-bold">
                    {selectedProgram.training_exercises
                      ? selectedProgram.training_exercises[currentExerciseIndex]
                          ?.exercise_parameters?.[0]?.tempo || '2-1-2'
                      : selectedProgram.exercises[currentExerciseIndex]
                          ?.tempo || '2-1-2'}
                  </p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Notes from PT</h3>
                  <p className="text-gray-600">
                    {selectedProgram.training_exercises
                      ? selectedProgram.training_exercises[currentExerciseIndex]
                          ?.exercise?.description ||
                        'Focus on proper form and controlled movement.'
                      : selectedProgram.exercises[currentExerciseIndex]
                          ?.ptNotes ||
                        'Focus on proper form and controlled movement.'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">My Notes</h3>
                  <textarea
                    value={
                      exerciseNotes[
                        selectedProgram.training_exercises
                          ? selectedProgram.training_exercises[
                              currentExerciseIndex
                            ]?.exercise?.id || ''
                          : selectedProgram.exercises[currentExerciseIndex]
                              ?.name || ''
                      ] || ''
                    }
                    onChange={(e) =>
                      handleUpdateNotes(
                        selectedProgram.training_exercises
                          ? selectedProgram.training_exercises[
                              currentExerciseIndex
                            ]?.exercise?.id || ''
                          : selectedProgram.exercises[currentExerciseIndex]
                              ?.name || '',
                        e.target.value
                      )
                    }
                    placeholder="Add your notes here..."
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[--primary] focus:ring-1 focus:ring-[--primary] outline-none"
                    rows={3}
                  />
                </div>
              </div>
              <button
                onClick={handleNextExercise}
                className="btn-primary w-full"
                disabled={savingWorkout}
              >
                {savingWorkout ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : selectedProgram.training_exercises ? (
                  currentExerciseIndex ===
                  selectedProgram.training_exercises.length - 1 ? (
                    'Complete Workout'
                  ) : (
                    'Next Exercise'
                  )
                ) : currentExerciseIndex ===
                  selectedProgram.exercises.length - 1 ? (
                  'Complete Workout'
                ) : (
                  'Next Exercise'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Program View Modal */}
      <AnimatePresence>
        {showProgramModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Program</h2>
                <button
                  onClick={() => setShowProgramModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-6">
                {trainingSessions.length > 0
                  ? trainingSessions.map((session) => (
                      <div key={session.id} className="card">
                        <h3 className="text-xl font-bold mb-4">
                          {session.name}
                        </h3>
                        <div className="space-y-4">
                          {session.training_exercises?.map(
                            (trainingExercise) => (
                              <button
                                key={trainingExercise.id}
                                onClick={() =>
                                  handleViewExercise(trainingExercise.exercise)
                                }
                                className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-left"
                              >
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold">
                                    {trainingExercise.exercise?.title}
                                  </h4>
                                  <span className="text-gray-600">
                                    4 x 8-12
                                  </span>
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  : trainingPrograms.map((program, programIndex) => (
                      <div key={programIndex} className="card">
                        <h3 className="text-xl font-bold mb-4">
                          {program.name}
                        </h3>
                        <div className="space-y-4">
                          {program.exercises.map((exercise, exerciseIndex) => (
                            <button
                              key={exerciseIndex}
                              onClick={() => handleViewExercise(exercise)}
                              className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-left"
                            >
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold">
                                  {exercise.name}
                                </h4>
                                <span className="text-gray-600">
                                  {exercise.sets} x {exercise.reps}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
              </div>
              <button
                onClick={() => {
                  setShowProgramModal(false);
                  handleStartTraining();
                }}
                className="btn-primary w-full mt-6"
              >
                Start Training
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*ADDED*/}
      <AnimatePresence>
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
                <h2 className="text-2xl font-bold mb-2">
                  Upgrade to have your personalized Training!{' '}
                </h2>
                <p className="text-gray-600">
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

                <div className="p-4 bg-[var(--primary)] bg-opacity-10 rounded-lg border-2 border-[var(--primary)]">
                  <h3 className="font-semibold mb-2 text-yellow-300">Premium Plans</h3>
                  <ul className="space-y-2 text-sm text-white">
                    <li >• Full exercise library</li>
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
      </AnimatePresence>
      {/*nuova Add*/}
      <AnimatePresence>
        {showProgramNotCreatedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowProgramNotCreatedModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-center mb-6">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-[--primary]" />
                <h2 className="text-2xl font-bold mb-2">
                  Program Not Created Yet
                </h2>
                <p className="text-gray-600">
                  Your personalized training program is being created by
                  Camilla. Please check back soon to start your training
                  journey!
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowProgramNotCreatedModal(false)}
                  className="btn-primary"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedExercise.name || selectedExercise.title}
                </h2>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-6">
                <iframe
                  src={selectedExercise.videoUrl || selectedExercise.video_url}
                  title={selectedExercise.name || selectedExercise.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Sets</p>
                  <p className="text-lg font-bold">
                    {selectedExercise.sets || 4}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Reps</p>
                  <p className="text-lg font-bold">
                    {selectedExercise.reps || '8-12'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Rest</p>
                  <p className="text-lg font-bold">
                    {selectedExercise.rest || '90s'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tempo</p>
                  <p className="text-lg font-bold">
                    {selectedExercise.tempo || '2-1-2'}
                  </p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Notes from PT</h3>
                  <p className="text-gray-600">
                    {selectedExercise.ptNotes || selectedExercise.description}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">My Notes</h3>
                  <textarea
                    value={
                      exerciseNotes[
                        selectedExercise.name || selectedExercise.title
                      ] || ''
                    }
                    onChange={(e) =>
                      handleUpdateNotes(
                        selectedExercise.name || selectedExercise.title,
                        e.target.value
                      )
                    }
                    placeholder="Add your notes here..."
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[--primary] focus:ring-1 focus:ring-[--primary] outline-none"
                    rows={3}
                  />
                </div>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="btn-primary w-full"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Workout Modal */}
      <AnimatePresence>
        {showLogWorkoutModal && logWorkoutDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto"
          >
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  Log Workout for {logWorkoutDate.toLocaleDateString()}
                </h2>
                <button
                  onClick={() => setShowLogWorkoutModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {logWorkoutStep === 'select-session' ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      Select the training session you completed:
                    </p>
                    <div className="space-y-3">
                      {trainingSessions.length > 0
                        ? trainingSessions.map((session) => (
                            <button
                              key={session.id}
                              onClick={() => handleSelectSession(session)}
                              className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-left"
                            >
                              <h3 className="font-semibold">{session.name}</h3>
                              <p className="text-sm text-gray-600">
                                {session.training_exercises?.length || 0}{' '}
                                exercises
                              </p>
                            </button>
                          ))
                        : trainingPrograms.map((program, index) => (
                            <button
                              key={index}
                              onClick={() =>
                                handleSelectSession(
                                  program as unknown as TrainingSession
                                )
                              }
                              className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-left"
                            >
                              <h3 className="font-semibold">{program.name}</h3>
                              <p className="text-sm text-gray-600">
                                {program.exercises.length} exercises
                              </p>
                            </button>
                          ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className="text-gray-600 mb-4">
                        You're about to log the following workout for{' '}
                        {logWorkoutDate.toLocaleDateString()}:
                      </p>
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h3 className="font-semibold mb-2">
                          Selected Training:
                        </h3>
                        <p className="text-lg">{selectedSession?.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedSession?.training_exercises?.length || 0}{' '}
                          exercises
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setLogWorkoutStep('select-session')}
                        className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleLogWorkoutConfirm}
                        className="flex-1 btn-primary"
                      >
                        Confirm
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Training;
