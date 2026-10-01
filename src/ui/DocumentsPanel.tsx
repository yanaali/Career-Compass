import { useEffect, useState } from "react";
import { serverApi, useApplications } from "../store/applications";
import type { CareerDocument } from "../lib/applicationsApi";
import { Card } from "./Card";
import { Button } from "./Button";

export function DocumentsPanel() {
  const mode = useApplications((state) => state.mode);
  const [documents, setDocuments] = useState<CareerDocument[]>([]);
  const [kind, setKind] = useState("resume");
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [download, setDownload] = useState<{ url: string; name: string }>();

  useEffect(() => {
    if (mode !== "server") return;
    let active = true;
    serverApi().documents().then((items) => { if (active) setDocuments(items); })
      .catch(() => { if (active) setError("Could not load documents. Try refreshing the page."); });
    return () => { active = false; };
  }, [mode]);

  async function perform(action: () => Promise<void>) {
    setBusy(true); setError(""); setDownload(undefined);
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Document request failed."); }
    finally { setBusy(false); }
  }

  return <Card>
    <h3 className="font-semibold">Career documents</h3>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Upload resumes, job descriptions, and project notes for the copilot. PDF or UTF-8 text, up to 5 MB each; 20 documents per workspace.</p>
    {mode !== "server" ? <p className="mt-3 text-sm">Connect to your server workspace above to manage documents.</p> : <>
      <form className="mt-3 flex flex-wrap items-center gap-3" onSubmit={(event) => {
        event.preventDefault();
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("Choose a file smaller than 5 MB."); return; }
        void perform(async () => { await serverApi().upload(file, kind); setDocuments(await serverApi().documents()); });
      }}>
        <select aria-label="Document purpose" className="rounded-xl border p-2 dark:bg-slate-800" value={kind} disabled={busy} onChange={(e) => setKind(e.target.value)}>
          <option value="resume">Resume</option><option value="job">Job description</option><option value="project">Project notes</option>
        </select>
        <input aria-label="Career document" type="file" accept=".pdf,.txt,application/pdf,text/plain" disabled={busy} onChange={(e) => setFile(e.target.files?.[0])} />
        <Button disabled={busy || !file} type="submit">{busy ? "Working..." : "Upload"}</Button>
      </form>
      <ul className="mt-4 space-y-2">
        {documents.map((doc) => <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 dark:border-slate-700">
          <span className="min-w-0 break-all text-sm">{doc.filename} <span className="text-slate-500">({doc.kind}, {Math.ceil(doc.sizeBytes / 1024)} KB)</span></span>
          <span className="flex gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => void perform(async () => setDownload({ ...await serverApi().download(doc.id), name: doc.filename }))}>Get download link</Button>
            <Button variant="ghost" disabled={busy} onClick={() => void perform(async () => {
              await serverApi().deleteDocument(doc.id); setDocuments((items) => items.filter((item) => item.id !== doc.id));
            })}>Delete</Button>
          </span>
        </li>)}
      </ul>
      {download && <p className="mt-3 text-sm"><a className="underline" href={download.url} target="_blank" rel="noreferrer">Download {download.name}</a> — link expires in 5 minutes.</p>}
      <p className="mt-3 text-xs text-slate-500">When you ask the copilot a question, readable document text and application details are sent to the AI provider to build the search index and answer. Scanned PDFs need OCR first.</p>
    </>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
  </Card>;
}
