"use client";

import { useEffect, useState } from "react";
import mammoth from "mammoth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getResumeFileBlob } from "@/lib/api";
import type { ResumeDetail } from "@/lib/types";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Renders a stored resume in its native format when the original bytes are
 * available -- a real PDF view for PDFs, a converted-to-HTML view for DOCX
 * (browsers can't render .docx natively, and there's no server-side Office
 * converter at this project's scale, so mammoth does a client-side
 * .docx -> HTML conversion instead). Falls back to the plain extracted text
 * for .txt uploads and for any resume saved before file storage existed
 * (content_type is null in that case -- see get_resume in job_seeker.py). */
export function ResumeViewer({ resume }: { resume: ResumeDetail }) {
  // No content_type (pre-file-storage resume) or plain .txt -- nothing to
  // fetch, the text fallback below already has everything it needs.
  const needsFetch = Boolean(resume.content_type && resume.content_type !== "text/plain");

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  // Initialized from needsFetch, not set synchronously inside the effect --
  // avoids a same-tick cascading render.
  const [loading, setLoading] = useState(needsFetch);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsFetch) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const blob = await getResumeFileBlob(resume.id);
        if (cancelled) return;

        if (resume.content_type === "application/pdf") {
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        } else if (resume.content_type === DOCX_MIME) {
          const arrayBuffer = await blob.arrayBuffer();
          const converted = await mammoth.convertToHtml({ arrayBuffer });
          if (!cancelled) setDocxHtml(converted.value);
        }
        // Any other content_type falls through to the plain-text view below.
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Couldn't load the original file.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resume.id, resume.content_type, needsFetch]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="destructive">
          <AlertDescription>{loadError} Showing the extracted text instead.</AlertDescription>
        </Alert>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{resume.resume_text}</p>
      </div>
    );
  }

  if (pdfUrl) {
    return (
      <iframe
        src={pdfUrl}
        title={resume.filename}
        className="h-[75vh] w-full rounded-lg border border-border bg-white"
      />
    );
  }

  if (docxHtml) {
    return (
      <div
        className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80 [&_a]:text-primary [&_a]:underline [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:font-medium [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
        // Safe here: this is the viewer's own uploaded resume, converted
        // client-side by mammoth from their own .docx -- not third-party
        // content rendered on anyone else's behalf.
        dangerouslySetInnerHTML={{ __html: docxHtml }}
      />
    );
  }

  return <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{resume.resume_text}</p>;
}
