// ============================================================================
// Global Search API — /api/search/global
// ============================================================================
// GET /api/search/global?q=rakesh&stage=instant&scope=all&limit=5
// GET /api/search/global?q=rakesh&stage=expanded&entity=customer&limit=20
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from "@/lib/prisma";
import { search } from '@/lib/services/search/searchService';
import { SearchEntityType, SearchStage } from '@/lib/types/search';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query params
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json({
        results: [],
        groups: [],
        meta: { query: '', stage: 'instant', totalResults: 0, searchTimeMs: 0, scope: 'global', appliedRole: session.user.role },
      });
    }

    const stage = (req.nextUrl.searchParams.get('stage') || 'instant') as SearchStage;
    const scopeParam = req.nextUrl.searchParams.get('scope') || 'all';
    const entityFilter = req.nextUrl.searchParams.get('entity') as SearchEntityType | null;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5', 10);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

    // 3. Get user context for RBAC
    const userId = parseInt(session.user.id, 10);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        systemRole: true,
        branchId: true,
        role: { select: { permissions: true } },
        userBranches: { select: { branchId: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Build search request
    const assignedBranchIds = user.userBranches.map((ub: { branchId: number }) => ub.branchId);
    const scope = scopeParam === 'all' ? 'all' : parseInt(scopeParam, 10);

    const searchResponse = await search({
      query: q,
      userId: user.id,
      systemRole: user.systemRole as any,
      branchId: user.branchId,
      assignedBranchIds,
      scope: isNaN(scope as number) ? 'all' : scope,
      stage,
      entityFilter: entityFilter || undefined,
      limit: Math.min(limit, 50),  // Cap at 50
      offset,
    });

    return NextResponse.json(searchResponse);
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
