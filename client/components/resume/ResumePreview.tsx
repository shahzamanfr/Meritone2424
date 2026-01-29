import React, { forwardRef, memo } from 'react';
import { Resume } from '@/lib/resume.service';
import { cn } from '@/lib/utils';
import { MapPin, Phone, Mail, Link2, Briefcase, GraduationCap, Trophy, Award, FolderGit2, Cpu } from 'lucide-react';

export type ResumeTemplate = 'modern' | 'classic' | 'creative';

interface ResumePreviewProps {
    resume: Partial<Resume>;
    template: ResumeTemplate;
    fontScale?: number;
    accentColor?: string;
}

const ResumePreviewComponent = forwardRef<HTMLDivElement, ResumePreviewProps>(({ resume, template, fontScale = 1, accentColor = '#4f46e5' }, ref) => {
    const {
        full_name, headline, email, phone, location, links,
        summary, experience, education, technical_skills,
        projects, achievements, certifications, languages, volunteer
    } = resume;

    const commonStyles = {
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'white',
        color: '#1a1a1a',
        boxSizing: 'border-box' as const,
        position: 'relative' as const,
        zIndex: 1,
    };

    // Print-specific class for consistent sizing
    const printClass = "print:w-[8.5in] print:min-h-[11in] print:m-0 print:p-[0.5in] print:shadow-none";

    // ATS Classic Template - MAXIMUM ATS COMPATIBILITY (95+ Score)
    if (template === 'classic') {
        return (
            <div
                ref={ref}
                className={`${printClass} bg-white shadow-lg`}
                style={{ ...commonStyles, fontSize: `${0.85 * fontScale}rem`, padding: '0.5in', minHeight: '11in', maxWidth: '850px' }}
            >
                {/* Header - Name and Contact */}
                <div className="mb-4">
                    <h1 className="font-bold mb-2" style={{ fontSize: '20pt', letterSpacing: '0.3px' }}>
                        {full_name?.toUpperCase() || "YOUR NAME"}
                    </h1>
                    {headline && <div className="italic mb-1" style={{ fontSize: '11.5pt' }}>{headline}</div>}
                    <div style={{ fontSize: '10.5pt' }}>
                        {email}{phone && ` | ${phone}`}{location && ` | ${location}`}
                        {links?.map((l, i) => ` | ${l.label}`).join('')}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Professional Summary */}
                    {summary && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                PROFESSIONAL SUMMARY
                            </h2>
                            <p style={{ fontSize: '11pt', textAlign: 'left' }}>{summary}</p>
                        </section>
                    )}

                    {/* Professional Experience */}
                    {experience && experience.length > 0 && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                PROFESSIONAL EXPERIENCE
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10pt' }}>
                                {experience.map((exp, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2pt' }}>
                                            <span className="font-bold" style={{ fontSize: '11pt' }}>{exp.company}</span>
                                            <span style={{ fontSize: '10.5pt' }}>{exp.duration}</span>
                                        </div>
                                        <div className="italic" style={{ fontSize: '11pt', marginBottom: '4pt' }}>{exp.role}</div>
                                        <ul style={{ marginLeft: '20pt', paddingLeft: '0', fontSize: '11pt', display: 'flex', flexDirection: 'column', gap: '3pt' }}>
                                            {exp.bullets?.slice(0, 4).map((b, bi) => <li key={bi}>{b}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Projects */}
                    {projects && projects.length > 0 && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                PROJECTS
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
                                {projects.map((proj, i) => (
                                    <div key={i}>
                                        <div className="font-bold" style={{ fontSize: '11pt', marginBottom: '2pt' }}>{proj.name}</div>
                                        {proj.description && <p style={{ fontSize: '10.5pt', marginBottom: '4pt', color: '#333' }}>{proj.description}</p>}
                                        <ul style={{ marginLeft: '20pt', paddingLeft: '0', fontSize: '11pt', display: 'flex', flexDirection: 'column', gap: '3pt' }}>
                                            {proj.bullets?.slice(0, 3).map((b, bi) => <li key={bi}>{b}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Technical Skills */}
                    {technical_skills && technical_skills.length > 0 && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                TECHNICAL SKILLS
                            </h2>
                            <div style={{ fontSize: '11pt', display: 'flex', flexDirection: 'column', gap: '3pt' }}>
                                {technical_skills.map((s, i) => (
                                    <div key={i}>
                                        <span className="font-bold">{s.section}:</span> {s.items.join(', ')}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {education && education.length > 0 && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                EDUCATION
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
                                {education.map((edu, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11pt' }}>
                                            <span className="font-bold">{edu.school}</span>
                                            <span style={{ fontSize: '10.5pt' }}>{edu.duration}</span>
                                        </div>
                                        <div style={{ fontSize: '11pt' }}>{edu.degree}</div>
                                        {edu.details && <div style={{ fontSize: '10.5pt', color: '#333' }}>{edu.details}</div>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Certifications */}
                    {certifications && certifications.length > 0 && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                CERTIFICATIONS
                            </h2>
                            <ul style={{ marginLeft: '20pt', paddingLeft: '0', fontSize: '11pt', display: 'flex', flexDirection: 'column', gap: '2pt' }}>
                                {certifications.map((c, i) => (
                                    <li key={i}>{c.name} - {c.issuer} ({c.year})</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Achievements */}
                    {achievements && achievements.length > 0 && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                ACHIEVEMENTS
                            </h2>
                            <ul style={{ marginLeft: '20pt', paddingLeft: '0', fontSize: '11pt', display: 'flex', flexDirection: 'column', gap: '2pt' }}>
                                {achievements.map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                        </section>
                    )}

                    {/* Languages */}
                    {languages && languages.length > 0 && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                LANGUAGES
                            </h2>
                            <div style={{ fontSize: '11pt', display: 'flex', flexDirection: 'column', gap: '3pt' }}>
                                {languages.map((lang, i) => (
                                    <div key={i}>
                                        <span className="font-bold">{lang.language}:</span> {lang.proficiency}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Volunteer */}
                    {volunteer && volunteer.length > 0 && (
                        <section>
                            <h2 className="font-bold uppercase mb-1.5" style={{ fontSize: '13.5pt', borderBottom: '1.5pt solid black', paddingBottom: '2pt' }}>
                                VOLUNTEER EXPERIENCE
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
                                {volunteer.map((vol, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2pt' }}>
                                            <span className="font-bold" style={{ fontSize: '11pt' }}>{vol.organization}</span>
                                            <span style={{ fontSize: '10.5pt' }}>{vol.duration}</span>
                                        </div>
                                        {vol.role && <div className="italic" style={{ fontSize: '11pt', marginBottom: '2pt' }}>{vol.role}</div>}
                                        {vol.description && <p style={{ fontSize: '10.5pt', color: '#333' }}>{vol.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        );
    }

    // Modern Professional Template - Enhanced Design
    if (template === 'modern') {
        return (
            <div
                ref={ref}
                className={`${printClass} bg-white shadow-lg text-slate-900`}
                style={{ ...commonStyles, fontSize: `${0.9 * fontScale}rem`, minHeight: '11in', maxWidth: '850px' }}
            >
                {/* Header with Accent */}
                <div className="px-10 py-8 text-white relative overflow-hidden" style={{ backgroundColor: accentColor }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight mb-1">{full_name || "Your Name"}</h1>
                        <p className="text-lg opacity-95 font-medium mb-3">{headline || "Professional Title"}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-90">
                            {email && <span className="flex items-center gap-1.5"><Mail size={14} />{email}</span>}
                            {phone && <span className="flex items-center gap-1.5"><Phone size={14} />{phone}</span>}
                            {location && <span className="flex items-center gap-1.5"><MapPin size={14} />{location}</span>}
                            {links?.map((l, i) => (
                                <a key={i} href={l.url} className="flex items-center gap-1.5 hover:underline"><Link2 size={14} />{l.label}</a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-[2fr_1fr] gap-8 p-10">
                    {/* Main Column */}
                    <div className="space-y-6">
                        {/* Summary */}
                        {summary && (
                            <section>
                                <h3 className="text-base font-bold uppercase tracking-wide mb-2 pb-1.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Professional Summary</h3>
                                <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
                            </section>
                        )}

                        {/* Experience */}
                        {experience && experience.length > 0 && (
                            <section>
                                <h3 className="text-base font-bold uppercase tracking-wide mb-3 pb-1.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Experience</h3>
                                <div className="space-y-4">
                                    {experience.map((exp, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="font-bold text-slate-900">{exp.role}</h4>
                                                <span className="text-xs font-medium text-slate-500">{exp.duration}</span>
                                            </div>
                                            <div className="text-sm font-semibold mb-2" style={{ color: accentColor }}>{exp.company}</div>
                                            <ul className="list-disc ml-4 space-y-1 text-sm text-slate-600">
                                                {exp.bullets?.map((b, bi) => <li key={bi}>{b}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Projects */}
                        {projects && projects.length > 0 && (
                            <section>
                                <h3 className="text-base font-bold uppercase tracking-wide mb-3 pb-1.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Projects</h3>
                                <div className="space-y-3">
                                    {projects.map((proj, i) => (
                                        <div key={i}>
                                            <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                                            {proj.description && <p className="text-sm text-slate-600 mb-1">{proj.description}</p>}
                                            <ul className="list-disc ml-4 space-y-0.5 text-sm text-slate-600">
                                                {proj.bullets?.map((b, bi) => <li key={bi}>{b}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        {/* Skills */}
                        {technical_skills && technical_skills.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Skills</h3>
                                <div className="space-y-3">
                                    {technical_skills.map((s, i) => (
                                        <div key={i}>
                                            <div className="text-xs font-bold text-slate-800 mb-1.5">{s.section}</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {s.items.map((item, ii) => (
                                                    <span key={ii} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Education */}
                        {education && education.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Education</h3>
                                <div className="space-y-3">
                                    {education.map((edu, i) => (
                                        <div key={i}>
                                            <div className="font-bold text-sm text-slate-900">{edu.school}</div>
                                            <div className="text-sm text-slate-700 mt-0.5">{edu.degree}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{edu.duration}</div>
                                            {edu.details && <div className="text-xs text-slate-600 mt-0.5">{edu.details}</div>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Certifications */}
                        {(certifications?.length || achievements?.length) ? (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Awards</h3>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    {certifications?.map((c, i) => (
                                        <li key={i}>
                                            <div className="font-semibold">{c.name}</div>
                                            <div className="text-xs text-slate-500">{c.issuer} • {c.year}</div>
                                        </li>
                                    ))}
                                    {achievements?.slice(0, 3).map((a, i) => <li key={`a-${i}`} className="text-sm">• {a}</li>)}
                                </ul>
                            </section>
                        ) : null}

                        {/* Languages */}
                        {languages && languages.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Languages</h3>
                                <div className="space-y-1.5 text-sm">
                                    {languages.map((lang, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span className="font-medium">{lang.language}</span>
                                            <span className="text-slate-500">{lang.proficiency}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Volunteer */}
                        {volunteer && volunteer.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Volunteer</h3>
                                <div className="space-y-2 text-sm">
                                    {volunteer.map((vol, i) => (
                                        <div key={i}>
                                            <div className="font-semibold">{vol.organization}</div>
                                            {vol.role && <div className="text-xs text-slate-600">{vol.role}</div>}
                                            {vol.duration && <div className="text-xs text-slate-500">{vol.duration}</div>}
                                            {vol.description && <div className="text-xs text-slate-600 mt-0.5">{vol.description}</div>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Creative Template - Professional with Personality
    if (template === 'creative') {
        return (
            <div
                ref={ref}
                className={`${printClass} bg-white shadow-lg text-slate-900`}
                style={{ ...commonStyles, fontSize: `${0.88 * fontScale}rem`, minHeight: '11in', maxWidth: '850px' }}
            >
                <div className="grid grid-cols-[260px_1fr]">
                    {/* Left Sidebar - Accent Color */}
                    <div className="text-white p-7 space-y-6" style={{ background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}>
                        {/* Profile */}
                        <div className="pb-4 border-b border-white/20">
                            <h1 className="text-xl font-bold mb-1 leading-tight">{full_name || "Your Name"}</h1>
                            <p className="text-sm opacity-90">{headline || "Professional"}</p>
                        </div>

                        {/* Contact */}
                        <div className="space-y-2.5 text-xs">
                            {email && <div className="flex items-start gap-2"><Mail size={13} className="mt-0.5 flex-shrink-0 opacity-80" /><span className="break-all">{email}</span></div>}
                            {phone && <div className="flex items-start gap-2"><Phone size={13} className="mt-0.5 flex-shrink-0 opacity-80" /><span>{phone}</span></div>}
                            {location && <div className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 flex-shrink-0 opacity-80" /><span>{location}</span></div>}
                            {links?.map((l, i) => (
                                <a key={i} href={l.url} className="flex items-start gap-2 hover:opacity-100 opacity-90"><Link2 size={13} className="mt-0.5 flex-shrink-0" /><span className="break-all underline">{l.label}</span></a>
                            ))}
                        </div>

                        {/* Skills */}
                        {technical_skills && technical_skills.length > 0 && (
                            <section className="pt-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b border-white/20">Skills</h3>
                                <div className="space-y-3">
                                    {technical_skills.map((s, i) => (
                                        <div key={i}>
                                            <div className="text-xs font-bold mb-1.5 opacity-95">{s.section}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {s.items.map((item, ii) => (
                                                    <span key={ii} className="text-xs px-1.5 py-0.5 bg-white/20 rounded backdrop-blur-sm">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Education */}
                        {education && education.length > 0 && (
                            <section className="pt-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b border-white/20">Education</h3>
                                <div className="space-y-3">
                                    {education.map((edu, i) => (
                                        <div key={i}>
                                            <div className="font-bold text-xs leading-tight">{edu.school}</div>
                                            <div className="text-xs opacity-90 mt-1">{edu.degree}</div>
                                            <div className="text-xs opacity-75 mt-0.5">{edu.duration}</div>
                                            {edu.details && <div className="text-xs opacity-70 mt-0.5">{edu.details}</div>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Certifications */}
                        {(certifications?.length || achievements?.length) ? (
                            <section className="pt-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b border-white/20">Certifications</h3>
                                <div className="space-y-2 text-xs">
                                    {certifications?.map((c, i) => (
                                        <div key={i}>
                                            <div className="font-semibold">{c.name}</div>
                                            <div className="text-xs opacity-75">{c.issuer}, {c.year}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {/* Languages */}
                        {languages && languages.length > 0 && (
                            <section className="pt-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b border-white/20">Languages</h3>
                                <div className="space-y-1.5 text-xs">
                                    {languages.map((lang, i) => (
                                        <div key={i}>
                                            <span className="font-semibold">{lang.language}</span>
                                            <span className="opacity-75"> - {lang.proficiency}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="p-8 space-y-6">
                        {/* Summary */}
                        {summary && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Profile</h3>
                                <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
                            </section>
                        )}

                        {/* Experience */}
                        {experience && experience.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wide mb-3 pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Experience</h3>
                                <div className="space-y-4">
                                    {experience.map((exp, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="font-bold text-slate-900">{exp.role}</h4>
                                                <span className="text-xs font-medium text-slate-500">{exp.duration}</span>
                                            </div>
                                            <div className="text-sm font-semibold mb-1.5" style={{ color: accentColor }}>{exp.company}</div>
                                            <ul className="list-disc ml-4 space-y-0.5 text-sm text-slate-600">
                                                {exp.bullets?.map((b, bi) => <li key={bi}>{b}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Projects */}
                        {projects && projects.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wide mb-3 pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Projects</h3>
                                <div className="space-y-3">
                                    {projects.map((proj, i) => (
                                        <div key={i}>
                                            <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                                            {proj.description && <p className="text-sm text-slate-600 mb-1">{proj.description}</p>}
                                            <ul className="list-disc ml-4 space-y-0.5 text-sm text-slate-600">
                                                {proj.bullets?.map((b, bi) => <li key={bi}>{b}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Achievements */}
                        {achievements && achievements.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Achievements</h3>
                                <ul className="list-disc ml-4 space-y-1 text-sm text-slate-700">
                                    {achievements.map((a, i) => <li key={i}>{a}</li>)}
                                </ul>
                            </section>
                        )}

                        {/* Volunteer */}
                        {volunteer && volunteer.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wide mb-3 pb-1 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>Volunteer Experience</h3>
                                <div className="space-y-3">
                                    {volunteer.map((vol, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="font-bold text-slate-900 text-sm">{vol.organization}</h4>
                                                <span className="text-xs font-medium text-slate-500">{vol.duration}</span>
                                            </div>
                                            {vol.role && <div className="text-sm font-semibold mb-1" style={{ color: accentColor }}>{vol.role}</div>}
                                            {vol.description && <p className="text-sm text-slate-600">{vol.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Fallback (shouldn't reach here)
    return <div ref={ref} className="bg-white min-h-[1123px] w-full max-w-[850px] mx-auto p-10">Select a template</div>;
});

ResumePreviewComponent.displayName = "ResumePreview";

// Export memoized version to prevent unnecessary re-renders
export const ResumePreview = memo(ResumePreviewComponent);
