import { supabase } from "@/lib/supabase";
import { Resume } from "./resume.service";

export interface MatchedPost {
    id: string;
    user_id: string;
    title: string;
    content: string;
    skills_offered: string[];
    skills_needed: string[];
    post_type: string;
    created_at: string;
    profiles?: {
        user_id: string;
        name: string;
        profile_picture?: string;
    };
    matchScore: number;
    matchingSkills: string[];
}

/**
 * Extract all skills from a resume
 */
export function extractSkillsFromResume(resume: Partial<Resume>): string[] {
    const skills: string[] = [];

    // Get skills from technical_skills section
    if (resume.technical_skills && Array.isArray(resume.technical_skills)) {
        resume.technical_skills.forEach((section: any) => {
            if (section.items && Array.isArray(section.items)) {
                skills.push(...section.items);
            }
        });
    }

    // Normalize: lowercase and trim
    return skills.map(s => s.toLowerCase().trim()).filter(s => s.length > 0);
}

/**
 * Find smart trade matches by querying real posts from the database
 * Matches user skills with posts that need those skills
 */
export async function findSmartTrades(userSkills: string[]): Promise<MatchedPost[]> {
    if (!userSkills || userSkills.length === 0) {
        if (import.meta.env.DEV) console.log('⚠️ No skills provided for matching');
        return [];
    }

    try {
        // Get current user ID to exclude their own posts
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        if (import.meta.env.DEV) console.log(`🔍 Searching for posts matching skills:`, userSkills);

        // Query ALL posts first, then filter in JavaScript for better debugging
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles (
                    user_id,
                    name,
                    profile_picture
                )
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('❌ Error fetching posts:', error);
            return [];
        }

        if (!posts || posts.length === 0) {
            if (import.meta.env.DEV) console.log('ℹ️ No posts found in database');
            return [];
        }

        if (import.meta.env.DEV) console.log(`📊 Found ${posts.length} total posts in database`);

        // Calculate match scores and filter matches
        const matches: MatchedPost[] = posts
            .filter((post: any) => {
                // Exclude current user's posts
                if (currentUserId && post.user_id === currentUserId) {
                    return false;
                }
                // Must have skills_needed
                return post.skills_needed && Array.isArray(post.skills_needed) && post.skills_needed.length > 0;
            })
            .map((post: any) => {
                // Normalize skills for comparison
                const postSkillsNeeded = (post.skills_needed || []).map((s: string) => s.toLowerCase().trim());
                const matchingSkills: string[] = [];

                // Find matching skills
                userSkills.forEach(userSkill => {
                    const normalizedUserSkill = userSkill.toLowerCase().trim();
                    if (postSkillsNeeded.includes(normalizedUserSkill)) {
                        matchingSkills.push(userSkill); // Use original casing
                    }
                });

                // Calculate match score
                const matchScore = postSkillsNeeded.length > 0
                    ? Math.round((matchingSkills.length / postSkillsNeeded.length) * 100)
                    : 0;

                return {
                    id: post.id,
                    user_id: post.user_id,
                    title: post.title,
                    content: post.content,
                    skills_offered: post.skills_offered || [],
                    skills_needed: post.skills_needed || [],
                    post_type: post.post_type,
                    created_at: post.created_at,
                    profiles: post.profiles,
                    matchScore,
                    matchingSkills,
                };
            })
            .filter(match => match.matchingSkills.length > 0) // Only include posts with at least 1 matching skill
            .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score (highest first)
            .slice(0, 10); // Return top 10 matches

        if (import.meta.env.DEV) {
            if (import.meta.env.DEV) {
                console.log(`✅ Found ${matches.length} smart trade matches!`);
            }
            if (matches.length === 0) {
                if (import.meta.env.DEV) {
                    console.log('💡 Debug info:');
                    console.log('- Your skills:', userSkills);
                    console.log('- Posts with skills_needed:', posts.filter((p: any) => p.skills_needed?.length > 0).length);
                    console.log('- Sample post skills_needed:', posts.find((p: any) => p.skills_needed?.length > 0)?.skills_needed);
                }
            }
        }

        return matches;
    } catch (err) {
        console.error('❌ Unexpected error in findSmartTrades:', err);
        return [];
    }
}

/**
 * Get smart trade recommendations for a user based on their resume
 */
export async function getSmartTradeRecommendations(resume: Partial<Resume>): Promise<MatchedPost[]> {
    const userSkills = extractSkillsFromResume(resume);
    return findSmartTrades(userSkills);
}
