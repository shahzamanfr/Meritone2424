import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, FileCheck, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchMyResume } from "@/lib/resume.service";
import { useAuth } from "@/contexts/AuthContext";

export default function ResumeLandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [hasExistingResume, setHasExistingResume] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }
            const data = await fetchMyResume();
            if (mounted) {
                setHasExistingResume(!!data);
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [isAuthenticated]);

    const templates = [
        {
            id: "classic",
            name: "ATS-Optimized",
            description: "Clean format designed for maximum ATS compatibility",
            score: "95%"
        },
        {
            id: "modern",
            name: "Modern Professional",
            description: "Contemporary two-column design with visual hierarchy",
            score: "88%"
        },
        {
            id: "creative",
            name: "Creative Design",
            description: "Bold layout for creative and design roles",
            score: "80%"
        }
    ];

    const handleTemplateSelect = (templateId: string) => {
        // Navigate to editor with selected template
        navigate(`/resume/edit?template=${templateId}`);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <div className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">

                {/* Hero Section */}
                <div className="text-center mb-12 sm:mb-16">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-slate-900 mb-5 tracking-tight leading-tight">
                        Build Your Resume,{" "}
                        <span className="block sm:inline">Find Skill Trades</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
                        Create your professional resume and let AI match you with relevant skill trading opportunities
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                        <Button
                            size="lg"
                            onClick={() => navigate("/resume/edit")}
                            className="bg-green-600 hover:bg-green-700 text-sm font-medium"
                            disabled={loading}
                        >
                            <FileText className="mr-2" size={18} />
                            Create Your Resume
                            <ArrowRight className="ml-2" size={18} />
                        </Button>
                    </div>
                </div>

                {/* Template Selection */}
                <div className="mb-12 sm:mb-16">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6 sm:mb-8 text-center tracking-tight">
                        Choose Your Template
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateSelect(template.id)}
                                className="group relative bg-white border border-slate-200 rounded-lg p-6 text-left hover:border-green-500 hover:shadow-md transition-all"
                            >
                                <div className="mb-3">
                                    <div className="text-xs font-semibold text-green-600 mb-2">
                                        {template.score} ATS Score
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-900 mb-2">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                                        {template.description}
                                    </p>
                                </div>

                                <div className="text-sm font-medium text-green-600 group-hover:text-green-700 flex items-center">
                                    Select Template
                                    <ArrowRight className="ml-1" size={14} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div className="border-t border-slate-200 pt-8 sm:pt-10 px-4">
                    <div className="grid grid-cols-3 gap-6 sm:gap-8 text-center">
                        <div>
                            <div className="text-3xl sm:text-4xl font-semibold text-green-600 mb-2">AI</div>
                            <div className="text-xs sm:text-sm text-slate-600 font-medium leading-tight">Smart Trade<br className="sm:hidden" /> Matching</div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-semibold text-green-600 mb-2">95%</div>
                            <div className="text-xs sm:text-sm text-slate-600 font-medium">ATS Optimized</div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-semibold text-green-600 mb-2">3</div>
                            <div className="text-xs sm:text-sm text-slate-600 font-medium leading-tight">Professional<br className="sm:hidden" /> Templates</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
