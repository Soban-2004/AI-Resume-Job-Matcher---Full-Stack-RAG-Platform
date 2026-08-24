export interface SampleSet {
  role: string;
  resumePath: string;
  jdPath: string;
}

// Each pair lives as plain .txt in /public/samples so it can be fetched
// client-side and loaded into editable textareas -- editing then just means
// mutating that fetched string, no backend involvement until submit.
export const SAMPLE_SETS: SampleSet[] = [
  {
    role: "AI Engineer",
    resumePath: "/samples/sample-resume.txt",
    jdPath: "/samples/sample-job-description.txt",
  },
  {
    role: "Backend Engineer",
    resumePath: "/samples/backend-engineer-resume.txt",
    jdPath: "/samples/backend-engineer-jd.txt",
  },
  {
    role: "Data Analyst",
    resumePath: "/samples/data-analyst-resume.txt",
    jdPath: "/samples/data-analyst-jd.txt",
  },
  {
    role: "Frontend Engineer",
    resumePath: "/samples/frontend-engineer-resume.txt",
    jdPath: "/samples/frontend-engineer-jd.txt",
  },
];
