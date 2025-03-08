import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  userGender?: 'male' | 'female' | null;
}

/*added*/
interface ProgressPhoto {
  id?: string;
  user_id?: string;
  pose: string;
  photo_url: string;
  check_date: string;
  created_at?: string;
}

/*added*/

const PhotoUpload = ({ userGender }: Props) => {
  const navigate = useNavigate();
  const [selectedPose, setSelectedPose] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState<'male' | 'female' | null>(userGender || null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
////added
  const [latestPhotos, setLatestPhotos] = useState<{[key: string]: ProgressPhoto}>({});

  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/');
          return;
        }
        
        // If gender wasn't passed as prop, try to get it from onboarding data
        if (!userGender) {
          const { data: onboarding, error: onboardingError } = await supabase
            .from('onboarding_responses')
            .select('gender')
            .eq('user_id', user.id)
            .single();

          if (!onboardingError && onboarding && onboarding.gender) {
            setGender(onboarding.gender as 'male' | 'female');
          }
        }
//////added
        // Fetch latest photos for each pose
        const { data: photos, error: photosError } = await supabase
          .from('progress_photos')
          .select('*')
          .eq('user_id', user.id)
          .order('check_date', { ascending: false });

        if (photosError) {
          console.error('Error fetching photos:', photosError);
        } else if (photos) {
          // Get the most recent photo for each pose
          const latestByPose: {[key: string]: ProgressPhoto} = {};
          photos.forEach(photo => {
            if (!latestByPose[photo.pose] || new Date(photo.check_date) > new Date(latestByPose[photo.pose].check_date)) {
              latestByPose[photo.pose] = photo;
            }
          });
          setLatestPhotos(latestByPose);
        }

        const availablePoses = getPoses();
        if(availablePoses.length>0){
          setSelectedPose(availablePoses[0]);
        }
        ///////added
        
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, userGender]);

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
    
    if (gender === 'male') return malePoses;
    if (gender === 'female') return femalePoses;
    return commonPoses;
  };

  const poses = getPoses();

  // Pose demonstration images
  const poseGuideImages = {
    'front-arms-down': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//fronte.png',
    'front-biceps': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//bicipiti.png',
    'side-left-arms-down': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//left.png',
    'side-left-arms-forward': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//leftbraccia.png',
    'side-right-arms-down': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//right.png',
    'side-right-arms-forward': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//rightbraccia.png',
    'back-arms-down': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//retro.png',
    'back-arms-extended': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//back.png',
    'back-biceps': 'https://ofjtlwlitgxtozalijve.supabase.co/storage/v1/object/public/guide_pose//bicipiti%20retro.png'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('File size exceeds 5MB limit');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setPhotoError('Only image files are allowed');
        return;
      }
      
      setSelectedFile(file);
      setPhotoError('');
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !selectedPose) {
      setPhotoError('Please select a pose and upload an image');
      return;
    }

    setPhotoLoading(true);
    setPhotoError('');
    setUploadSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const timestamp = Date.now();
      const fileName = `${user.id}/${today}/${selectedPose}-${timestamp}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL - construct it manually to ensure correct format
      ///NO const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
     /// NO const photoUrl = `${supabaseUrl}/storage/v1/object/public/progress-photos/${fileName}`;
      const {data: { signedUrl}, error:signedUrlError} = await supabase.storage
      .from('progress-photos')
      .createSignedUrl(fileName, 60*60*24*365);
      if(signedUrlError) throw signedUrlError;
      
      // Save photo record in database
      const { error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          pose: selectedPose,
          //photo_url: photoUrl,
          photo_url: signedUrl,
          check_date: today
        });

      if (insertError) throw insertError;

      setLatestPhotos(prev => ({
        ...prev,
        [selectedPose]: {
          user_id: user.id,
          pose:selectedPose,
          photo_url:signedUrl,
          check_date: today
        }
      }));
      
      // Reset form and show success
      setSelectedFile(null);
      setUploadSuccess(true);
      
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setPhotoError(error.message || 'Failed to upload photo');
    } finally {
      setPhotoLoading(false);
    }
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

  
  /////added
    // Check if a pose has been recently uploaded (within 28 days)
  const isPoseRecentlyUploaded = (pose: string) => {
    const photo = latestPhotos[pose];
    if (!photo) return false;
    
    const photoDate = new Date(photo.check_date);
    const daysSinceUpload = (new Date().getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpload <= 28;
  };
  //////added

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[--primary] border-t-transparent rounded-full animate-spin"></div>
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
        <h1 className="text-2xl font-bold">Upload Progress Photos</h1>
        <p className="text-gray-600 mt-2">
          Select a pose and upload a photo. Make sure the photo clearly shows your body position according to the pose guide.
        </p>
      </div>

      {photoError && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="flex-shrink-0 mr-2" size={20} />
          {photoError}
        </div>
      )}

      {uploadSuccess && (
        <div className="mb-6 p-4 bg-green-500 bg-opacity-10 text-green-500 rounded-lg flex items-center">
          <CheckCircle className="flex-shrink-0 mr-2" size={20} />
          Photo uploaded successfully! You can upload another photo or return to your profile.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pose Selection */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">1. Select Pose</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {poses.map((pose) => (
              <button
                key={pose}
                onClick={() => setSelectedPose(pose)}
                //className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                  selectedPose === pose
                    ? 'border-[--primary] bg-[--primary] bg-opacity-10'
                    : 'border-gray-200 hover:border-[--primary]'
                }`}
              >
                {/*getPoseDisplayName(pose)*/}
                 <span>{getPoseDisplayName(pose)}</span>
                {isPoseRecentlyUploaded(pose) && (
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0 ml-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pose Guide */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">2. Pose Guide</h2>
          {selectedPose ? (
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={poseGuideImages[selectedPose as keyof typeof poseGuideImages]}
                  alt={`${selectedPose} guide`}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-center text-gray-600">
                Example of {getPoseDisplayName(selectedPose)} pose
              </p>
            </div>
          ) : (
            <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Select a pose to see the guide</p>
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">3. Upload Photo</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center cursor-pointer py-6"
            >
              <Camera size={48} className="text-gray-400 mb-2" />
              <span className="text-[--primary] font-medium">
                {selectedFile ? selectedFile.name : 'Select a photo'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Max size: 5MB. Formats: JPG, PNG
              </span>
            </label>
          </div>
          
          {selectedFile && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Selected Photo:</h3>
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          <button
            onClick={handleUploadPhoto}
            className="btn-primary w-full"
            disabled={photoLoading || !selectedPose || !selectedFile}
          >
            {photoLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Upload Photo'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;