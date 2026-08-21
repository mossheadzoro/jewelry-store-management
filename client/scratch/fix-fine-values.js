const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Find all jobs for this karigar
  const jobs = await p.karigarJob.findMany({
    include: { jewelleryItems: true },
    orderBy: { createdAt: 'desc' },
  })

  for (const job of jobs) {
    console.log(`\nJob ${job.id.slice(-6).toUpperCase()} (${job.status}):`)
    console.log(`  fineUsed=${job.fineUsed}, fineWastage=${job.fineWastage}`)
    console.log(`  Items: ${job.jewelleryItems.length}`)
    
    for (const item of job.jewelleryItems) {
      console.log(`    weight=${item.weight}, tonch=${item.tonch}, fineGold=${item.fineGold}, purity=${item.purity}`)
    }

    // Correct: baseFine = sum of (weight * tonch) for each item
    const baseFine = job.jewelleryItems.reduce((sum, item) => sum + (item.weight * (item.tonch || 0.92)), 0)
    const totalFine = job.jewelleryItems.reduce((sum, item) => sum + (item.fineGold || (item.weight * (item.tonch || 0.92))), 0)
    console.log(`  Computed baseFine=${baseFine.toFixed(3)}, totalFine=${totalFine.toFixed(3)}`)

    // Fix: Set fineUsed = baseFine, fineWastage = totalFine - baseFine
    if (job.status === 'CLOSED' && job.jewelleryItems.length > 0) {
      const wastage = totalFine - baseFine
      await p.karigarJob.update({
        where: { id: job.id },
        data: {
          fineUsed: baseFine,
          fineWastage: wastage,
        },
      })
      console.log(`  ✓ FIXED: fineUsed=${baseFine.toFixed(3)}, fineWastage=${wastage.toFixed(3)}`)
    }
  }
}

main().catch(console.error).finally(() => p.$disconnect())
