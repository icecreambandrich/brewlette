import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface CoffeeShopRow {
  id: string
  name: string
  address: string
  postcode: string
  'review count': string
  rating: string
}

async function setupDatabase() {
  console.log('🚀 Setting up Brewlette database...')
  
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Clear existing data
    const deletedCount = await prisma.coffeeShop.deleteMany()
    console.log(`🗑️  Cleared ${deletedCount.count} existing records`)

    // Import CSV data
    const csvPath = path.join(process.cwd(), '..', 'london_coffee_shops.csv')
    console.log(`📂 Reading CSV from: ${csvPath}`)

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at ${csvPath}`)
    }

    const records: CoffeeShopRow[] = []

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(parse({ 
          delimiter: ',',
          columns: true,
          skip_empty_lines: true
        }))
        .on('data', (data: CoffeeShopRow) => {
          records.push(data)
        })
        .on('end', () => {
          console.log(`📊 Parsed ${records.length} records from CSV`)
          resolve()
        })
        .on('error', (error) => {
          reject(error)
        })
    })

    // Insert data in batches for better performance
    console.log('💾 Inserting coffee shop data...')
    const batchSize = 10
    let insertedCount = 0
    let skippedCount = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      const validRecords = batch.map(record => {
        const rating = parseFloat(record.rating)
        // Skip records with invalid or missing ratings
        if (isNaN(rating) || rating === 0) {
          console.log(`⚠️ Skipping ${record.name} - invalid rating: ${record.rating}`)
          skippedCount++
          return null
        }
        return {
          name: record.name,
          address: record.address,
          postcode: record.postcode || null,
          reviewCount: parseInt(record['review count']) || null,
          rating: rating,
          lat: null, // Will need to geocode addresses later
          lng: null  // Will need to geocode addresses later
        }
      }).filter(record => record !== null) // Remove null records

      if (validRecords.length > 0) {
        await prisma.coffeeShop.createMany({
          data: validRecords
        })
        insertedCount += validRecords.length
      }
      
      process.stdout.write(`\r💾 Processed ${i + batch.length}/${records.length} records (${insertedCount} inserted, ${skippedCount} skipped)`)
    }

    console.log(`\n✅ Successfully imported ${insertedCount} coffee shops`)

    // Verify the data
    const totalCount = await prisma.coffeeShop.count()
    console.log(`🔍 Database now contains ${totalCount} coffee shops`)

    // Show some sample data
    const sampleShops = await prisma.coffeeShop.findMany({
      take: 3,
      select: {
        name: true,
        postcode: true,
        rating: true,
        reviewCount: true
      }
    })

    console.log('\n📋 Sample coffee shops:')
    sampleShops.forEach((shop: { name: string; postcode: string | null; rating: number; reviewCount: number | null }, index: number) => {
      console.log(`  ${index + 1}. ${shop.name} (${shop.postcode || 'No postcode'}) - ⭐ ${shop.rating} (${shop.reviewCount || 0} reviews)`)
    })

    console.log('\n🎉 Database setup completed successfully!')
    console.log('🚀 You can now run: npm run dev')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()
