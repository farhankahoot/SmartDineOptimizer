export type ClassValue = string | false | null | undefined | ClassValue[]

/** Tiny classname joiner — keeps component files readable without pulling a dep. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  for (const v of values) {
    if (!v) continue
    if (Array.isArray(v)) {
      const nested = cn(...v)
      if (nested) out.push(nested)
    } else {
      out.push(v)
    }
  }
  return out.join(' ')
}
