import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MatchedPost } from "@/lib/smart-trade.service";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, X } from "lucide-react";

interface SmartTradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    matches: MatchedPost[];
    loading: boolean;
}

export function SmartTradeModal({ open, onOpenChange, matches, loading }: SmartTradeModalProps) {
    const navigate = useNavigate();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="text-green-600" size={24} />
                        Smart Trade Matches
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-600">
                        Posts and trades that match your resume skills
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4 py-4">
                        {/* Skeleton Loading */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-6 bg-slate-200 rounded w-24"></div>
                                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                                </div>
                                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
                                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-5/6 mb-3"></div>
                                <div className="flex gap-2">
                                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                                    <div className="h-6 bg-slate-200 rounded w-20"></div>
                                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-600 mb-4">No matching trades found yet.</p>
                        <p className="text-sm text-slate-500">
                            Try adding more skills to your resume or check back later!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="border border-slate-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => {
                                    onOpenChange(false);
                                    navigate(`/feed#post-${match.id}`);
                                }}
                            >
                                {/* User Info & Match Score */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {match.profiles?.avatar_url ? (
                                            <img
                                                src={match.profiles.avatar_url}
                                                alt={match.profiles.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                                                {match.profiles?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-slate-700">
                                            {match.profiles?.name || 'Unknown User'}
                                        </span>
                                    </div>
                                    <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                        <TrendingUp size={14} className="mr-1" />
                                        {match.matchScore}% Match
                                    </Badge>
                                </div>

                                {/* Post Title */}
                                <h3 className="font-semibold text-slate-900 mb-2">
                                    {match.title}
                                </h3>

                                {/* Post Content Preview */}
                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                    {match.content}
                                </p>

                                {/* Matching Skills */}
                                <div className="mb-3">
                                    <p className="text-xs font-semibold text-slate-700 mb-2">
                                        Your matching skills:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {match.matchingSkills.map((skill, i) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className="bg-green-50 text-green-700 border-green-200"
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Skills Needed */}
                                {match.skills_needed && match.skills_needed.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700 mb-2">
                                            They're looking for:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {match.skills_needed.map((skill, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className="text-slate-600"
                                                >
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            navigate("/feed");
                        }}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        View All Posts
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
