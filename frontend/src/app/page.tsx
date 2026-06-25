"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@/hooks/useChat"
import { MessageBubble } from "@/components/MessageBubble"

export default function Home() {
  // useChat() returns three things, bundled in an object.
  // We destructure all three at once.
  const { messages, isLoading, sendMessage } = useChat()
  
  // This tracks what's currently typed in the input box.
  const [input, setInput] = useState<string>("")

  // useRef gives us a direct reference to a DOM element — in this
  // case, an invisible div at the bottom of the chat. We use it to
  // auto-scroll down whenever a new message arrives.
  const bottomRef = useRef<HTMLDivElement>(null)

  // useEffect runs side-effect code AFTER React renders.
  // The [messages] at the end means: "run this again every time
  // the messages array changes" — i.e. every time a new token
  // streams in or a new message is added.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // React.FormEvent is the type for a form submission event.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()   // stops the page from reloading (default HTML form behavior)
    if (!input.trim() || isLoading) return
    
    const question = input
    setInput("")          // clear the box immediately, feels responsive
    await sendMessage(question)
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-white">
      <header className="p-4 border-b border-gray-800">
        <h1 className="font-semibold text-lg">DocPilot</h1>
        <p className="text-xs text-gray-500">RAG-powered support agent</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-20">
            Ask a question about your uploaded documents.
          </p>
        )}
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-800 flex gap-2 max-w-2xl mx-auto w-full"
      >
        <input
          className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          placeholder="Ask anything about your documents..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-[#7c3aed] text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-[#6d28d9] transition-colors"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  )
}