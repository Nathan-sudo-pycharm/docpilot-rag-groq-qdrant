"use client"

import type { Document } from "@/types"
import { FileUploader } from "./FileUploader"

interface Props {
  documents: Document[]
  isUploading: boolean
  onUpload: (file: File) => Promise<void>
  onRemove: (filename: string) => Promise<void>
}

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
    <aside className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen bg-white dark:bg-[#0d0d0d]">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-base">DocPilot</h1>
          <span className="text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
            Beta
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">RAG-powered support agent</p>
      </div>

      <div className="p-4">
        <FileUploader onUpload={onUpload} isUploading={isUploading} />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-500 uppercase">Documents</p>
          <span className="text-sm text-gray-400">{documents.length}</span>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-gray-400">No documents yet</p>
        ) : (
          documents.map(doc => (
            <div
              key={doc.filename}
              className="group flex items-start justify-between py-2.5 border-b border-gray-100 dark:border-gray-900"
            >
              <div className="flex items-start gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{doc.filename}</p>
                  <p className="text-sm text-gray-400" suppressHydrationWarning>
                    {doc.chunkCount} chunks · {formatRelativeTime(new Date(doc.uploadedAt))}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemove(doc.filename)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-sm px-1"
                aria-label={`Remove ${doc.filename}`}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-900">
        <p className="text-m text-gray-400">
          Built by{" "}
          <a
            href="https://nathansequeirafinal.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Nathan Sequeira
          </a>
        </p>
      </div>
    </aside>
  )
}
