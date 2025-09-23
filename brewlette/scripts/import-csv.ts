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
  lat: string
  lng: string
  borough: string
  rating: string
}

async function importCoffeeShops() {
  const csvPath = path.join(process.cwd(), '..', 'london_coffee_shops.csv')
  
  console.log('Reading CSV file from:', csvPath)
  
  const records: CoffeeShopRow[] = []
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(parse({ 
        delimiter: ',',
        columns: true,
        skip_empty_lines: true
      }))
      .on('data', (data: CoffeeShopRow) => {
        records.push(data)
      })
      .on('end', async () => {
        console.log(`Parsed ${records.length} records from CSV`)
        
        try {
          // Clear existing data
          await prisma.coffeeShop.deleteMany()
          console.log('Cleared existing coffee shop data')
          
          // Insert new data
          for (const record of records) {
            await prisma.coffeeShop.create({
              data: {
                name: record.name,
                address: record.address,
                postcode: record.postcode,
                lat: parseFloat(record.lat),
                lng: parseFloat(record.lng),
                borough: record.borough,
                rating: parseFloat(record.rating)
              }
            })
          }
          
          console.log(`Successfully imported ${records.length} coffee shops`)
          resolve(records.length)
        } catch (error) {
          console.error('Error importing data:', error)
          reject(error)
        } finally {
          await prisma.$disconnect()
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error)
        reject(error)
      })
  })
}

importCoffeeShops()
  .then(() => {
    console.log('Import completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Import failed:', error)
    process.exit(1)
  })
