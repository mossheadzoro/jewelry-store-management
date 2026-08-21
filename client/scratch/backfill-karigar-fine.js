const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Step 1: Fix jewelleryItems with fineGold = 0 that have weight and tonch
  const badItems = await prisma.karigarJobJewellery.findMany({
    where: {
      fineGold: { lte: 0 },
      weight: { gt: 0 },
    },
  })

  console.log(`Found ${badItems.length} jewellery items with fineGold=0`)

  for (const item of badItems) {
    const tonch = item.tonch || 0.92
    const computedFine = item.weight * tonch
    console.log(`  Item ${item.id}: weight=${item.weight}, tonch=${tonch}, computedFine=${computedFine.toFixed(3)}`)
    
    await prisma.karigarJobJewellery.update({
      where: { id: item.id },
      data: { fineGold: computedFine },
    })
    console.log(`    ✓ Updated fineGold=${computedFine.toFixed(3)}`)
  }

  // Step 2: Fix CLOSED jobs with null fineUsed
  const badJobs = await prisma.karigarJob.findMany({
    where: {
      status: 'CLOSED',
      fineUsed: null,
    },
    include: {
      jewelleryItems: true,
    },
  })

  console.log(`\nFound ${badJobs.length} CLOSED jobs with null fineUsed`)

  for (const job of badJobs) {
    // Re-fetch items (may have been updated above)
    const items = await prisma.karigarJobJewellery.findMany({
      where: { jobId: job.id },
    })

    if (items.length === 0) {
      console.log(`  Job ${job.id.slice(-6).toUpperCase()}: No items, skipping`)
      continue
    }

    const baseFine = items.reduce((sum, item) => {
      const tonch = item.tonch || 0.92
      return sum + (item.weight * tonch)
    }, 0)

    // For wastage: use the job's wastagePercent if available
    const w = (job.wastagePercent || 0) / 100
    let totalFine = 0
    if (job.calculationMode === 'MODE_B') {
      totalFine = items.reduce((sum, item) => {
        const tonch = item.tonch || 0.92
        return sum + (item.weight * (tonch + w))
      }, 0)
    } else {
      totalFine = items.reduce((sum, item) => {
        const tonch = item.tonch || 0.92
        return sum + (item.weight * (1 + w) * tonch)
      }, 0)
    }

    const wastage = totalFine - baseFine

    console.log(`  Job ${job.id.slice(-6).toUpperCase()}: baseFine=${baseFine.toFixed(3)}, totalFine=${totalFine.toFixed(3)}, wastage=${wastage.toFixed(3)}`)

    await prisma.karigarJob.update({
      where: { id: job.id },
      data: {
        fineUsed: baseFine,
        fineWastage: wastage,
      },
    })

    console.log(`    ✓ Updated`)
  }

  // Step 3: Verify
  console.log('\n--- VERIFICATION ---')
  const allJobs = await prisma.karigarJob.findMany({
    include: { karigar: { select: { name: true } }, jewelleryItems: true },
    orderBy: { createdAt: 'desc' },
  })

  for (const j of allJobs) {
    const effectivePurity = j.issuedPurity >= 0.995 ? 1.0 : j.issuedPurity
    const issuedFine = j.issuedWeight * effectivePurity
    let returnedFine = 0
    if (j.fineUsed != null) {
      returnedFine = (j.fineUsed || 0) + (j.fineWastage || 0)
    } else if (j.jewelleryItems.length > 0) {
      returnedFine = j.jewelleryItems.reduce((s, i) => s + (i.fineGold || 0), 0)
    }
    const balance = j.status === 'OPEN'
      ? (j.remainingRawMetal !== null ? j.remainingRawMetal : issuedFine)
      : (issuedFine - returnedFine)

    console.log(`${j.karigar?.name} | Job ${j.id.slice(-6).toUpperCase()} | ${j.status} | Issued: ${issuedFine.toFixed(3)}g | Returned Fine: ${returnedFine.toFixed(3)}g | Balance: ${balance.toFixed(3)}g`)
  }

  console.log('\nDone!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
