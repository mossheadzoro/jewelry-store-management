const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get karigar ID from URL fragment
  const karigars = await prisma.karigar.findMany({
    select: { id: true, name: true }
  })
  
  console.log('All karigars:', JSON.stringify(karigars.map(k => ({ id: k.id, name: k.name })), null, 2))

  // Find the karigar matching the URL
  const target = karigars.find(k => k.id.includes('cms51tcbk0000'))
  if (!target) {
    console.log('Target karigar not found, showing all')
    return
  }

  const karigarId = target.id
  console.log('\nTarget Karigar:', target.name, '- ID:', karigarId)

  const jobs = await prisma.karigarJob.findMany({
    where: { karigarId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      issuedWeight: true,
      issuedPurity: true,
      fineUsed: true,
      fineWastage: true,
      remainingRawMetal: true,
      remainingAction: true,
      status: true,
      calculationMode: true,
    }
  })

  console.log('\n--- JOBS ---')
  for (const j of jobs) {
    const effectivePurity = j.issuedPurity >= 0.995 ? 1.0 : j.issuedPurity
    const issuedFine = j.issuedWeight * effectivePurity
    const returnedFine = (j.fineUsed || 0) + (j.fineWastage || 0)
    const balance = j.status === 'OPEN' 
      ? (j.remainingRawMetal !== null ? j.remainingRawMetal : issuedFine)
      : (issuedFine - returnedFine)

    console.log(`Job: ${j.id.slice(-6).toUpperCase()}`)
    console.log(`  Status: ${j.status}`)
    console.log(`  Issued: ${j.issuedWeight}g @ ${j.issuedPurity} purity`)
    console.log(`  Effective Issued Fine: ${issuedFine}g`)
    console.log(`  fineUsed: ${j.fineUsed}, fineWastage: ${j.fineWastage}`)
    console.log(`  Returned Fine: ${returnedFine}g`)
    console.log(`  Balance Contribution: ${balance.toFixed(3)}g`)
    console.log(`  remainingRawMetal: ${j.remainingRawMetal}, action: ${j.remainingAction}`)
    console.log('')
  }

  const held = await prisma.karigarHeldMetal.findMany({ where: { karigarId } })
  console.log('Held Metals:', JSON.stringify(held, null, 2))

  let total = 0
  for (const j of jobs) {
    const effectivePurity = j.issuedPurity >= 0.995 ? 1.0 : j.issuedPurity
    const issuedFine = j.issuedWeight * effectivePurity
    const returnedFine = (j.fineUsed || 0) + (j.fineWastage || 0)
    if (j.status === 'OPEN') {
      total += j.remainingRawMetal !== null ? j.remainingRawMetal : issuedFine
    } else {
      total += (issuedFine - returnedFine)
    }
  }
  for (const h of held) {
    total += h.weight
  }
  console.log(`\nTOTAL METAL BALANCE: ${total.toFixed(3)}g`)
  console.log(total < 0 ? '→ Metal DUE TO Karigar' : '→ Metal HELD BY Karigar')
}

main().catch(console.error).finally(() => prisma.$disconnect())
