import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { PageLoader, ButtonLoader } from "@/components/ui/loading-spinner";
import { ArrowLeft, Check, Edit2 } from "lucide-react";

type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
type Availability = "full_time" | "part_time" | "project_based";

interface ProfileData {
  name: string;
  email: string;
  profilePicture: string;
  bio: string;
  location: string;
  skillsOffered: string[];
  workWanted: string;
  experienceLevel: ExperienceLevel;
  availability: Availability;
  topSkills: string[];
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified, loading: authLoading } = useAuth();
  const { profile, loading, hasProfile, updateProfile, uploadProfilePicture } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSkill, setCurrentSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    profilePicture: "",
    bio: "",
    location: "",
    skillsOffered: [],
    workWanted: "",
    experienceLevel: "intermediate",
    availability: "project_based",
    topSkills: [],
  });

  useEffect(() => {
    // Wait for BOTH auth and profile loading to complete
    // This prevents race conditions on mobile where auth state hasn't loaded yet
    if (authLoading || loading) {
      return;
    }

    // Check authentication and profile status
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    if (!isEmailVerified) {
      navigate("/");
      return;
    }

    if (!hasProfile) {
      navigate("/create-profile");
      return;
    }

    // Load existing profile data from context
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        profilePicture: profile.profile_picture || "",
        bio: profile.bio || "",
        location: profile.location || "",
        skillsOffered: profile.skills_i_have || [],
        workWanted: profile.skills_i_want?.join(", ") || "",
        experienceLevel: profile.experience_level || "intermediate",
        availability: profile.availability || "project_based",
        topSkills: profile.top_skills || [],
      });
    }
  }, [isAuthenticated, isEmailVerified, hasProfile, loading, authLoading, profile, navigate]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData((prev) => ({
          ...prev,
          profilePicture: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (
      currentSkill.trim() &&
      !profileData.skillsOffered.includes(currentSkill.trim())
    ) {
      setProfileData((prev) => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, currentSkill.trim()],
      }));
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfileData((prev) => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[EditProfile] handleSubmit called');

    // Basic validation
    if (!profileData.name.trim()) {
      console.log('[EditProfile] Validation failed: Name is required');
      setSuccessMessage('Name is required');
      return;
    }

    if (profileData.skillsOffered.length === 0) {
      console.log('[EditProfile] Validation failed: At least one skill is required');
      setSuccessMessage('At least one skill is required');
      return;
    }

    console.log('[EditProfile] Validation passed, starting update');

    try {
      setIsSubmitting(true);

      // Handle profile picture update if changed
      let profilePictureUrl = profile?.profile_picture;
      if (profileData.profilePicture !== profile?.profile_picture) {
        console.log('[EditProfile] Profile picture changed');
        if (profileData.profilePicture === "") {
          // User wants to remove the profile picture
          profilePictureUrl = null;
        } else if (profileData.profilePicture.startsWith('data:')) {
          // Check if it's a new file (starts with 'data:')
          console.log('[EditProfile] Uploading new profile picture');

          try {
            // Convert base64 to file and upload
            const response = await fetch(profileData.profilePicture);
            const blob = await response.blob();
            const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });

            const { url, error: uploadError } = await uploadProfilePicture(file);
            if (uploadError) {
              console.error('[EditProfile] Failed to upload profile picture:', uploadError);
              setSuccessMessage(`Failed to upload profile picture: ${uploadError}`);
              return;
            }

            profilePictureUrl = url;
            console.log('[EditProfile] Profile picture uploaded successfully:', url);
          } catch (uploadError) {
            console.error('[EditProfile] Error during profile picture upload:', uploadError);
            setSuccessMessage(`Error uploading profile picture: ${uploadError}`);
            return;
          }
        }
      }

      // Update profile using the context
      const updateData = {
        name: profileData.name.trim(),
        bio: profileData.bio.trim(),
        location: profileData.location.trim(),
        profile_picture: profilePictureUrl,
        skills_i_have: profileData.skillsOffered,
        skills_i_want: profileData.workWanted ? profileData.workWanted.split(", ").filter(s => s.trim()) : [],
        experience_level: profileData.experienceLevel,
        availability: profileData.availability,
        top_skills: profileData.skillsOffered.slice(0, 3), // First 3 skills as top skills
      };

      console.log('[EditProfile] Calling updateProfile with data:', updateData);

      // Use the updateProfile function from the context
      const { error, success } = await updateProfile(updateData);

      console.log('[EditProfile] updateProfile returned:', { error, success });

      if (error) {
        console.error('[EditProfile] Failed to update profile:', error);
        setSuccessMessage(`Failed to update profile: ${error}`);
        return;
      }

      if (success) {
        console.log('[EditProfile] Profile updated successfully!');
        setSuccessMessage('Profile updated successfully! Redirecting...');
        // Wait a moment to show the success message, then navigate
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      }
    } catch (error) {
      console.error('[EditProfile] Error updating profile:', error);
      setSuccessMessage('An error occurred while updating your profile');
    } finally {
      setIsSubmitting(false);
      console.log('[EditProfile] handleSubmit completed');
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return <PageLoader text="Loading profile..." />;
  }

  // Return early if no profile
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <button
                onClick={() => navigate("/profile")}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-gray-100 rounded-lg shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 truncate">Edit Profile</h1>
            </div>
            {/* Optional Save button in header for desktop if needed */}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-4 sm:py-8 px-4 sm:px-4">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50/50 border border-green-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-green-800 font-semibold">{successMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              Profile Photo
            </h2>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <img
                  src={
                    profileData.profilePicture ||
                    ""
                  }
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 hover:bg-green-700 transition-colors shadow-lg"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-sm sm:text-md font-medium text-gray-900">
                  Update your profile photo
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  Choose a clear, professional photo that represents you well
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    size="sm"
                  >
                    Change Photo
                  </Button>
                  {profileData.profilePicture && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setProfileData(prev => ({ ...prev, profilePicture: "" }))}
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      size="sm"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => {
                    setSuccessMessage(""); // Clear any previous messages
                    setProfileData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                  }}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-base transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => {
                  setSuccessMessage(""); // Clear any previous messages
                  setProfileData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }));
                }}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Bio Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              About Me
            </h2>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Bio / Professional Summary
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => {
                  setSuccessMessage(""); // Clear any previous messages
                  setProfileData((prev) => ({ ...prev, bio: e.target.value }));
                }}
                rows={3}
                maxLength={500}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm sm:text-base"
                placeholder="Tell us about yourself, your background, and what drives your passion for skill trading..."
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {profileData.bio.length}/500 characters
                </span>
                {profileData.bio.length > 400 && (
                  <span className="text-xs text-orange-500">
                    {500 - profileData.bio.length} characters remaining
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              Skills I Offer
            </h2>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Add your skills *
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                  placeholder="Type a skill and press Enter"
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  size="sm"
                >
                  Add
                </Button>
              </div>
              {profileData.skillsOffered.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profileData.skillsOffered.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-green-600 hover:text-green-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Work Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              Work Preferences
            </h2>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  What type of work are you looking for?
                </label>
                <textarea
                  value={profileData.workWanted}
                  onChange={(e) => {
                    setSuccessMessage(""); // Clear any previous messages
                    setProfileData((prev) => ({
                      ...prev,
                      workWanted: e.target.value,
                    }));
                  }}
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm sm:text-base"
                  placeholder="Describe the type of projects, collaborations, or skill exchanges you're interested in..."
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {profileData.workWanted.length}/300 characters
                  </span>
                  {profileData.workWanted.length > 250 && (
                    <span className="text-xs text-orange-500">
                      {300 - profileData.workWanted.length} characters remaining
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Experience Level *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  {(
                    [
                      "beginner",
                      "intermediate",
                      "advanced",
                      "expert",
                    ] as ExperienceLevel[]
                  ).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setProfileData((prev) => ({
                          ...prev,
                          experienceLevel: level,
                        }))
                      }
                      className={cn(
                        "py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-lg border transition-colors capitalize",
                        profileData.experienceLevel === level
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Availability *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                  {(
                    [
                      { value: "full_time", label: "Full Time" },
                      { value: "part_time", label: "Part Time" },
                      { value: "project_based", label: "Project Based" },
                    ] as Array<{ value: Availability; label: string }>
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setProfileData((prev) => ({
                          ...prev,
                          availability: option.value,
                        }))
                      }
                      className={cn(
                        "py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-lg border transition-colors",
                        profileData.availability === option.value
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/profile")}
              className="w-full sm:w-auto order-2 sm:order-1 font-semibold text-gray-500 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto order-1 sm:order-2 bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-10 rounded-xl shadow-lg shadow-green-600/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <ButtonLoader size="sm" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
