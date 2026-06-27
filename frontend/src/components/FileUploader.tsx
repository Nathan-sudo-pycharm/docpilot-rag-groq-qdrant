"use client"

import { useState, useCallback } from "react"

interface Props {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

export function FileUploader({ onUpload, isUploading }: Props) {
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // React.DragEvent<HTMLDivElement> types this event specifically as
  // a drag event happening on a <div> element — TypeScript knows
  // exactly which properties/methods are available on `e` because
  // of this specific type.
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type === "application/pdf") {
        onUpload(file)
      }
    },
    [onUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // ?. is "optional chaining" — if e.target.files is null,
      // this whole expression short-circuits to undefined instead
      // of throwing an error trying to access [0] on null.
      const file = e.target.files?.[0]
      if (file) {
        onUpload(file)
      }
    },
    [onUpload]
  )

return (
    <div
      onDragOver={e => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        border border-dashed rounded-lg p-5 text-center transition-colors
        ${isDragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
          : "border-gray-300 dark:border-gray-700"
        }
      `}
    >
      {isUploading ? (
        <p className="text-base text-gray-500">Uploading...</p>
      ) : (
        <>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Drop PDF here or{" "}
            <label className="text-blue-600 cursor-pointer hover:underline">
              browse
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </p>
          <p className="text-sm text-gray-400 mt-1">PDF up to 25 MB</p>
        </>
      )}
    </div>
  )
}