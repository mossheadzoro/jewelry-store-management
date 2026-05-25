import { useState, useEffect } from "react";
import axios from "axios";

export function useBillingCustomer(customerId?: number | string) {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;

    const fetchBillingCustomer = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/customer/search-by-id?id=${customerId}`);

        setCustomer(res.data.customer);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch customer");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingCustomer();
  }, [customerId]);

  return { customer, loading, error };
}
