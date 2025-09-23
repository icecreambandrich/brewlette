'use client'

import { useState, useEffect } from 'react'
// import Image from 'next/image'
import CoffeeSpinner from '@/components/CoffeeSpinner'
import CoffeeShopCard from '@/components/CoffeeShopCard'
import LocationInput from '@/components/LocationInput'

interface CoffeeShop {
  id: number
  name: string
  address: string
  postcode: string | null
  reviewCount: number | null
  rating: number
  lat: number | null
  lng: number | null
  distance: number | null
}

interface SpinResult {
  shop: CoffeeShop
  totalShopsInRange: number
}

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number>(5) // Default 5 minutes
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentSpins, setRecentSpins] = useState<CoffeeShop[]>([])

  // Load recent spins from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('brewlette-recent-spins')
    if (saved) {
      try {
        setRecentSpins(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading recent spins:', e)
      }
    }
  }, [])

  // Save recent spins to localStorage
  // const saveRecentSpin = (shop: CoffeeShop) => {
  //   const updated = [shop, ...recentSpins.filter(s => s.id !== shop.id)].slice(0, 5)
  //   setRecentSpins(updated)
  //   localStorage.setItem('brewlette-recent-spins', JSON.stringify(updated))
  // }

  const handleSpin = async () => {
    if (!location) {
      setError('Please set your location first')
      return
    }

    setIsSpinning(true)
    setError(null)
    setResult(null)

    try {
      // Convert walking time to radius: 5min = 800m, 10min = 1600m
      const radius = distance === 5 ? 800 : 1600

      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          radius: radius
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to find coffee shop')
      }

      const data = await response.json()
      setResult(data)

      // Save to recent spins
      const newSpin = data.shop
      setRecentSpins(prev => {
        const updated = [newSpin, ...prev.filter(shop => shop.id !== newSpin.id)]
        const limited = updated.slice(0, 5)
        localStorage.setItem('recentSpins', JSON.stringify(limited))
        return limited
      })

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSpinning(false)
    }
  }

  const handleSpinAgain = () => {
    setResult(null)
    handleSpin()
  }

  const handleCopyShop = async (shop: CoffeeShop) => {
    const textToCopy = `${shop.name}${shop.postcode ? ` - ${shop.postcode}` : ''}`
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      // You could add a toast notification here if desired
      console.log('Copied to clipboard:', textToCopy)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
{/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/coffee-background.jpg"
          alt="Coffee background"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.6)' }}
        />
      </div>
      
      {/* Gradient overlay for better text readability and focus on center */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/50"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="inline-block p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <span className="text-6xl">☕</span>
            </div>
          </div>
          <h1 className="text-6xl font-black text-white mb-2 drop-shadow-lg text-center w-full flex justify-center" style={{fontFamily: 'serif', letterSpacing: '0.15em'}}>
            <span>BREWLETTE</span>
          </h1>
          <p className="text-white/90 text-xl font-black drop-shadow-md" style={{fontFamily: 'serif'}}>
            One spin, one coffee, endless choices
          </p>
        </div>

        {/* Location Input */}
        <LocationInput
          onLocationChange={setLocation}
          distance={distance}
          onDistanceChange={setDistance}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-white px-4 py-3 rounded-xl mb-6 shadow-lg">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Spin Button or Spinner */}
        {!result && (
          <div className="mb-5">
            {isSpinning ? (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
                <CoffeeSpinner />
              </div>
            ) : (
              <button
                onClick={handleSpin}
                disabled={!location || isSpinning}
                className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:bg-gray-500/20 text-white font-bold py-3 px-4 rounded-2xl text-sm shadow-xl transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed border border-white/20 hover:border-white/40"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">🎲</span>
                  <span className="text-xl">Spin for Coffee</span>
                  <span className="text-xl">☕</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Result */}
        {result && !isSpinning && (
          <div className="space-y-6">
            <CoffeeShopCard shop={result.shop} />
            
            <div>
              <button
                onClick={handleSpinAgain}
                className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold py-3 px-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">🎲</span>
                  <span className="text-xl">Spin Again</span>
                </div>
              </button>
            </div>

            <div className="text-center text-white/80 bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <span className="text-lg">
                Found {result.totalShopsInRange} coffee shops within {distance} minute{distance !== 1 ? 's' : ''} walk
              </span>
            </div>
          </div>
        )}

        {/* Recent Spins */}
        {recentSpins.length > 0 && !isSpinning && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-lg">
              Recent Discoveries
            </h2>
            <div className="space-y-3">
              {recentSpins.slice(0, 3).map((shop) => (
                <div key={shop.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 relative">
                  <div className="font-bold text-white text-lg pr-12">
                    {shop.name}
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    📍 {shop.postcode || 'No postcode'} • ⭐ {shop.rating} • {shop.reviewCount || 0} reviews
                  </div>
                  <button
                    onClick={() => handleCopyShop(shop)}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Copy cafe name and postcode"
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
