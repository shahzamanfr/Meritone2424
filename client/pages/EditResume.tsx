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
import { Loader2, Sparkles, Settings, Printer, LayoutTemplate, Target, User, FileText, Briefcase, GraduationCap, Wrench, FolderGit2, Award, Globe, Heart, Search, ClipboardCheck } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { useToast } from "@/hooks/use-toast";
import { ResumePreview, ResumeTemplate } from "@/components/resume/ResumePreview";
import ResumeScannerModal from "@/components/resume/ResumeScannerModal";
import { ExperienceSection, EducationSection, SkillsSection, LanguagesSection, VolunteerSection, ProjectsSection } from "@/components/resume/ResumeFormSections";
import { ResumeScoreCard } from "@/components/resume/ResumeScoreCard";
import { JobTailoringDialog, JobTailoringSuggestions } from "@/components/resume/JobTailoringDialog";
import { useReactToPrint } from 'react-to-print';
import { getSmartTradeRecommendations, MatchedPost } from '@/lib/smart-trade.service';
import { SmartTradeModal } from '@/components/SmartTradeModal';
import { AIPromptDialog } from '@/components/AIPromptDialog';

import { EXAMPLE_RESUME } from '@/lib/example-resume';

export default function EditResumePage() {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
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

  // AI Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<ResumeScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);


  const contentRef = useRef<HTMLDivElement>(null);

  // Robust Print/PDF function using react-to-print
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: resume.full_name ? `${resume.full_name} - Resume` : 'Resume',
    onAfterPrint: () => console.log('Print completed'),
  });

  // Legacy fallback for mobile browsers where window.print might be restricted
  const handlePrintLegacy = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const resumeElement = contentRef.current;
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
            body { margin: 0; padding: 0.5in; background: white; }
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

  // Mobile-specific direct print handler
  const handlePrintMobile = async () => {
    // 1. Ensure preview is visible on mobile
    if (window.innerWidth < 1024) {
      setShowMobilePreview(true);
      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 2. Trigger native print (CSS will handle hiding everything else)
    window.print();
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

    setImprovingText(true);
    try {
      const improved = await generateResumeImprovement(text, "Make it more professional, action-oriented, and concise.");
      return improved;
    } catch (e: any) {
      console.error("AI Error:", e);
      toast({
        title: "AI Enhancement Failed",
        description: e.message || "Failed to contact Groq API. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Resume Generated!",
        description: "Please review and customize the suggested content.",
      });
    } catch (e: any) {
      console.error("Generation failed:", e);
      toast({
        title: "Generation Failed",
        description: e.message || "Failed to generate resume with Groq AI.",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleScanResume = async () => {
    setIsScanning(true);
    try {
      const result = await scanCompleteResume(resume);
      setScanResult(result);
      setShowScanner(true);
    } catch (e) {
      console.error("Scan failed:", e);
      toast({
        title: "Audit Failed",
        description: "Could not analyze resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
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
      <div className="no-print">
        <Header />
      </div>

      {/* Header */}
      <div className="border-b border-slate-300 bg-white px-4 md:px-8 py-4 md:py-5 no-print">
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

            {/* AI Actions */}
            <Button
              size="sm"
              onClick={handleScanResume}
              disabled={isScanning || !resume.full_name}
              className="flex items-center gap-1.5 text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2 sm:px-3 h-9 font-medium shadow-sm transition-all"
            >
              {isScanning ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <ClipboardCheck size={16} className="text-green-600" />
              )}
              <span className="hidden min-[450px]:inline">Audit Resume</span>
              <span className="min-[450px]:hidden">Audit</span>
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
              onClick={() => {
                // Detection if it's a mobile device/narrow screen
                const isMobile = window.innerWidth < 1024 || /Android|iPhone/i.test(navigator.userAgent);

                if (isMobile) {
                  toast({
                    title: "Preparing PDF...",
                    description: "Please select 'Save as PDF' from the print options in the next screen.",
                  });
                  handlePrintMobile();
                } else {
                  try {
                    handlePrint();
                  } catch (e) {
                    handlePrintLegacy();
                  }
                }
              }}
              className="text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2 sm:px-3 h-9 font-medium shadow-sm transition-all"
            >
              <Printer size={16} className="text-green-600 shrink-0" />
              <span className="hidden min-[400px]:inline ml-1.5 whitespace-nowrap">PDF</span>
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
      <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-2.5 no-print">
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
                      <Button variant="ghost" size="sm" className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={async () => {
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
        <div className={`w-full lg:w-1/2 bg-slate-50 overflow-y-auto overflow-x-hidden p-2 md:p-4 preview-column ${!showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          <div className="w-full max-w-[850px] mx-auto shadow-lg relative resume-print-target">
            {/* 
                This is the actual preview visible to the user.
                We keep the 'ref' on THIS component so react-to-print can see it.
                Even if the parent container is 'hidden' on mobile (display: none),
                some versions of react-to-print handle it, but for maximum compatibility,
                we ensure it's technically printable.
            */}
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

          {/* Hidden Print Anchor - Dedicated target for the printing engine */}
          <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden h-0 w-0">
            <div ref={contentRef}>
              <ResumePreview
                resume={resume}
                template={template}
                accentColor={accentColor}
                fontScale={fontScale}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Job Tailoring Dialog */}
      <JobTailoringDialog
        open={showJobTailoringDialog}
        onOpenChange={setShowJobTailoringDialog}
        resume={resume}
        onApplySuggestions={async (suggestions) => {
          // Handle applied suggestions (this logic was simplified in previous edit)
          const updatedResume = { ...resume };
          if (suggestions.suggestedSummary) {
            updatedResume.summary = suggestions.suggestedSummary;
          }
          setResume(updatedResume);
        }}
      />

      <style>{`
        @media print {
          /* Force high-fidelity color printing (backgrounds, gradients) */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Hide UI elements */
          .no-print, 
          header, 
          nav, 
          button, 
          aside,
          .fixed, 
          .absolute:not(.resume-element),
          [role="dialog"],
          .accordion-item,
          .tabs-list,
          .editing-sidebar,
          footer {
            display: none !important;
            visibility: hidden !important;
          }

          /* Reset body and root for printing */
          body, #root {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          /* Main layout reset */
          .flex { display: block !important; }
          .min-h-screen { min-height: 0 !important; }
          .h-screen { height: auto !important; }

          /* Ensure the resume container is visible and occupies full width */
          .resume-print-target {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0.5in !important;
            box-shadow: none !important;
            position: static !important;
            background: white !important;
          }

          /* Show the preview column even if it was hidden on mobile */
          .preview-column {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            z-index: 9999 !important;
            background: white !important;
          }

          /* Prevent page breaks inside sections */
          section, .resume-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Professional typography reset for print */
          h1, h2, h3, h4 { page-break-after: avoid !important; }
        }

        /* Hide the specific print target from screen view */
        @media screen {
          .resume-print-target-hidden {
             display: none;
          }
        }
      `}</style>

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
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        scanResult={scanResult}
        onRescan={handleScanResume}
      />

    </div >
  );
}
