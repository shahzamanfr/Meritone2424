/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * User search API types
 */
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

export interface UserSearchError {
  error: string;
}
