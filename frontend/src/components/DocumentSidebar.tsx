"use client"

import type { Document } from "@/types"
import { FileUploader } from "./FileUploader"

interface Props {
  documents: Document[]
  isUploading: boolean
  onUpload: (file: File) => Promise<void>
  onRemove: (filename: string) => Promise<void>
}

// A small helper function — not a component, just a regular
// TypeScript function — that converts a Date into a friendly
// relative string like "6m ago" or "2h ago".
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DocumentSidebar({ documents, isUploading, onUpload, onRemove }: Props) {
  return (
    <aside className="w-72 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-sm">DocPilot</h1>
          <span className="text-[10px] uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
            Beta
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">RAG-powered support agent</p>
      </div>

      <div className="p-4">
        <FileUploader onUpload={onUpload} isUploading={isUploading} />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Documents</p>
          <span className="text-xs text-gray-400">{documents.length}</span>
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-gray-400">No documents yet</p>
        ) : (
          // .map() loops over the array and returns one JSX element
          // per document. The `key` prop is REQUIRED by React whenever
          // you render a list — it helps React track which item is
          // which across re-renders, so it can update efficiently
          // instead of re-rendering the entire list every time.
          documents.map(doc => (
            <div
              key={doc.filename}
              className="group flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-900"
            >
              <div className="flex items-start gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs truncate">{doc.filename}</p>
                  <p className="text-xs text-gray-400">
                    {doc.chunkCount} chunks · {formatRelativeTime(doc.uploadedAt)}
                  </p>
                </div>
              </div>

              {/* opacity-0 + group-hover:opacity-100 means this X button
                  is invisible by default and only appears when the user
                  hovers over the parent div (the one with className="group") */}
              <button
                onClick={() => onRemove(doc.filename)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-xs px-1"
                aria-label={`Remove ${doc.filename}`}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}