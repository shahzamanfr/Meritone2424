import { Resume } from './resume.service';

/**
 * Professional example resume with high ATS score
 * Demonstrates best practices for resume writing
 */
export const EXAMPLE_RESUME: Resume = {
    user_id: "example", // Placeholder - will be replaced with actual user ID
    full_name: "Sarah Johnson",
    headline: "Senior Full-Stack Software Engineer | React & Node.js Specialist",
    email: "sarah.johnson@email.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    links: [
        { label: "linkedin.com/in/sarahjohnson", url: "https://linkedin.com/in/sarahjohnson" },
        { label: "github.com/sarahjohnson", url: "https://github.com/sarahjohnson" },
        { label: "sarahjohnson.dev", url: "https://sarahjohnson.dev" }
    ],
    summary: "Results-driven Full-Stack Software Engineer with 6+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies. Proven track record of delivering high-impact features that increased user engagement by 45% and reduced system latency by 60%. Passionate about clean code, mentorship, and driving technical excellence.",

    experience: [
        {
            company: "TechCorp Solutions",
            role: "Senior Software Engineer",
            duration: "Jan 2021 - Present",
            bullets: [
                "Led development of microservices architecture serving 2M+ daily active users, improving system reliability from 95% to 99.9% uptime",
                "Architected and implemented real-time notification system using WebSockets and Redis, reducing message delivery latency by 60%",
                "Mentored team of 5 junior developers, resulting in 100% promotion rate within 18 months",
                "Reduced API response time by 40% through database query optimization and caching strategies"
            ]
        },
        {
            company: "StartupXYZ",
            role: "Full-Stack Developer",
            duration: "Jun 2019 - Dec 2020",
            bullets: [
                "Developed customer-facing dashboard using React and TypeScript, increasing user engagement by 45%",
                "Built RESTful APIs with Node.js and Express, handling 50K+ requests per day with 99.5% success rate",
                "Implemented CI/CD pipeline using GitHub Actions, reducing deployment time from 2 hours to 15 minutes",
                "Collaborated with product team to deliver 12 major features across 6 quarterly releases"
            ]
        },
        {
            company: "Digital Innovations Inc",
            role: "Junior Software Developer",
            duration: "Aug 2018 - May 2019",
            bullets: [
                "Developed responsive web components using React and Material-UI, improving mobile user experience by 35%",
                "Integrated third-party payment gateway (Stripe), processing $500K+ in monthly transactions",
                "Wrote comprehensive unit tests achieving 85% code coverage using Jest and React Testing Library",
                "Participated in Agile ceremonies and contributed to sprint planning and retrospectives"
            ]
        }
    ],

    projects: [
        {
            name: "E-Commerce Platform",
            description: "Full-stack e-commerce solution with real-time inventory management",
            bullets: [
                "Built using React, Node.js, PostgreSQL, and AWS (EC2, S3, RDS)",
                "Implemented secure payment processing with Stripe, handling 1000+ transactions/month",
                "Designed RESTful API with JWT authentication and role-based access control",
                "Deployed using Docker containers and AWS ECS for scalability"
            ]
        },
        {
            name: "Real-Time Analytics Dashboard",
            description: "Data visualization platform for business intelligence",
            bullets: [
                "Created interactive charts using D3.js and Chart.js with real-time data updates",
                "Integrated with multiple data sources via REST APIs and WebSocket connections",
                "Implemented server-side caching with Redis, reducing query time by 70%",
                "Built responsive UI supporting desktop, tablet, and mobile devices"
            ]
        }
    ],

    technical_skills: [
        {
            section: "Programming Languages",
            items: ["JavaScript", "TypeScript", "Python", "SQL", "HTML/CSS"]
        },
        {
            section: "Frontend Technologies",
            items: ["React", "Next.js", "Redux", "Material-UI", "Tailwind CSS", "D3.js"]
        },
        {
            section: "Backend Technologies",
            items: ["Node.js", "Express.js", "PostgreSQL", "MongoDB", "Redis", "GraphQL"]
        },
        {
            section: "DevOps & Tools",
            items: ["AWS (EC2, S3, Lambda)", "Docker", "Git", "GitHub Actions", "Jest", "Webpack"]
        },
        {
            section: "Methodologies",
            items: ["Agile/Scrum", "Test-Driven Development", "CI/CD", "Microservices", "RESTful APIs"]
        }
    ],

    education: [
        {
            school: "University of California, Berkeley",
            degree: "Bachelor of Science in Computer Science",
            duration: "2014 - 2018",
            details: "GPA: 3.8/4.0 | Dean's List: 6 semesters | Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering, Web Development"
        }
    ],

    certifications: [
        {
            name: "AWS Certified Solutions Architect - Associate",
            issuer: "Amazon Web Services",
            year: "2023"
        },
        {
            name: "Professional Scrum Master I (PSM I)",
            issuer: "Scrum.org",
            year: "2022"
        },
        {
            name: "MongoDB Certified Developer",
            issuer: "MongoDB University",
            year: "2021"
        }
    ],

    achievements: [
        "Won 'Best Innovation Award' at TechCorp Hackathon 2023 for AI-powered code review tool",
        "Improved application performance by 60%, recognized with 'Technical Excellence Award'",
        "Published technical blog post on microservices architecture, reaching 10K+ readers",
        "Mentored 8 junior developers with 100% promotion rate within 2 years",
        "Contributed to 3 open-source projects with 500+ GitHub stars combined"
    ],

    languages: [
        { language: "English", proficiency: "Native" },
        { language: "Spanish", proficiency: "Professional Working" },
        { language: "Mandarin", proficiency: "Elementary" }
    ],

    volunteer: [
        {
            organization: "Code for Good",
            role: "Volunteer Software Developer",
            duration: "2020 - Present",
            description: "Developed web applications for non-profit organizations, helping 5 charities improve their digital presence and reach 50K+ beneficiaries"
        },
        {
            organization: "Girls Who Code",
            role: "Mentor",
            duration: "2019 - 2022",
            description: "Mentored 15 high school students in web development, with 80% pursuing computer science degrees"
        }
    ]
};
