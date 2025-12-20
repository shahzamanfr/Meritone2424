import { RequestHandler } from "express";
import { supabase } from "@shared/supabase";

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per user

export interface UserSearchRequest {
  query: string;
}

export interface UserSearchResponse {
  users: Array<{
    user_id: string;
    name: string;
    email: string;
    profile_picture: string | null;
    location: string | null;
    bio: string | null;
    skills_i_have: string[] | null;
    experience_level: string | null;
  }>;
  total: number;
}

// Rate limiting function
function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count };
}

export const handleUserSearch: RequestHandler = async (req, res) => {
  try {
    const { query } = req.body as UserSearchRequest;
    const authHeader = req.headers.authorization;

    // Validate authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitMap.get(user.id)?.resetTime || 0 - Date.now()) / 1000)
      });
    }

    // Validate query
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    if (trimmedQuery.length > 100) {
      return res.status(400).json({ error: 'Search query is too long' });
    }

    // Sanitize query to prevent SQL injection and XSS
    const sanitizedQuery = trimmedQuery
      .replace(/[%_]/g, '\\$&') // Escape SQL wildcards
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();

    // Search users with proper filtering and security
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        name,
        email,
        profile_picture,
        location,
        bio,
        skills_i_have,
        experience_level
      `)
      .or(`name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
      .neq('user_id', user.id) // Exclude current user
      .limit(20) // Limit results for performance
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to search users' });
    }

    const response: UserSearchResponse = {
      users: data || [],
      total: data?.length || 0
    };

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitMap.get(user.id)?.resetTime || 0).toISOString()
    });

    res.json(response);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
