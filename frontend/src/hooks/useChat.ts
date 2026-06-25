// "use client" tells Next.js: this file runs in the BROWSER, not on
// the server. By default, Next.js 14 renders components on the server
// first (React Server Components) — but server-side code can't use
// useState, useEffect, or browser-only features like fetch streaming.
// Any file using React hooks needs this directive at the very top.
"use client"

import { useState, useCallback } from "react"
import type { Message } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export function useChat() {
  // useState<Message[]> means: this piece of state holds an ARRAY
  // of Message objects. TypeScript will now stop you from accidentally
  // putting anything else (a string, a number, the wrong shape) into
  // this array — the compiler enforces it.
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // useCallback "memoizes" this function — meaning React keeps the
  // same function reference across re-renders instead of recreating
  // it every time. The empty array [] at the end means "never recreate
  // this function — it doesn't depend on anything that changes."
  const sendMessage = useCallback(async (question: string) => {
    
    // Build the user's message object — appears instantly in the UI
    const userMessage: Message = {
      id: crypto.randomUUID(),   // browser's built-in random ID generator
      role: "user",
      content: question,
    }

    // Build a placeholder for the assistant's reply. It starts EMPTY —
    // we'll fill in its content character by character as tokens arrive.
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      isStreaming: true,   // this flags the UI to show a blinking cursor
    }

    // Add both messages to the array immediately. This is called
    // "optimistic UI" — we show the user's message right away rather
    // than waiting for any server response.
    setMessages(prev => [...prev, userMessage, assistantMessage])
    setIsLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
      }

      // res.body is a ReadableStream — raw bytes arriving over time.
      // getReader() gives us a way to pull chunks of those bytes
      // out one at a time as they arrive, instead of waiting for
      // the entire response to finish.
      const reader = res.body!.getReader()
      
      // The server sends raw bytes (Uint8Array). TextDecoder converts
      // those bytes into readable text.
      const decoder = new TextDecoder()

      // This loop runs forever until the stream is finished (done = true)
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const rawChunk = decoder.decode(value)
        
        // The backend sends lines like: "data: Hello\n\ndata:  world\n\n"
        // We split by newline, then keep only lines that start with "data: "
        const lines = rawChunk
          .split("\n")
          .filter(line => line.startsWith("data: "))

        for (const line of lines) {
          const token = line.replace("data: ", "")

          if (token === "[DONE]") {
            // The backend's sentinel value — tells us the stream is over.
            // Flip isStreaming to false so the blinking cursor disappears.
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessage.id
                  ? { ...m, isStreaming: false }
                  : m
              )
            )
            break
          }

          // Append this token onto the assistant message's existing content.
          // We use .map() to find the right message by id and update
          // just that one — React state should never be mutated directly.
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, content: m.content + token }
                : m
            )
          )
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { messages, isLoading, sendMessage }
}