import React, { useState, useEffect, useRef } from 'react';
import { Search, User, MapPin, Briefcase, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserSearchService, UserSearchResult } from '@/lib/user-search.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface UserSearchDropdownProps {
  className?: string;
  onUserSelect?: (user: UserSearchResult) => void;
  placeholder?: string;
}

export const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  className,
  onUserSelect,
  placeholder = "Search users by name or email..."
}) => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<() => void>();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      debounceRef.current();
    }

    if (!query.trim()) {
      setResults([]);
      setError(null);
      setIsOpen(false);
      return;
    }

    // Validate query
    const validation = UserSearchService.validateQuery(query);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid search query');
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (!session) {
      setError('Authentication required');
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Debounced search
    debounceRef.current = UserSearchService.debounceSearch(
      query,
      session,
      (result) => {
        setLoading(false);
        if (result.success && result.data) {
          setResults(result.data);
          setIsOpen(result.data.length > 0);
          setSelectedIndex(-1);
        } else {
          setError(result.error || 'Failed to search users');
          setResults([]);
          setIsOpen(false);
        }
      }
    );

    return () => {
      if (debounceRef.current) {
        debounceRef.current();
      }
    };
  }, [query, session?.access_token]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleUserSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleUserSelect = (selectedUser: UserSearchResult) => {
    if (onUserSelect) {
      onUserSelect(selectedUser);
    } else {
      // Navigate to the specific user's profile page
      navigate(`/profile/${selectedUser.user_id}`);
    }
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getExperienceLevelColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {error ? (
            <div className="p-4 text-center text-red-600">
              <p className="text-sm">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((user, index) => (
                <div
                  key={user.user_id}
                  className={cn(
                    "flex items-center space-x-3 p-3 cursor-pointer transition-colors",
                    index === selectedIndex
                      ? "bg-primary/10"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => handleUserSelect(user)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.profile_picture || undefined}
                      alt={user.name}
                    />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {user.name}
                      </h4>
                      {user.experience_level && (
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", getExperienceLevelColor(user.experience_level))}
                        >
                          {user.experience_level}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    {user.location && (
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400">{user.location}</p>
                      </div>
                    )}
                    {user.skills_i_have && user.skills_i_have.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400">
                          {user.skills_i_have.slice(0, 3).join(', ')}
                          {user.skills_i_have.length > 3 && '...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
