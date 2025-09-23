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

interface CoffeeShopCardProps {
  shop: CoffeeShop
}

export default function CoffeeShopCard({ shop }: CoffeeShopCardProps) {
  const handleOpenInMaps = () => {
    const query = encodeURIComponent(`${shop.name} ${shop.address}`)
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`
    window.open(url, '_blank')
  }

  const walkingTime = shop.distance ? Math.ceil(shop.distance / 160) : null // 160m per minute

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 transform transition-all duration-300 hover:scale-105">
      <div className="text-center space-y-6">
        {/* Coffee Shop Name */}
        <div className="space-y-2">
          <div className="inline-block p-3 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full mb-2">
            <span className="text-3xl">☕</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 leading-tight">
            {shop.name}
          </h2>
        </div>

        {/* Rating */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl ${
                    i < Math.floor(shop.rating) 
                      ? 'text-yellow-500' 
                      : 'text-gray-300'
                  }`}
                >
                  ⭐
                </span>
              ))}
            </div>
            <span className="text-gray-700 font-bold text-xl">
              {shop.rating}/5
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-gray-800 font-semibold text-lg">
            📍 {shop.address}
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span className="bg-white px-3 py-1 rounded-full">
              {shop.postcode || 'No postcode'}
            </span>
            <span className="bg-white px-3 py-1 rounded-full">
              {shop.reviewCount ? `${shop.reviewCount} reviews` : 'No reviews'}
            </span>
          </div>
        </div>

        {/* Distance */}
        {shop.distance && walkingTime ? (
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl px-6 py-3">
            <span className="text-gray-700 font-bold">
              🚶 {shop.distance}m away • ~{walkingTime} min walk
            </span>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl px-6 py-3">
            <span className="text-gray-700 font-bold">
              ✨ Location-based features coming soon!
            </span>
          </div>
        )}

        {/* Google Maps Button */}
        <button
          onClick={handleOpenInMaps}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-xl transform transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-3"
        >
          <span className="text-xl">🗺️</span>
          <span className="text-lg">Open in Google Maps</span>
          <span className="text-xl">📍</span>
        </button>
      </div>
    </div>
  )
}
