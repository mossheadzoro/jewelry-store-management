// app/api/dashboard/data/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";



export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      systemRole: true,
      role: true,
      branchId: true,
      image: true,
      status: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const branchPromise = user.systemRole !== "ADMIN" ? prisma.branch.findUnique({
    where: { id: user.branchId! },
  }) : Promise.resolve(null);

  const managerPromise = prisma.user.findFirst({
    where: { branchId: user.branchId, systemRole: 'MANAGER' },
    select: { id: true, name: true, image: true }
  });

  const salesmenPromise = prisma.user.findMany({
    where: {
      branchId: user.branchId!,
      systemRole: 'SALESMAN',
    },
    select: {
      id: true,
      name: true,
      branchId: true,
    },
  });

  const [branch, manager, salesmen] = await Promise.all([
    branchPromise,
    managerPromise,
    salesmenPromise
  ]);

  return NextResponse.json({
    user,
    branch,
    salesmen,
    manager,
  });
}

