import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Upload, Calendar, Activity, Apple, Wine, Target, Trophy, Scale as Male, Scale as Female } from 'lucide-react';
import { supabase } from '../lib/supabase';

const screens = [
  {
    id: 1,
    title: "Welcome 🎉💪🔥",
    content: "Welcome to your personalized fitness journey! Answer a few questions to help us create the perfect program for you.",
    buttonText: "Let's Start!"
  },
  {
    id: 2,
    type: "form",
    title: "Personal Information",
    fields: [
      { name: "fullName", type: "text", label: "Full Name", required: true },
      { name: "dateOfBirth", type: "date", label: "Date of Birth", required: true },
      { name: "weight", type: "number", label: "Current Weight (kg)", required: true },
      { name: "height", type: "number", label: "Height (cm)", required: true }
    ]
  },
  {
    id: 3,
    type: "gender",
    title: "Your Gender",
    question: "Please select your gender",
    options: ["male", "female"],
    required: true
  },
  {
    id: 4,
    type: "multiChoice",
    title: "Your Lifestyle",
    questions: [
      {
        question: "jobType",
        label: "Job Type",
        options: ["Very demanding", "Moderate", "Sedentary"],
        required: true
      },
      {
        question: "lifestyle",
        label: "Lifestyle",
        options: ["Active", "Moderately active", "Sedentary"],
        required: true
      }
    ]
  },
  {
    id: 5,
    type: "motivational",
    title: "Every Step Counts!",
    content: "Your lifestyle impacts your progress. Even small changes can make a difference!",
    icon: Activity
  },
  {
    id: 6,
    type: "form",
    title: "Current Training",
    fields: [
      { name: "trainingExperience", type: "number", label: "How long have you been training? (months)", required: true },
      { name: "trainingType", type: "text", label: "Type of training (optional)" }
    ],
    hasUpload: true
  },
  {
    id: 7,
    type: "frequency",
    title: "Training Frequency",
    question: "How many times per week do you want to train?",
    options: [2, 3, 4],
    required: true
  },
  {
    id: 8,
    type: "form",
    title: "Health & Wellness",
    fields: [
      { 
        name: "medicalConditions", 
        type: "textarea", 
        label: "Current/past medical conditions",
        placeholder: "List any medical conditions that might affect your training"
      },
      { 
        name: "medications", 
        type: "text", 
        label: "Current medications",
        placeholder: "List any medications you're currently taking"
      },
      { 
        name: "jointPain", 
        type: "text", 
        label: "Any joint pain?",
        placeholder: "Describe any joint pain or discomfort"
      },
      { 
        name: "surgeries", 
        type: "text", 
        label: "Past surgeries",
        placeholder: "List any relevant surgeries"
      }
    ]
  },
  {
    id: 9,
    type: "nutrition",
    title: "Nutrition",
    icon: Apple,
    fields: [
      { 
        name: "diet", 
        type: "textarea", 
        label: "Describe your usual diet",
        placeholder: "Include typical meals and eating patterns",
        required: true
      },
      { 
        name: "supplements", 
        type: "text", 
        label: "Current supplements",
        placeholder: "List any supplements you take regularly",
        required: true
      },
      { 
        name: "allergies", 
        type: "text", 
        label: "Food intolerances/allergies",
        placeholder: "List any food allergies or intolerances",
        required: true
      }
    ]
  },
  {
    id: 10,
    type: "lifestyle",
    title: "Lifestyle Details",
    icon: Wine,
    questions: [
      {
        question: "alcoholConsumption",
        label: "Alcohol consumption",
        options: ["Never", "Once a week", "More than 3 times a week"],
        required: true
      },
      {
        question: "menstrualCycle",
        label: "Menstrual cycle",
        options: ["Regular", "Irregular", "Not applicable"],
        required: true
      }
    ]
  },
  {
    id: 11,
    type: "goals",
    title: "Your Goals",
    question: "What are your main goals? (Select all that apply)",
    options: [
      "Weight loss",
      "Muscle gain",
      "Performance improvement",
      "General well-being",
      "Flexibility",
      "Stress reduction",
      "Better sleep",
      "Other"
    ],
    required: true
  },
  {
    id: 12,
    type: "conclusion",
    title: "Awesome! 🎉",
    content: "We have everything we need to create your personalized plan. Get ready to give it your all!",
    buttonText: "Explore the app",
    icon: Trophy,
    showDemo: true
  }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [formData, setFormData] = useState<any>({
    selectedGoals: []
  });
  const [showDemo, setShowDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadExistingResponses();
  }, []);

  const loadExistingResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setIsUpdating(true);
        setFormData({
          fullName: data.full_name,
          dateOfBirth: data.date_of_birth,
          weight: data.weight,
          height: data.height,
          gender: data.gender,
          jobType: data.job_type,
          lifestyle: data.lifestyle,
          trainingExperience: data.training_experience_months,
          trainingType: data.training_type,
          frequency: data.preferred_training_days,
          medicalConditions: data.medical_conditions,
          medications: data.medications,
          jointPain: data.joint_pain,
          surgeries: data.past_surgeries,
          diet: data.diet_description,
          supplements: data.supplements,
          allergies: data.food_intolerances,
          alcoholConsumption: data.alcohol_consumption,
          menstrualCycle: data.menstrual_cycle,
          selectedGoals: data.goals || []
        });
      }
    } catch (err) {
      console.error('Error loading responses:', err);
      setError('Failed to load your previous responses');
    } finally {
      setLoading(false);
    }
  };

  const saveResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const formattedData = {
        user_id: user.id,
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        weight: formData.weight,
        height: formData.height,
        gender: formData.gender || null,
        job_type: formData.jobType || '',
        lifestyle: formData.lifestyle || '',
        training_experience_months: formData.trainingExperience,
        training_type: formData.trainingType,
        preferred_training_days: formData.frequency || 3,
        medical_conditions: formData.medicalConditions,
        medications: formData.medications,
        joint_pain: formData.jointPain,
        past_surgeries: formData.surgeries,
        diet_description: formData.diet,
        supplements: formData.supplements,
        food_intolerances: formData.allergies,
        alcohol_consumption: formData.alcoholConsumption || 'Never',
        menstrual_cycle: formData.menstrualCycle,
        goals: formData.selectedGoals,
        onboarding_completed: true
      };

      const { error } = await supabase
        .from('onboarding_responses')
        .upsert([formattedData], {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // If weight is provided, log it in weight_logs
      if (formData.weight && !isNaN(parseFloat(formData.weight)) && parseFloat(formData.weight) > 0) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const weight = parseFloat(formData.weight);

        // Check if there's already an entry for today
        const { data: existingEntries, error: fetchError } = await supabase
          .from('weight_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('log_date', today);

        if (fetchError) throw fetchError;

        if (existingEntries && existingEntries.length > 0) {
          // Update existing entry for today
          const { error: updateError } = await supabase
            .from('weight_logs')
            .update({ weight })
            .eq('id', existingEntries[0].id);
            
          if (updateError) throw updateError;
        } else {
          // Insert new entry for today
          const { error: insertError } = await supabase
            .from('weight_logs')
            .insert({
              user_id: user.id,
              weight,
              log_date: today
            });
            
          if (insertError) throw insertError;
        }
      }
    } catch (err) {
      console.error('Error saving responses:', err);
      setError('Failed to save your responses');
    }
  };

  const handleNext = async () => {
    // Validate required fields based on current screen
    const currentScreenData = screens[currentScreen];
    
    if (currentScreenData.type === "form" && currentScreenData.fields) {
      const requiredFields = currentScreenData.fields.filter(field => field.required);
      for (const field of requiredFields) {
        if (!formData[field.name]) {
          setError(`Please fill in ${field.label}`);
          return;
        }
      }
    }

    if (currentScreenData.type === "gender" && currentScreenData.required) {
      if (!formData.gender) {
        setError('Please select your gender');
        return;
      }
    }

    if (currentScreenData.type === "multiChoice" && currentScreenData.questions) {
      const requiredQuestions = currentScreenData.questions.filter(q => q.required);
      for (const question of requiredQuestions) {
        if (!formData[question.question]) {
          setError(`Please answer: ${question.label}`);
          return;
        }
      }
    }

    if (currentScreenData.type === "frequency" && currentScreenData.required) {
      if (!formData.frequency) {
        setError('Please select your training frequency');
        return;
      }
    }

    if (currentScreenData.type === "nutrition" && currentScreenData.fields) {
      const requiredFields = currentScreenData.fields.filter(field => field.required);
      for (const field of requiredFields) {
        if (!formData[field.name]) {
          setError(`Please fill in ${field.label}`);
          return;
        }
      }
    }

    if (currentScreenData.type === "lifestyle" && currentScreenData.questions) {
      const requiredQuestions = currentScreenData.questions.filter(q => q.required);
      for (const question of requiredQuestions) {
        if (!formData[question.question]) {
          setError(`Please answer: ${question.label}`);
          return;
        }
      }
    }

    if (currentScreenData.type === "goals" && currentScreenData.required) {
      if (!formData.selectedGoals || formData.selectedGoals.length === 0) {
        setError('Please select at least one goal');
        return;
      }
    }

    // Clear any previous errors
    setError(null);

    // Save current progress
    await saveResponses();

    if (currentScreen === screens.length - 1) {
      if (screens[currentScreen].showDemo && !showDemo) {
        setShowDemo(true);
      } else {
        navigate('/subscription');
      }
    } else {
      setCurrentScreen(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(prev => prev - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => {
      const goals = prev.selectedGoals || [];
      if (goals.includes(goal)) {
        return { ...prev, selectedGoals: goals.filter((g: string) => g !== goal) };
      } else {
        return { ...prev, selectedGoals: [...goals, goal] };
      }
    });
    setError(null);
  };

  const handleOptionSelect = (question: string, option: string | number) => {
    setFormData(prev => ({ ...prev, [question]: option }));
    setError(null);
  };

  const screenVariants = {
    enter: { x: 1000, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -1000, opacity: 0 }
  };

  const renderScreen = (screen: any) => {
    const Icon = screen.icon;

    if (showDemo) {
      const demoFeatures = [
        {
          title: "Training Programs",
          description: "Access personalized workout plans tailored to your goals"
        },
        {
          title: "Progress Tracking",
          description: "Monitor your progress with photos and measurements"
        },
        {
          title: "Exercise Library",
          description: "Browse through detailed exercise demonstrations"
        },
        {
          title: "Personal Notes",
          description: "Keep track of your thoughts and achievements"
        }
      ];

      return (
        <motion.div
          key="demo"
          className="w-full max-w-lg mx-auto p-6"
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-center">Quick Tour</h2>
            <div className="space-y-6">
              {demoFeatures.map((feature, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                navigate('/subscription');
              }}
              className="btn-primary w-full mt-6"
            >
              Get Started
            </button>
          </div>
        </motion.div>
      );
    }

    if (screen.type === "gender") {
      return (
        <motion.div
          key={screen.id}
          className="w-full max-w-lg mx-auto p-6"
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-center">{screen.title}</h2>
            <p className="text-gray-600 text-center mb-6">{screen.question}</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleOptionSelect('gender', 'male')}
                className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center ${
                  formData.gender === 'male'
                    ? 'border-[--primary] bg-[--primary] bg-opacity-10'
                    : 'border-gray-200 hover:border-[--primary]'
                }`}
              >
                <Male size={48} className="mb-2" />
                <span className="font-medium">Male</span>
              </button>
              <button
                onClick={() => handleOptionSelect('gender', 'female')}
                className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center ${
                  formData.gender === 'female'
                    ? 'border-[--primary] bg-[--primary] bg-opacity-10'
                    : 'border-gray-200 hover:border-[--primary]'
                }`}
              >
                <Female size={48} className="mb-2" />
                <span className="font-medium">Female</span>
              </button>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleBack}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <button
                onClick={handleNext}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={!formData.gender}
              >
                Continue
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    if (screen.type === "goals") {
      return (
        <motion.div
          key={screen.id}
          className="w-full max-w-lg mx-auto p-6"
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-center">{screen.title}</h2>
            <p className="text-gray-600 text-center mb-6">{screen.question}</p>
            <div className="grid gap-3">
              {screen.options.map((option: string) => (
                <button
                  key={option}
                  onClick={() => handleGoalToggle(option)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    formData.selectedGoals.includes(option)
                      ? 'border-[--primary] bg-[--primary] bg-opacity-10'
                      : 'border-gray-200 hover:border-[--primary]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleBack}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <button
                onClick={handleNext}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={formData.selectedGoals.length === 0}
              >
                Continue
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    if (screen.type === "multiChoice" || screen.type === "lifestyle") {
      return (
        <motion.div
          key={screen.id}
          className="w-full max-w-lg mx-auto p-6"
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="card">
            {Icon && <Icon className="w-12 h-12 mx-auto mb-4 text-[--primary]" />}
            <h2 className="text-2xl font-bold mb-4 text-center">{screen.title}</h2>
            <div className="space-y-6">
              {screen.questions.map((q: any) => (
                <div key={q.question} className="space-y-2">
                  <h3 className="font-medium">{q.label}</h3>
                  <div className="grid gap-2">
                    {q.options.map((option: string) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(q.question, option)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData[q.question] === option
                            ? 'border-[--primary] bg-[--primary] bg-opacity-10'
                            : 'border-gray-200 hover:border-[--primary]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleBack}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <button
                onClick={handleNext}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    if (screen.type === "frequency") {
      return (
        <motion.div
          key={screen.id}
          className="w-full max-w-lg mx-auto p-6"
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-center">{screen.title}</h2>
            <p className="text-gray-600 text-center mb-6">{screen.question}</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {screen.options.map((option: number) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect('frequency', option)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData['frequency'] === option
                      ? 'border-[--primary] bg-[--primary] bg-opacity-10'
                      : 'border-gray-200 hover:border-[--primary]'
                  }`}
                >
                  <span className="block text-2xl font-bold mb-1">{option}x</span>
                  <span className="text-sm">per week</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <button
                onClick={handleNext}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={screen.id}
        className="w-full max-w-lg mx-auto p-6"
        variants={screenVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="card">
          {Icon && <Icon className="w-12 h-12 mx-auto mb-4 text-[--primary]" />}
          <h2 className="text-2xl font-bold mb-4 text-center">{screen.title}</h2>

                {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
      )}
          
          {screen.content && (
            <p className="text-gray-600 text-center mb-6">{screen.content}</p>
          )}

          {(screen.type === "form" || screen.type === "nutrition") && screen.fields && (
            <div className="space-y-4">
              {screen.fields.map((field: any) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      rows={4}
                      placeholder={field.placeholder}
                      required={field.name !== "trainingType"}
                    />
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder={field.placeholder}
                      required={field.name !== "trainingType"}
                    />
                  )}
                </div>
              ))}
              {screen.hasUpload && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload current training plan (optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-[--primary] hover:text-[--secondary] focus-within:outline-none">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 mt-6">
            {currentScreen > 0 && (
              <button
                onClick={handleBack}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {screen.buttonText || "Continue"}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">

      <AnimatePresence mode="wait">
        {renderScreen(screens[currentScreen])}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;