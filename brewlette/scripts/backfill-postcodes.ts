import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocodeByAddress(address: string, attempt = 1): Promise<{ lat: number, lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&q=${encodeURIComponent(address)}`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Brewlette Backfill Script'
    }
  })
  if (res.status === 429) {
    const wait = Math.min(1500 * attempt, 8000)
    console.warn(`Nominatim rate limited. Waiting ${wait}ms...`)
    await sleep(wait)
    return geocodeByAddress(address, attempt + 1)
  }
  if (!res.ok) return null
  const data = await res.json()
  const first = data?.[0]
  if (!first) return null
  if (typeof first.lat === 'string' && typeof first.lon === 'string') {
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
  }
  return null
}

async function fetchQueryFallback(query: string, attempt = 1): Promise<{ lat: number, lng: number } | null> {
  const url = `https://api.postcodes.io/postcodes?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Brewlette Backfill Script'
    }
  })

  if (res.status === 429) {
    const wait = Math.min(2000 * attempt, 10000)
    console.warn(`Query fallback rate limited. Waiting ${wait}ms...`)
    await sleep(wait)
    return fetchQueryFallback(query, attempt + 1)
  }

  if (!res.ok) return null
  const data = await res.json()
  const first = data?.result?.[0]
  if (!first) return null
  if (typeof first.latitude === 'number' && typeof first.longitude === 'number') {
    return { lat: first.latitude, lng: first.longitude }
  }
  return null
}

function normalizePostcode(pc: string): string {
  return pc.trim().toUpperCase().replace(/\s+/g, '')
}

function looksLikePostcode(pc: string): boolean {
  // Very loose UK postcode check (accepts outward-only too). We'll rely on API to be strict.
  const s = pc.trim().toUpperCase()
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(s) // full
    || /^[A-Z]{1,2}\d[A-Z\d]?$/.test(s) // outward-only like EC4M
}

async function fetchBulkPostcodes(postcodes: string[], attempt = 1): Promise<any> {
  const url = 'https://api.postcodes.io/postcodes'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Brewlette Backfill Script'
    },
    body: JSON.stringify({ postcodes })
  })

  if (res.status === 429) {
    const wait = Math.min(2000 * attempt, 10000)
    console.warn(`Rate limited (429). Waiting ${wait}ms and retrying...`)
    await sleep(wait)
    return fetchBulkPostcodes(postcodes, attempt + 1)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`postcodes.io error ${res.status}: ${text}`)
  }

  return res.json()
}

async function main() {
  const needsCoords = await prisma.coffeeShop.findMany({
    where: {
      AND: [
        { postcode: { not: null } },
        { postcode: { not: '' } },
        { OR: [ { lat: null }, { lng: null } ] }
      ]
    },
    select: { id: true, postcode: true }
  })

  if (needsCoords.length === 0) {
    console.log('All shops already have coordinates. Nothing to do.')
    return
  }

  const map = new Map<string, number[]>()
  for (const s of needsCoords) {
    const key = normalizePostcode(s.postcode as string)
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s.id)
  }

  const uniquePostcodes = Array.from(map.keys())
  console.log(`Unique postcodes needing coords: ${uniquePostcodes.length}`)

  const chunkSize = 100
  let updated = 0
  let missing = 0
  let invalid = 0
  let fallbackHits = 0
  let addressHits = 0

  for (let i = 0; i < uniquePostcodes.length; i += chunkSize) {
    const chunk = uniquePostcodes.slice(i, i + chunkSize)
    try {
      const data = await fetchBulkPostcodes(chunk)
      const results: Array<{ query: string, result: any }> = data.result || []

      for (const item of results) {
        const q = normalizePostcode(item.query)
        const ids = map.get(q) || []
        let lat: number | null = null
        let lng: number | null = null

        if (item.result && typeof item.result.latitude === 'number' && typeof item.result.longitude === 'number') {
          lat = item.result.latitude
          lng = item.result.longitude
        } else {
          // Fallback to query search for this postcode
          const fb = await fetchQueryFallback(q)
          if (fb) {
            lat = fb.lat
            lng = fb.lng
            fallbackHits += ids.length
          }
        }

        if (lat == null || lng == null) {
          // Try a last-ditch: if it doesn't even look like a postcode, mark invalid
          if (!looksLikePostcode(q)) invalid += ids.length
          else missing += ids.length
          continue
        }

        if (ids.length > 0) {
          const res = await prisma.coffeeShop.updateMany({
            where: { id: { in: ids } },
            data: { lat, lng }
          })
          updated += res.count
        }
      }
    } catch (err) {
      console.error('Bulk request failed for chunk', i / chunkSize, err)
    }

    // Gentle pacing to avoid limits
    await sleep(300)
  }

  // Final stage: address fallback for any shops still missing coords (including shops without postcodes)
  const unresolved = await prisma.coffeeShop.findMany({
    where: { OR: [ { lat: null }, { lng: null } ] },
    select: { id: true, name: true, address: true, postcode: true }
  })

  for (const row of unresolved) {
    const q = `${row.name ? row.name + ', ' : ''}${row.address || ''}, UK`
    const g = await geocodeByAddress(q)
    if (g) {
      await prisma.coffeeShop.update({ where: { id: row.id }, data: { lat: g.lat, lng: g.lng } })
      addressHits += 1
      updated += 1
      await sleep(250)
    }
  }

  console.log('Backfill complete:')
  console.log(`  Updated shops: ${updated}`)
  console.log(`  Fallback matches: ${fallbackHits}`)
  console.log(`  Address matches: ${addressHits}`)
  console.log(`  Missing/Unmatched: ${missing}`)
  console.log(`  Invalid-looking postcodes: ${invalid}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
