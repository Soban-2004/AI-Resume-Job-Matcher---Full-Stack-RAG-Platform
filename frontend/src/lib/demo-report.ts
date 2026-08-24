import type { JobSeekerAnalysisResponse } from "./types";

// A hand-written, static example result -- rendered through the exact same
// AnalysisResultView component a real analysis uses, so it's a faithful
// preview of the real output. Deliberately NOT wired to any backend call:
// no login, no LLM spend, can never fail or time out. See /demo/page.tsx.
export const DEMO_REPORT: JobSeekerAnalysisResponse = {
  eligibility: { eligible: true, reasons: [] },
  resume_degree: { all_degrees: ["bachelor"], highest: "bachelor" },
  jd_degree: { all_degrees: ["bachelor"], highest: "bachelor" },
  resume_experience_years: 1,
  jd_experience_years: 0,
  overall_fit_score: 79.4,
  skill_based_ats_score: 72.5,
  matched_requirements: ["python", "fastapi", "retrieval-augmented generation (rag)", "langchain", "qdrant", "docker"],
  missing_requirements: ["kubernetes", "aws"],
  requirement_verdicts: [
    {
      requirement: "python",
      weight: 0.95,
      satisfied: true,
      evidence_type: "demonstrated_usage",
      confidence: 1.0,
      external_source_url: null,
      justification: "Repeatedly used to build and deploy backend and RAG systems across two roles.",
      evidence: [
        "Built a Retrieval-Augmented Generation pipeline over internal support documentation using LangChain and Qdrant, cutting average ticket resolution time by roughly 30%.",
      ],
      suggested_certification: null,
    },
    {
      requirement: "fastapi",
      weight: 0.85,
      satisfied: true,
      evidence_type: "demonstrated_usage",
      confidence: 1.0,
      external_source_url: null,
      justification: "Used to serve LLM-backed features to a product team, not just listed as a skill.",
      evidence: ["Developed REST APIs with FastAPI to serve LLM-backed features to the product team."],
      suggested_certification: null,
    },
    {
      requirement: "retrieval-augmented generation (rag)",
      weight: 0.9,
      satisfied: true,
      evidence_type: "demonstrated_usage",
      confidence: 1.0,
      external_source_url: null,
      justification: "A full RAG pipeline was built and shipped, with a measured impact on resolution time.",
      evidence: [
        "Built a Retrieval-Augmented Generation pipeline over internal support documentation using LangChain and Qdrant, cutting average ticket resolution time by roughly 30%.",
      ],
      suggested_certification: null,
    },
    {
      requirement: "langchain",
      weight: 0.7,
      satisfied: true,
      evidence_type: "project_mention",
      confidence: 0.75,
      external_source_url: null,
      justification: "Named as the framework behind the RAG pipeline, without a standalone deep-dive.",
      evidence: [
        "Built a Retrieval-Augmented Generation pipeline over internal support documentation using LangChain and Qdrant.",
      ],
      suggested_certification: null,
    },
    {
      requirement: "qdrant",
      weight: 0.75,
      satisfied: true,
      evidence_type: "demonstrated_usage",
      confidence: 1.0,
      external_source_url: null,
      justification: "Used as the vector store backing a production RAG pipeline.",
      evidence: [
        "Built a Retrieval-Augmented Generation pipeline over internal support documentation using LangChain and Qdrant.",
      ],
      suggested_certification: null,
    },
    {
      requirement: "docker",
      weight: 0.6,
      satisfied: true,
      evidence_type: "skills_only",
      confidence: 0.5,
      external_source_url: null,
      justification: "Only appears in the skills list -- no sentence shows it actually being used.",
      evidence: ["Databases & Infra: PostgreSQL, Qdrant (vector database), Docker, Git, GitHub"],
      suggested_certification: null,
    },
    {
      requirement: "kubernetes",
      weight: 0.65,
      satisfied: false,
      evidence_type: null,
      confidence: 0,
      external_source_url: null,
      justification: "No mention of Kubernetes anywhere in the resume.",
      evidence: [],
      suggested_certification: "Certified Kubernetes Application Developer (CKAD)",
    },
    {
      requirement: "aws",
      weight: 0.5,
      satisfied: false,
      evidence_type: null,
      confidence: 0,
      external_source_url: null,
      justification: "No cloud provider experience is mentioned in the resume.",
      evidence: [],
      suggested_certification: "AWS Certified Cloud Practitioner",
    },
  ],
  cover_letter: `Dear Hiring Manager,

I'm writing to apply for the AI Engineer position. In my current role, I built a Retrieval-Augmented Generation pipeline over internal support documentation using LangChain and Qdrant, cutting average ticket resolution time by roughly 30% -- work that lines up directly with what this role is asking for. I also developed REST APIs with FastAPI to get LLM-backed features in front of real users, and integrated multiple LLM providers to keep those features resilient to rate limits.

Beyond the RAG pipeline, I've worked across the stack: writing and optimizing SQL against a PostgreSQL backend, containerizing services with Docker, and collaborating with cross-functional teams through Agile sprints. I care about shipping AI features that are grounded and testable, not just impressive in a demo.

I'd welcome the chance to talk about how that experience applies here. Thank you for your consideration.

Sincerely,
Maya Chen`,
  optimized_resume: {
    full_name: "Maya Chen",
    contact_line: "Bengaluru, India | maya.chen.dev@example.com | github.com/example | linkedin.com/in/example",
    sections: [
      {
        heading: "Professional Summary",
        lines: [
          "AI engineer with hands-on experience building and shipping Retrieval-Augmented Generation pipelines and LLM-backed REST APIs, from a FastAPI backend through a Python-based retrieval layer.",
        ],
      },
      {
        heading: "Experience",
        lines: [
          "AI Engineering Intern, NimbusWorks (Jun 2025 - Dec 2025): Built a Retrieval-Augmented Generation pipeline over internal support documentation using LangChain and Qdrant, cutting average ticket resolution time by roughly 30%.",
          "Developed REST APIs with FastAPI to serve LLM-backed features to the product team, and integrated the OpenAI API with Gemini as a fallback provider for rate-limit resilience.",
          "Software Engineering Intern, Solstice Labs (Jan 2025 - May 2025): Contributed to a Python/PostgreSQL backend service, writing and optimizing SQL queries, and containerized a small internal tool with Docker.",
        ],
      },
      {
        heading: "Projects",
        lines: [
          "Personal RAG Chatbot: Built an end-to-end question-answering chatbot over a personal document collection using LlamaIndex and a vector database, deployed as a FastAPI service.",
        ],
      },
      {
        heading: "Technical Skills",
        lines: [
          "Programming: Python, SQL",
          "Frameworks: FastAPI, LangChain, LlamaIndex",
          "AI/ML: Large Language Models, Retrieval-Augmented Generation (RAG), Prompt Engineering",
          "Infra: PostgreSQL, Qdrant, Docker, Git",
        ],
      },
    ],
  },
};

export const DEMO_JOB_ROLE = "AI Engineer";
