// app/api/dashboard/data/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '../../../../../libs/prisma';



export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let branch = null;

if (user.role !== "ADMIN") {
  branch = await prisma.branch.findUnique({
    where: { id: user.branchId! },
  });
}


  const manager = await prisma.user.findFirst({
    where: { branchId: user.branchId, role: 'MANAGER' },
  });

  const salesmen = await prisma.user.findMany({
    where: {
      branchId: user.branchId!,
      role: 'SALESMAN',
    },
    select: {
      id: true,
      name: true,
      branchId: true,
    },
  });

  return NextResponse.json({
    user,
    branch,
    salesmen,
    manager,
  });
}

