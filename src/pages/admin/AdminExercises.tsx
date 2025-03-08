import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MuscleGroup, Exercise } from '../../types/database';
import { 
  Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp, ChevronRight, Search, 
  FolderPlus, FileEdit, AlertCircle, CheckCircle, RefreshCw, Info, Image
} from 'lucide-react';

const AdminExercises = () => {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  
  // Edit states
  const [editingMuscleGroup, setEditingMuscleGroup] = useState<MuscleGroup | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isCreatingMuscleGroup, setIsCreatingMuscleGroup] = useState(false);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  
  // Form data
  const [muscleGroupForm, setMuscleGroupForm] = useState({
    name: '',
    image_url: ''
  });
  
  const [exerciseForm, setExerciseForm] = useState({
    title: '',
    description: '',
    video_url: '',
    image_url: '',
    muscle_group_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch muscle groups
      const { data: muscleGroupsData, error: muscleGroupsError } = await supabase
        .from('muscle_groups')
        .select('*')
        .order('name');
      
      if (muscleGroupsError) throw muscleGroupsError;
      
      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .order('title');
      
      if (exercisesError) throw exercisesError;
      
      setMuscleGroups(muscleGroupsData || []);
      setExercises(exercisesData || []);
      
      // Initialize expanded state for all muscle groups
      const initialExpandedState: {[key: string]: boolean} = {};
      muscleGroupsData?.forEach(group => {
        initialExpandedState[group.id] = false;
      });
      setExpandedGroups(initialExpandedState);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleEditMuscleGroup = (group: MuscleGroup) => {
    setEditingMuscleGroup(group);
    setMuscleGroupForm({
      name: group.name,
      image_url: group.image_url
    });
    setIsCreatingMuscleGroup(false);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      title: exercise.title,
      description: exercise.description,
      video_url: exercise.video_url,
      image_url: exercise.image_url,
      muscle_group_id: exercise.muscle_group_id
    });
    setIsCreatingExercise(false);
  };

  const handleCreateMuscleGroup = () => {
    setIsCreatingMuscleGroup(true);
    setEditingMuscleGroup(null);
    setMuscleGroupForm({
      name: '',
      image_url: ''
    });
  };

  const handleCreateExercise = (muscleGroupId: string) => {
    setIsCreatingExercise(true);
    setEditingExercise(null);
    setExerciseForm({
      title: '',
      description: '',
      video_url: '',
      image_url: '',
      muscle_group_id: muscleGroupId
    });
    setSelectedMuscleGroupId(muscleGroupId);
  };

  const handleCancelEdit = () => {
    setEditingMuscleGroup(null);
    setEditingExercise(null);
    setIsCreatingMuscleGroup(false);
    setIsCreatingExercise(false);
    setSelectedMuscleGroupId(null);
  };

  const handleMuscleGroupFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMuscleGroupForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExerciseFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setExerciseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveMuscleGroup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!muscleGroupForm.name || !muscleGroupForm.image_url) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      
      if (isCreatingMuscleGroup) {
        // Create new muscle group
        const { data, error } = await supabase
          .from('muscle_groups')
          .insert([muscleGroupForm])
          .select();
        
        if (error) throw error;
        
        setSuccess('Muscle group created successfully');
      } else if (editingMuscleGroup) {
        // Update existing muscle group
        const { error } = await supabase
          .from('muscle_groups')
          .update(muscleGroupForm)
          .eq('id', editingMuscleGroup.id);
        
        if (error) throw error;
        
        setSuccess('Muscle group updated successfully');
      }
      
      // Reset form and fetch updated data
      setEditingMuscleGroup(null);
      setIsCreatingMuscleGroup(false);
      await fetchData();
      
    } catch (err: any) {
      console.error('Error saving muscle group:', err);
      setError(err.message || 'Failed to save muscle group');
    } finally {
      setLoading(false);
    }
  };

  const saveExercise = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (
        !exerciseForm.title || 
        !exerciseForm.description || 
        !exerciseForm.video_url || 
        !exerciseForm.image_url || 
        !exerciseForm.muscle_group_id
      ) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      
      if (isCreatingExercise) {
        // Create new exercise
        const { data, error } = await supabase
          .from('exercises')
          .insert([exerciseForm])
          .select();
        
        if (error) throw error;
        
        setSuccess('Exercise created successfully');
      } else if (editingExercise) {
        // Update existing exercise
        const { error } = await supabase
          .from('exercises')
          .update(exerciseForm)
          .eq('id', editingExercise.id);
        
        if (error) throw error;
        
        setSuccess('Exercise updated successfully');
      }
      
      // Reset form and fetch updated data
      setEditingExercise(null);
      setIsCreatingExercise(false);
      setSelectedMuscleGroupId(null);
      await fetchData();
      
    } catch (err: any) {
      console.error('Error saving exercise:', err);
      setError(err.message || 'Failed to save exercise');
    } finally {
      setLoading(false);
    }
  };

  const deleteMuscleGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this muscle group? This will also delete all associated exercises.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First delete all exercises associated with this muscle group
      const { error: exercisesError } = await supabase
        .from('exercises')
        .delete()
        .eq('muscle_group_id', groupId);
      
      if (exercisesError) throw exercisesError;
      
      // Then delete the muscle group
      const { error: groupError } = await supabase
        .from('muscle_groups')
        .delete()
        .eq('id', groupId);
      
      if (groupError) throw groupError;
      
      setSuccess('Muscle group and associated exercises deleted successfully');
      
      // Fetch updated data
      await fetchData();
      
    } catch (err: any) {
      console.error('Error deleting muscle group:', err);
      setError(err.message || 'Failed to delete muscle group');
    } finally {
      setLoading(false);
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);
      
      if (error) throw error;
      
      setSuccess('Exercise deleted successfully');
      
      // Fetch updated data
      await fetchData();
      
    } catch (err: any) {
      console.error('Error deleting exercise:', err);
      setError(err.message || 'Failed to delete exercise');
    } finally {
      setLoading(false);
    }
  };

  // Filter muscle groups and exercises based on search query
  const filteredMuscleGroups = muscleGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getExercisesForMuscleGroup = (muscleGroupId: string) => {
    return exercises.filter(exercise => 
      exercise.muscle_group_id === muscleGroupId &&
      (searchQuery === '' || exercise.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  if (loading && muscleGroups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search muscle groups or exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-[--primary]"
            title="Show help"
          >
            <Info size={20} />
          </button>
          <button
            onClick={handleCreateMuscleGroup}
            className="flex items-center gap-2 bg-[--primary] text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
            disabled={isCreatingMuscleGroup || isCreatingExercise || editingMuscleGroup !== null || editingExercise !== null}
          >
            <FolderPlus size={20} />
            <span>Add Muscle Group</span>
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center">
          <CheckCircle className="flex-shrink-0 mr-2" size={20} />
          <div>
            <p className="font-medium">{success}</p>
          </div>
          <button 
            onClick={() => setSuccess(null)} 
            className="ml-auto text-green-700 hover:text-green-900"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="flex-shrink-0 mr-2" size={20} />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Refresh button */}
      <div className="flex justify-end" id="scroll">
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-[--primary] hover:underline"
        >
          <RefreshCw size={16} />
          <span>Refresh data</span>
        </button>
      </div>

      {/* Create/Edit Muscle Group Form */}
      {(isCreatingMuscleGroup || editingMuscleGroup) && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[--primary]" id="scroll">
          <h3 className="text-xl font-bold mb-4">
            {isCreatingMuscleGroup ? 'Create New Muscle Group' : 'Edit Muscle Group'}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={muscleGroupForm.name}
                onChange={handleMuscleGroupFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                placeholder="e.g., Chest, Back, Legs"
              />
            </div>
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="image_url"
                  name="image_url"
                  value={muscleGroupForm.image_url}
                  onChange={handleMuscleGroupFormChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                  placeholder="https://example.com/image.jpg"
                />
                {muscleGroupForm.image_url && (
                  <div className="relative group">
                    <Image 
                      size={24} 
                      className="text-[--primary] cursor-pointer"
                      title="Preview image"
                    />
                    <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 p-2 bg-white rounded-lg shadow-lg">
                      <img 
                        src={muscleGroupForm.image_url} 
                        alt="Preview" 
                        className="w-48 h-48 object-cover rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveMuscleGroup}
                className="px-4 py-2 bg-[--primary] text-white rounded-md hover:bg-opacity-90 flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save size={18} />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Exercise Form */}
      {(isCreatingExercise || editingExercise) && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[--primary]">
          <h3 className="text-xl font-bold mb-4">
            {isCreatingExercise ? 'Create New Exercise' : 'Edit Exercise'}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={exerciseForm.title}
                onChange={handleExerciseFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                placeholder="e.g., Bench Press, Squats"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={exerciseForm.description}
                onChange={handleExerciseFormChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                placeholder="Describe the exercise and how to perform it correctly"
              />
            </div>
            <div>
              <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1">
                Video URL
              </label>
              <input
                type="text"
                id="video_url"
                name="video_url"
                value={exerciseForm.video_url}
                onChange={handleExerciseFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                placeholder="https://www.youtube.com/embed/example"
              />
              {exerciseForm.video_url && (
                <div className="mt-2 max-w-sm aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <iframe
                    src={exerciseForm.video_url}
                    title="Video preview"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="image_url"
                  name="image_url"
                  value={exerciseForm.image_url}
                  onChange={handleExerciseFormChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                  placeholder="https://example.com/image.jpg"
                />
                {exerciseForm.image_url && (
                  <div className="relative group">
                    <Image 
                      size={24} 
                      className="text-[--primary] cursor-pointer"
                      title="Preview image"
                    />
                    <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 p-2 bg-white rounded-lg shadow-lg">
                      <img 
                        src={exerciseForm.image_url} 
                        alt="Preview" 
                        className="w-48 h-48 object-cover rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="muscle_group_id" className="block text-md font-medium text-gray-700 mb-1">
                Muscle Group
              </label>
              <select
                id="muscle_group_id"
                name="muscle_group_id"
                value={exerciseForm.muscle_group_id}
                onChange={handleExerciseFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[--primary] focus:border-[--primary]"
                disabled={isCreatingExercise && selectedMuscleGroupId !== null}
              >
                <option value="">Select a muscle group</option>
                {muscleGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveExercise}
                className="px-4 py-2 bg-[--primary] text-white rounded-md hover:bg-opacity-90 flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save size={18} />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Muscle Groups and Exercises List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Muscle Groups & Exercises</h2>
        </div>
        
        {filteredMuscleGroups.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchQuery ? 'No muscle groups match your search' : 'No muscle groups found'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMuscleGroups.map(group => {
              const groupExercises = getExercisesForMuscleGroup(group.id);
              const isExpanded = expandedGroups[group.id];
              
              return (
                <div key={group.id} className="group">
                  <div 
                    className="p-4 hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleGroupExpanded(group.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={group.image_url} 
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-500">{groupExercises.length} exercises</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMuscleGroup(group);
                            const element = document.getElementById("scroll");
                            element.scrollIntoView();
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit muscle group"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMuscleGroup(group.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Delete muscle group"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateExercise(group.id);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Add exercise to this group"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="pl-10 pr-4 pb-4">
                      {groupExercises.length === 0 ? (
                        <div className="text-gray-500 text-sm py-2">
                          {searchQuery ? 'No exercises match your search' : 'No exercises in this group'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {groupExercises.map(exercise => (
                            <div 
                              key={exercise.id}
                              className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 group/exercise"
                            >
                              <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <img 
                                    src={exercise.image_url} 
                                    alt={exercise.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold">{exercise.title}</h4>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {/*exercise.description.substring(0, 100)*/}
                                        {/*exercise.description.length > 100 ? '...' : ''*/}
                                        {window.innerWidth >=1024
                                        ? exercise.description.substring(0,1000)
                                        : exercise.description.substring(0,200)}
                                        {exercise.description.length > (window.innerWidth >= 1024 ? 1000 : 200) ? '...' : ''}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover/exercise:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => { handleEditExercise(exercise);
                                          const element = document.getElementById("scroll");
                                          element.scrollIntoView();
                                        }}
                                        
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        title="Edit exercise"
                                      >
                                        <FileEdit size={18} />
                                      </button>
                                      <button
                                        onClick={() => deleteExercise(exercise.id)}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        title="Delete exercise"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>
                                  {exercise.video_url && (
                                    <div className="mt-2 max-w-md aspect-video rounded-lg overflow-hidden bg-gray-100">
                                      <iframe
                                        src={exercise.video_url}
                                        title={exercise.title}
                                        className="w-full h-full"
                                        allowFullScreen
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Help & Tips</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y y-4">
              <div>
                <h4 className="font-semibold mb-2">Managing Muscle Groups</h4>
                <ul className="list-disc pl-4 space-y-2 text-gray-600">
                  <li>Click "Add Muscle Group" to create a new muscle group</li>
                  <li>Each muscle group requires a name and image URL</li>
                  <li>Hover over muscle groups to see edit and delete options</li>
                  <li>Deleting a muscle group will also delete all its exercises</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Managing Exercises</h4>
                <ul className="list-disc pl-4 space-y-2 text-gray-600">
                  <li>Click the "+" button on a muscle group to add a new exercise</li>
                  <li>Exercises require a title, description, video URL, and image URL</li>
                  <li>Video URLs should be in embed format (e.g., youtube.com/embed/...)</li>
                  <li>Images and videos are previewed while editing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Search & Navigation</h4>
                <ul className="list-disc pl-4 space-y-2 text-gray-600">
                  <li>Use the search bar to filter both muscle groups and exercises</li>
                  <li>Click on a muscle group to expand/collapse its exercises</li>
                  <li>Use the refresh button to update the data if needed</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full btn-primary"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExercises;