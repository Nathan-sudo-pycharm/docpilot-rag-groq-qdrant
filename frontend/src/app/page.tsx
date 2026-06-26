"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@/hooks/useChat"
import { useDocuments } from "@/hooks/useDocuments"
import { MessageBubble } from "@/components/MessageBubble"
import { DocumentSidebar } from "@/components/DocumentSidebar"

export default function Home() {
  const { messages, isLoading, sendMessage } = useChat()
  const { documents, isUploading, uploadDocument, removeDocument } = useDocuments()
  const [input, setInput] = useState<string>("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const question = input
    setInput("")
    await sendMessage(question)
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
      <DocumentSidebar
        documents={documents}
        isUploading={isUploading}
        onUpload={uploadDocument}
        onRemove={removeDocument}
      />

      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Ask anything</h2>
            <p className="text-xs text-gray-500">
              {documents.length} document{documents.length !== 1 ? "s" : ""} loaded · {messages.length} messages
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-20">
              {documents.length === 0
                ? "Upload a document to get started."
                : "Ask a question about your documents."}
            </p>
          )}
          {messages.map(m => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>

{documents.length === 0 && (
  <p className="text-center text-xs text-amber-500 px-4 pb-2 max-w-2xl mx-auto w-full">
    Upload a document to start chatting.
  </p>
)}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2 max-w-2xl mx-auto w-full"
        >
          <input
            className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading || documents.length === 0}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || documents.length === 0}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  )
}