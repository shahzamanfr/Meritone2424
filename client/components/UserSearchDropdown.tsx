import React, { useState, useEffect, useRef } from 'react';
import { Search, User, MapPin, Briefcase, X, Loader2, ArrowRight } from 'lucide-react';
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
  placeholder = "Search by name, skill or expertise..."
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
      <div className="relative group">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
          <Search className="text-gray-400 h-4 w-4 group-focus-within:text-green-500 transition-colors duration-200" />
        </div>
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
          className="w-full pl-10 pr-12 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/10 focus:border-green-400 focus:bg-white placeholder:text-gray-400"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {query ? (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center px-1.5 py-0.5 border border-gray-200 rounded-md bg-white text-[10px] font-medium text-gray-400 select-none">
              /
            </div>
          )}
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-green-500" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 max-h-[400px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {error ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Search Error</p>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No results found</p>
              <p className="text-xs text-gray-500">Try searching for something else</p>
            </div>
          ) : (
            <div className="flex flex-col py-1 overflow-y-auto">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50 mb-1">
                Found {results.length} People
              </div>
              {results.map((user, index) => (
                <div
                  key={user.user_id}
                  className={cn(
                    "flex items-center space-x-4 px-4 py-3 cursor-pointer transition-all duration-200 border-l-4",
                    index === selectedIndex
                      ? "bg-green-50 border-green-500"
                      : "hover:bg-gray-50 border-transparent"
                  )}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-gray-100 ring-2 ring-transparent group-hover:ring-green-400/20 transition-all">
                      <AvatarImage
                        src={user.profile_picture || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-green-50 to-green-100 text-green-700 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="font-semibold text-gray-900 truncate text-sm">
                        {user.name}
                      </h4>
                      {user.experience_level && (
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] px-1.5 py-0 uppercase tracking-tight", getExperienceLevelColor(user.experience_level))}
                        >
                          {user.experience_level}
                        </Badge>
                      )}
                    </div>
                    {(user.location || (user.skills_i_have && user.skills_i_have.length > 0)) && (
                      <div className="flex items-center gap-3 mt-1">
                        {user.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-[11px] text-gray-500 truncate max-w-[100px]">{user.location}</p>
                          </div>
                        )}
                        {user.skills_i_have && user.skills_i_have.length > 0 && (
                          <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
                            <Briefcase className="w-3 h-3 text-gray-400" />
                            <p className="text-[11px] text-gray-500 truncate">
                              {user.skills_i_have[0]}
                              {user.skills_i_have.length > 1 && `, +${user.skills_i_have.length - 1}`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <ArrowRight className={cn(
                    "w-4 h-4 text-gray-300 transition-all duration-200",
                    index === selectedIndex ? "translate-x-0 opacity-100 text-green-500" : "-translate-x-2 opacity-0"
                  )} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
