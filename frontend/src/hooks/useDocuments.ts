"use client"

import { useState, useCallback, useEffect } from "react"
import type { Document } from "@/types"
import { ingestDocument, deleteDocument, listDocuments } from "@/lib/api"

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState<boolean>(true)

  useEffect(() => {
    async function loadExistingDocuments() {
      try {
        const summaries = await listDocuments()
        const docs: Document[] = summaries.map(s => ({
          filename: s.filename,
          chunkCount: s.chunk_count,
          uploadedAt: new Date(),
        }))
        setDocuments(docs)
      } catch (error) {
        console.error("Failed to load existing documents:", error)
      } finally {
        setIsLoadingDocuments(false)
      }
    }

    loadExistingDocuments()
  }, [])

  const uploadDocument = useCallback(async (file: File) => {
    setIsUploading(true)
    try {
      const result = await ingestDocument(file)
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
    setDocuments(prev => prev.filter(doc => doc.filename !== filename))
  }, [])

  return { documents, isUploading, isLoadingDocuments, uploadDocument, removeDocument }
}