const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.emailSettings.findMany();
  console.log('=== EMAIL SETTINGS ===');
  console.log(JSON.stringify(settings, null, 2));

  const logs = await prisma.emailAuditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  console.log('=== AUDIT LOGS ===');
  console.log(JSON.stringify(logs, null, 2));

  const jobs = await prisma.emailJob.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  console.log('=== EMAIL JOBS ===');
  console.log(JSON.stringify(jobs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
