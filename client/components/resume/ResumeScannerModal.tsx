import React, { useState } from 'react';
import { X, Trophy, AlertTriangle, CheckCircle, TrendingUp, Search, ChevronRight, Activity, ArrowRight } from 'lucide-react';
import { ResumeScanResult } from '@/lib/ai-resume.service';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResumeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    scanResult: ResumeScanResult | null;
    onRescan?: () => void;
}

export default function ResumeScannerModal({ isOpen, onClose, scanResult, onRescan }: ResumeScannerModalProps) {
    if (!isOpen || !scanResult) return null;

    // Define colors and grading styles
    const getGradeStyle = (score: number) => {
        if (score >= 90) return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Elite', icon: Trophy };
        if (score >= 75) return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Strong', icon: CheckCircle };
        if (score >= 50) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Average', icon: Activity };
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Needs Imp.', icon: AlertTriangle };
    };

    const grade = getGradeStyle(scanResult.atsScore);
    const GradeIcon = grade.icon;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col font-sans">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${grade.bg}`}>
                            <GradeIcon className={`w-5 h-5 ${grade.color}`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Resume Audit Report</h2>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">AI Executive Recruiter Analysis</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-full">
                        <X size={20} />
                    </Button>
                </div>

                {/* Main Content */}
                <ScrollArea className="flex-1 bg-slate-50/50">
                    <div className="p-6 space-y-8">

                        {/* Top Score Section */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Score Card */}
                            <Card className="md:col-span-4 border-none shadow-sm ring-1 ring-slate-200 overflow-hidden relative">
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${grade.bg.replace('bg-', 'bg-gradient-to-r from-transparent via-')}`} />
                                <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center text-center">
                                    <div className="relative mb-4">
                                        <svg className="w-24 h-24 transform -rotate-90">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                strokeDasharray={2 * Math.PI * 40}
                                                strokeDashoffset={2 * Math.PI * 40 * (1 - scanResult.atsScore / 100)}
                                                className={grade.color}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className={`text-4xl font-extrabold ${grade.color}`}>{scanResult.atsScore}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Score</span>
                                        </div>
                                    </div>
                                    <h3 className={`text-lg font-bold ${grade.color} mb-2`}>{grade.label}</h3>
                                    <p className="text-sm text-slate-600 px-4 leading-relaxed">{scanResult.summary}</p>
                                </CardContent>
                            </Card>

                            {/* Key Stats / High Level */}
                            <div className="md:col-span-8 grid grid-cols-1 gap-4">
                                <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
                                    <CardHeader className="pb-3 border-b border-slate-50">
                                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <Activity size={16} className="text-blue-500" />
                                            Impact Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Strengths</div>
                                            <ul className="space-y-2">
                                                {scanResult.strengths.slice(0, 3).map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                        <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                                {scanResult.strengths.length === 0 && <li className="text-sm text-slate-400 italic">No major strengths detected yet.</li>}
                                            </ul>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Critical Fixes</div>
                                            <ul className="space-y-2">
                                                {scanResult.issues.filter(i => i.severity === 'critical' || i.severity === 'high').slice(0, 3).map((issue, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                        <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                                        <span className="line-clamp-2">{issue.issue}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
                                    <CardContent className="pt-4 pb-4 flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-slate-900 mb-1">Keywords Detected</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {scanResult.keywordAnalysis.present.slice(0, 6).map((k, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 font-normal hover:bg-slate-200">{k}</Badge>
                                                ))}
                                                {scanResult.keywordAnalysis.present.length > 6 && (
                                                    <Badge variant="outline" className="text-slate-400 border-dashed">+{scanResult.keywordAnalysis.present.length - 6}</Badge>
                                                )}
                                                {scanResult.keywordAnalysis.present.length === 0 && <span className="text-sm text-slate-400 italic">No strong keywords found.</span>}
                                            </div>
                                        </div>
                                        <div className="pl-6 border-l border-slate-100 ml-6 hidden sm:block">
                                            <div className="text-sm font-medium text-slate-900 mb-1">Missing Keywords</div>
                                            <div className="text-sm text-red-500 font-medium">
                                                {scanResult.keywordAnalysis.missing.slice(0, 3).join(', ')}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Detailed Issues */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="text-amber-500" size={20} />
                                Action Plan
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                {scanResult.issues.map((issue, idx) => (
                                    <div key={idx} className="group bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${issue.severity === 'critical' ? 'bg-red-500' :
                                                issue.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-400'
                                            }`} />

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${issue.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                            issue.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {issue.severity}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{issue.category} &bull; {issue.location}</span>
                                                </div>
                                                <h4 className="text-base font-semibold text-slate-900 mb-1">{issue.issue}</h4>
                                                <div className="flex items-start gap-2 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                                                    <ArrowRight size={14} className="text-blue-500 mt-1 shrink-0" />
                                                    <p className="text-sm text-slate-700 font-medium">{issue.suggestion}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center">
                    <p className="text-xs text-slate-400">
                        Analysis based on FAANG hiring standards.
                    </p>
                    <div className="flex gap-3">
                        {onRescan && (
                            <Button variant="outline" onClick={onRescan} className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                                Rescan
                            </Button>
                        )}
                        <Button onClick={onClose} className="bg-slate-900 text-white hover:bg-slate-800 px-8">
                            Close Report
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
