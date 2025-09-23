import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function norm(pc: string | null): string | null {
  if (!pc) return null
  return pc.trim().toUpperCase().replace(/\s+/g, '')
}

async function main() {
  const total = await prisma.coffeeShop.count()
  const withPostcode = await prisma.coffeeShop.count({ where: { postcode: { not: null } } })
  const nonEmptyPc = await prisma.coffeeShop.count({ where: { AND: [ { postcode: { not: null } }, { NOT: { postcode: '' } } ] } })
  const withCoords = await prisma.coffeeShop.count({ where: { AND: [ { lat: { not: null } }, { lng: { not: null } } ] } })
  const withoutCoords = total - withCoords

  const sample = await prisma.coffeeShop.findMany({ take: 20, select: { id: true, name: true, postcode: true, lat: true, lng: true } })

  const all = await prisma.coffeeShop.findMany({ select: { postcode: true }, where: { postcode: { not: null } } })
  const uniqueSet = new Set<string>()
  for (const r of all) {
    const p = norm(r.postcode as string)
    if (p) uniqueSet.add(p)
  }

  console.log('DB stats:')
  console.log({ total, withPostcode, nonEmptyPc, uniquePostcodes: uniqueSet.size, withCoords, withoutCoords })
  console.log('Sample rows:')
  console.log(sample)
}

main().finally(() => prisma.$disconnect())
