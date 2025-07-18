import { useUserStore } from '@/lib/store/useUserStore';
import { redirect } from 'next/dist/server/api-utils';




export async function fetchDashboardData() {

  const res = await fetch('/api/dashboard/data');
  if (!res.ok) {
   window.location.href = '/login';
  }

  const data = await res.json();
  const { user, branch, salesmen, manager } = data;
  useUserStore.getState().setUserData(user, branch, salesmen, manager);
}

