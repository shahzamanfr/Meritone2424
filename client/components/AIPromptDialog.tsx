import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

interface AIPromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (prompt: string) => Promise<void>;
}

export function AIPromptDialog({ open, onOpenChange, onSubmit }: AIPromptDialogProps) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        try {
            await onSubmit(prompt);
            setPrompt("");
            onOpenChange(false);
        } catch (error) {
            console.error("AI prompt error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={20} />
                        Ask AI Assistant
                    </DialogTitle>
                    <DialogDescription>
                        Ask the AI to help improve your resume content, suggest better wording, or answer questions about your experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="ai-prompt" className="text-sm font-medium mb-2 block">
                            What would you like help with?
                        </Label>
                        <Textarea
                            id="ai-prompt"
                            placeholder="Example: Make my summary more professional and concise, or suggest better action verbs for my experience bullets"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={5}
                            className="resize-none"
                        />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <p className="text-xs text-slate-600 font-medium mb-2">💡 Suggestions:</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                            <li>• "Rewrite my summary to highlight leadership skills"</li>
                            <li>• "Make these bullet points more quantifiable"</li>
                            <li>• "Suggest technical skills for a software engineer"</li>
                            <li>• "Improve the impact of my project descriptions"</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || loading}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={16} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2" size={16} />
                                Ask AI
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
