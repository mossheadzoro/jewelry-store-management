import React from "react";
import { WholesalerCard } from "./WholesalerCard";

interface BalancesProps {
  goldBal?: number;
  silverBal?: number;
  moneyBal?: number;
}

export function WholesalerBalances({ goldBal = 0, silverBal = 0, moneyBal = 0 }: BalancesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <WholesalerCard 
        title="Gold Balance" 
        value={`${goldBal.toFixed(3)} gm`} 
        balance={goldBal} 
      />
      <WholesalerCard 
        title="Silver Balance" 
        value={`${silverBal.toFixed(3)} gm`} 
        balance={silverBal} 
      />
      <WholesalerCard 
        title="Total Metal Due" 
        value={`${(goldBal + silverBal).toFixed(3)} gm`} 
        balance={goldBal + silverBal} 
      />
      <WholesalerCard 
        title="Total Amount Due" 
        value={`₹${Math.abs(moneyBal).toLocaleString("en-IN")}`} 
        balance={moneyBal} 
      />
    </div>
  );
}
