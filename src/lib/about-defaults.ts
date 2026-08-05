import type { AboutContent } from "./about-types";

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  bio: [
    "Hey, I'm Syed Muhammad Maaz, a freelance software & AI engineer with 6+ years of shipping production systems. I go by maazaowski online.",
    "After 5 years at Astera Software where I grew from associate to senior, led teams, and built everything from microservices to AI-powered workflows. Then I went independent. Now I help clients build web applications and deploy AI agents that actually solve problems.",
    "This blog is where I write about what I'm building, what I'm learning, and what I think about the tech industry. No fluff, no filler. Just real stories from the work.",
  ],
  availability: {
    label: "Available for projects",
    message:
      "I'm freelancing, currently working with two clients on projects ranging from web applications to deploying AI agents for their business workflows. If you need software built or AI integrated into your stack, let's talk.",
  },
  education: {
    degree: "Bachelor of Science",
    institution: "Institute of Business Administration (IBA)",
    location: "Karachi, Pakistan",
    period: "2016 – 2020",
    gpa: "CGPA: 3.63 / 4.00",
  },
  certificates: [
    {
      title: "Claude Certified Architect - Professional",
      issuer: "Anthropic / Credly",
      url: "https://www.credly.com/badges/6cb5f19b-dafb-4069-9e30-dbae9e7fc2b6/public_url",
    },
  ],
  timeline: [
    {
      period: "2025 – Present",
      role: "Freelance Software & AI Engineer",
      company: "Independent",
      location: "Pakistan",
      highlights: [
        "Building web applications and deploying AI agents for client workflows",
        "Currently onboarded with two clients on projects ranging from full-stack web apps to AI-powered automation",
        "End-to-end ownership: architecture, development, deployment, and iteration",
      ],
    },
    {
      period: "Jan 2025 – May 2025",
      role: "Senior Software Engineer",
      company: "Astera Software",
      location: "Karachi, Pakistan",
      highlights: [
        "Automated installer pipelines with Anthropic API (Claude) for PR review, reducing QA blocker issues by 80%",
        "Led backend transition from WinForms to WPF and microservices architecture using .NET Core 8",
        "Implemented gRPC services with bidirectional streaming and RabbitMQ/MassTransit message queues",
        "Migrated installer pipelines from InstallShield to WiX, saving $10,000/year",
        "Led Cross-Platform team for macOS compatibility via Avalonia XPF",
      ],
    },
    {
      period: "Jan 2023 – Jan 2025",
      role: "Software Engineer II",
      company: "Astera Software",
      highlights: [
        "Built the LLM Workbench for orchestrating AI requests and visualizations",
        "Improved software performance by 86% through backend refactoring and query optimization",
        "Established CI/CD pipelines in Azure DevOps with unit and integration test coverage",
        "Directed monthly SonarQube audits over 12 sprints, reducing critical vulnerabilities by 67%",
      ],
    },
    {
      period: "Jun 2021 – Jan 2023",
      role: "Software Engineer I",
      company: "Astera Software",
      highlights: [
        "Led Visualization department in the Data Prep team for real-time data insights",
        "Pioneered the Analytics Workbench architecture for data analysis in C# .NET",
        "Built Installation Manager using Builder/Factory/Singleton patterns, cutting install time by 92%",
        "Reduced latency by 40% through targeted C# .NET module refactoring over 6 months",
      ],
    },
    {
      period: "Jul 2020 – Jun 2021",
      role: "Associate Software Engineer",
      company: "Astera Software",
      highlights: [
        "Integrated statistical and ML models into Centerprise, boosting predictive accuracy by 20%",
        "Created diagnostic tools reducing manual troubleshooting time by 30%",
        "Designed data pipelines for model training",
      ],
    },
  ],
  skills: {
    Languages: ["C#", "Java", "Python", "JavaScript", "TypeScript", "PHP"],
    Frameworks: [
      ".NET Core 8",
      "ASP.NET Core",
      "Next.js",
      "React",
      "Laravel",
      "Avalonia XPF",
    ],
    Architecture: ["Microservices", "gRPC", "RabbitMQ", "REST", "Docker"],
    "Cloud & DevOps": ["Azure DevOps", "AWS", "GCP", "CI/CD", "Vercel"],
    Databases: ["PostgreSQL", "MongoDB", "SQL Server", "Redis"],
    "AI & Agents": ["Claude", "Cursor", "GPT", "LLM Orchestration", "AI Agents"],
  },
};
