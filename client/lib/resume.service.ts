import { supabase } from "@/lib/supabase";

export type ResumeLink = { label: string; url: string };
export type ResumeEducation = { school: string; degree?: string; duration?: string; details?: string };
export type ResumeSkillSection = { section: string; items: string[] };
export type ResumeExperience = { company: string; role?: string; duration?: string; bullets: string[] };
export type ResumeProject = { name: string; description?: string; bullets: string[]; links?: ResumeLink[] };
export type ResumeCertification = { name: string; issuer?: string; year?: string };
export type ResumeLanguage = { language: string; proficiency: string }; // e.g., "English", "Native" or "Spanish", "Professional"
export type ResumeVolunteer = { organization: string; role?: string; duration?: string; description?: string };

export type Resume = {
  id?: string;
  user_id: string;
  full_name: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  links: ResumeLink[];
  summary?: string;
  education: ResumeEducation[];
  technical_skills: ResumeSkillSection[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  achievements: string[];
  certifications: ResumeCertification[];
  languages?: ResumeLanguage[]; // Optional for ATS
  volunteer?: ResumeVolunteer[]; // Optional for ATS
  created_at?: string;
  updated_at?: string;
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchMyResume(): Promise<Resume | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If column doesn't exist (406 error), return null instead of throwing
      if (error.code === 'PGRST116' || error.message.includes('column')) {
        console.warn("Database schema issue - please run migrations:", error.message);
        return null;
      }
      throw error;
    }

    return (data as unknown as Resume) || null;
  } catch (err) {
    console.error("Error fetching resume:", err);
    return null;
  }
}

export async function upsertMyResume(resume: Omit<Resume, "user_id">): Promise<Resume> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const payload = { ...resume, user_id: userId } as Partial<Resume>;

  // Remove id if it exists to let the database handle it
  delete payload.id;

  const { data, error } = await supabase
    .from("resumes")
    .upsert(payload, {
      onConflict: "user_id",
      ignoreDuplicates: false
    })
    .select("*")
    .single();

  if (error) {
    console.error("Resume save error:", error);
    throw error;
  }
  return data as unknown as Resume;
}

export async function deleteMyResume(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const { error } = await supabase.from("resumes").delete().eq("user_id", userId);
  if (error) throw error;
}


