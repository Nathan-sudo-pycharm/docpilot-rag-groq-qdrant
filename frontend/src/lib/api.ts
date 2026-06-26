// process.env.NEXT_PUBLIC_API_URL reads the value from .env.local
// The ! at the end is called a "non-null assertion." It tells
// TypeScript: "trust me, this value will exist — don't make me
// check for undefined every time I use it." We're allowed to use
// it here because we know we set this value ourselves above.
const API_URL = process.env.NEXT_PUBLIC_API_URL!

// We import the type we defined earlier. This tells TypeScript
// exactly what shape of object this function will return.
import type { IngestResponse } from "@/types"

// async function = a function that does something that takes time
// (like a network request) without freezing the whole page while waiting.
//
// (file: File) means this function takes one parameter called `file`,
// and it must be of type `File` — the browser's built-in type for
// an actual file the user selected (like from a file picker).
//
// : Promise<IngestResponse> means: "this function will eventually
// give back an IngestResponse — but not immediately, since it has
// to wait for the network request to finish."
export async function ingestDocument(file: File): Promise<IngestResponse> {
  // FormData is how browsers package up a file to send over HTTP —
  // the same format an HTML <form> uses when you upload a file.
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_URL}/ingest`, {
    method: "POST",
    body: formData,
    // We deliberately do NOT set Content-Type here.
    // The browser sets it automatically for FormData, including a
    // special "boundary" string the server needs to parse the file
    // correctly. Setting it manually would actually break things.
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail ?? "Ingestion failed")
  }

  // res.json() returns `any` by default in plain JavaScript.
  // Because we declared this function's return type as
  // Promise<IngestResponse>, TypeScript will warn us if we ever
  // try to use a field that doesn't exist on IngestResponse.
  return res.json()
}


// Deletes a document and all its chunks from the backend.
// We don't expect any data back, just confirmation it succeeded —
// so the return type is Promise<void> (a promise that resolves
// with nothing meaningful).
export async function deleteDocument(filename: string): Promise<void> {
  const res = await fetch(`${API_URL}/ingest/${filename}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    throw new Error("Failed to delete document")
  }
}