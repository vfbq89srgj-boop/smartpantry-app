/*
  Receipt scan – talks to Benny's backend: POST /api/v1/Receipts (multipart, field "image").
  Response = FileAnalysisDto (see Smart-Pantry/items/FileAnalysisDto.cs).

  DEMO MODE: if VITE_API_URL is not set, we return a fake analysis
  after a short delay, so the screens can be tested without the backend.
*/
import type { StoragePlace } from '../data/pantry'
import { apiConfigured, apiFetch } from './client'

/** One item as the AI returns it (FoodItemDto) */
export interface ScannedItem {
  name: string
  unreadable: boolean
  quantity: number | null
  category: string
  suggestedStoragePlace: StoragePlace | null
  storageNote: string | null
  expirationDate: string | null
  expirationDateEstimated: boolean
  estimationNote: string | null
}

/** The whole analysis (FileAnalysisDto) */
export interface ReceiptAnalysis {
  referenceDate: string
  referenceDateSource: string
  items: ScannedItem[]
  /** SHA-256 of the file (64 hex chars). Send it back unchanged with POST /Items so duplicates are detected. */
  fileHash?: string | null
}

/** Error with a message we can show to the user (MVP step 1: error handling) */
export class ScanError extends Error {}

/** 409: this receipt was already saved. The user may still choose "Add anyway" (force = true). */
export class DuplicateReceiptError extends ScanError {
  constructor(public savedOn: string | null) {
    super(savedOn ? `This receipt was already saved on ${savedOn}.` : 'This receipt was already saved.')
  }
}

export async function analyzeReceipt(image: Blob, force = false): Promise<ReceiptAnalysis> {
  if (!apiConfigured) return demoAnalysis()

  const form = new FormData()
  form.append('image', image, 'receipt.jpg')

  let res: Response
  try {
    res = await apiFetch(`/api/v1/Receipts${force ? '?force=true' : ''}`, { method: 'POST', body: form })
  } catch {
    throw new ScanError('No connection to the server. Check your internet and try again.')
  }

  if (res.ok) return (await res.json()) as ReceiptAnalysis

  // Status codes from ReceiptEndpoints.cs
  if (res.status === 409) {
    const body = (await res.json().catch(() => null)) as { code?: string; message?: string } | null
    // message: "This file was already saved (reference date 2026-11-21). …"
    throw new DuplicateReceiptError(body?.message?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null)
  }
  switch (res.status) {
    case 400: throw new ScanError('This file can’t be used. Please take a photo (JPEG or PNG, max. 10 MB).')
    case 401: throw new ScanError('Your login has expired. Please sign in again.')
    case 422: throw new ScanError('We couldn’t find any groceries on this photo. Please retake it with good light.')
    case 504: throw new ScanError('The AI took too long. Please try again.')
    default: throw new ScanError('The AI is not available right now. Please try again in a moment.')
  }
}

// ---------- Demo data ----------
function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function demoAnalysis(): Promise<ReceiptAnalysis> {
  await new Promise((r) => setTimeout(r, 1800)) // pretend the AI is thinking
  const item = (name: string, quantity: number | null, category: string, place: StoragePlace, days: number, estimated = true): ScannedItem => ({
    name, unreadable: false, quantity, category, suggestedStoragePlace: place, storageNote: null,
    expirationDate: inDays(days), expirationDateEstimated: estimated, estimationNote: null,
  })
  return {
    referenceDate: inDays(0),
    referenceDateSource: 'image',
    items: [
      item('Fresh whole milk', 1, 'fresh_milk', 'Refrigerator', 6),
      item('Chicken breast', 1, 'meat', 'Refrigerator', 2, false),
      item('Cherry tomatoes', 1, 'vegetables', 'Room Temperature', 7),
      item('Mozzarella', 2, 'cheese', 'Refrigerator', 14, false),
      item('Basmati rice', 1, 'dry_goods', 'Pantry', 540),
      {
        name: 'Unreadable item', unreadable: true, quantity: null, category: 'other', suggestedStoragePlace: null,
        storageNote: null, expirationDate: null, expirationDateEstimated: false, estimationNote: null,
      },
    ],
  }
}
