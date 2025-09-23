const { PrismaClient } = require('@prisma/client')

async function checkDatabase() {
  const prisma = new PrismaClient()
  
  try {
    // Get first 5 coffee shops to see what data we have
    const shops = await prisma.coffeeShop.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        address: true,
        postcode: true,
        lat: true,
        lng: true,
        rating: true
      }
    })
    
    console.log('Sample coffee shop data:')
    console.log(JSON.stringify(shops, null, 2))
    
    // Count how many have coordinates
    const withCoords = await prisma.coffeeShop.count({
      where: {
        AND: [
          { lat: { not: null } },
          { lng: { not: null } }
        ]
      }
    })
    
    const total = await prisma.coffeeShop.count()
    
    console.log(`\nCoordinate status:`)
    console.log(`Total shops: ${total}`)
    console.log(`With coordinates: ${withCoords}`)
    console.log(`Without coordinates: ${total - withCoords}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
