"use client";

import { useState, useEffect, useCallback } from "react";

interface DocItem {
  id: string;
  name: string;
  chunkCount: number;
}

interface Props {
  onRagUpdate: (active: boolean) => void;
}

export default function KnowledgeBase({ onRagUpdate }: Props) {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/ingest");
      const data = await res.json();
      setDocs(data.documents || []);
      onRagUpdate((data.documents || []).length > 0);
    } catch {
      /* silent */
    }
  }, [onRagUpdate]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const res = await fetch("/api/ingest", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setUploadStatus(`✅ Added ${data.chunkCount} chunks from "${data.docName}"`);
        fetchDocs();
      } else {
        setUploadStatus(`❌ ${data.error}`);
      }
    } catch {
      setUploadStatus("❌ Upload failed");
    }
    setUploading(false);
    setTimeout(() => setUploadStatus(""), 4000);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
    e.target.value = "";
  };

  const deleteDoc = async (docId: string) => {
    await fetch(`/api/ingest?docId=${docId}`, { method: "DELETE" });
    fetchDocs();
  };

  return (
    <div>
      {/* Drop Zone */}
      <label
        id="doc-upload-zone"
        className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{ cursor: "pointer" }}
        aria-label="Upload document to knowledge base"
      >
        <div className="drop-zone-icon">{uploading ? "⏳" : "📄"}</div>
        <div className="drop-zone-text">
          {uploading ? "Processing..." : "Drop PDF, TXT, or MD"}
        </div>
        <div className="drop-zone-hint">or click to browse</div>
        <input
          type="file"
          accept=".pdf,.txt,.md,.csv"
          className="sr-only"
          onChange={handleFileInput}
          aria-hidden="true"
        />
      </label>

      {/* Status message */}
      {uploadStatus && (
        <div style={{ fontSize: 11, marginTop: 6, color: "var(--text-muted)", padding: "0 4px" }}>
          {uploadStatus}
        </div>
      )}

      {/* Document list */}
      {docs.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {docs.map((doc) => (
            <div key={doc.id} className="doc-item" role="listitem">
              <span style={{ fontSize: 14 }}>📄</span>
              <span className="doc-item-name" title={doc.name}>{doc.name}</span>
              <span className="doc-item-chunks">{doc.chunkCount} chunks</span>
              <button
                className="doc-delete-btn"
                onClick={() => deleteDoc(doc.id)}
                aria-label={`Remove ${doc.name} from knowledge base`}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {docs.length === 0 && !uploading && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 8, lineHeight: 1.6 }}>
          Upload your notes or textbooks<br />to enable RAG-powered answers
        </div>
      )}
    </div>
  );
}
