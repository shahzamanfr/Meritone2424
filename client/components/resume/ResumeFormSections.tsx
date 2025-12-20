import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { ResumeExperience, ResumeEducation, ResumeSkillSection, ResumeLanguage, ResumeVolunteer, ResumeProject } from "@/lib/resume.service";
import { generateBulletPoints } from "@/lib/ai-resume.service";
import React, { useState } from "react";

// --- Experience Section ---
interface ExperienceSectionProps {
    items: ResumeExperience[];
    onChange: (items: ResumeExperience[]) => void;
    onAiImprove?: (text: string, path: string) => Promise<string>;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ items, onChange, onAiImprove }) => {
    const [generatingBullets, setGeneratingBullets] = useState<number | null>(null);

    const addItem = () => onChange([...items, { company: '', role: '', duration: '', bullets: [''] }]);
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof ResumeExperience, value: any) => {
        const updated = [...items];
        updated[i] = { ...updated[i], [field]: value };
        onChange(updated);
    };

    const addBullet = (i: number) => {
        const updated = [...items];
        updated[i].bullets.push('');
        onChange(updated);
    };

    const removeBullet = (i: number, bi: number) => {
        const updated = [...items];
        updated[i].bullets = updated[i].bullets.filter((_, idx) => idx !== bi);
        onChange(updated);
    };

    const updateBullet = (i: number, bi: number, value: string) => {
        const updated = [...items];
        updated[i].bullets[bi] = value;
        onChange(updated);
    };

    const handleGenerateBullets = async (i: number) => {
        const item = items[i];
        if (!item.role || !item.company) {
            alert('Please fill in the role and company first');
            return;
        }

        setGeneratingBullets(i);
        try {
            const bullets = await generateBulletPoints(item.role, item.company);
            const updated = [...items];
            updated[i].bullets = bullets;
            onChange(updated);
        } catch (error) {
            console.error('Error generating bullets:', error);
            alert('Failed to generate bullet points. Please try again.');
        } finally {
            setGeneratingBullets(null);
        }
    };

    return (
        <div className="space-y-4">
            {items.map((item, i) => (
                <Card key={i} className="p-4 bg-slate-50">
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                <Input placeholder="Company" value={item.company} onChange={e => updateItem(i, 'company', e.target.value)} />
                                <Input placeholder="Role" value={item.role || ''} onChange={e => updateItem(i, 'role', e.target.value)} />
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="ml-2 text-red-500">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                        <Input placeholder="Duration (e.g., Jan 2020 - Present)" value={item.duration || ''} onChange={e => updateItem(i, 'duration', e.target.value)} />

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-xs">Achievements & Responsibilities</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateBullets(i)}
                                    disabled={generatingBullets === i || !item.role || !item.company}
                                    className="text-xs h-7"
                                >
                                    {generatingBullets === i ? (
                                        <>
                                            <Sparkles size={12} className="mr-1 animate-pulse" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={12} className="mr-1" />
                                            AI Generate
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {item.bullets.map((bullet, bi) => (
                                    <div key={bi} className="flex gap-2">
                                        <Textarea
                                            rows={2}
                                            value={bullet}
                                            onChange={(e) => updateBullet(i, bi, e.target.value)}
                                            className="flex-1 min-h-[60px]"
                                            placeholder="Describe your achievement..."
                                        />
                                        <div className="flex flex-col gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeBullet(i, bi)}
                                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                                                title="Remove bullet"
                                            >
                                                <Trash2 size={12} />
                                            </Button>
                                            {onAiImprove && bullet.trim() && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () => {
                                                        const improved = await onAiImprove(bullet, `exp-${i}-bull-${bi}`);
                                                        if (improved && improved !== bullet) {
                                                            updateBullet(i, bi, improved);
                                                        }
                                                    }}
                                                    className="h-7 w-7 p-0 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                    title="Improve with AI"
                                                >
                                                    <Sparkles size={12} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={() => addBullet(i)} className="text-xs">
                                    <Plus size={12} className="mr-1" /> Add Bullet
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
            <Button onClick={addItem} variant="outline" className="w-full border-dashed">
                <Plus size={14} className="mr-2" /> Add Experience
            </Button>
        </div>
    );
};

// --- Education Section ---
interface EducationSectionProps {
    items: ResumeEducation[];
    onChange: (items: ResumeEducation[]) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ items, onChange }) => {
    const addItem = () => onChange([...items, { school: '', degree: '', duration: '', details: '' }]);
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof ResumeEducation, value: string) => {
        const updated = [...items];
        updated[i] = { ...updated[i], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {items.map((item, i) => (
                <Card key={i} className="p-4 bg-slate-50">
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                <Input placeholder="School/University" value={item.school} onChange={e => updateItem(i, 'school', e.target.value)} />
                                <Input placeholder="Degree" value={item.degree || ''} onChange={e => updateItem(i, 'degree', e.target.value)} />
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="ml-2 text-red-500">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                        <Input placeholder="Duration (e.g., 2018 - 2022)" value={item.duration || ''} onChange={e => updateItem(i, 'duration', e.target.value)} />
                        <Input placeholder="Details (e.g., GPA: 3.8/4.0)" value={item.details || ''} onChange={e => updateItem(i, 'details', e.target.value)} />
                    </div>
                </Card>
            ))}
            <Button onClick={addItem} variant="outline" className="w-full border-dashed">
                <Plus size={14} className="mr-2" /> Add Education
            </Button>
        </div>
    );
};

// --- Projects Section ---
interface ProjectsSectionProps {
    items: ResumeProject[];
    onChange: (items: ResumeProject[]) => void;
    onAiImprove?: (text: string, path: string) => Promise<string>;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ items, onChange, onAiImprove }) => {
    const addItem = () => onChange([...items, { name: '', description: '', bullets: [''] }]);
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof ResumeProject, value: any) => {
        const updated = [...items];
        updated[i] = { ...updated[i], [field]: value };
        onChange(updated);
    };

    const addBullet = (i: number) => {
        const updated = [...items];
        updated[i].bullets.push('');
        onChange(updated);
    };

    const removeBullet = (i: number, bi: number) => {
        const updated = [...items];
        updated[i].bullets = updated[i].bullets.filter((_, idx) => idx !== bi);
        onChange(updated);
    };

    const updateBullet = (i: number, bi: number, value: string) => {
        const updated = [...items];
        updated[i].bullets[bi] = value;
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {items.map((item, i) => (
                <Card key={i} className="p-4 bg-slate-50">
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <Input
                                placeholder="Project Name"
                                value={item.name}
                                onChange={e => updateItem(i, 'name', e.target.value)}
                                className="flex-1"
                            />
                            <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="ml-2 text-red-500">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                        <Textarea
                            rows={2}
                            placeholder="Brief project description (optional)"
                            value={item.description || ''}
                            onChange={e => updateItem(i, 'description', e.target.value)}
                        />

                        <div>
                            <Label className="text-xs">Key Features & Achievements</Label>
                            <div className="space-y-2 mt-2">
                                {item.bullets.map((bullet, bi) => (
                                    <div key={bi} className="flex gap-2">
                                        <Textarea
                                            rows={2}
                                            value={bullet}
                                            onChange={(e) => updateBullet(i, bi, e.target.value)}
                                            className="flex-1 min-h-[60px]"
                                            placeholder="Describe a key feature or achievement..."
                                        />
                                        <div className="flex flex-col gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeBullet(i, bi)}
                                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                                                title="Remove bullet"
                                            >
                                                <Trash2 size={12} />
                                            </Button>
                                            {onAiImprove && bullet.trim() && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () => {
                                                        const improved = await onAiImprove(bullet, `proj-${i}-bull-${bi}`);
                                                        if (improved && improved !== bullet) {
                                                            updateBullet(i, bi, improved);
                                                        }
                                                    }}
                                                    className="h-7 w-7 p-0 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                    title="Improve with AI"
                                                >
                                                    <Sparkles size={12} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={() => addBullet(i)} className="text-xs">
                                    <Plus size={12} className="mr-1" /> Add Bullet
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
            <Button onClick={addItem} variant="outline" className="w-full border-dashed">
                <Plus size={14} className="mr-2" /> Add Project
            </Button>
        </div>
    );
};


// --- Skills Section ---
interface SkillsSectionProps {
    items: ResumeSkillSection[];
    onChange: (items: ResumeSkillSection[]) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ items, onChange }) => {
    const add = () => onChange([...items, { section: '', items: [] }]);
    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const update = (i: number, section: string, itemsStr: string) => {
        const updated = [...items];
        updated[i] = { section, items: itemsStr.split(',').map(s => s.trim()).filter(Boolean) };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {items.map((item, i) => (
                <Card key={i} className="p-4 bg-slate-50">
                    <CardContent className="p-0 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                            <Input
                                placeholder="Category (e.g., Programming Languages)"
                                value={item.section}
                                onChange={(e) => update(i, e.target.value, item.items.join(', '))}
                                className="flex-1"
                            />
                            <Button variant="ghost" size="sm" onClick={() => remove(i)} className="text-red-500">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                        <div>
                            <Label>Skills (comma separated)</Label>
                            <Textarea
                                value={item.items.join(', ')}
                                onChange={(e) => update(i, item.section, e.target.value)}
                                placeholder="Python, JavaScript, TypeScript..."
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button onClick={add} variant="outline" className="w-full border-dashed">
                <Plus size={14} className="mr-2" /> Add Skill Category
            </Button>
        </div>
    );
};

// --- Languages Section (NEW for ATS) ---
interface LanguagesSectionProps {
    items: ResumeLanguage[];
    onChange: (items: ResumeLanguage[]) => void;
}

export const LanguagesSection: React.FC<LanguagesSectionProps> = ({ items, onChange }) => {
    const addItem = () => onChange([...items, { language: '', proficiency: 'Professional' }]);
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: 'language' | 'proficiency', value: string) => {
        const updated = [...items];
        updated[i][field] = value;
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                    <Input
                        placeholder="Language (e.g., Spanish)"
                        value={item.language}
                        onChange={(e) => updateItem(i, 'language', e.target.value)}
                        className="flex-1"
                    />
                    <select
                        value={item.proficiency}
                        onChange={(e) => updateItem(i, 'proficiency', e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm bg-white"
                    >
                        <option value="Native">Native</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Professional">Professional</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Basic">Basic</option>
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="text-red-500">
                        <Trash2 size={14} />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem} className="w-full border-dashed">
                <Plus size={14} className="mr-2" /> Add Language
            </Button>
        </div>
    );
};

// --- Volunteer Section (NEW for ATS) ---
interface VolunteerSectionProps {
    items: ResumeVolunteer[];
    onChange: (items: ResumeVolunteer[]) => void;
}

export const VolunteerSection: React.FC<VolunteerSectionProps> = ({ items, onChange }) => {
    const addItem = () => onChange([...items, { organization: '', role: '', duration: '', description: '' }]);
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof ResumeVolunteer, value: string) => {
        const updated = [...items];
        updated[i] = { ...updated[i], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {items.map((item, i) => (
                <Card key={i} className="p-4 bg-slate-50">
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                <Input
                                    placeholder="Organization"
                                    value={item.organization}
                                    onChange={(e) => updateItem(i, 'organization', e.target.value)}
                                />
                                <Input
                                    placeholder="Role (e.g., Volunteer Coordinator)"
                                    value={item.role || ''}
                                    onChange={(e) => updateItem(i, 'role', e.target.value)}
                                />
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="ml-2 text-red-500">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                        <Input
                            placeholder="Duration (e.g., Jan 2020 - Present)"
                            value={item.duration || ''}
                            onChange={(e) => updateItem(i, 'duration', e.target.value)}
                        />
                        <Textarea
                            rows={2}
                            placeholder="Brief description of your volunteer work..."
                            value={item.description || ''}
                            onChange={(e) => updateItem(i, 'description', e.target.value)}
                        />
                    </div>
                </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addItem} className="w-full border-dashed">
                <Plus size={14} className="mr-2" /> Add Volunteer Experience
            </Button>
        </div>
    );
};
