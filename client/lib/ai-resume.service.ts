import { Resume } from './resume.service';

export interface AIResumeRequest {
  full_name: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  education?: string;
  skills?: string;
  experience?: string;
  projects?: string;
  achievements?: string;
  certifications?: string;
}

export interface AIResumeResponse {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: Array<{
    school: string;
    degree?: string;
    duration?: string;
    details?: string;
  }>;
  technical_skills: Array<{
    section: string;
    items: string[];
  }>;
  experience: Array<{
    company: string;
    role?: string;
    duration?: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description?: string;
    bullets: string[];
  }>;
  achievements: string[];
  certifications: Array<{
    name: string;
    issuer?: string;
    year?: string;
  }>;
}

export async function generateResumeWithAI(input: AIResumeRequest): Promise<AIResumeResponse> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key not found. Please add your API key in settings.');
  }

  // Try API first, with retry logic
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await callGeminiAPI(apiKey, input);
    } catch (error) {
      console.log(`API attempt ${attempt} failed:`, error);

      if (attempt === 3) {
        console.log('All API attempts failed, using fallback generation');
        return generateFallbackResume(input);
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  // This should never be reached, but just in case
  return generateFallbackResume(input);
}

// Helper to improve specific text (e.g. a bullet point)
export async function generateResumeImprovement(text: string, instruction: string = "Make it more professional"): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || ""; // Groq API Key from environment

  const prompt = `
You are an expert resume writer and ATS optimization specialist.

TASK: Improve the following resume text to be more professional, impactful, and ATS-friendly.

ORIGINAL TEXT: "${text}"

INSTRUCTION: ${instruction}

GUIDELINES:
- Start with strong action verbs (Developed, Implemented, Led, Designed, etc.)
- Include specific metrics or results when possible
- Be concise but impactful (1-2 lines max)
- Use professional terminology
- Optimize for ATS keyword matching
- Make it achievement-focused

Return ONLY the improved text, no explanations or quotes.
`;


  try {
    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are an expert resume writer. Improve this text to be more professional and ATS-friendly:\n\n"${text}"\n\nReturn ONLY the improved text, no quotes or explanations.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const improvedText = data.choices?.[0]?.message?.content?.trim();

    if (!improvedText) {
      throw new Error('No response from API');
    }

    // Remove quotes if present
    return improvedText.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error improving text with Groq:', error);
    // Return a simple improved version as fallback
    if (text.length > 10) {
      return text.charAt(0).toUpperCase() + text.slice(1) + (text.endsWith('.') ? '' : '.');
    }
    return text;
  }
}

// Generate professional bullet points for work experience
export async function generateBulletPoints(role: string, company: string, description: string = ""): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";

  const prompt = `Generate 3-4 professional, ATS-optimized bullet points for this role:

Role: ${role}
Company: ${company}
${description ? `Description: ${description}` : ''}

Requirements:
- Start with strong action verbs
- Include specific achievements and metrics where possible
- Be concise (1-2 lines each)
- Focus on impact and results
- Use professional terminology
- Optimize for ATS keywords

Return ONLY the bullet points, one per line, without bullet symbols or numbers.`;

  try {
    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 300
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error('API error');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error('No response');
    }

    // Split by newlines and filter empty lines
    return text.split('\n').filter((line: string) => line.trim().length > 0).map((line: string) => line.trim().replace(/^[-•*]\s*/, ''));
  } catch (error) {
    console.error('Error generating bullet points:', error);
    return [
      `Developed and implemented key features for ${role} position`,
      `Collaborated with cross-functional teams at ${company}`,
      'Improved system performance and efficiency through optimization',
      'Delivered high-quality results within project timelines'
    ];
  }
}

async function callGeminiAPI(apiKey: string, input: AIResumeRequest): Promise<AIResumeResponse> {

  const prompt = `
You are an expert resume writer and career consultant with 15+ years of experience. Create a comprehensive, detailed, and highly professional resume that stands out to recruiters and hiring managers.

INPUT INFORMATION:
- Name: ${input.full_name}
- Headline: ${input.headline || 'Not provided'}
- Email: ${input.email || 'Not provided'}
- Phone: ${input.phone || 'Not provided'}
- Location: ${input.location || 'Not provided'}
- Summary: ${input.summary || 'Not provided'}
- Education: ${input.education || 'Not provided'}
- Skills: ${input.skills || 'Not provided'}
- Experience: ${input.experience || 'Not provided'}
- Projects: ${input.projects || 'Not provided'}
- Achievements: ${input.achievements || 'Not provided'}
- Certifications: ${input.certifications || 'Not provided'}

RESUME REQUIREMENTS:

1. **Professional Summary**: Write a compelling 2-3 sentence summary that:
   - Highlights 2-3 key strengths and technical competencies
   - Mentions years of experience (estimate if not provided)
   - Includes specific technologies/frameworks mentioned
   - Shows current career objectives

2. **Education**: Create education entries with:
   - Institution name and degree
   - Graduation year and relevant details

3. **Technical Skills**: Organize into 3-4 categories:
   - Programming Languages: List 4-6 languages
   - Frameworks & Tools: Include 4-6 modern frameworks
   - Other Skills: Database, cloud, soft skills

4. **Experience**: For each role, create 3-4 bullet points that:
   - Start with action verbs (Developed, Implemented, Led, etc.)
   - Include specific metrics where possible
   - Mention technologies used
   - Show impact and results

5. **Projects**: Create 1-2 project entries with:
   - Project name and brief description
   - 2-3 bullet points per project
   - Technologies used
   - Key results

6. **Achievements**: List 3-4 notable accomplishments including:
   - Awards and recognitions
   - Performance metrics
   - Leadership roles

7. **Certifications**: Include 2-3 relevant certifications with:
   - Certification name
   - Issuing organization
   - Completion year

CONTENT GUIDELINES:
- Make content specific but concise
- Use professional terminology
- Include realistic company names and technologies
- Use action verbs (Developed, Implemented, Led, etc.)
- Include metrics where appropriate
- Keep bullet points clear and impactful
- Ensure content is professional and ATS-friendly
- Default location should be "Hyderabad, India" if not specified

IMPORTANT: Generate professional content that's detailed but not overwhelming. Be specific about technologies and impact without being excessive. Use Hyderabad, India as the default location.

Return the response as a valid JSON object with the exact structure specified above.
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (import.meta.env.DEV) console.log('Gemini API Response:', data);

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('No generated text found:', data);
      throw new Error('No content generated from Gemini API');
    }

    if (import.meta.env.DEV) console.log('Generated text:', generatedText);

    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI. Generated text: ' + generatedText.substring(0, 200));
    }

    try {
      const parsedData = JSON.parse(jsonMatch[0]);
      if (import.meta.env.DEV) console.log('Parsed data:', parsedData);

      // Handle nested structure where resume data is inside a "resume" object
      const resumeData = parsedData.resume || parsedData;

      // Convert the nested structure to our expected format
      const convertedResume: AIResumeResponse = {
        full_name: resumeData.contact?.name || resumeData.full_name || "Your Name",
        headline: resumeData.headline || "Professional seeking opportunities",
        email: resumeData.contact?.email || resumeData.email || "",
        phone: resumeData.contact?.phone || resumeData.phone || "",
        location: resumeData.contact?.location || resumeData.location || "",
        summary: resumeData.professionalSummary || resumeData.summary || "",
        education: (resumeData.education || []).map((edu: any) => ({
          school: edu.institution || edu.school || "",
          degree: edu.degree || "",
          duration: edu.graduationDate || edu.duration || "",
          details: edu.gpa || edu.details || ""
        })),
        technical_skills: [
          {
            section: "Programming Languages",
            items: resumeData.technicalSkills?.programmingLanguages || []
          },
          {
            section: "Other Skills",
            items: resumeData.technicalSkills?.otherSkills || []
          }
        ].filter(skill => skill.items.length > 0),
        experience: (resumeData.experience || []).map((exp: any) => ({
          company: exp.company || "",
          role: exp.title || exp.role || "",
          duration: exp.dates || exp.duration || "",
          bullets: exp.responsibilities || exp.bullets || []
        })),
        projects: (resumeData.projects || []).map((proj: any) => ({
          name: proj.projectName || proj.name || "",
          description: proj.description || "",
          bullets: proj.achievements?.map((a: any) => a.achievement || a) || proj.bullets || []
        })),
        achievements: (resumeData.achievements || []).map((ach: any) =>
          ach.achievement || ach
        ),
        certifications: (resumeData.certifications || []).map((cert: any) => ({
          name: cert.name || "",
          issuer: cert.issuer || "",
          year: cert.date || cert.year || ""
        }))
      };

      if (import.meta.env.DEV) console.log('Converted resume:', convertedResume);
      return convertedResume;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw JSON:', jsonMatch[0]);
      throw new Error('Failed to parse AI response as JSON');
    }

  } catch (error) {
    console.error('AI Resume Generation Error:', error);
    throw error; // Re-throw to trigger retry logic
  }
}

function generateFallbackResume(input: AIResumeRequest): AIResumeResponse {
  if (import.meta.env.DEV) console.log('Generating detailed fallback resume...');

  const skills = input.skills ? input.skills.split(',').map(s => s.trim()).filter(Boolean) : ['Python', 'JavaScript', 'React', 'Node.js'];

  return {
    full_name: input.full_name || "Your Name",
    headline: input.headline || "Full Stack Developer & Software Engineer",
    email: input.email || "your.email@example.com",
    phone: input.phone || "(555) 123-4567",
    location: input.location || "Hyderabad, India",
    summary: input.summary || `Experienced software engineer with 3+ years in full-stack development, specializing in ${skills.slice(0, 3).join(', ')}. Proven ability to deliver scalable solutions and work effectively in team environments. Seeking opportunities to contribute technical expertise to innovative projects.`,
    education: input.education ? [
      {
        school: input.education,
        degree: "Bachelor of Science in Computer Science",
        duration: "2018 - 2022",
        details: "GPA: 3.7/4.0 | Relevant Coursework: Data Structures, Algorithms, Software Engineering, Database Systems | Dean's List: 3 semesters"
      }
    ] : [
      {
        school: "University of California, Berkeley",
        degree: "Bachelor of Science in Computer Science",
        duration: "2018 - 2022",
        details: "GPA: 3.7/4.0 | Relevant Coursework: Data Structures, Algorithms, Software Engineering, Database Systems | Dean's List: 3 semesters"
      }
    ],
    technical_skills: [
      {
        section: "Programming Languages",
        items: skills.length > 0 ? skills : ["Python", "JavaScript", "Java", "SQL"]
      },
      {
        section: "Frameworks & Tools",
        items: ["React", "Node.js", "Express.js", "Django", "Git", "Docker"]
      },
      {
        section: "Other Skills",
        items: ["AWS", "MongoDB", "PostgreSQL", "Problem Solving", "Team Collaboration"]
      }
    ],
    experience: input.experience ? [
      {
        company: "Previous Company",
        role: "Your Role",
        duration: "Year - Year",
        bullets: [
          "Led key projects and initiatives",
          "Collaborated with cross-functional teams",
          "Delivered measurable results and improvements"
        ]
      }
    ] : [
      {
        company: "TechCorp Solutions",
        role: "Software Engineer",
        duration: "2021 - Present",
        bullets: [
          "Developed scalable web applications using React and Node.js",
          "Implemented microservices architecture, improving system performance by 40%",
          "Collaborated with cross-functional teams to deliver new features",
          "Mentored junior developers and maintained code quality standards"
        ]
      },
      {
        company: "StartupXYZ",
        role: "Full Stack Developer",
        duration: "2020 - 2021",
        bullets: [
          "Built RESTful APIs using Node.js and Express",
          "Developed responsive frontend components with React",
          "Implemented automated testing with Jest",
          "Deployed applications on AWS using Docker"
        ]
      }
    ],
    projects: input.projects ? [
      {
        name: "Key Project",
        description: input.projects,
        bullets: [
          "Implemented innovative solutions",
          "Achieved project objectives on time",
          "Demonstrated technical expertise"
        ]
      }
    ] : [
      {
        name: "E-Commerce Platform",
        description: "Full-stack e-commerce solution with inventory management",
        bullets: [
          "Developed using React, Node.js, and MongoDB",
          "Implemented secure payment integration with Stripe",
          "Built real-time inventory tracking system"
        ]
      },
      {
        name: "Analytics Dashboard",
        description: "Data visualization dashboard for business intelligence",
        bullets: [
          "Created using Python and React",
          "Implemented data visualization components",
          "Integrated with multiple data sources via REST APIs"
        ]
      }
    ],
    achievements: input.achievements ? input.achievements.split('\n').filter(Boolean) : [
      "Won 'Best Innovation Award' at TechCrunch Disrupt 2023",
      "Improved application performance by 60% through optimization",
      "Mentored junior developers with 100% promotion rate",
      "Completed AWS Solutions Architect certification"
    ],
    certifications: input.certifications ? [
      {
        name: input.certifications,
        issuer: "Issuing Organization",
        year: "2024"
      }
    ] : [
      {
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        year: "2023"
      },
      {
        name: "Certified Scrum Master",
        issuer: "Scrum Alliance",
        year: "2022"
      }
    ]
  };
}

// Job Tailoring - Analyze job description and suggest resume optimizations
export async function tailorResumeToJob(resume: Partial<Resume>, jobDescription: string): Promise<{
  matchScore: number;
  keywordMatches: string[];
  missingKeywords: string[];
  skillsToHighlight: string[];
  suggestedSummary?: string;
}> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("API Key missing");

  // Extract current skills from resume
  const currentSkills = resume.technical_skills?.flatMap(s => s.items) || [];
  const currentExperience = resume.experience?.flatMap(e => e.bullets).join(' ') || '';

  const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer and career consultant.

RESUME SUMMARY:
- Skills: ${currentSkills.join(', ')}
- Experience Summary: ${currentExperience.substring(0, 500)}
- Current Summary: ${resume.summary || 'Not provided'}

JOB DESCRIPTION:
${jobDescription}

TASK: Analyze how well this resume matches the job description and provide optimization suggestions.

Return a JSON object with this EXACT structure:
{
  "matchScore": <number 0-100>,
  "keywordMatches": [<array of keywords from job that appear in resume>],
  "missingKeywords": [<array of important keywords from job NOT in resume>],
  "skillsToHighlight": [<array of resume skills that match job requirements>],
  "suggestedSummary": "<a tailored 2-3 sentence professional summary optimized for this specific job>"
}

IMPORTANT: Return ONLY valid JSON, no additional text.
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) throw new Error("AI Request Failed");

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!generatedText) throw new Error("No response from AI");

    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format");

    const result = JSON.parse(jsonMatch[0]);

    return {
      matchScore: result.matchScore || 0,
      keywordMatches: result.keywordMatches || [],
      missingKeywords: result.missingKeywords || [],
      skillsToHighlight: result.skillsToHighlight || [],
      suggestedSummary: result.suggestedSummary || undefined,
    };
  } catch (e) {
    console.error("Job tailoring failed", e);
    // Fallback: basic keyword matching
    const jobLower = jobDescription.toLowerCase();
    const matches = currentSkills.filter(skill =>
      jobLower.includes(skill.toLowerCase())
    );

    return {
      matchScore: Math.min(100, matches.length * 10),
      keywordMatches: matches,
      missingKeywords: [],
      skillsToHighlight: matches,
      suggestedSummary: undefined,
    };
  }
}

export function saveGeminiApiKey(apiKey: string): void {
  localStorage.setItem('gemini_api_key', apiKey);
}

export function getGeminiApiKey(): string | null {
  return localStorage.getItem('gemini_api_key');
}

export function removeGeminiApiKey(): void {
  localStorage.removeItem('gemini_api_key');
}

// ============================================
// AI RESUME SCANNER - Comprehensive Analysis
// ============================================

export interface ResumeScanIssue {
  category: 'ATS' | 'Content' | 'Keywords' | 'Formatting' | 'Impact';
  severity: 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
  location: string;
  details?: string;
}

export interface ResumeScanResult {
  atsScore: number;
  overallGrade: 'Excellent' | 'Good' | 'Needs Work' | 'Poor';
  strengths: string[];
  issues: ResumeScanIssue[];
  keywordAnalysis: {
    present: string[];
    missing: string[];
    suggestions: string[];
  };
  recommendations: string[];
  summary: string;
}

/**
 * Comprehensive AI-powered resume scanner
 * Analyzes entire resume and provides detailed suggestions
 */
export async function scanCompleteResume(resume: Partial<Resume>): Promise<ResumeScanResult> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || ""; // Groq API from environment

  // Build comprehensive resume text for analysis
  const resumeText = buildResumeText(resume);

  const prompt = `You are a senior ATS expert and recruiter at Fortune 500 companies. Score based on REAL ATS systems (Taleo, Workday, Greenhouse).

RESUME TO ANALYZE:
${resumeText}

INDUSTRY-STANDARD ATS SCORING (0-100):

CRITICAL (60pts):
• Contact Info (10pts): Name, phone, email, location, LinkedIn
• Keywords (25pts): Industry keywords, technical skills, certifications
• Quantified Results (15pts): Metrics (%, $, numbers), measurable impact
• Experience Quality (10pts): Clear titles, dates (MM/YYYY), no gaps >6mo

IMPORTANT (30pts):
• Summary (8pts): 2-4 sentences, 50-150 words, value proposition
• Action Verbs (7pts): Led/Developed/Implemented (not "worked on")
• Format (8pts): ATS-friendly, consistent, proper headers
• Education (7pts): Degree, school, date, certifications

BONUS (10pts):
• Extra Sections (5pts): Projects, awards, volunteer, languages
• Polish (5pts): No typos, 1-2 pages, industry-tailored

RED FLAGS (deductions):
- Missing contact: -20 | No metrics: -15 | Weak verbs: -10
- Bad format: -10 | Buzzwords: -5 | Typos: -5 each
- >2 pages: -10 | Unexplained gaps: -5

SCORE RANGES:
90-100: Excellent (Top 10%) | 80-89: Very Good (Strong)
70-79: Good (Competitive) | 60-69: Fair (Needs work)
50-59: Needs Work | <50: Poor (Won't pass ATS)

Return ONLY valid JSON:
{
  "atsScore": <0-100 based on REAL criteria above>,
  "overallGrade": "<Excellent|Good|Needs Work|Poor>",
  "strengths": ["specific strength", ...],
  "issues": [{
    "category": "<ATS|Content|Keywords|Formatting|Impact>",
    "severity": "<high|medium|low>",
    "issue": "Specific problem",
    "suggestion": "Actionable fix with example",
    "location": "Section",
    "details": "Why this matters for ATS"
  }],
  "keywordAnalysis": {
    "present": ["keyword1", ...],
    "missing": ["keyword2", ...],
    "suggestions": ["Add X to Y section", ...]
  },
  "recommendations": ["Top priority 1", ...],
  "summary": "Professional assessment based on real ATS standards"
}

Be accurate and specific. Return ONLY JSON.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "system",
          content: "You are a senior ATS expert. Score resumes using real Fortune 500 ATS standards. Be accurate and professional."
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.2,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      return generateFallbackScan(resume);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content?.trim();

    if (!resultText) {
      return generateFallbackScan(resume);
    }

    // Extract JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return generateFallbackScan(resume);
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and return
    return {
      atsScore: result.atsScore || 0,
      overallGrade: result.overallGrade || 'Needs Work',
      strengths: result.strengths || [],
      issues: result.issues || [],
      keywordAnalysis: result.keywordAnalysis || { present: [], missing: [], suggestions: [] },
      recommendations: result.recommendations || [],
      summary: result.summary || 'Analysis complete.'
    };

  } catch (error) {
    console.error('Error scanning resume:', error);
    return generateFallbackScan(resume);
  }
}

/**
 * Build comprehensive text representation of resume for AI analysis
 */
function buildResumeText(resume: Partial<Resume>): string {
  let text = '';

  // Header
  text += `NAME: ${resume.full_name || 'Not provided'}\n`;
  text += `HEADLINE: ${resume.headline || 'Not provided'}\n`;
  text += `CONTACT: ${resume.email || ''} | ${resume.phone || ''} | ${resume.location || ''}\n\n`;

  // Summary
  if (resume.summary) {
    text += `PROFESSIONAL SUMMARY:\n${resume.summary}\n\n`;
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    text += `WORK EXPERIENCE:\n`;
    resume.experience.forEach(exp => {
      text += `- ${exp.role || 'Role'} at ${exp.company || 'Company'} (${exp.duration || 'Duration'})\n`;
      exp.bullets?.forEach(bullet => {
        text += `  • ${bullet}\n`;
      });
      text += '\n';
    });
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    text += `PROJECTS:\n`;
    resume.projects.forEach(proj => {
      text += `- ${proj.name}\n`;
      if (proj.description) text += `  ${proj.description}\n`;
      proj.bullets?.forEach(bullet => {
        text += `  • ${bullet}\n`;
      });
      text += '\n';
    });
  }

  // Skills
  if (resume.technical_skills && resume.technical_skills.length > 0) {
    text += `TECHNICAL SKILLS:\n`;
    resume.technical_skills.forEach(skillSection => {
      text += `- ${skillSection.section}: ${skillSection.items.join(', ')}\n`;
    });
    text += '\n';
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    text += `EDUCATION:\n`;
    resume.education.forEach(edu => {
      text += `- ${edu.degree || 'Degree'} from ${edu.school || 'School'} (${edu.duration || 'Duration'})\n`;
      if (edu.details) text += `  ${edu.details}\n`;
    });
    text += '\n';
  }

  // Achievements
  if (resume.achievements && resume.achievements.length > 0) {
    text += `ACHIEVEMENTS:\n`;
    resume.achievements.forEach(ach => {
      text += `- ${ach}\n`;
    });
    text += '\n';
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    text += `CERTIFICATIONS:\n`;
    resume.certifications.forEach(cert => {
      text += `- ${cert.name} from ${cert.issuer || 'Issuer'} (${cert.year || 'Year'})\n`;
    });
  }

  return text;
}

/**
 * Fallback scan when AI fails - provides basic analysis
 */
function generateFallbackScan(resume: Partial<Resume>): ResumeScanResult {
  const issues: ResumeScanIssue[] = [];
  const strengths: string[] = [];
  let score = 50; // Base score

  // Check contact info
  if (resume.full_name) score += 5;
  if (resume.email) score += 5;
  if (resume.phone) score += 5;
  if (resume.location) score += 5;

  // Check summary
  if (resume.summary && resume.summary.length > 50) {
    score += 10;
    strengths.push('Professional summary is present');
  } else {
    issues.push({
      category: 'Content',
      severity: 'high',
      issue: 'Missing or weak professional summary',
      suggestion: 'Add a compelling 2-3 sentence summary highlighting your key strengths',
      location: 'Summary'
    });
  }

  // Check experience
  if (resume.experience && resume.experience.length > 0) {
    score += 10;
    strengths.push(`${resume.experience.length} work experience entries`);

    // Check for quantification
    const hasMetrics = resume.experience.some(exp =>
      exp.bullets?.some(bullet => /\d+%|\$\d+|\d+ (users|customers|projects)/.test(bullet))
    );

    if (hasMetrics) {
      score += 10;
      strengths.push('Quantified achievements present');
    } else {
      issues.push({
        category: 'Impact',
        severity: 'high',
        issue: 'Missing quantified achievements',
        suggestion: 'Add specific metrics, percentages, or numbers to show impact (e.g., "Improved performance by 40%")',
        location: 'Experience'
      });
    }
  }

  // Check skills
  if (resume.technical_skills && resume.technical_skills.length > 0) {
    score += 10;
    const totalSkills = resume.technical_skills.reduce((sum, s) => sum + s.items.length, 0);
    strengths.push(`${totalSkills} technical skills listed`);
  } else {
    issues.push({
      category: 'Keywords',
      severity: 'high',
      issue: 'No technical skills section',
      suggestion: 'Add a technical skills section with relevant technologies and tools',
      location: 'Skills'
    });
  }

  // Determine grade
  let grade: 'Excellent' | 'Good' | 'Needs Work' | 'Poor';
  if (score >= 85) grade = 'Excellent';
  else if (score >= 70) grade = 'Good';
  else if (score >= 50) grade = 'Needs Work';
  else grade = 'Poor';

  return {
    atsScore: Math.min(100, score),
    overallGrade: grade,
    strengths,
    issues,
    keywordAnalysis: {
      present: resume.technical_skills?.flatMap(s => s.items) || [],
      missing: ['Add industry-specific keywords', 'Include modern technologies'],
      suggestions: ['Review job descriptions in your field for common keywords']
    },
    recommendations: [
      'Add quantified achievements with specific metrics',
      'Use strong action verbs (Developed, Implemented, Led)',
      'Ensure all sections are complete and detailed',
      'Tailor resume to specific job descriptions'
    ],
    summary: `Your resume scores ${score}/100. ${issues.length > 0 ? 'Focus on addressing the high-priority issues first.' : 'Great job! Minor improvements will make it even stronger.'}`
  };
}
