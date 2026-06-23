// In JavaScript, you might create an object like this:
//   const message = { id: "1", role: "user", content: "hello" }
// and just hope every message object has the right fields.
//
// In TypeScript, an "interface" is a contract. It says:
// "any object claiming to be a Message MUST have exactly these fields,
// with exactly these types. If it doesn't, the compiler will refuse
// to run your code."

export interface Message {
  id: string                        // a text value, e.g. "abc-123"
  role: "user" | "assistant"        // can ONLY be one of these two exact strings
  content: string                   // the actual message text
  isStreaming?: boolean             // the ? makes this field OPTIONAL
}

// This describes exactly what shape of data comes back from our
// backend's POST /ingest endpoint. Compare this to the Python response:
//   return {"ingested_chunks": len(points), "filename": file.filename}
// TypeScript's job is to make sure your frontend code expects exactly
// this shape — no typos, no guessing field names.

export interface IngestResponse {
  ingested_chunks: number
  filename: string
}