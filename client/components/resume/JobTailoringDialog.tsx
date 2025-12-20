import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { Resume } from '@/lib/resume.service';
import { tailorResumeToJob } from '@/lib/ai-resume.service';
import { Card, CardContent } from '@/components/ui/card';

interface JobTailoringDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resume: Partial<Resume>;
    onApplySuggestions: (suggestions: JobTailoringSuggestions) => void;
}

export interface JobTailoringSuggestions {
    matchScore: number;
    keywordMatches: string[];
    missingKeywords: string[];
    skillsToHighlight: string[];
    suggestedSummary?: string;
}

export const JobTailoringDialog: React.FC<JobTailoringDialogProps> = ({
    open,
    onOpenChange,
    resume,
    onApplySuggestions,
}) => {
    const [jobDescription, setJobDescription] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState<JobTailoringSuggestions | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) {
            setError('Please paste a job description');
            return;
        }

        setAnalyzing(true);
        setError(null);

        try {
            const result = await tailorResumeToJob(resume, jobDescription);
            setSuggestions(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze job description');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleApply = () => {
        if (suggestions) {
            onApplySuggestions(suggestions);
            onOpenChange(false);
            // Reset state
            setJobDescription('');
            setSuggestions(null);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setJobDescription('');
        setSuggestions(null);
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-indigo-600" size={20} />
                        Tailor Resume to Job
                    </DialogTitle>
                    <DialogDescription>
                        Paste a job description below, and AI will analyze it to suggest which skills and keywords to emphasize in your resume.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Job Description Input */}
                    <div>
                        <Label htmlFor="job-description">Job Description</Label>
                        <Textarea
                            id="job-description"
                            rows={8}
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here..."
                            className="mt-1"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Analyze Button */}
                    {!suggestions && (
                        <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
                            {analyzing ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="mr-2" size={16} />
                                    Analyze Job Match
                                </>
                            )}
                        </Button>
                    )}

                    {/* Suggestions Display */}
                    {suggestions && (
                        <div className="space-y-4">
                            {/* Match Score */}
                            <Card className="border-2">
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Match Score</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${suggestions.matchScore >= 70
                                                            ? 'bg-green-500'
                                                            : suggestions.matchScore >= 50
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${suggestions.matchScore}%` }}
                                                />
                                            </div>
                                            <span className="text-lg font-bold">{suggestions.matchScore}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Skills to Highlight */}
                            {suggestions.skillsToHighlight.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 text-green-700">✓ Skills You Have (Highlight These)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.skillsToHighlight.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing Keywords */}
                            {suggestions.missingKeywords.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 text-amber-700">⚠ Missing Keywords (Consider Adding)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.missingKeywords.map((keyword, i) => (
                                            <span key={i} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Summary */}
                            {suggestions.suggestedSummary && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Suggested Summary (Tailored)</h4>
                                    <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                                        <p className="text-sm text-slate-700">{suggestions.suggestedSummary}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <Button onClick={handleApply} className="flex-1">
                                    Apply Suggestions
                                </Button>
                                <Button variant="outline" onClick={() => setSuggestions(null)} className="flex-1">
                                    Analyze Another Job
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
