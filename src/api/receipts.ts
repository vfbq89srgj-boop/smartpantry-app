/*
  Receipt scan – talks to Benny's backend: POST /api/v1/Receipts (multipart, field "image").
  Response = FileAnalysisDto (see Smart-Pantry/items/FileAnalysisDto.cs).

  DEMO MODE: if VITE_API_URL is not set, we return a fake analysis
  after a short delay, so the screens can be tested without the backend.
*/
import type { StoragePlace } from '../data/pantry'
import { apiConfigured, apiFetch } from './client'
import { inDays } from '../lib/date'

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
}

/** Error with a message we can show to the user (MVP step 1: error handling) */
export class ScanError extends Error {}

export async function analyzeReceipt(image: Blob): Promise<ReceiptAnalysis> {
  if (!apiConfigured) return demoAnalysis()

  const form = new FormData()
  form.append('image', image, 'receipt.jpg')

  let res: Response
  try {
    res = await apiFetch('/api/v1/Receipts', { method: 'POST', body: form })
  } catch {
    throw new ScanError('No connection to the server. Check your internet and try again.')
  }

  if (res.ok) return (await res.json()) as ReceiptAnalysis

  // Status codes from ReceiptEndpoints.cs
  switch (res.status) {
    case 400: throw new ScanError('This file can’t be used. Please take a photo (JPEG or PNG, max. 10 MB).')
    case 401: throw new ScanError('Your login has expired. Please sign in again.')
    case 422: throw new ScanError('We couldn’t find any groceries on this photo. Please retake it with good light.')
    case 504: throw new ScanError('The AI took too long. Please try again.')
    default: throw new ScanError('The AI is not available right now. Please try again in a moment.')
  }
}

// ---------- Demo data ----------

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
