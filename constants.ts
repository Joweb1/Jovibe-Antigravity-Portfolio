import { Project, NavLink, Service, ProcessStep, Testimonial } from './types';
import { IMAGES } from './assets/images';

// Re-exporting for backward compatibility if needed, though direct usage is preferred
export const PROFILE_IMAGE = IMAGES.profile;

export const HOME_PROJECTS: Project[] = [
  {
    id: '01',
    title: 'Jovibe',
    category: 'Creative AI Ecosystem',
    image: IMAGES.projects.jovibe,
    year: '2025',
    status: 'Live',
    isComingSoon: false,
    description: 'A modern SPA designed to empower users in content creation through Google Gemini integration. Features real-time visual feedback and intelligent "vibe" suggestions.',
    features: ['VibePanel AI Assistant', 'Real-time Preview Engine', 'Google Gemini Integration', 'Modular Workflow Management'],
    techStack: ['React', 'TypeScript', 'Vite', 'Gemini API'],
    goal: 'Empower users to explore new artistic directions with AI assistance.',
    role: 'Lead Developer',
    link: 'https://jovibe-code.vercel.app'
  },
  {
    id: '02',
    title: 'Clymail',
    category: 'Enterprise Email Infrastructure',
    image: IMAGES.projects.clymail,
    year: '2025',
    isComingSoon: true,
    status: 'Development',
    description: 'A robust, self-hosted bulk email sending application built on Laravel. Features comprehensive campaign management and efficient Redis-backed scheduling.',
    features: ['Filament Management', 'Redis Queues', 'Audit Logging', 'PHPMailer Integration'],
    techStack: ['Laravel', 'FilamentPHP', 'Livewire', 'Redis'],
    goal: 'High-performance bulk email delivery in a self-controlled environment.',
    role: 'Full Stack Developer'
  },
  {
    id: '03',
    title: 'Pawpals',
    category: 'Pet Marketplace',
    image: IMAGES.projects.pawpals,
    year: '2025',
    status: 'Live',
    isComingSoon: false,
    description: 'A dynamic pet adoption and marketplace facilitating connections between owners and service providers.',
    features: ['Firebase Auth', 'Listing Management', 'Payment Integration', 'Admin Moderation'],
    techStack: ['PHP', 'Tailwind', 'Firebase', 'Vite'],
    role: 'Backend Architect',
    link: 'https://pawpals-rdxt.onrender.com'
  },
  {
    id: '04',
    title: 'LenitAI',
    category: 'Educational AI',
    image: IMAGES.projects.lenitAI,
    year: '2025',
    isComingSoon: true,
    status: 'Development',
    description: 'An AI-powered learning management system designed to personalize the student journey with adaptive testing.',
    features: ['Adaptive Testing', 'Personalized Bots', 'Progress Analytics'],
    techStack: ['Laravel', 'OpenAI', 'Vue.js', 'PostgreSQL'],
    role: 'Full Stack Developer',
    link: 'https://lenit-ai.vercel.app'
  }
];

export const ARCHIVE_PROJECTS: Project[] = [
  ...HOME_PROJECTS,
  {
    id: '05',
    title: 'NXB MVP',
    category: 'Mobile Application',
    image: IMAGES.projects.nxbMVP,
    year: '2025',
    isComingSoon: true,
    status: 'Development',
    description: 'A sophisticated MVP built with React Native and Expo. Features personalized "For You" feeds and secure Firebase authentication.',
    features: ['React Native Expo', 'Firebase Auth', 'Custom Tab Bar', 'Responsive UI Hooks'],
    techStack: ['React Native', 'Expo', 'Firebase', 'Context API'],
    goal: 'Deliver a personalized content stream on mobile devices.',
    role: 'Mobile Lead'
  },
  {
    id: '06',
    title: 'Pennieshares',
    category: 'Financial Platform',
    image: IMAGES.projects.pennieshares,
    year: '2024',
    status: 'Live',
    isComingSoon: false,
    description: 'A robust web-based financial platform focused on asset management and trading. Built for reliability and performance.',
    features: ['Secure User Management', 'Asset Trading', 'KYC Verification', 'Web Push Notifications'],
    techStack: ['PHP', 'MySQL', 'PDO', 'Web-Push'],
    role: 'Lead Architect',
    link: 'https://pennieshares.com'
  },
  {
    id: '07',
    title: 'Ai-Inspin',
    category: 'AI Content Platform',
    image: IMAGES.projects.aiInspin,
    year: '2024',
    status: 'Live',
    isComingSoon: false,
    description: 'Enterprise-grade AI content platform leveraging Google Gemini for scalable generation workflows.',
    features: ['Context-aware generation', 'Multi-modal processing', 'Real-time UI'],
    techStack: ['React', 'TypeScript', 'Gemini API', 'Node.js'],
    role: 'AI Engineer'
  }
];

export const NAV_LINKS: NavLink[] = [
  { label: 'Works', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'Methodology', href: '#process' },
  { label: 'Testimonials', href: 'testimonials', isAction: true },
  { label: 'Expertise', href: '#skills' },
  { label: 'Archive', href: 'archive', isAction: true },
  { label: 'About', href: 'about', isAction: true },
  { label: 'Contact', href: '#contact' }
];

export const SKILL_CATEGORIES = [
  {
    name: 'Backend Architecture',
    skills: ['Laravel', 'PHP', 'Python', 'Node.js', 'MySQL', 'PostgreSQL', 'Redis']
  },
  {
    name: 'Frontend & Mobile',
    skills: ['React', 'React Native', 'Vue.js', 'Expo', 'TypeScript', 'Tailwind CSS', 'GSAP']
  },
  {
    name: 'Intelligence & Ops',
    skills: ['Google Gemini', 'OpenAI', 'LLM RAG', 'Firebase', 'Git', 'Vite', 'Linux']
  }
];

export const SERVICES: Service[] = [
  {
    id: '01',
    title: 'Intelligent Systems',
    description: 'Development of custom RAG (Retrieval-Augmented Generation) architectures and AI agent workflows that integrate seamlessly with existing business data.',
    capabilities: ['LLM Integration', 'Vector Database Design', 'Custom Chatbots', 'Automated Reasoning Agents']
  },
  {
    id: '02',
    title: 'SaaS Engineering',
    description: 'End-to-end architectural design and development of scalable Software-as-a-Service platforms, focusing on multi-tenancy, security, and performance.',
    capabilities: ['Laravel Architecture', 'API Design', 'Database Optimization', 'Real-time Systems']
  },
  {
    id: '03',
    title: 'Experience Design',
    description: 'Crafting immersive frontend experiences that merge aesthetic precision with technical performance, utilizing modern frameworks and motion libraries.',
    capabilities: ['React/Next.js', 'React Native Mobile', 'Interaction Design', 'Performance Tuning']
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: '01',
    phase: 'Discovery',
    title: 'Neural Mapping',
    description: 'Deconstructing the problem space. We analyze business requirements and user intent to build a comprehensive data strategy.'
  },
  {
    id: '02',
    phase: 'Architecture',
    title: 'System Design',
    description: 'Drafting the blueprints. We select the optimal tech stack (Laravel/React/AI) to ensure scalability and fault tolerance.'
  },
  {
    id: '03',
    phase: 'Development',
    title: 'Core Fusion',
    description: 'Writing clean, self-documenting code. This is where logic meets creativity, building the backend engines and frontend interfaces.'
  },
  {
    id: '04',
    phase: 'Deployment',
    title: 'Orbital Launch',
    description: 'CI/CD pipelines, automated testing, and secure provisioning. Ensuring a smooth transition from local to global availability.'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '01',
    quote: "Jonadab doesn't just write code; he architects solutions. His ability to integrate complex AI workflows into our existing Laravel infrastructure was nothing short of brilliant.",
    author: "Sarah Jenkins",
    role: "CTO",
    company: "TechFlow Solutions"
  },
  {
    id: '02',
    quote: "The 'antigravity' feel isn't just a visual gimmick—it's how his applications perform. Fast, weightless, and incredibly intuitive.",
    author: "Michael Adebayo",
    role: "Product Lead",
    company: "NextGen Africa"
  },
  {
    id: '03',
    quote: "We needed a scalable MVP in record time. Jonadab delivered a robust system that handled our first 10,000 users without a blink.",
    author: "David Chen",
    role: "Founder",
    company: "Orbit Startups"
  }
];