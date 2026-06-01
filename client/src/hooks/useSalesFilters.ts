import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface SalesFilters {
  tab: string;
  page: string;
  limit: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  paymentMethod: string;
  salespersonId: string;
  huidStatus: string;
  amountMin: string;
  amountMax: string;
}

export function useSalesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    return {
      tab: searchParams.get("tab") || "invoices",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || "",
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
      status: searchParams.get("status") || "",
      paymentMethod: searchParams.get("paymentMethod") || "",
      salespersonId: searchParams.get("salespersonId") || "",
      huidStatus: searchParams.get("huidStatus") || "",
      amountMin: searchParams.get("amountMin") || "",
      amountMax: searchParams.get("amountMax") || "",
    } as SalesFilters;
  }, [searchParams]);

  const setFilter = useCallback(
    (key: keyof SalesFilters, value: string | null | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      
      // Reset page to 1 on filter changes except for page itself
      if (key !== "page") {
        params.set("page", "1");
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const setFilters = useCallback(
    (newFilters: Partial<Record<keyof SalesFilters, string | null | undefined>>) => {
      const params = new URLSearchParams(searchParams.toString());
      
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      if (!newFilters.page) {
        params.set("page", "1");
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const resetFilters = useCallback(() => {
    const params = new URLSearchParams();
    const currentTab = searchParams.get("tab") || "invoices";
    params.set("tab", currentTab);
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
  };
}
