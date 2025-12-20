import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import Header from '@/components/Header';
import { TradesService, TradeWithComments, Comment } from '@/lib/trades.service';
import {
  Plus,
  MessageCircle,
  Check,
  X,
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  Search,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

type Trade = TradeWithComments;

interface NewTradeData {
  title: string;
  description: string;
  skillOffered: string;
  skillWanted: string;
  location?: string;
  deadline?: string;
}

const Trades: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { profile, hasProfile } = useProfile();

  const [activeView, setActiveView] = useState<'list' | 'new-trade'>('list');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Closed' | 'Assigned'>('all');

  const [newTrade, setNewTrade] = useState<NewTradeData>({
    title: '',
    description: '',
    skillOffered: '',
    skillWanted: '',
    location: '',
    deadline: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [tradeCommentTexts, setTradeCommentTexts] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const TRADES_PER_PAGE = 20;

  useEffect(() => {
    const loadTrades = async () => {
      setLoading(true);
      try {
        const { data, error } = await TradesService.getTrades();
        if (error) {
          setError(error);
        } else {
          setTrades(data || []);
          setError(null);
        }
      } catch (err) {
        setError('Failed to load trades');
        console.error('Error loading trades:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrades();

    const subscription = TradesService.subscribeToTrades((updatedTrades) => {
      setTrades(updatedTrades);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trade.description && trade.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      trade.skill_offered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.skill_wanted.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrades.length / TRADES_PER_PAGE);
  const startIndex = (currentPage - 1) * TRADES_PER_PAGE;
  const endIndex = startIndex + TRADES_PER_PAGE;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);


  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('Please sign in to create a trade');
      return;
    }

    if (!hasProfile) {
      setError('Please create a profile first');
      navigate('/create-profile');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Validation
      const title = newTrade.title.trim();
      const description = newTrade.description.trim();
      const skillOffered = newTrade.skillOffered.trim();
      const skillWanted = newTrade.skillWanted.trim();

      if (!title || !skillOffered || !skillWanted) {
        setError('Please fill in all required fields');
        return;
      }

      if (title.length < 3) {
        setError('Title must be at least 3 characters');
        return;
      }

      if (title.length > 100) {
        setError('Title must be less than 100 characters');
        return;
      }

      if (description.length > 500) {
        setError('Description must be less than 500 characters');
        return;
      }

      if (skillOffered.length > 50) {
        setError('Skill offered must be less than 50 characters');
        return;
      }

      if (skillWanted.length > 50) {
        setError('Skill wanted must be less than 50 characters');
        return;
      }

      const { data: createdTrade, error } = await TradesService.createTrade({
        title,
        description,
        skillOffered,
        skillWanted,
        userId: user?.id || 'anonymous',
        userDisplayName: profile?.name || 'Anonymous User',
        location: newTrade.location?.trim(),
        deadline: newTrade.deadline
      });

      if (error) {
        setError(error);
        return;
      }

      setNewTrade({
        title: '',
        description: '',
        skillOffered: '',
        skillWanted: '',
        location: '',
        deadline: ''
      });

      setActiveView('list');
      setError(null);

    } catch (err) {
      setError('Failed to create trade');
      console.error('Error creating trade:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInlineComment = async (tradeId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const commentText = tradeCommentTexts[tradeId]?.trim();
    if (!commentText) return;

    try {
      setIsSubmitting(true);

      const newComment: Comment = {
        id: Date.now().toString(),
        author: profile?.name || 'Anonymous User',
        text: commentText,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous'
      };

      const { error } = await TradesService.addComment(tradeId, newComment);

      if (error) {
        setError(error);
        return;
      }

      // Refresh the specific trade
      const { data: refreshed } = await TradesService.getTradeById(tradeId);
      if (refreshed) {
        setTrades(prev => prev.map(t => t.id === refreshed.id ? refreshed : t));
      }

      // Clear the comment text for this trade
      setTradeCommentTexts(prev => ({ ...prev, [tradeId]: '' }));
      setError(null);

    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-red-100 text-red-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTradeList = () => (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Skill Trades</h1>
              <Badge variant="outline" className="text-xs">
                {filteredTrades.length}
              </Badge>
            </div>

            <Button
              onClick={() => setActiveView('new-trade')}
              className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Trade
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-4 md:py-6 px-4">
        <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4 mb-4 md:mb-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search trades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', 'Open', 'Closed', 'Assigned'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "whitespace-nowrap text-xs h-8",
                    statusFilter === status
                      ? "bg-green-700 hover:bg-green-800 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {status === 'all' ? 'All' : status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading trades...</p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to create a trade!'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => setActiveView('new-trade')}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Trade
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {paginatedTrades.map((trade) => (
              <Card
                key={trade.id}
                className="border border-slate-200 hover:border-slate-300 transition-all"
              >
                <CardContent className="p-0">
                  {/* Main Trade Content */}
                  <div className="p-3 md:p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-1 truncate">{trade.title}</h3>
                        <div className="flex flex-wrap items-center text-slate-500 text-xs gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
                            {trade.user_display_name?.charAt(0).toUpperCase()}
                          </div>
                          <button
                            className="text-green-700 hover:underline font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${trade.user_id}`);
                            }}
                          >
                            {trade.user_display_name}
                          </button>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{formatDistanceToNow(new Date(trade.created_at))} ago</span>
                        </div>
                      </div>
                      <Badge className={cn("text-xs shrink-0", getStatusColor(trade.status))}>
                        {trade.status}
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Offering:</span>
                        <span className="font-medium text-slate-900 text-sm">{trade.skill_offered}</span>
                      </div>
                      <span className="hidden sm:inline text-slate-300">→</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Seeking:</span>
                        <span className="font-medium text-slate-900 text-sm">{trade.skill_wanted}</span>
                      </div>
                    </div>

                    {trade.description && (
                      <p className="text-xs md:text-sm text-slate-600 line-clamp-2 mb-3">{trade.description}</p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        {trade.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{trade.location}</span>
                          </div>
                        )}
                        {trade.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(trade.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {user?.id !== trade.user_id && (
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 text-white text-xs h-7 px-3 w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/chat', { state: { openWithUserId: trade.user_id } });
                          }}
                        >
                          Message
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Inline Comments Section */}
                  <div className="border-t border-slate-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTradeId(expandedTradeId === trade.id ? null : trade.id);
                      }}
                      className="w-full px-3 md:px-4 py-2 flex items-center justify-between text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>{trade.comments.length} {trade.comments.length === 1 ? 'Comment' : 'Comments'}</span>
                      </div>
                      {expandedTradeId === trade.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {expandedTradeId === trade.id && (
                      <div className="px-3 md:px-4 pb-3 space-y-3 bg-slate-50">
                        {/* Comments List */}
                        {trade.comments.length > 0 ? (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {trade.comments.map((comment) => (
                              <div key={comment.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="flex items-start gap-2">
                                  <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {comment.author.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-sm text-slate-900">{comment.author}</span>
                                      <span className="text-xs text-slate-500">
                                        {formatDistanceToNow(new Date(comment.timestamp))} ago
                                      </span>
                                      {comment.status === 'accepted' && (
                                        <Badge className="text-xs bg-green-100 text-green-800 border-0">
                                          Accepted
                                        </Badge>
                                      )}
                                      {comment.status === 'rejected' && (
                                        <Badge className="text-xs bg-red-100 text-red-800 border-0">
                                          Rejected
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-700">{comment.text}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No comments yet. Be the first to comment!</p>
                          </div>
                        )}

                        {/* Add Comment Form */}
                        {isAuthenticated ? (
                          <form
                            onSubmit={(e) => handleAddInlineComment(trade.id, e)}
                            className="pt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-2">
                              <Textarea
                                value={tradeCommentTexts[trade.id] || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setTradeCommentTexts(prev => ({ ...prev, [trade.id]: e.target.value }));
                                }}
                                placeholder="Write a comment..."
                                rows={2}
                                className="flex-1 text-sm resize-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || !tradeCommentTexts[trade.id]?.trim()}
                                className="bg-green-700 hover:bg-green-800 text-white self-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isSubmitting ? 'Posting...' : 'Post'}
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="text-center py-3 text-sm text-slate-500">
                            <a href="/login" className="text-green-700 hover:underline">Sign in</a> to comment
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="disabled:opacity-50"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "w-8 h-8 p-0",
                    currentPage === page && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderNewTradeForm = () => (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setActiveView('list')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Create New Trade</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreateTrade} className="space-y-6">
              <div>
                <Label htmlFor="title">Trade Title *</Label>
                <Input
                  id="title"
                  value={newTrade.title}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What are you looking to trade?"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTrade.description}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide more details..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="skillOffered">Offering *</Label>
                  <Input
                    id="skillOffered"
                    value={newTrade.skillOffered}
                    onChange={(e) => setNewTrade(prev => ({ ...prev, skillOffered: e.target.value }))}
                    placeholder="e.g., Web Development"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="skillWanted">Seeking *</Label>
                  <Input
                    id="skillWanted"
                    value={newTrade.skillWanted}
                    onChange={(e) => setNewTrade(prev => ({ ...prev, skillWanted: e.target.value }))}
                    placeholder="e.g., Graphic Design"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newTrade.location}
                    onChange={(e) => setNewTrade(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City or Remote"
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newTrade.deadline}
                    onChange={(e) => setNewTrade(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveView('list')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  {isSubmitting ? 'Creating...' : 'Create Trade'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );


  return (
    <>
      {activeView === 'list' && renderTradeList()}
      {activeView === 'new-trade' && renderNewTradeForm()}
    </>
  );
};

export default Trades;
