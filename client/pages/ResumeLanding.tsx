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

            <div className="container mx-auto px-4 py-16 max-w-5xl">

                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4 tracking-tight">
                        Build Your Resume, Find Skill Trades
                    </h1>
                    <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-10">
                        Create your professional resume and let AI match you with relevant skill trading opportunities
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            size="lg"
                            onClick={() => navigate("/resume/edit")}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={loading}
                        >
                            <FileText className="mr-2" size={18} />
                            Create Your Resume
                            <ArrowRight className="ml-2" size={18} />
                        </Button>
                    </div>
                </div>

                {/* Template Selection */}
                <div className="mb-16">
                    <h2 className="text-xl font-semibold text-slate-900 mb-8 text-center tracking-tight">
                        Choose Your Template
                    </h2>

                    <div className="grid md:grid-cols-3 gap-5">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateSelect(template.id)}
                                className="group relative bg-white border border-slate-200 rounded-lg p-6 text-left hover:border-green-500 hover:shadow-md transition-all"
                            >
                                <div className="mb-4">
                                    <div className="text-xs font-medium text-green-600 mb-2">
                                        {template.score} ATS Score
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
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
                <div className="border-t border-slate-200 pt-10">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-3xl font-semibold text-green-600 mb-2">AI</div>
                            <div className="text-sm text-slate-600 font-medium">Smart Trade Matching</div>
                        </div>
                        <div>
                            <div className="text-3xl font-semibold text-green-600 mb-2">95%</div>
                            <div className="text-sm text-slate-600 font-medium">ATS Optimized</div>
                        </div>
                        <div>
                            <div className="text-3xl font-semibold text-green-600 mb-2">3</div>
                            <div className="text-sm text-slate-600 font-medium">Professional Templates</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
