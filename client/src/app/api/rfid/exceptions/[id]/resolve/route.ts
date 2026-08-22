// client/src/app/api/rfid/exceptions/[id]/resolve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import { rfidExceptionService } from '@/lib/rfid/services/exceptionService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { resolutionType, resolutionNotes, authorizedById } = body;

    if (!resolutionType) {
      return NextResponse.json({ error: 'Resolution type is required' }, { status: 400 });
    }

    const userId = parseInt(auth.session.user.id, 10);
    const userRole = auth.user.systemRole;

    const result = await rfidExceptionService.resolveException(id, {
      resolutionType,
      resolutionNotes: resolutionNotes || 'Resolved through investigation.',
      userId,
      userRole,
      authorizedById: authorizedById ? parseInt(authorizedById, 10) : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Resolve RFID Exception API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to resolve exception' }, { status: 500 });
  }
}
