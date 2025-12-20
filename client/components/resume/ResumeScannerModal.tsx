import React from 'react';
import { X } from 'lucide-react';
import { ResumeScanResult } from '@/lib/ai-resume.service';

interface ResumeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    scanResult: ResumeScanResult | null;
    onRescan?: () => void;
}

export default function ResumeScannerModal({ isOpen, onClose, scanResult, onRescan }: ResumeScannerModalProps) {
    if (!isOpen || !scanResult) return null;

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-700';
        if (score >= 70) return 'text-green-600';
        if (score >= 50) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 85) return 'bg-green-600';
        if (score >= 70) return 'bg-green-500';
        if (score >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const highPriorityIssues = scanResult.issues.filter(i => i.severity === 'high');
    const mediumPriorityIssues = scanResult.issues.filter(i => i.severity === 'medium');
    const lowPriorityIssues = scanResult.issues.filter(i => i.severity === 'low');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Resume Analysis</h2>
                        <p className="text-sm text-slate-500">ATS Compatibility Score</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Score */}
                    <div className="mb-6 pb-6 border-b border-slate-200">
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className={`text-5xl font-bold ${getScoreColor(scanResult.atsScore)}`}>
                                {scanResult.atsScore}
                            </span>
                            <span className="text-2xl text-slate-400">/100</span>
                            <span className="ml-3 text-sm font-medium text-slate-600">{scanResult.overallGrade}</span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                            <div
                                className={`h-full ${getScoreBarColor(scanResult.atsScore)} rounded-full transition-all`}
                                style={{ width: `${scanResult.atsScore}%` }}
                            />
                        </div>

                        <p className="text-sm text-slate-600">{scanResult.summary}</p>
                    </div>

                    {/* Issues */}
                    {scanResult.issues.length > 0 && (
                        <div className="mb-6 pb-6 border-b border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Issues ({scanResult.issues.length})</h3>

                            <div className="space-y-3">
                                {highPriorityIssues.map((issue, idx) => (
                                    <div key={`h-${idx}`} className="border-l-2 border-red-500 pl-3 py-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium text-red-600">High</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500">{issue.category}</span>
                                        </div>
                                        <p className="text-sm text-slate-900 font-medium">{issue.issue}</p>
                                        <p className="text-sm text-slate-600 mt-0.5">{issue.suggestion}</p>
                                    </div>
                                ))}

                                {mediumPriorityIssues.map((issue, idx) => (
                                    <div key={`m-${idx}`} className="border-l-2 border-amber-500 pl-3 py-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium text-amber-600">Medium</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500">{issue.category}</span>
                                        </div>
                                        <p className="text-sm text-slate-900 font-medium">{issue.issue}</p>
                                        <p className="text-sm text-slate-600 mt-0.5">{issue.suggestion}</p>
                                    </div>
                                ))}

                                {lowPriorityIssues.map((issue, idx) => (
                                    <div key={`l-${idx}`} className="border-l-2 border-slate-300 pl-3 py-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium text-slate-600">Low</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500">{issue.category}</span>
                                        </div>
                                        <p className="text-sm text-slate-900 font-medium">{issue.issue}</p>
                                        <p className="text-sm text-slate-600 mt-0.5">{issue.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Strengths */}
                    {scanResult.strengths.length > 0 && (
                        <div className="mb-6 pb-6 border-b border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Strengths ({scanResult.strengths.length})</h3>
                            <ul className="space-y-1.5">
                                {scanResult.strengths.map((strength, idx) => (
                                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        <span>{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Keywords */}
                    {(scanResult.keywordAnalysis.present.length > 0 || scanResult.keywordAnalysis.missing.length > 0) && (
                        <div className="mb-6 pb-6 border-b border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Keywords</h3>

                            {scanResult.keywordAnalysis.present.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-slate-600 mb-1.5">Present</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {scanResult.keywordAnalysis.present.slice(0, 10).map((keyword, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {scanResult.keywordAnalysis.missing.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-slate-600 mb-1.5">Consider Adding</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {scanResult.keywordAnalysis.missing.slice(0, 10).map((keyword, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recommendations */}
                    {scanResult.recommendations.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Recommendations</h3>
                            <ol className="space-y-2">
                                {scanResult.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex gap-2.5 text-sm text-slate-700">
                                        <span className="text-slate-400 font-medium">{idx + 1}.</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    {onRescan && (
                        <button
                            onClick={onRescan}
                            className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                            Rescan
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
