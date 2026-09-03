"use client";

import { useParams } from 'next/navigation';
import React from 'react';
import EditProductPage from '@/components/Inventory/Product/EditProduct';

const Page = () => {
  const params = useParams();
  const productId = params?.id?.toString();

  return (
    <div>
      {productId ? (
        <EditProductPage id={parseInt(productId)} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Page;
