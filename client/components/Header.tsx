import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Menu, X, Rocket, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate, useLocation } from "react-router-dom";
import { UserSearchDropdown } from "./UserSearchDropdown";
import { UserSearchResult } from "@/lib/user-search.service";

export default function Header() {
  const { isAuthenticated, signOut, isEmailVerified, user } = useAuth();
  const { profile, hasProfile, loading } = useProfile();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we are on the home page
  const isHomePage = location.pathname === "/";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleProfileClick = () => {
    if (hasProfile) {
      navigate("/profile");
    } else {
      navigate("/create-profile");
    }
  };

  const handleUserSelect = (user: UserSearchResult) => {
    // Navigate to the specific user's profile page
    navigate(`/profile/${user.user_id}`);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Back Button */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2">
              {!isHomePage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-1 -ml-2 text-slate-500 hover:text-slate-900"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="flex-shrink-0">
                <a href="/" className="flex items-center">
                  <img
                    src="/meritone-logo.png"
                    alt="MeritOne"
                    className="h-12 w-auto object-contain"
                  />
                </a>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => toast({ title: "Coming Soon", description: "Our Collab Hub is under construction!", duration: 3000 })}
                className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5" />
                Collab Hub
              </button>
              <button
                onClick={() => toast({ title: "Coming Soon", description: "Skill certifications are coming soon!", duration: 3000 })}
                className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
              >
                Skills Certifications
              </button>
              <a href="/trades" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">Trades</a>
              <a href="/resume" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">Resume</a>
              {isAuthenticated && (
                <>
                  <a href="/feed" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">Post</a>
                  <a href="/messages" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">Messages</a>
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            {isAuthenticated ? (
              <UserSearchDropdown
                onUserSelect={handleUserSelect}
                placeholder="Search by name or skill..."
                className="w-full"
              />
            ) : (
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-green-500" />
                <input
                  type="text"
                  placeholder="Sign in to search users..."
                  disabled
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed transition-all"
                />
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                loading ? (
                  <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse border border-gray-200" />
                ) : hasProfile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={profile?.profile_picture || ""}
                            alt={profile?.name || "User"}
                          />
                          <AvatarFallback>
                            {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{profile?.name || "User"}</p>
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {profile?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleProfileClick}>
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {user?.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="text-sm text-muted-foreground">
                            {user?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/create-profile")}>
                        Create Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/signin")}
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top duration-200">
            <div className="px-4 py-5 space-y-5">
              {/* Mobile Search */}
              <div>
                {isAuthenticated ? (
                  <UserSearchDropdown
                    onUserSelect={handleUserSelect}
                    placeholder="Search users..."
                    className="w-full"
                  />
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Sign in to search users..."
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                )}
              </div>





              {/* Mobile Navigation Links */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => {
                    toast({ title: "Coming Soon", description: "Our Collab Hub is under construction!", duration: 3000 });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Collab Hub
                </button>
                <button
                  onClick={() => {
                    toast({ title: "Coming Soon", description: "Skill certifications are coming soon!", duration: 3000 });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Skills Certifications
                </button>
                <a
                  href="/trades"
                  className="block px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Trades
                </a>
                <a
                  href="/resume"
                  className="block px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Resume
                </a>
                {isAuthenticated && (
                  <>
                    <a
                      href="/feed"
                      className="block px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Post
                    </a>
                    <a
                      href="/messages"
                      className="block px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Messages
                    </a>
                  </>
                )}
              </div>

              {/* Mobile Auth */}
              <div className="border-t border-gray-200 pt-4">
                {isAuthenticated ? (
                  profile ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={profile.profile_picture || ""}
                            alt={profile.name || "User"}
                          />
                          <AvatarFallback>
                            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile.name || "User"}</p>
                          <p className="text-sm text-muted-foreground">
                            {profile.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            navigate("/profile");
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Profile
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            navigate("/settings");
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Settings
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Log out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        window.location.href = "/create-profile";
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      Create Profile
                    </Button>
                  )
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("/signin");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full border-gray-200"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/signup");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
