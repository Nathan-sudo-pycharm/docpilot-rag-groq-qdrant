"use client"

import { useState, useCallback } from "react"
import type { Document } from "@/types"
import { ingestDocument, deleteDocument } from "@/lib/api"

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const uploadDocument = useCallback(async (file: File) => {
    setIsUploading(true)
    try {
      const result = await ingestDocument(file)

      // Build a new Document object from the upload response,
      // and add it to the front of the list so the newest
      // upload appears at the top of the sidebar.
      const newDoc: Document = {
        filename: result.filename,
        chunkCount: result.ingested_chunks,
        uploadedAt: new Date(),
      }

      setDocuments(prev => [newDoc, ...prev])
    } finally {
      setIsUploading(false)
    }
  }, [])

  const removeDocument = useCallback(async (filename: string) => {
    await deleteDocument(filename)

    // Remove the document from our local list by filtering it out.
    // .filter() returns a NEW array with everything except items
    // that match the condition — this is the standard React pattern
    // for removing an item from state without mutating the original array.
    setDocuments(prev => prev.filter(doc => doc.filename !== filename))
  }, [])

  return { documents, isUploading, uploadDocument, removeDocument }
}