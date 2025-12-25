
export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  year: string;
  description?: string;
  features?: string[];
  techStack?: string[];
  goal?: string;
  role?: string;
  isComingSoon?: boolean;
  status?: 'Live' | 'Development' | 'MVP';
  link?: string;
}

export interface NavLink {
  label: string;
  href: string;
  isAction?: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  capabilities: string[];
}

export interface ProcessStep {
  id: string;
  phase: string;
  title: string;
  description: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  image?: string;
}

export interface ResumeData {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  summary: string;
  skills: string[];
  image?: string;
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string[];
  }[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
  projects: {
    name: string;
    description: string;
    tech: string;
  }[];
}
