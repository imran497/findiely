'use client'

import { useState, KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export function TagInput({ tags, onChange, placeholder = 'Type and press comma or enter...', maxTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  // Ensure tags is always an array
  const tagArray = Array.isArray(tags) ? tags : []

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !inputValue && tagArray.length > 0) {
      // Remove last tag if backspace is pressed on empty input
      removeTag(tagArray.length - 1)
    }
  }

  const addTag = () => {
    const trimmedValue = inputValue.trim().replace(/,$/g, '').toLowerCase()

    if (trimmedValue && !tagArray.includes(trimmedValue)) {
      if (maxTags && tagArray.length >= maxTags) {
        return
      }
      onChange([...tagArray, trimmedValue])
      setInputValue('')
    } else {
      setInputValue('')
    }
  }

  const removeTag = (index: number) => {
    const newTags = tagArray.filter((_, i) => i !== index)
    onChange(newTags)
  }

  const handleBlur = () => {
    // Add tag on blur if there's text
    if (inputValue.trim()) {
      addTag()
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[42px] focus-within:ring-1 focus-within:ring-ring">
      {tagArray.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="text-sm pl-2 pr-1 py-1 flex items-center gap-1"
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tagArray.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
        disabled={maxTags ? tagArray.length >= maxTags : false}
      />
    </div>
  )
}
