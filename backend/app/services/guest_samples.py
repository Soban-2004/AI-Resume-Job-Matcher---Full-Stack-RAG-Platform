"""Canonical sample resume/JD text for the unauthenticated guest demo.

Deliberately duplicated here rather than read from the frontend's
public/samples/*.txt files: the guest-jobs endpoint (see job_seeker.py)
must never run the real LLM pipeline on client-submitted free text (that
would turn a rate-limited demo into an open, quota-draining endpoint) --
it only ever accepts a `sample_role` key and looks the actual text up here,
server-side. Keep these in sync with frontend/public/samples/ if either
changes.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class GuestSample:
    role: str
    resume_text: str
    jd_text: str


GUEST_SAMPLES: dict[str, GuestSample] = {
    "AI Engineer": GuestSample(
        role="AI Engineer",
        resume_text="""Maya Chen
Bengaluru, India
maya.chen.dev@example.com | github.com/example | linkedin.com/in/example

PROFESSIONAL SUMMARY
Recent Computer Science graduate with hands-on experience building AI-powered applications
using Large Language Models and Retrieval-Augmented Generation. Comfortable across the full
stack, from a FastAPI backend to a Python-based RAG pipeline.

EXPERIENCE

AI Engineering Intern | NimbusWorks | Bengaluru, India | Jun 2025 - Dec 2025
- Built a Retrieval-Augmented Generation pipeline over internal support documentation using
  LangChain and Qdrant, cutting average ticket resolution time by roughly 30%.
- Developed REST APIs with FastAPI to serve LLM-backed features to the product team.
- Integrated the OpenAI API and later added Gemini as a fallback provider for resilience
  against rate limits.
- Wrote unit and integration tests, and used Git/GitHub for version control and code review.

Software Engineering Intern | Solstice Labs | Remote | Jan 2025 - May 2025
- Contributed to a Python/PostgreSQL backend service, writing and optimizing SQL queries.
- Containerized a small internal tool with Docker for consistent local development.
- Collaborated with a cross-functional team using Agile sprints and stand-ups.

PROJECTS

Personal RAG Chatbot (2024)
- Built an end-to-end question-answering chatbot over a personal document collection using
  LlamaIndex, a vector database, and prompt engineering to reduce hallucinated answers.
- Deployed as a small FastAPI service with a simple web frontend.

EDUCATION
B.Sc. Computer Science, Bengaluru Institute of Technology (2021-2025)

TECHNICAL SKILLS
Programming: Python, SQL
Frameworks: FastAPI, LangChain, LlamaIndex
AI/ML: Large Language Models, Retrieval-Augmented Generation (RAG), Prompt Engineering,
  OpenAI API, Gemini
Databases & Infra: PostgreSQL, Qdrant (vector database), Docker, Git, GitHub
Other: REST APIs, Agile/Scrum""",
        jd_text="""AI Engineer

Location: Bengaluru, India (Hybrid)

Experience: 0-2 Years

About the Role

We are looking for an AI Engineer to design, develop, and deploy AI-powered applications using Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and modern machine learning frameworks. You will work with software engineers and product teams to build scalable AI solutions for enterprise customers.

Responsibilities
Build and deploy AI applications using Python.
Develop Retrieval-Augmented Generation (RAG) pipelines.
Design and implement AI agents and multi-agent workflows.
Integrate Large Language Models (OpenAI, Anthropic, Gemini, Llama).
Develop REST APIs using FastAPI.
Work with vector databases such as Pinecone, Qdrant, Weaviate, or Milvus.
Optimize prompts and evaluate LLM performance.
Build data ingestion and document processing pipelines.
Deploy applications using Docker and Kubernetes.
Work with cloud platforms such as AWS, Azure, or Google Cloud.
Monitor AI applications and troubleshoot production issues.
Collaborate with cross-functional teams using Agile methodologies.
Write clean, maintainable, and well-tested code.

Required Skills
Bachelor's degree in Computer Science or related field.
Strong programming skills in Python.
Experience with FastAPI or Flask.
Knowledge of Generative AI and Large Language Models.
Experience with LangChain, LangGraph, LlamaIndex, or similar frameworks.
Understanding of Retrieval-Augmented Generation (RAG).
Familiarity with vector databases.
Experience with Git and GitHub.
Knowledge of SQL and databases.
Experience with Docker.
Good problem-solving and communication skills.

Preferred Skills
Experience with Kubernetes.
Knowledge of Redis.
Experience with Azure OpenAI, AWS Bedrock, or Vertex AI.
Familiarity with Hugging Face Transformers.
Experience with MLflow, Langfuse, or similar observability tools.
Knowledge of CI/CD pipelines.
Experience with Linux.
Understanding of prompt engineering and AI evaluation techniques.

Nice to Have
Experience building end-to-end AI applications.
Open-source contributions.
Personal AI projects or hackathon experience.
Knowledge of agentic AI frameworks and MCP (Model Context Protocol).

Technologies
Python, FastAPI, LangChain, LangGraph, LlamaIndex, OpenAI API, Anthropic Claude, Gemini,
Docker, Kubernetes, Redis, PostgreSQL, SQL, Git, GitHub, Azure, AWS,
Vector Databases (Qdrant, Pinecone, Weaviate, Milvus), REST APIs, Prompt Engineering, RAG,
Multi-Agent Systems, CI/CD, Linux""",
    ),
    "Backend Engineer": GuestSample(
        role="Backend Engineer",
        resume_text="""Arjun Mehta
Pune, India
arjun.mehta.dev@example.com | github.com/example | linkedin.com/in/example

PROFESSIONAL SUMMARY
Backend engineer with 3 years of experience building and scaling REST APIs and data-heavy
services in Python. Comfortable owning a service from schema design through deployment.

EXPERIENCE

Backend Engineer | Fenwick Systems | Pune, India | Aug 2022 - Present
- Designed and built REST APIs in Python using FastAPI, serving over 2M requests/day.
- Modeled relational schemas in PostgreSQL and optimized slow queries, cutting p95 latency
  on the orders endpoint by roughly 40%.
- Added a Redis caching layer in front of a frequently-hit product-lookup endpoint.
- Containerized all services with Docker and deployed them to Kubernetes.
- Built and maintained CI/CD pipelines with GitHub Actions for automated testing and deploys.

Software Engineer | Kestrel Data | Pune, India | Jun 2021 - Jul 2022
- Built internal tooling in Python and PostgreSQL for the data engineering team.
- Wrote unit and integration tests using pytest, raising coverage on a legacy module from
  under 20% to over 70%.
- Worked with AWS S3 and EC2 to support batch data-processing jobs.

PROJECTS

Task Queue Service (2022)
- Built a small distributed task queue in Python backed by Redis, with a FastAPI-based
  dashboard for monitoring job status.

EDUCATION
B.Tech Computer Science, Pune Institute of Technology (2017-2021)

TECHNICAL SKILLS
Programming: Python, SQL
Frameworks: FastAPI, pytest
Databases & Infra: PostgreSQL, Redis, Docker, Kubernetes, AWS (S3, EC2)
DevOps: GitHub Actions, CI/CD
Other: REST APIs, Git""",
        jd_text="""Backend Engineer

Location: Remote

Experience: 2-4 Years

About the Role

We're hiring a Backend Engineer to help build and scale the services powering our platform.
You'll work primarily in Python, designing REST APIs, managing relational data, and deploying
containerized services to the cloud.

Responsibilities
Design and build REST APIs using Python and FastAPI.
Model and query relational data in PostgreSQL, including writing performant SQL.
Add caching layers with Redis for hot-path endpoints.
Containerize services with Docker and deploy to Kubernetes.
Set up and maintain CI/CD pipelines using GitHub Actions.
Write unit and integration tests, and participate in code review.
Work with AWS services (EC2, S3, RDS) for infrastructure.

Requirements
2+ years of backend development experience.
Strong proficiency in Python.
Experience with FastAPI or a comparable web framework.
Solid understanding of PostgreSQL and SQL query optimization.
Familiarity with Docker and container-based deployment.
Bachelor's degree in Computer Science or a related field.

Nice to Have
Experience with Kubernetes in production.
Exposure to Redis or another caching layer.
Experience with GitHub Actions or similar CI/CD tooling.""",
    ),
    "Data Analyst": GuestSample(
        role="Data Analyst",
        resume_text="""Priya Nair
Hyderabad, India
priya.nair.data@example.com | linkedin.com/in/example

PROFESSIONAL SUMMARY
Data analyst with 2 years of experience turning raw data into dashboards and decisions for
product and marketing teams. Strong in SQL, comfortable in Python for deeper analysis.

EXPERIENCE

Data Analyst | Northgate Retail | Hyderabad, India | Jul 2023 - Present
- Wrote SQL queries against a Snowflake data warehouse to support weekly business reviews.
- Built and maintained 6+ Tableau dashboards tracking sales, retention, and campaign
  performance for the marketing team.
- Used Python (pandas) to clean and analyze survey data, presenting findings to leadership.
- Designed and analyzed an A/B test for a checkout flow change, contributing to a 5%
  conversion lift.
- Maintained Excel-based forecasting models used in monthly planning meetings.

Business Analyst Intern | Coral Insights | Remote | Jan 2023 - Jun 2023
- Supported the analytics team with ad-hoc SQL pulls and Excel reporting.
- Helped migrate a set of manual reports into a Power BI dashboard.

EDUCATION
B.Sc. Statistics, University of Hyderabad (2019-2023)

TECHNICAL SKILLS
Data & Analysis: SQL, Python (pandas), Excel, A/B Testing
Visualization: Tableau, Power BI
Infra: Snowflake
Other: Git""",
        jd_text="""Data Analyst

Location: Hyderabad, India (Hybrid)

Experience: 1-3 Years

About the Role

We are looking for a Data Analyst to help turn raw data into decisions. You'll partner with
product and marketing teams to build dashboards, run analyses, and surface insights that
directly inform business strategy.

Responsibilities
Write SQL queries to extract and analyze data from our data warehouse.
Build and maintain dashboards in Tableau or Power BI for stakeholders across the company.
Use Python (pandas) for deeper ad-hoc analysis and data cleaning.
Design and analyze A/B tests, and communicate results to non-technical stakeholders.
Maintain and improve Excel-based reporting models used by leadership.
Work with the data engineering team to improve data quality and pipeline reliability.

Requirements
1+ years of experience in a data analyst or similar role.
Strong SQL skills, comfortable with joins, window functions, and aggregations.
Experience building dashboards in Tableau or Power BI.
Working knowledge of Python and pandas for data manipulation.
Advanced Excel skills (pivot tables, formulas).
Bachelor's degree in a quantitative field.

Nice to Have
Experience with A/B testing and basic statistics.
Familiarity with a cloud data warehouse (BigQuery, Redshift, or Snowflake).""",
    ),
    "Frontend Engineer": GuestSample(
        role="Frontend Engineer",
        resume_text="""Rohan Kapoor
Bengaluru, India
rohan.kapoor.dev@example.com | github.com/example | linkedin.com/in/example

PROFESSIONAL SUMMARY
Frontend engineer with 2 years of experience building production web applications in React
and TypeScript. Focused on clean, accessible UI and close collaboration with design.

EXPERIENCE

Frontend Engineer | Lumen Software | Bengaluru, India | Sep 2023 - Present
- Built and maintained customer-facing pages using React, TypeScript, and Next.js.
- Implemented the company's design system in Tailwind CSS, used across 20+ components.
- Integrated frontend features with internal REST APIs, handling loading and error states.
- Wrote component tests with Jest and React Testing Library, raising test coverage on the
  checkout flow from roughly 30% to 75%.
- Worked directly with designers in Figma to turn mockups into pixel-accurate UI.

Junior Web Developer | Brightpath Studio | Bengaluru, India | Jun 2022 - Aug 2023
- Built responsive marketing pages in React for small business clients.
- Improved page load performance on a client site, reducing Largest Contentful Paint by 35%.

PROJECTS

Personal Portfolio Site (2022)
- Built and deployed a personal site using Next.js and Tailwind CSS, with a small blog
  powered by static markdown files.

EDUCATION
B.E. Information Technology, Bengaluru Institute of Technology (2018-2022)

TECHNICAL SKILLS
Programming: TypeScript, JavaScript
Frameworks: React, Next.js
Styling: Tailwind CSS
Testing: Jest, React Testing Library
Design Collaboration: Figma
Other: REST APIs, Git""",
        jd_text="""Frontend Engineer

Location: Bengaluru, India (Hybrid)

Experience: 1-3 Years

About the Role

We're looking for a Frontend Engineer to build fast, accessible interfaces for our product.
You'll work closely with design and backend teams to ship polished features in React and
TypeScript.

Responsibilities
Build responsive UI components using React and TypeScript.
Develop and maintain pages and routes using Next.js.
Style interfaces with Tailwind CSS, following our design system.
Integrate frontend features with REST APIs.
Write unit and component tests using Jest and React Testing Library.
Collaborate with designers in Figma to translate mockups into production UI.
Optimize for performance and accessibility across devices.

Requirements
1+ years of experience building production web applications.
Strong proficiency in React and TypeScript.
Experience with Next.js or a comparable framework.
Familiarity with Tailwind CSS or another utility-first CSS approach.
Comfortable consuming REST APIs from a frontend application.
Bachelor's degree in Computer Science or equivalent practical experience.

Nice to Have
Experience with Jest or React Testing Library.
Familiarity with Figma-to-code workflows.
Exposure to Git-based CI/CD pipelines.""",
    ),
}
