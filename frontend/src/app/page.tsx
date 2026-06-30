"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@/hooks/useChat"
import { useDocuments } from "@/hooks/useDocuments"
import { MessageBubble } from "@/components/MessageBubble"
import { DocumentSidebar } from "@/components/DocumentSidebar"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function Home() {
  const { messages, isLoading, sendMessage, clearChat } = useChat()
  const { documents, isUploading, isLoadingDocuments, uploadDocument, removeDocument } = useDocuments()
  const [input, setInput] = useState<string>("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

const inputRef = useRef<HTMLInputElement>(null)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!input.trim() || isLoading) return
  const question = input
  setInput("")
  await sendMessage(question)
  
}
useEffect(() => {
  if (!isLoading) {
    inputRef.current?.focus()
  }
}, [isLoading])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
      <DocumentSidebar
  documents={documents}
  isUploading={isUploading}
  isLoadingDocuments={isLoadingDocuments}
  onUpload={uploadDocument}
  onRemove={removeDocument}
/>

      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
  <div>
    <h2 className="font-semibold text-base">Ask anything</h2>
    <p className="text-sm text-gray-500">
      {documents.length} document{documents.length !== 1 ? "s" : ""} loaded · {messages.length} messages
    </p>
  </div>
  <div className="flex items-center gap-3">
    {messages.length > 0 && (
      <button
  onClick={clearChat}
  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
>
  Clear chat
</button>
    )}
    <ThemeToggle />
  </div>
</header>

        <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-base mt-20">
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
          <p className="text-center text-sm text-amber-500 px-4 pb-2 max-w-4xl mx-auto w-full">
            Upload a document to start chatting.
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2 max-w-4xl mx-auto w-full"
        >
          <input
            ref={inputRef}
            className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading || documents.length === 0}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || documents.length === 0}
            className="bg-blue-600 text-white rounded-lg px-5 py-2.5 text-base font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 pb-3">
  DocPilot can make mistakes. Verify important information.
</p>
      </div>
    </div>
  )
}