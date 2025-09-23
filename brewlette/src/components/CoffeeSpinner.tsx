export default function CoffeeSpinner() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="w-24 h-24 border-4 border-white/20 border-t-white rounded-full animate-spin">
        </div>
        {/* Inner coffee cup */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-4xl animate-bounce">☕</span>
          </div>
        </div>
        {/* Floating coffee beans */}
        <div className="absolute -top-2 -right-2 text-lg animate-ping">🫘</div>
        <div className="absolute -bottom-2 -left-2 text-lg animate-ping" style={{animationDelay: '0.5s'}}>🫘</div>
      </div>
      
      <div className="text-center space-y-2">
        <div className="text-white font-bold text-xl animate-pulse">
          ✨ Finding your perfect coffee...
        </div>
        <div className="text-white/80 text-sm">
          Spinning through {Math.floor(Math.random() * 100) + 2400}+ amazing coffee shops
        </div>
      </div>
      
      {/* Loading dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  )
}
