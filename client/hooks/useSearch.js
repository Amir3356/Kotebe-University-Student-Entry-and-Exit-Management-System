import { useState, useMemo } from 'react'
import { matches } from '../utils/format'

/**
 * Custom hook for managing search query and filtering an array of items.
 * @param {Array} items - List of objects to filter
 * @param {Function} fieldExtractor - Function returning array of string fields to match against
 */
export function useSearch(items = [], fieldExtractor) {
  const [query, setQuery] = useState('')

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    return items.filter((item) => {
      const fields = fieldExtractor ? fieldExtractor(item) : Object.values(item)
      return matches(query, ...(Array.isArray(fields) ? fields : [fields]))
    })
  }, [items, query, fieldExtractor])

  return {
    query,
    setQuery,
    filteredItems,
    clearQuery: () => setQuery(''),
  }
}

export default useSearch
