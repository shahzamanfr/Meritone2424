import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Resume } from '@/lib/resume.service';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

interface ResumeScoreCardProps {
    resume: Partial<Resume>;
}

interface ScoreCategory {
    name: string;
    score: number;
    maxScore: number;
    status: 'complete' | 'partial' | 'missing';
    suggestions: string[];
}

export const ResumeScoreCard: React.FC<ResumeScoreCardProps> = ({ resume }) => {
    const calculateCategories = (): ScoreCategory[] => {
        const categories: ScoreCategory[] = [];

        // Contact Information (20 points)
        const contactScore = [
            resume.full_name ? 5 : 0,
            resume.email ? 5 : 0,
            resume.phone ? 5 : 0,
            resume.location ? 5 : 0,
        ].reduce((a, b) => a + b, 0);
        categories.push({
            name: 'Contact Info',
            score: contactScore,
            maxScore: 20,
            status: contactScore === 20 ? 'complete' : contactScore > 0 ? 'partial' : 'missing',
            suggestions: [
                !resume.full_name && 'Add your full name',
                !resume.email && 'Add email address',
                !resume.phone && 'Add phone number',
                !resume.location && 'Add location',
            ].filter(Boolean) as string[],
        });

        // Professional Summary (15 points)
        const summaryScore = resume.summary
            ? resume.summary.length > 100
                ? 15
                : resume.summary.length > 50
                    ? 10
                    : 5
            : 0;
        categories.push({
            name: 'Summary',
            score: summaryScore,
            maxScore: 15,
            status: summaryScore === 15 ? 'complete' : summaryScore > 0 ? 'partial' : 'missing',
            suggestions: [
                !resume.summary && 'Add a professional summary',
                resume.summary && resume.summary.length < 100 && 'Expand your summary (aim for 100+ characters)',
            ].filter(Boolean) as string[],
        });

        // Experience (30 points)
        const expCount = resume.experience?.length || 0;
        const expBullets = resume.experience?.reduce((sum, exp) => sum + (exp.bullets?.length || 0), 0) || 0;
        const experienceScore = Math.min(30, expCount * 10 + Math.min(10, expBullets * 2));
        categories.push({
            name: 'Experience',
            score: experienceScore,
            maxScore: 30,
            status: experienceScore >= 25 ? 'complete' : experienceScore > 0 ? 'partial' : 'missing',
            suggestions: [
                expCount === 0 && 'Add work experience',
                expCount < 2 && 'Add more experience entries (2-3 recommended)',
                expBullets < 6 && 'Add more bullet points (3-4 per role)',
            ].filter(Boolean) as string[],
        });

        // Education (15 points)
        const eduScore = resume.education?.length
            ? resume.education.length >= 1
                ? 15
                : 10
            : 0;
        categories.push({
            name: 'Education',
            score: eduScore,
            maxScore: 15,
            status: eduScore === 15 ? 'complete' : eduScore > 0 ? 'partial' : 'missing',
            suggestions: [!resume.education?.length && 'Add education details'].filter(Boolean) as string[],
        });

        // Skills (15 points)
        const skillsCount = resume.technical_skills?.reduce((sum, s) => sum + s.items.length, 0) || 0;
        const skillsScore = Math.min(15, skillsCount * 1.5);
        categories.push({
            name: 'Skills',
            score: skillsScore,
            maxScore: 15,
            status: skillsScore >= 12 ? 'complete' : skillsScore > 0 ? 'partial' : 'missing',
            suggestions: [
                skillsCount === 0 && 'Add technical skills',
                skillsCount < 8 && 'Add more skills (aim for 8-12)',
            ].filter(Boolean) as string[],
        });

        // Additional Sections (5 points)
        const additionalScore = [
            resume.projects?.length ? 2 : 0,
            resume.certifications?.length ? 2 : 0,
            resume.links?.length ? 1 : 0,
        ].reduce((a, b) => a + b, 0);
        categories.push({
            name: 'Additional',
            score: additionalScore,
            maxScore: 5,
            status: additionalScore >= 4 ? 'complete' : additionalScore > 0 ? 'partial' : 'missing',
            suggestions: [
                !resume.projects?.length && 'Add projects to stand out',
                !resume.certifications?.length && 'Add certifications if applicable',
                !resume.links?.length && 'Add LinkedIn or portfolio links',
            ].filter(Boolean) as string[],
        });

        return categories;
    };

    const categories = calculateCategories();
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    const maxScore = categories.reduce((sum, cat) => sum + cat.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    const getScoreColor = () => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreLabel = () => {
        if (percentage >= 80) return 'Excellent';
        if (percentage >= 60) return 'Good';
        if (percentage >= 40) return 'Fair';
        return 'Needs Work';
    };

    return (
        <Card className="border-2">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                    <span>Resume Score</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getScoreColor()}`}>{percentage}%</span>
                        <span className="text-sm font-normal text-slate-500">{getScoreLabel()}</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overall Progress */}
                <div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1">
                        {totalScore} / {maxScore} points
                    </p>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-3">
                    {categories.map((cat, i) => (
                        <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {cat.status === 'complete' && <CheckCircle2 size={14} className="text-green-600" />}
                                    {cat.status === 'partial' && <AlertCircle size={14} className="text-yellow-600" />}
                                    {cat.status === 'missing' && <Circle size={14} className="text-slate-300" />}
                                    <span className="text-sm font-medium">{cat.name}</span>
                                </div>
                                <span className="text-xs text-slate-500">
                                    {cat.score}/{cat.maxScore}
                                </span>
                            </div>
                            <Progress value={(cat.score / cat.maxScore) * 100} className="h-1.5" />
                            {cat.suggestions.length > 0 && (
                                <ul className="mt-1 ml-6 space-y-0.5">
                                    {cat.suggestions.map((suggestion, si) => (
                                        <li key={si} className="text-xs text-slate-600">
                                            • {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

                {/* ATS Tips */}
                <div className="pt-3 border-t">
                    <h4 className="text-xs font-semibold text-slate-700 mb-2">ATS Optimization Tips:</h4>
                    <ul className="space-y-1 text-xs text-slate-600">
                        <li>✓ Use standard section headings</li>
                        <li>✓ Include relevant keywords from job descriptions</li>
                        <li>✓ Use bullet points for achievements</li>
                        <li>✓ Avoid images, tables, and complex formatting</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};
