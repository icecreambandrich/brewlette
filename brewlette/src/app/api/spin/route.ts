import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Haversine formula to calculate distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Lookup nearby postcodes around a location using postcodes.io search endpoint
async function getNearbyPostcodes(lat: number, lng: number, radius: number, limit = 200): Promise<Map<string, {lat: number, lng: number}>> {
  const out = new Map<string, {lat: number, lng: number}>()
  try {
    // postcodes.io radius is in meters, limit max 100 per request – we may paginate if needed
    const cappedLimit = Math.min(limit, 100)
    const url = `https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&radius=${Math.ceil(radius)}&limit=${cappedLimit}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Brewlette Coffee App' } })
    if (!res.ok) return out
    const data = await res.json()
    if (data && data.status === 200 && Array.isArray(data.result)) {
      for (const r of data.result) {
        if (r.postcode && typeof r.latitude === 'number' && typeof r.longitude === 'number') {
          const up = String(r.postcode).trim().toUpperCase()
          const nospace = up.replace(/\s+/g, '')
          const coord = { lat: r.latitude, lng: r.longitude }
          out.set(up, coord)
          out.set(nospace, coord)
        }
      }
    }
  } catch (e) {
    console.error('Nearby postcode lookup error:', e)
  }
  return out
}

// Geocode using UK postcodes.io when a postcode is available (faster and more reliable)
async function geocodeByPostcode(postcode: string): Promise<{lat: number, lng: number} | null> {
  try {
    const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Brewlette Coffee App' } })
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.status === 200 && data.result) {
      return { lat: data.result.latitude, lng: data.result.longitude }
    }
    return null
  } catch (e) {
    console.error('Postcode geocoding error:', e)
    return null
  }
}

interface CoffeeShop {
  id: number
  name: string
  address: string
  postcode: string | null
  reviewCount: number | null
  lat: number | null
  lng: number | null
  rating: number
}

// Simple in-memory shuffle to randomize candidates
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Geocode address using free Nominatim service
async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Brewlette Coffee App'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }

    const data = await response.json()
    
    if (data.length === 0) {
      return null
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Weighted random selection based on rating
function weightedRandomSelect(shops: CoffeeShop[]): CoffeeShop {
  const totalWeight = shops.reduce((sum, shop) => sum + shop.rating, 0)
  let random = Math.random() * totalWeight
  
  for (const shop of shops) {
    random -= shop.rating
    if (random <= 0) {
      return shop
    }
  }
  
  // Fallback to last shop if something goes wrong
  return shops[shops.length - 1]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, radius } = body

    // Validate input
    if (!lat || !lng || !radius) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lng, radius' },
        { status: 400 }
      )
    }

    if (typeof lat !== 'number' || typeof lng !== 'number' || typeof radius !== 'number') {
      return NextResponse.json(
        { error: 'Invalid parameter types. lat, lng, and radius must be numbers' },
        { status: 400 }
      )
    }

    // FAST PATH: DB-only bounding box on existing coordinates (no external calls)
    try {
      const metersPerDegLat = 111_320
      const metersPerDegLng = 111_320 * Math.cos(lat * Math.PI / 180)
      const dLat = radius / metersPerDegLat
      const dLng = radius / metersPerDegLng
      const minLat = lat - dLat
      const maxLat = lat + dLat
      const minLng = lng - dLng
      const maxLng = lng + dLng

      const bboxCandidates = await prisma.coffeeShop.findMany({
        where: {
          AND: [
            { lat: { not: null } },
            { lng: { not: null } },
            { lat: { gte: minLat, lte: maxLat } },
            { lng: { gte: minLng, lte: maxLng } },
          ]
        }
      })

      const bboxFiltered: CoffeeShop[] = []
      for (const s of bboxCandidates) {
        const d = haversineDistance(lat, lng, s.lat as number, s.lng as number)
        if (d <= radius) bboxFiltered.push(s)
      }

      if (bboxFiltered.length > 0) {
        const selectedShop = weightedRandomSelect(bboxFiltered)
        const distance = haversineDistance(lat, lng, selectedShop.lat!, selectedShop.lng!)
        return NextResponse.json({
          shop: {
            id: selectedShop.id,
            name: selectedShop.name,
            address: selectedShop.address,
            postcode: selectedShop.postcode,
            reviewCount: selectedShop.reviewCount,
            rating: selectedShop.rating,
            lat: selectedShop.lat,
            lng: selectedShop.lng,
            distance: Math.round(distance)
          },
          totalShopsInRange: bboxFiltered.length,
          userLocation: { lat, lng },
          note: `Found coffee shop ${Math.round(distance)}m away (${Math.ceil(distance / 160)} min walk)`,
          debug: {
            method: 'bbox',
            candidateCount: bboxCandidates.length,
            filteredCount: bboxFiltered.length
          }
        })
      }
    } catch (e) {
      console.warn('BBox fast-path failed; falling back to external-assisted search', e)
    }

    // Get all coffee shops from database
    const allShops = await prisma.coffeeShop.findMany()

    if (allShops.length === 0) {
      return NextResponse.json(
        { error: 'No coffee shops found in database' },
        { status: 404 }
      )
    }

    // Distance filtering – prefer shops whose postcodes are near the user
    let filteredShops: CoffeeShop[] = []
    // Debug counters
    const withCoordsCountInit = allShops.filter(s => s.lat != null && s.lng != null).length
    const withoutCoordsCountInit = allShops.length - withCoordsCountInit
    let geocodedCount = 0
    let candidatesCount = 0
    let nearPostcodesCount = 0

    const nearbyPostcodes = await getNearbyPostcodes(lat, lng, radius)
    nearPostcodesCount = nearbyPostcodes.size
    if (nearbyPostcodes.size > 0) {
      const nearList = Array.from(nearbyPostcodes.keys())
      const nearListNoSpace = nearList.map(p => p.replace(/\s+/g, ''))
      // Pull only candidates with postcodes close to the user (match both spaced and unspaced formats)
      const candidates = await prisma.coffeeShop.findMany({
        where: { OR: [ { postcode: { in: nearList } }, { postcode: { in: nearListNoSpace } } ] }
      })
      candidatesCount = candidates.length

      for (const s of candidates) {
        let tLat = s.lat ?? null
        let tLng = s.lng ?? null
        if (tLat == null || tLng == null) {
          const key = (s.postcode || '').trim().toUpperCase()
          const keyNoSpace = key.replace(/\s+/g, '')
          const coord = nearbyPostcodes.get(key) || nearbyPostcodes.get(keyNoSpace)
          if (coord) {
            tLat = coord.lat
            tLng = coord.lng
            // Persist for future calls
            await prisma.coffeeShop.update({ where: { id: s.id }, data: { lat: tLat, lng: tLng } })
          }
        }
        if (tLat != null && tLng != null) {
          const d = haversineDistance(lat, lng, tLat, tLng)
          if (d <= radius) {
            filteredShops.push({ ...s, lat: tLat, lng: tLng })
          }
        }
      }
    }

    // If nothing found, fall back to progressive geocoding across the dataset
    if (filteredShops.length === 0) {
      const shopsWithCoords = allShops.filter(s => s.lat != null && s.lng != null)
      const shopsWithoutCoords = allShops.filter(s => s.lat == null || s.lng == null)
      shuffle(shopsWithoutCoords)

      const consider = (shop: CoffeeShop, targetLat: number, targetLng: number) => {
        const d = haversineDistance(lat, lng, targetLat, targetLng)
        if (d <= radius) filteredShops.push({ ...shop, lat: targetLat, lng: targetLng })
      }

      for (const s of shopsWithCoords) consider(s, s.lat as number, s.lng as number)

      const MAX_GEOCODE = 100
      for (const s of shopsWithoutCoords) {
        if (geocodedCount >= MAX_GEOCODE) break
        try {
          let g: {lat: number, lng: number} | null = null
          if (s.postcode) g = await geocodeByPostcode(s.postcode)
          if (!g) g = await geocodeAddress(s.address)
          geocodedCount++
          if (g) {
            await prisma.coffeeShop.update({ where: { id: s.id }, data: { lat: g.lat, lng: g.lng } })
            consider(s, g.lat, g.lng)
          }
        } catch {}
      }
    }

    console.log(`📍 Found ${filteredShops.length} shops within ${radius}m radius`)

    if (filteredShops.length === 0) {
      return NextResponse.json(
        {
          error: 'No coffee shops found within the specified distance',
          suggestion: 'Try increasing your walking distance or choosing a different location',
          debug: {
            nearPostcodes: nearPostcodesCount,
            candidates: candidatesCount,
            initialWithCoords: withCoordsCountInit,
            initialWithoutCoords: withoutCoordsCountInit,
            geocodedCount
          }
        },
        { status: 404 }
      )
    }
    
    // Select a random shop weighted by rating from filtered results
    const selectedShop = weightedRandomSelect(filteredShops)
    const distance = haversineDistance(lat, lng, selectedShop.lat!, selectedShop.lng!)

    return NextResponse.json({
      shop: {
        id: selectedShop.id,
        name: selectedShop.name,
        address: selectedShop.address,
        postcode: selectedShop.postcode,
        reviewCount: selectedShop.reviewCount,
        rating: selectedShop.rating,
        lat: selectedShop.lat,
        lng: selectedShop.lng,
        distance: Math.round(distance) // Distance in meters
      },
      totalShopsInRange: filteredShops.length,
      userLocation: { lat, lng },
      note: `Found coffee shop ${Math.round(distance)}m away (${Math.ceil(distance / 160)} min walk)`,
      debug: {
        nearPostcodes: nearPostcodesCount,
        candidates: candidatesCount,
        initialWithCoords: withCoordsCountInit,
        initialWithoutCoords: withoutCoordsCountInit,
        geocodedCount,
        filteredCount: filteredShops.length
      }
    })

  } catch (error) {
    console.error('Error in /api/spin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
