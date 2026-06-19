"use client";

import { useRef, useCallback } from "react";

interface Props {
  input: string;
  setInput: (val: string) => void;
  images: File[];
  setImages: (imgs: File[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  showCitations: boolean;
  setShowCitations: (v: boolean) => void;
}

export default function InputBar({
  input,
  setInput,
  images,
  setImages,
  onSubmit,
  isLoading,
  textareaRef,
  showCitations,
  setShowCitations,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePasteRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleImageFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      setImages([...images, ...imageFiles]);
    },
    [images, setImages]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) handleImageFiles(imageFiles);
    },
    [handleImageFiles]
  );

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div className="input-area">
      <form onSubmit={onSubmit} id="chat-form">
        <div className="input-wrapper">
          {/* Image previews */}
          {images.length > 0 && (
            <div className="image-preview-bar" role="list" aria-label="Attached images">
              {images.map((file, i) => (
                <div key={i} className="image-preview-item" role="listitem">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt={`Attached image ${i + 1}`} />
                  <button
                    type="button"
                    className="image-remove-btn"
                    onClick={() => removeImage(i)}
                    aria-label={`Remove image ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="input-textarea"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask anything... (Multimodal input supported)"
            rows={1}
            aria-label="Chat message input"
            disabled={isLoading}
          />

          {/* Actions row */}
          <div className="input-actions">
            <div className="input-actions-left">
              <button
                type="button"
                id="image-upload-btn"
                className="icon-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image (or paste from clipboard)"
                aria-label="Attach image"
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) handleImageFiles(Array.from(e.target.files));
                  e.target.value = "";
                }}
                aria-hidden="true"
              />
              <input ref={imagePasteRef} type="file" className="sr-only" aria-hidden="true" />

              {/* Source Citation toggle */}
              <label
                className="citation-toggle"
                title="Toggle source citations in responses"
                aria-label="Toggle source citation"
                style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}
              >
                <label className="switch" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={showCitations}
                    onChange={(e) => setShowCitations(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>
                  Source Citation
                </span>
              </label>
            </div>

            <button
              type="submit"
              id="send-btn"
              className="send-btn"
              disabled={isLoading || (!input.trim() && images.length === 0)}
              aria-label="Send message"
              title="Send message (Enter)"
            >
              {isLoading ? <span style={{ fontSize: 12 }}>⏳</span> : <span>➤</span>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

