import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts, Post } from '@/contexts/PostsContext';
import { useProfile } from '@/contexts/ProfileContext';
import { X, Image, Video, File, Plus, Trash2, Upload, Briefcase, Search } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { EmailVerificationNotice } from '@/components/EmailVerificationNotice';

type PostType = 'skill_offer' | 'skill_request' | 'project' | 'general';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type Availability = 'full_time' | 'part_time' | 'project_based';

interface PostData {
  type: PostType;
  title: string;
  description: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  availability?: Availability;
  deadline?: string;
  budget?: string;
  location?: string;
  media?: {
    files: File[];
    previews: string[];
  };
}

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified, loading } = useAuth();
  const { profile, hasProfile } = useProfile();
  const { createPost, updatePost } = usePosts();
  const [step, setStep] = useState(1);
  const [currentSkill, setCurrentSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postData, setPostData] = useState<PostData>({
    type: 'general',
    title: '',
    description: '',
    skills: [],
    experienceLevel: 'intermediate',
    availability: 'project_based',
    deadline: '',
    budget: '',
    location: '',
    media: {
      files: [],
      previews: []
    }
  });

  const location = useLocation();
  const postToEdit = location.state?.postToEdit as Post | undefined;

  // Initialize with existing post data if editing
  React.useEffect(() => {
    if (postToEdit) {
      setPostData({
        type: postToEdit.post_type as PostType,
        title: postToEdit.title,
        description: postToEdit.content,
        skills: postToEdit.skills_offered?.length ? postToEdit.skills_offered : (postToEdit.skills_needed || []),
        experienceLevel: (postToEdit.experience_level as ExperienceLevel) || 'intermediate',
        availability: (postToEdit.availability as Availability) || 'project_based',
        deadline: postToEdit.deadline || '',
        budget: '', // Budget not currently stored in Post model explicitly or handled differently
        location: '', // Location not currently in Post model explicitly
        media: {
          files: [],
          previews: postToEdit.media_urls || []
        }
      });
      setStep(2); // Skip type selection step when editing
    }
  }, [postToEdit]);

  // Redirect if not authenticated or email not verified (wait for loading first)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/signin');
    return null;
  }

  if (!isEmailVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/feed')}
                  className="text-gray-600 hover:text-green-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">{postToEdit ? 'Edit Post' : 'Create Post'}</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto py-8 px-4">
          <EmailVerificationNotice />
        </div>
      </div>
    );
  }

  // Check if profile is complete
  const { isProfileComplete } = useProfile();
  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <BackButton />
                <h1 className="text-xl font-bold text-gray-900">{postToEdit ? 'Edit Post' : 'Create Post'}</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-amber-900 mb-2">Complete Your Profile</h2>
            <p className="text-amber-800 mb-4">
              You need to complete your profile before creating posts. Please add a bio and at least one skill to continue.
            </p>
            <Button
              onClick={() => navigate('/edit-profile')}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Complete Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const addSkill = () => {
    if (currentSkill.trim() && !postData.skills.includes(currentSkill.trim())) {
      setPostData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setPostData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== newFiles.length) {
      alert('Some files were skipped. Only images, videos, and PDFs under 10MB are allowed.');
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setPostData(prev => ({
          ...prev,
          media: {
            files: [...(prev.media?.files || []), file],
            previews: [...(prev.media?.previews || []), preview]
          }
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setPostData(prev => ({
      ...prev,
      media: {
        files: prev.media?.files.filter((_, i) => i !== index) || [],
        previews: prev.media?.previews.filter((_, i) => i !== index) || []
      }
    }));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to create a post');
      return;
    }

    if (!hasProfile) {
      alert('Please create a profile first');
      navigate('/create-profile');
      return;
    }

    try {
      setIsSubmitting(true);

      const postDataForDB = {
        title: postData.title,
        content: postData.description,
        post_type: postData.type,
        skills_offered: postData.type === 'skill_request' ? postData.skills : [],
        skills_needed: postData.type === 'skill_offer' || postData.type === 'project' ? postData.skills : [],
        experience_level: postData.type === 'general' ? null : postData.experienceLevel,
        availability: postData.type === 'general' ? null : postData.availability,
        deadline: postData.deadline ? new Date(postData.deadline).toISOString() : null,
        media_urls: postData.media?.previews || [],
      };



      const { error, success } = await createPost(postDataForDB);

      if (error) {
        alert(`Failed to create post: ${error}`);
        return;
      }

      if (success) {
        alert('Post created successfully!');
        navigate('/feed');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred while creating your post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!postToEdit) return;

    try {
      setIsSubmitting(true);

      const updates = {
        title: postData.title,
        content: postData.description,
        post_type: postData.type,
        skills_offered: postData.type === 'skill_request' ? postData.skills : [],
        skills_needed: postData.type === 'skill_offer' || postData.type === 'project' ? postData.skills : [],
        experience_level: postData.type === 'general' ? null : postData.experienceLevel,
        availability: postData.type === 'general' ? null : postData.availability,
        deadline: postData.deadline ? new Date(postData.deadline).toISOString() : null,
        media_urls: postData.media?.previews || [],
        updated_at: new Date().toISOString()
      };

      const { error, success } = await updatePost(postToEdit.id, updates);

      if (error) {
        alert(`Failed to update post: ${error}`);
        return;
      }

      if (success) {
        alert('Post updated successfully!');
        navigate('/feed');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('An error occurred while updating your post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) {
      if (postData.type === 'general') {
        return postData.title && postData.description;
      }
      return postData.title && postData.description && postData.skills.length > 0;
    }
    return true;
  };

  const getPostTypeInfo = (type: PostType) => {
    switch (type) {
      case 'skill_offer':
        return {
          title: 'I have work to offer',
          subtitle: 'Post a project or job opportunity',
          icon: <Briefcase className="w-8 h-8" />,
          color: 'green'
        };
      case 'skill_request':
        return {
          title: 'I\'m looking for work',
          subtitle: 'Showcase your skills and availability',
          icon: <Search className="w-8 h-8" />,
          color: 'blue'
        };
      case 'project':
        return {
          title: 'Project Collaboration',
          subtitle: 'Find partners for your project',
          icon: '🤝',
          color: 'purple'
        };
      default:
        return {
          title: 'General Post',
          subtitle: 'Share something with the community',
          icon: '📝',
          color: 'gray'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton />
              <h1 className="text-xl font-bold text-gray-900">{postToEdit ? 'Edit Post' : 'Create Post'}</h1>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2].map((stepNumber) => (
                  <div
                    key={stepNumber}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      step >= stepNumber ? "bg-green-500" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-2">Step {step} of 2</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Step 1: Choose Post Type */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">What do you want to share?</h2>
              <p className="text-gray-600 text-lg">Choose the type of post you'd like to create</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {(['general', 'skill_offer', 'skill_request'] as PostType[]).map((type) => {
                const info = getPostTypeInfo(type);
                const isSelected = postData.type === type;

                return (
                  <button
                    key={type}
                    onClick={() => setPostData(prev => ({ ...prev, type }))}
                    className={cn(
                      "group relative bg-white border rounded-2xl p-8 text-left transition-all duration-300",
                      isSelected
                        ? `border-${info.color}-600 ring-1 ring-${info.color}-600 shadow-xl scale-[1.02]`
                        : "border-gray-100 hover:border-gray-200 hover:shadow-lg hover:-translate-y-1"
                    )}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-6">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                          isSelected ? `bg-${info.color}-100 text-${info.color}-700` : `bg-gray-50 text-gray-500 group-hover:bg-${info.color}-50 group-hover:text-${info.color}-600`
                        )}>
                          {info.icon}
                        </div>
                        {isSelected && (
                          <div className={`w-4 h-4 rounded-full bg-${info.color}-600 shadow-sm`} />
                        )}
                      </div>

                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">{info.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{info.subtitle}</p>
                      </div>

                      <div className="mt-auto pt-6 border-t border-gray-100">
                        <ul className="space-y-3">
                          {type === 'skill_offer' && (
                            <>
                              <li className="flex items-start space-x-3 text-sm text-gray-600">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                <span>Get work done efficiently</span>
                              </li>
                              <li className="flex items-start space-x-3 text-sm text-gray-600">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                <span>Find rated professionals</span>
                              </li>
                            </>
                          )}
                          {type === 'skill_request' && (
                            <>
                              <li className="flex items-start space-x-3 text-sm text-gray-600">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                                <span>Find projects & opportunities</span>
                              </li>
                              <li className="flex items-start space-x-3 text-sm text-gray-600">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                                <span>Build your professional profile</span>
                              </li>
                            </>
                          )}
                          {type === 'general' && (
                            <>
                              <li className="flex items-start space-x-3 text-sm text-gray-600">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-gray-500 rounded-full flex-shrink-0"></span>
                                <span>Share updates & news</span>
                              </li>
                              <li className="flex items-start space-x-3 text-sm text-gray-600">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-gray-500 rounded-full flex-shrink-0"></span>
                                <span>Engage with community</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                Continue
              </Button>
            </div>
          </div >
        )}

        {/* Step 2: Post Details */}
        {
          step === 2 && postData.type && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {getPostTypeInfo(postData.type).title}
                </h2>
                <p className="text-gray-600 text-lg">
                  {getPostTypeInfo(postData.type).subtitle}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    value={postData.title}
                    onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter a compelling title for your post..."
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {postData.title.length}/100
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={postData.description}
                    onChange={(e) => setPostData(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
                    placeholder="Tell us more about what you're looking for or offering..."
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {postData.description.length}/1000
                  </div>
                </div>

                {/* Skills - Only query if NOT general type */}
                {postData.type !== 'general' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {postData.type === 'skill_request' ? 'Skills/Services Offered *' : 'Skills/Services Needed *'}
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="Type a skill and press Enter"
                      />
                      <Button
                        type="button"
                        onClick={addSkill}
                        variant="outline"
                        className="px-6 border-green-500 text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {postData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {postData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-2 group hover:bg-green-200 transition-colors"
                          >
                            <span>{skill}</span>
                            <button
                              onClick={() => removeSkill(skill)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Experience Level - Hide for general */}
                {postData.type !== 'general' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Level Required *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(['beginner', 'intermediate', 'advanced', 'expert'] as ExperienceLevel[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setPostData(prev => ({ ...prev, experienceLevel: level }))}
                          className={cn(
                            "py-3 px-4 text-sm font-medium rounded-lg border transition-all duration-200 capitalize",
                            postData.experienceLevel === level
                              ? "bg-green-600 text-white border-green-600 shadow-md"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Add Media (Optional)
                  </label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                      dragActive
                        ? "border-green-400 bg-green-50"
                        : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf"
                      onChange={(e) => handleFileUpload(e.target.files!)}
                      className="hidden"
                    />
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <Upload className="w-12 h-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">
                          <span className="text-green-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Images, videos, and PDFs up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Media Previews */}
                  {postData.media && postData.media.previews.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Media</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {postData.media.previews.map((preview, index) => (
                          <div key={index} className="relative group">
                            {postData.media?.files[index]?.type.startsWith('image/') ? (
                              <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:opacity-75 transition-opacity"
                              />
                            ) : postData.media?.files[index]?.type.startsWith('video/') ? (
                              <video
                                src={preview}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:opacity-75 transition-opacity"
                                controls={false}
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center group-hover:opacity-75 transition-opacity">
                                <File className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <button
                              onClick={() => removeMedia(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg truncate">
                              {postData.media?.files[index]?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Fields */}
                {postData.type === 'skill_request' && (
                  <>
                    {/* Availability */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Availability *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(['full_time', 'part_time', 'project_based'] as Availability[]).map((availability) => (
                          <button
                            key={availability}
                            type="button"
                            onClick={() => setPostData(prev => ({ ...prev, availability }))}
                            className={cn(
                              "py-3 px-4 text-sm font-medium rounded-lg border transition-all duration-200",
                              postData.availability === availability
                                ? "bg-green-600 text-white border-green-600 shadow-md"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                            )}
                          >
                            {availability === 'full_time' && 'Full Time'}
                            {availability === 'part_time' && 'Part Time'}
                            {availability === 'project_based' && 'Project Based'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        value={postData.location}
                        onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="City, Country or Remote"
                      />
                    </div>
                  </>
                )}

                {(postData.type === 'skill_offer' || postData.type === 'project') && (
                  <>
                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Budget Range (Optional)
                      </label>
                      <input
                        type="text"
                        value={postData.budget}
                        onChange={(e) => setPostData(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="e.g., $500-1000, Negotiable, Equity"
                      />
                    </div>

                    {/* Deadline */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Deadline (Optional)
                      </label>
                      <input
                        type="date"
                        value={postData.deadline}
                        onChange={(e) => setPostData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        value={postData.location}
                        onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="City, Country or Remote"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  onClick={() => postToEdit ? navigate(-1) : setStep(1)}
                  variant="outline"
                  className="px-6 py-3 transition-colors"
                >
                  {postToEdit ? 'Cancel' : 'Back'}
                </Button>
                <Button
                  onClick={postToEdit ? handleUpdate : handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Publishing...
                    </>
                  ) : (
                    postToEdit ? 'Update Post' : 'Publish Post'
                  )}
                </Button>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
};

export default CreatePost;
