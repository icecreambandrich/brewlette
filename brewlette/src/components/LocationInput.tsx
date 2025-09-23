'use client'

import { useState, useEffect } from 'react'

interface LocationInputProps {
  onLocationChange: (location: { lat: number; lng: number } | null) => void
  distance: number
  onDistanceChange: (distance: number) => void
}

export default function LocationInput({ 
  onLocationChange, 
  distance, 
  onDistanceChange 
}: LocationInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [hasLocation, setHasLocation] = useState(false)
  const [postcode, setPostcode] = useState('')
  const [isGeocodingPostcode, setIsGeocodingPostcode] = useState(false)
  const [locationMethod, setLocationMethod] = useState<'gps' | 'postcode'>('gps')

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    setIsGettingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        onLocationChange(location)
        setHasLocation(true)
        setIsGettingLocation(false)
      },
      (error) => {
        let errorMessage = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        setLocationError(errorMessage)
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Geocode postcode using UK postcodes.io (consistent with API)
  const geocodePostcode = async () => {
    const raw = postcode.trim()
    if (!raw) {
      setLocationError('Please enter a postcode')
      return
    }

    // Basic normalisation (uppercase, collapse spaces)
    const normalised = raw.toUpperCase().replace(/\s+/g, '')

    setIsGeocodingPostcode(true)
    setLocationError(null)

    try {
      const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(normalised)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Geocoding service unavailable')
      const data = await res.json()
      if (!data || data.status !== 200 || !data.result) {
        throw new Error('Postcode not found. Please check and try again.')
      }

      const location = {
        lat: data.result.latitude,
        lng: data.result.longitude,
      }

      onLocationChange(location)
      setHasLocation(true)
      setLocationError(null)
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Failed to find postcode')
    } finally {
      setIsGeocodingPostcode(false)
    }
  }

  // Try to get location on mount only if GPS method is selected
  useEffect(() => {
    if (locationMethod === 'gps') {
      getCurrentLocation()
    }
  }, [locationMethod, getCurrentLocation])

  return (
    <div className="space-y-2 mb-5">
      {/* Location Method Selection */}
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20 overflow-hidden">
        <h3 className="font-bold text-white mb-3 text-sm drop-shadow-md text-center">
          Choose Location Method
        </h3>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setLocationMethod('gps')}
            className={`py-1.5 px-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg ${
              locationMethod === 'gps'
                ? 'bg-white/30 text-white border-2 border-white/40'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border-2 border-white/20'
            }`}
          >
            GPS
          </button>
          <button
            onClick={() => setLocationMethod('postcode')}
            className={`py-1.5 px-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg ${
              locationMethod === 'postcode'
                ? 'bg-white/30 text-white border-2 border-white/40'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border-2 border-white/20'
            }`}
          >
            Postcode
          </button>
        </div>

        {/* Error Messages Only */}
        {locationError && (
          <div className="text-red-300 text-sm mb-3 bg-red-500/20 rounded-lg p-2">
            ⚠️ {locationError}
          </div>
        )}

        {/* GPS Method */}
        {locationMethod === 'gps' && (
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full bg-white/20 hover:bg-white/30 disabled:bg-gray-500/20 text-white font-bold text-sm py-2 px-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg border border-white/20"
          >
            {isGettingLocation ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Getting location...</span>
              </span>
            ) : hasLocation ? (
              'Update GPS Location'
            ) : (
              'Use My Current Location'
            )}
          </button>
        )}

        {/* Postcode Method */}
        {locationMethod === 'postcode' && (
          <div className="space-y-2">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              placeholder="Enter postcode (e.g. SW1A 1AA)"
              className="w-full px-3 py-2 border-2 border-white/20 rounded-xl bg-white/10 text-white text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  geocodePostcode()
                }
              }}
            />
            <button
              onClick={geocodePostcode}
              disabled={isGeocodingPostcode || !postcode.trim()}
              className="w-full bg-white/20 hover:bg-white/30 disabled:bg-gray-500/20 text-white font-bold text-sm py-2 px-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg border border-white/20"
            >
              {isGeocodingPostcode ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Finding postcode...</span>
                </span>
              ) : (
                'Use This Postcode'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Distance Selection */}
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
        <h3 className="font-bold text-white mb-2 text-sm drop-shadow-md text-center">
          Walking Distance
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {[300, 600].map((meters) => (
            <button
              key={meters}
              onClick={() => onDistanceChange(meters)}
              className={`py-1.5 px-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg ${
                distance === meters
                  ? 'bg-white/30 text-white border-2 border-white/40'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border-2 border-white/20'
              }`}
            >
              {meters}m
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
