import { type NextRequest, NextResponse } from "next/server";
import { addChunks, removeDocument, getDocuments, getTotalChunks } from "@/lib/rag/vectorstore";
import { chunkText } from "@/lib/rag/chunker";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET — list all ingested documents
export async function GET() {
  return NextResponse.json({
    documents: getDocuments(),
    totalChunks: getTotalChunks(),
  });
}

// POST — ingest a document
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const textContent = formData.get("text") as string | null;
    const docName = formData.get("name") as string | null;

    let text = "";
    let name = docName || "Untitled Document";

    if (file) {
      name = docName || file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith(".pdf")) {
        // Dynamic import to avoid issues with edge runtime
        const pdfParseModule = await import("pdf-parse");
        const PDFParseClass = pdfParseModule.PDFParse;
        const parser = new PDFParseClass({ data: buffer });
        const parsed = await parser.getText();
        await parser.destroy();
        text = parsed.text;
      } else if (
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".csv")
      ) {
        text = buffer.toString("utf-8");
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Use PDF, TXT, or MD." },
          { status: 400 }
        );
      }
    } else if (textContent) {
      text = textContent;
    } else {
      return NextResponse.json(
        { error: "No file or text content provided." },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Document appears to be empty." }, { status: 400 });
    }

    const docId = randomUUID();
    const chunks = chunkText(text);

    const documentChunks = chunks.map((content, i) => ({
      id: `${docId}-chunk-${i}`,
      docId,
      docName: name,
      content,
      chunkIndex: i,
    }));

    addChunks(documentChunks);

    return NextResponse.json({
      success: true,
      docId,
      docName: name,
      chunkCount: documentChunks.length,
      totalChunks: getTotalChunks(),
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json({ error: "Failed to process document." }, { status: 500 });
  }
}

// DELETE — remove a document by ID
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");

  if (!docId) {
    return NextResponse.json({ error: "docId is required" }, { status: 400 });
  }

  removeDocument(docId);
  return NextResponse.json({ success: true });
}
