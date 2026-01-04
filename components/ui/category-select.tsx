'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CATEGORIES } from '@/lib/constants/categories'

interface CategorySelectProps {
  selectedCategories: string[]
  onChange: (categories: string[]) => void
  maxCategories?: number
}

export function CategorySelect({
  selectedCategories,
  onChange,
  maxCategories = 5,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false)

  const toggleCategory = (value: string) => {
    if (selectedCategories.includes(value)) {
      onChange(selectedCategories.filter((c) => c !== value))
    } else {
      if (selectedCategories.length < maxCategories) {
        onChange([...selectedCategories, value])
      }
    }
  }

  const removeCategory = (value: string) => {
    onChange(selectedCategories.filter((c) => c !== value))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-left font-normal"
          >
            {selectedCategories.length === 0
              ? 'Select categories...'
              : `${selectedCategories.length} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="max-h-64 overflow-auto p-2">
            <div className="space-y-1">
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.value)
                const isDisabled =
                  !isSelected && selectedCategories.length >= maxCategories

                return (
                  <button
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    disabled={isDisabled}
                    className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    } ${isSelected ? 'bg-accent' : ''}`}
                  >
                    <span>{category.label}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>
          </div>
          {selectedCategories.length >= maxCategories && (
            <div className="border-t p-2 text-xs text-muted-foreground text-center">
              Maximum {maxCategories} categories allowed
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((value) => {
            const category = CATEGORIES.find((c) => c.value === value)
            return (
              <Badge
                key={value}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => removeCategory(value)}
              >
                {category?.label || value}
                <span className="ml-1">×</span>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
