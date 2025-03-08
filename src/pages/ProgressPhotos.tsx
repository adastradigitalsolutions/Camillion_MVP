import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProgressPhoto {
  id?: string;
  user_id?: string;
  pose: string;
  photo_url: string;
  check_date: string;
  created_at?: string;
}

interface PhotosByPose {
  [pose: string]: {
    first: ProgressPhoto | null;
    previous: ProgressPhoto | null;
    current: ProgressPhoto | null;
  };
}

const ProgressPhotos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [photosByPose, setPhotosByPose] = useState<PhotosByPose>({});
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      // Get user gender from onboarding data
      const { data: onboarding, error: onboardingError } = await supabase
        .from('onboarding_responses')
        .select('gender')
        .eq('user_id', user.id)
        .single();

      if (!onboardingError && onboarding && onboarding.gender) {
        setUserGender(onboarding.gender as 'male' | 'female');
      }

      // Fetch progress photos
      const { data: photos, error: photosError } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('check_date', { ascending: true });

      if (photosError) {
        throw photosError;
      }

      setProgressPhotos(photos || []);
      
      // Process photos for comparison
      if (photos && photos.length > 0) {
        processPhotosForComparison(photos);
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to load progress photos');
    } finally {
      setLoading(false);
    }
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

  const processPhotosForComparison = (photos: ProgressPhoto[]) => {
    const poses = getPoses();
    const result: PhotosByPose = {};
    
    // Group photos by pose
    const photosByPoseAndDate: {[pose: string]: {[date: string]: ProgressPhoto}} = {};
    
    photos.forEach(photo => {
      if (!photosByPoseAndDate[photo.pose]) {
        photosByPoseAndDate[photo.pose] = {};
      }
      photosByPoseAndDate[photo.pose][photo.check_date] = photo;
    });
    
    // Get unique check dates for each pose, sorted chronologically
    const datesByPose: {[pose: string]: string[]} = {};
    
    Object.keys(photosByPoseAndDate).forEach(pose => {
      datesByPose[pose] = Object.keys(photosByPoseAndDate[pose]).sort();
    });
    
    // For each pose, get the first, previous, and current photos
    poses.forEach(pose => {
      if (datesByPose[pose] && datesByPose[pose].length > 0) {
        const dates = datesByPose[pose];
        const firstDate = dates[0];
        const currentDate = dates[dates.length - 1];
        
        let previousDate = null;
        if (dates.length > 1) {
          previousDate = dates[dates.length - 2];
        }
        
        result[pose] = {
          first: photosByPoseAndDate[pose][firstDate] || null,
          previous: previousDate ? photosByPoseAndDate[pose][previousDate] : null,
          current: photosByPoseAndDate[pose][currentDate] || null
        };
      } else {
        result[pose] = {
          first: null,
          previous: null,
          current: null
        };
      }
    });
    
    setPhotosByPose(result);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center text-[--primary] hover:underline mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Profile
          </button>
          <h1 className="text-2xl font-bold">Progress Photos</h1>
        </div>
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>Error: {error}</p>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center text-[--primary] hover:underline mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Profile
        </button>
        <h1 className="text-2xl font-bold">Progress Photos</h1>
        <p className="text-gray-600 mt-2">
          Track your physical changes over time with progress photos.
        </p>
      </div>

      {progressPhotos.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600 mb-4">You haven't uploaded any progress photos yet.</p>
          <button
            onClick={() => navigate('/photo-upload')}
            className="btn-primary"
          >
            Upload Your First Photos
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Legend */}
          <div className="card bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={20} className="text-[--primary]" />
              <h3 className="font-semibold">Photo Comparison Guide</h3>
            </div>
            <p className="text-gray-600 mb-2">
              For each pose, we show up to three photos for comparison:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><span className="font-medium">First Check:</span> Your very first photo for this pose</li>
              <li><span className="font-medium">Previous Check:</span> The photo from your previous check (if available)</li>
              <li><span className="font-medium">Current:</span> Your most recent photo for this pose</li>
            </ul>
          </div>

          {/* Photo comparisons by pose */}
          {Object.keys(photosByPose).map(pose => {
            const photos = photosByPose[pose];
            
            // Skip poses with no photos
            if (!photos.first && !photos.previous && !photos.current) {
              return null;
            }
            
            return (
              <div key={pose} className="card">
                <h2 className="text-xl font-bold mb-4">{getPoseDisplayName(pose)}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* First Check */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      First Check
                    </h3>
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      {photos.first ? (
                        <img
                          src={photos.first.photo_url}
                          alt={`${pose} first check`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-gray-500">No photo available</p>
                        </div>
                      )}
                    </div>
                    {photos.first && (
                      <p className="text-sm text-gray-600 text-center">
                        {formatDate(photos.first.check_date)}
                      </p>
                    )}
                  </div>
                  
                  {/* Previous Check (if available and different from first) */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      Previous Check
                    </h3>
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      {photos.previous && photos.previous.id !== photos.first?.id ? (
                        <img
                          src={photos.previous.photo_url}
                          alt={`${pose} previous check`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-gray-500">No previous check</p>
                        </div>
                      )}
                    </div>
                    {photos.previous && photos.previous.id !== photos.first?.id && (
                      <p className="text-sm text-gray-600 text-center">
                        {formatDate(photos.previous.check_date)}
                      </p>
                    )}
                  </div>
                  
                  {/* Current Check */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      Current
                    </h3>
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      {photos.current && (photos.current.id !== photos.previous?.id && photos.current.id !== photos.first?.id) ? (
                        <img
                          src={photos.current.photo_url}
                          alt={`${pose} current`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-gray-500">
                            {photos.current ? 'Same as previous' : 'No current photo'}
                          </p>
                        </div>
                      )}
                    </div>
                    {photos.current && (photos.current.id !== photos.previous?.id && photos.current.id !== photos.first?.id) && (
                      <p className="text-sm text-gray-600 text-center">
                        {formatDate(photos.current.check_date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-center mt-8">
            <button
              onClick={() => navigate('/photo-upload')}
              className="btn-primary"
            >
              Upload New Photos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPhotos;