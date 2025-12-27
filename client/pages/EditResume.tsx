import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { useEffect, useState, useRef } from "react";
import { fetchMyResume, upsertMyResume, Resume } from "@/lib/resume.service";
import { generateResumeWithAI, saveGeminiApiKey, getGeminiApiKey, AIResumeRequest, generateResumeImprovement, scanCompleteResume, ResumeScanResult } from "@/lib/ai-resume.service";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Settings, Printer, LayoutTemplate, Target, User, FileText, Briefcase, GraduationCap, Wrench, FolderGit2, Award, Globe, Heart, Search } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { ResumePreview, ResumeTemplate } from "@/components/resume/ResumePreview";
import { ExperienceSection, EducationSection, SkillsSection, LanguagesSection, VolunteerSection, ProjectsSection } from "@/components/resume/ResumeFormSections";
import { ResumeScoreCard } from "@/components/resume/ResumeScoreCard";
import { JobTailoringDialog, JobTailoringSuggestions } from "@/components/resume/JobTailoringDialog";
import { useReactToPrint } from 'react-to-print';
import { getSmartTradeRecommendations, MatchedPost } from '@/lib/smart-trade.service';
import { SmartTradeModal } from '@/components/SmartTradeModal';
import { AIPromptDialog } from '@/components/AIPromptDialog';
import ResumeScannerModal from '@/components/resume/ResumeScannerModal';
import { EXAMPLE_RESUME } from '@/lib/example-resume';

export default function EditResumePage() {
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();

  // State
  const [resume, setResume] = useState<Resume>({} as Resume);
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const [template, setTemplate] = useState<ResumeTemplate>('classic');
  const [accentColor, setAccentColor] = useState('#4f46e5');
  const [fontScale, setFontScale] = useState(1);
  const [spacing, setSpacing] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [improvingText, setImprovingText] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showJobTailoringDialog, setShowJobTailoringDialog] = useState(false);
  const [showSmartTradeModal, setShowSmartTradeModal] = useState(false);
  const [smartTradeMatches, setSmartTradeMatches] = useState<MatchedPost[]>([]);
  const [loadingSmartTrades, setLoadingSmartTrades] = useState(false);
  const [showAIPromptDialog, setShowAIPromptDialog] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanResult, setScanResult] = useState<ResumeScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  // Resume Score is now handled by ResumeScoreCard component

  // Print function that opens resume in new window with proper styling
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const resumeElement = document.querySelector('[data-resume-preview]');
    if (!resumeElement) return;

    // Get all stylesheets from current page
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resume.full_name || 'Resume'}</title>
          <style>
            ${styles}
            @page { margin: 0.5in; size: letter; }
            body { margin: 0; padding: 20px; background: white; }
          </style>
        </head>
        <body>
          ${resumeElement.innerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  useEffect(() => {
    let mounted = true;

    // CRITICAL: Clear resume state when user changes to prevent data leakage
    setResume({
      full_name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      links: [],
      summary: "",
      education: [],
      technical_skills: [],
      experience: [],
      projects: [],
      achievements: [],
      certifications: [],
      languages: [],
      volunteer: [],
    } as Resume);

    setIsLoadingResume(true);

    (async () => {
      try {
        const existing = await fetchMyResume();
        if (existing && mounted) {
          setResume({
            ...existing,
            full_name: existing.full_name || "",
            headline: existing.headline || "",
            email: existing.email || "",
            phone: existing.phone || "",
            location: existing.location || "",
            summary: existing.summary || "",
            technical_skills: existing.technical_skills || [],
            experience: existing.experience || [],
            education: existing.education || [],
            projects: existing.projects || [],
            links: existing.links || [],
            achievements: existing.achievements || [],
            certifications: existing.certifications || [],
            languages: existing.languages || [],
            volunteer: existing.volunteer || [],
          });
        } else if (profile && mounted) {
          // Pre-fill from profile if no resume exists
          setResume(prev => ({
            ...prev,
            full_name: profile.name || "",
            email: profile.email || "",
          }));
        }
        if (mounted) setApiKey(getGeminiApiKey() || "");
      } catch (error) {
        console.error("Error loading resume:", error);
      } finally {
        if (mounted) setIsLoadingResume(false);
      }
    })();
    return () => { mounted = false };
  }, [profile?.user_id]);

  const update = (field: keyof Resume, value: any) => {
    setResume(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!resume.full_name) throw new Error("Full Name is required");
      await upsertMyResume(resume as any);
      alert("✅ Resume saved successfully! Your data is secure and private.");
      setSaving(false);
    } catch (err: any) {
      console.error("Resume save error:", err);
      setSaving(false);
      const errorMessage = err?.message || err?.error_description || "Unknown error";
      alert(`❌ Failed to save resume: ${errorMessage}\n\nPlease check the console for details.`);
    }
  };

  // AI Implementation - Improved text enhancement
  const improveText = async (text: string, path: string): Promise<string> => {
    if (!text) return text;
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return text;
    }

    setImprovingText(true);
    try {
      const improved = await generateResumeImprovement(text, "Make it more professional, action-oriented, and concise.");
      return improved;
    } catch (e) {
      console.error("AI Error:", e);
      alert("AI improvement failed. Please try again.");
      return text;
    } finally {
      setImprovingText(false);
    }
  };

  const handleSmartTrade = async () => {
    setLoadingSmartTrades(true);
    setShowSmartTradeModal(true);
    try {
      const matches = await getSmartTradeRecommendations(resume);
      setSmartTradeMatches(matches);
    } catch (error) {
      console.error('Error finding smart trades:', error);
    } finally {
      setLoadingSmartTrades(false);
    }
  };

  const handleAIPrompt = async (prompt: string) => {
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }
    try {
      const response = await generateResumeImprovement(
        JSON.stringify(resume),
        prompt
      );
      alert(`AI Response:\n\n${response}\n\nYou can now apply these suggestions to your resume.`);
    } catch (error) {
      console.error('AI prompt error:', error);
      alert('Failed to get AI response. Please try again.');
    }
  };

  const handleClearForm = () => {
    if (confirm('Are you sure you want to clear all resume data? This cannot be undone.')) {
      setResume({
        full_name: "",
        headline: "",
        email: "",
        phone: "",
        location: "",
        links: [],
        summary: "",
        education: [],
        technical_skills: [],
        experience: [],
        projects: [],
        achievements: [],
        certifications: [],
        languages: [],
        volunteer: [],
      } as Resume);
    }
  };


  // Job Tailoring Handler
  const handleJobTailoring = (suggestions: JobTailoringSuggestions) => {
    // Apply suggested summary if available
    if (suggestions.suggestedSummary) {
      setResume(prev => ({ ...prev, summary: suggestions.suggestedSummary }));
    }

    // Show notification
    alert(`Job Match: ${suggestions.matchScore}%\n\nHighlight these skills: ${suggestions.skillsToHighlight.join(', ')}`);
  };

  const generateFullResume = async () => {
    if (!resume.full_name) { alert("Please enter a name first."); return; }
    setAiGenerating(true);
    try {
      const aiReq: AIResumeRequest = { ...resume as any };
      const result = await generateResumeWithAI(aiReq);
      setResume(prev => ({ ...prev, ...result }));
      alert("Resume Generated! Please review.");
    } catch (e) {
      alert("Generation failed: " + e);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleScanResume = async () => {
    setScanning(true);
    try {
      const result = await scanCompleteResume(resume);
      setScanResult(result);
      setShowScannerModal(true);
    } catch (error) {
      console.error('Error scanning resume:', error);
      alert('Failed to scan resume. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const loadExampleResume = () => {
    if (confirm('This will replace your current resume with a professional example. Continue?')) {
      setResume({ ...EXAMPLE_RESUME, user_id: profile?.id || "" });
      alert('Example resume loaded! Review and customize it for your needs.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header />

      {/* Header */}
      <div className="border-b border-slate-300 bg-white px-4 md:px-8 py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-5">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/resume')}
              size="sm"
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 font-medium text-sm px-2.5 h-9"
            >
              ←
            </Button>
            <div className="border-l border-slate-300 pl-3">
              <h1 className="text-base md:text-lg font-bold text-slate-900">Resume Builder</h1>
              <p className="text-xs text-slate-600 mt-0.5 hidden sm:block">Professional Resume</p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Save Button */}
            <Button
              size="sm"
              onClick={async () => {
                await handleSave();
                setShowMobilePreview(true);
              }}
              disabled={saving || !resume.full_name}
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 h-9"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="hidden sm:inline ml-2">Saving...</span>
                </>
              ) : (
                <span className="hidden sm:inline">Save Resume</span>
              )}
              {!saving && <span className="sm:hidden">Save</span>}
            </Button>

            {/* Secondary Actions - Now visible on mobile */}
            <Button
              size="sm"
              onClick={handleSmartTrade}
              className="text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2.5 sm:px-3 h-9 font-medium"
            >
              <Sparkles size={16} className="text-green-600" />
              <span className="hidden sm:inline ml-1.5">Trades</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2.5 sm:px-3 h-9 font-medium"
            >
              <Printer size={16} className="text-green-600" />
              <span className="hidden sm:inline ml-1.5">PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handleScanResume}
              disabled={scanning || !resume.full_name}
              className="text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2.5 sm:px-3 h-9 font-medium"
            >
              {scanning ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <Search size={16} className="text-green-600" />
                  <span className="hidden sm:inline ml-1.5">Scan</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={loadExampleResume}
              className="text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2.5 sm:px-3 h-9 font-medium"
            >
              <FileText size={16} className="text-green-600" />
              <span className="hidden sm:inline ml-1.5">Example</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Preview Toggle */}
      <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!showMobilePreview ? "outline" : "ghost"}
            onClick={() => setShowMobilePreview(false)}
            className={`flex-1 h-9 text-sm font-medium ${!showMobilePreview
              ? 'bg-slate-100 border-slate-300 text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Edit Form
          </Button>
          <Button
            size="sm"
            variant={showMobilePreview ? "outline" : "ghost"}
            onClick={() => setShowMobilePreview(true)}
            className={`flex-1 h-9 text-sm font-medium ${showMobilePreview
              ? 'bg-slate-100 border-slate-300 text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Preview
          </Button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

        {/* Mobile: Show either form OR preview based on toggle */}

        {/* LEFT SIDE: Form Editor */}
        <div className={`w-full lg:w-1/2 overflow-y-auto overflow-x-hidden bg-white border-b lg:border-b-0 lg:border-r border-slate-300 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          <div className="p-4 sm:p-5 md:p-8 space-y-5 sm:space-y-6 max-w-2xl mx-auto">

            {/* Template & Style */}
            <Card className="border-slate-300 shadow-sm">
              <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <LayoutTemplate size={16} className="text-green-600" />
                  Template & Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-800 mb-2.5 block">Resume Template</Label>
                  <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
                    <SelectTrigger className="h-10 border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-slate-700" />
                          <span>ATS Classic</span>
                          <span className="text-xs text-slate-600 font-medium">(Recommended)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="modern">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-slate-700" />
                          <span>Modern Professional</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="creative">
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-slate-700" />
                          <span>Creative</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label className="text-sm font-semibold text-slate-800 mb-2.5 block">Spacing</Label>
                    <Select value={spacing} onValueChange={(v: any) => setSpacing(v)}>
                      <SelectTrigger className="h-10 border-slate-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-800 mb-2.5 block">Accent Color</Label>
                    <div className="flex gap-2.5 mt-2">
                      {[
                        { color: '#4f46e5', name: 'Indigo' },
                        { color: '#0ea5e9', name: 'Sky' },
                        { color: '#059669', name: 'Green' },
                        { color: '#111827', name: 'Dark' }
                      ].map(({ color, name }) => (
                        <button
                          key={color}
                          onClick={() => setAccentColor(color)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center shadow-sm ${accentColor === color ? 'border-green-500 ring-2 ring-offset-2 ring-green-200' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          style={{ backgroundColor: color }}
                          title={name}
                        >
                          {accentColor === color && <span className="text-white text-sm font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Sections */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 px-1 flex items-center gap-2">
                <FileText size={18} className="text-green-600" />
                Resume Sections
              </h3>
              <Accordion type="single" collapsible defaultValue="basics" className="space-y-3">

                <AccordionItem value="basics" className="border border-slate-300 rounded-lg bg-white px-5 hover:border-green-400 hover:shadow-md transition-all">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:text-green-700 hover:no-underline py-4">
                    <div className="flex items-center gap-2.5">
                      <User size={18} className="text-green-600" />
                      Contact Information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 pb-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label className="text-sm font-medium text-slate-700">Full Name *</Label><Input value={resume.full_name || ""} onChange={e => update('full_name', e.target.value)} className="mt-1.5 border-slate-300" /></div>
                      <div><Label className="text-sm font-medium text-slate-700">Professional Title</Label><Input value={resume.headline || ""} onChange={e => update('headline', e.target.value)} placeholder="e.g. Software Engineer" className="mt-1.5 border-slate-300" /></div>
                      <div><Label className="text-sm font-medium text-slate-700">Email *</Label><Input type="email" value={resume.email || ""} onChange={e => update('email', e.target.value)} className="mt-1.5 border-slate-300" /></div>
                      <div><Label className="text-sm font-medium text-slate-700">Phone *</Label><Input value={resume.phone || ""} onChange={e => update('phone', e.target.value)} className="mt-1.5 border-slate-300" /></div>
                      <div className="col-span-2"><Label className="text-sm font-medium text-slate-700">Location</Label><Input value={resume.location || ''} onChange={e => update('location', e.target.value)} placeholder="City, State" className="mt-1.5 border-slate-300" /></div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="summary" className="border border-slate-300 rounded-lg bg-white px-5 hover:border-green-400 hover:shadow-md transition-all">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:text-green-700 hover:no-underline py-4">
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="text-green-600" />
                      Professional Summary
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-3">
                    <Textarea rows={4} value={resume.summary || ''} onChange={e => update('summary', e.target.value)} placeholder="Write a compelling 2-3 sentence summary highlighting your key strengths and experience..." className="border-slate-300" />
                    <div className="flex justify-end mt-3">
                      <Button variant="ghost" size="sm" className="text-sm text-green-600 hover:text-green-700 hover:bg-green-50" onClick={async () => {
                        const improved = await improveText(resume.summary || '', 'summary');
                        if (improved) update('summary', improved);
                      }}>
                        <Sparkles size={14} className="mr-1.5" /> AI Enhance
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="experience" className="border border-slate-300 rounded-lg bg-white px-5 hover:border-green-400 hover:shadow-md transition-all">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:text-green-700 hover:no-underline py-4">
                    <div className="flex items-center gap-2.5">
                      <Briefcase size={18} className="text-green-600" />
                      Work Experience
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-3">
                    <ExperienceSection
                      items={resume.experience || []}
                      onChange={v => update('experience', v)}
                      onAiImprove={improveText}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="education" className="border border-slate-300 rounded-lg bg-white px-5 hover:border-green-400 hover:shadow-md transition-all">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:text-green-700 hover:no-underline py-4">
                    <div className="flex items-center gap-2.5">
                      <GraduationCap size={18} className="text-green-600" />
                      Education
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-3">
                    <EducationSection items={resume.education || []} onChange={v => update('education', v)} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="skills" className="border border-slate-300 rounded-lg bg-white px-5 hover:border-green-400 hover:shadow-md transition-all">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:text-green-700 hover:no-underline py-4">
                    <div className="flex items-center gap-2.5">
                      <Wrench size={18} className="text-green-600" />
                      Technical Skills
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-3">
                    <SkillsSection items={resume.technical_skills || []} onChange={v => update('technical_skills', v)} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="projects" className="border border-slate-300 rounded-lg bg-white px-5 hover:border-green-400 hover:shadow-md transition-all">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:text-green-700 hover:no-underline py-4">
                    <div className="flex items-center gap-2.5">
                      <FolderGit2 size={18} className="text-green-600" />
                      Projects (Optional)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-3">
                    <ProjectsSection
                      items={resume.projects || []}
                      onChange={v => update('projects', v)}
                      onAiImprove={improveText}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="languages" className="border border-slate-300 rounded-lg bg-white px-5 hover:border-green-400 hover:shadow-md transition-all">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:text-green-700 hover:no-underline py-4">
                    <div className="flex items-center gap-2.5">
                      <Globe size={18} className="text-green-600" />
                      Languages (Optional - Boosts ATS)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-3">
                    <LanguagesSection items={resume.languages || []} onChange={v => update('languages', v)}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="volunteer" className="border border-slate-300 rounded-lg bg-white px-5 hover:border-green-400 hover:shadow-md transition-all">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:text-green-700 hover:no-underline py-4">
                    <div className="flex items-center gap-2.5">
                      <Heart size={18} className="text-green-600" />
                      Volunteer Experience (Optional - Boosts ATS)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-3">
                    <VolunteerSection items={resume.volunteer || []} onChange={v => update('volunteer', v)} />
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Live Resume Preview */}
        <div className={`w-full lg:w-1/2 bg-slate-50 overflow-y-auto overflow-x-hidden p-2 md:p-4 ${!showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          <div className="w-full max-w-[850px] mx-auto shadow-lg" data-resume-preview>
            {isLoadingResume ? (
              <div className="bg-white w-full mx-auto shadow-lg animate-pulse" style={{ padding: '0.5in', minHeight: '11in' }}>
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-8"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/3 mt-8 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            ) : (
              <ResumePreview
                resume={resume}
                template={template}
                accentColor={accentColor}
                fontScale={fontScale}
              />
            )}
          </div>
        </div>

      </div>

      {/* Job Tailoring Dialog */}
      <JobTailoringDialog
        open={showJobTailoringDialog}
        onOpenChange={setShowJobTailoringDialog}
        resume={resume}
        onApplySuggestions={handleJobTailoring}
      />

      {/* Smart Trade Modal */}
      <SmartTradeModal
        open={showSmartTradeModal}
        onOpenChange={setShowSmartTradeModal}
        matches={smartTradeMatches}
        loading={loadingSmartTrades}
      />

      {/* AI Prompt Dialog */}
      <AIPromptDialog
        open={showAIPromptDialog}
        onOpenChange={setShowAIPromptDialog}
        onSubmit={handleAIPrompt}
      />

      {/* Resume Scanner Modal */}
      <ResumeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        scanResult={scanResult}
        onRescan={handleScanResume}
      />
    </div >
  );
}
