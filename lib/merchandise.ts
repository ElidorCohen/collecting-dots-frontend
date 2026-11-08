import bundled from "./merchandise.json"

export interface MerchImage { src: string; width: number; height: number; label: string }
export interface MerchProduct {
  id: string
  name: string
  shortName: string
  category: string
  /** Short partner name for the title and tag, e.g. "Float" */
  brand: string
  /** Full partner name for sentences, e.g. "Float Apparel" */
  brandName: string
  url: string
  images: MerchImage[]
}

const FLOAT = { brand: "Float", brandName: "Float Apparel", url: "https://www.floatapparel.co.za/collections/collecting-dots-x-float" }

function webUrl(value: unknown) {
  try { const url = new URL(String(value || "")); return ["http:", "https:"].includes(url.protocol) ? url.href : "" } catch { return "" }
}
const text = (value: unknown) => typeof value === "string" ? value.trim() : ""
const size = (value: unknown, fallback: number) => Number(value) > 0 ? Number(value) : fallback

/** Keeps only products the section can show: a name, a shop link and at least one photo. */
export function normalizeMerch(rows: unknown[]): MerchProduct[] {
  const seen = new Set<string>()
  return rows.flatMap((value, index) => {
    const row = (value ?? {}) as Record<string, unknown>
    const name = text(row.name), shortName = text(row.shortName) || name, url = webUrl(row.url)
    const images = (Array.isArray(row.images) ? row.images : []).flatMap((image: Record<string, unknown>, angle) => {
      const src = webUrl(image?.src)
      return src ? [{ src, width: size(image.width, 1440), height: size(image.height, 1920), label: text(image.label) || `Photo ${angle + 1}` }] : []
    })
    const id = text(row.id) || `product-${index}`
    if (!shortName || !url || !images.length || seen.has(id)) return []
    seen.add(id)
    const brand = text(row.brand) || "Collecting Dots"
    return [{ id, name: name || shortName, shortName, category: text(row.category), brand, brandName: text(row.brandName) || brand, url, images }]
  })
}

/** The six Float pieces the section shipped with; shown until the dashboard's list loads. */
export const BUNDLED_MERCH = normalizeMerch(bundled.map(product => ({ ...FLOAT, ...product })))

export async function fetchMerch(signal: AbortSignal): Promise<MerchProduct[]> {
  const response = await fetch("/api/get-merch-data", { signal })
  const result = await response.json()
  if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error("Merch unavailable")
  const products = normalizeMerch(result.data)
  if (!products.length) throw new Error("No merch to show")
  return products
}
