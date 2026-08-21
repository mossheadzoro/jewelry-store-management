import React from 'react';
import { Wallet, Package, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerContextPanelProps {
  customer: any;
  billing: any;
  onAddOrderProduct?: (product: any) => void;
}

import { useProductSettingsStore } from '@/lib/store/useProductSettingsStore';

const CustomerContextPanel: React.FC<CustomerContextPanelProps> = ({ customer, billing, onAddOrderProduct }) => {
  const { globalSettings } = useProductSettingsStore();
  const walletConfig = globalSettings?.customerConfig?.wallet || { enableWallet: true, cashWallet: true, goldWallet: false, storeCredit: true };

  if (!customer) {
    return (
      <div className="flex flex-col gap-4 sticky top-8 bg-onyx-surface border border-[#1e1e1e] rounded-xl p-6">
        <div className="flex flex-col items-center justify-center text-center text-[#888] h-full min-h-[200px]">
          <Wallet className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Select a customer to view wallet and active orders.</p>
        </div>
      </div>
    );
  }

  const { CustomerWallet, Order } = customer;

  const handleAddOrderToBilling = (order: any) => {
    // Prevent adding if order is already billed
    if (order.status === "DELIVERED") {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground text-sm">⚠️ Order Already Billed</span>
          <span className="text-xs text-[#ccc]">Order <strong>{order.orderNumber}</strong> has already been delivered.</span>
        </div>,
        { duration: 4000 }
      );
      return;
    }

    // Check if the order is currently at the Stamping Center
    if (order._isInStampingCenter) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground text-sm">⚠️ Order in Stamping Center</span>
          <span className="text-xs text-[#ccc]">
            Order <strong>{order.orderNumber}</strong> is currently at the Stamping Center. 
            Please receive it into the respective inventory first before adding it to the bill.
          </span>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    // Check if the advance from this order is already applied
    if (order.advance && billing.appliedAdvance?.id === order.advance?.id) {
      toast.warning("This order's advance is already applied to the bill.");
      return;
    }

    // Check if another advance is already applied
    if (order.advance && billing.appliedAdvance) {
      toast.warning(
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground text-sm">Advance Already Applied</span>
          <span className="text-xs text-[#ccc]">
            Remove the current advance first before applying a new one.
          </span>
        </div>,
        { duration: 4000 }
      );
      return;
    }

    let itemsAdded = false;
    
    // Add items from the order as products to the billing cart
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const orderProduct = {
          name: item.description 
            ? `${item.category?.name || 'Order Item'} (${item.description})`
            : `${item.category?.name || 'Custom Order Item'} - ${order.orderNumber}`,
          barcode: `ORD-${order.id.slice(-6).toUpperCase()}`,
          productCode: `ORD-${order.id.slice(-6).toUpperCase()}`,
          huidNumber: '',
          gsWeight: Number(item.weight) || 0,
          ntWeight: Number(item.weight) || 0,
          purity: 22, // Defaulting, you might want to adjust
          price: 0, // Should be calculated/added by user later
          quantity: 1,
          otherChargesPrice: 0,
          description: `From Order ${order.orderNumber}`,
          orderId: order.id,
          subCategory: {
            category: {
              name: item.category?.name || 'Uncategorized'
            }
          },
          advance: order.advance
        };
        
        if (onAddOrderProduct) {
          onAddOrderProduct(orderProduct);
        } else {
          billing.addProduct(orderProduct);
        }
        itemsAdded = true;
      });
    } else {
      // If no explicit items, add a dummy product to represent the order
      const dummyProduct = {
        name: `Order ${order.orderNumber}`,
        barcode: `ORD-${order.id.slice(-6).toUpperCase()}`,
        productCode: `ORD-${order.id.slice(-6).toUpperCase()}`,
        huidNumber: '',
        gsWeight: 0,
        ntWeight: 0,
        purity: 22,
        price: 0,
        quantity: 1,
        description: `Order ${order.orderNumber}`,
        orderId: order.id,
        advance: order.advance
      };
      
      if (onAddOrderProduct) {
        onAddOrderProduct(dummyProduct);
      } else {
        billing.addProduct(dummyProduct);
      }
      itemsAdded = true;
    }

    // Only apply advance immediately if there's no modal intercepting the addition
    if (itemsAdded && order.advance && !onAddOrderProduct) {
      billing.applyAdvance(order.advance);
    }
  };

  return (
    <div className="flex flex-col gap-6 sticky top-8">
      {/* Wallet Details */}
      {walletConfig.enableWallet && (
        <div className="bg-onyx-surface border border-[#1e1e1e] rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-4 border-b border-[#222] pb-3">
            <div className="w-8 h-8 rounded-full bg-onyx-elevated flex items-center justify-center border border-border">
              <Wallet className="w-4 h-4 text-[#d4a843]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-wide">Wallet Details</h2>
          </div>
          
          {CustomerWallet ? (
            <div className="flex flex-col gap-3">
              {walletConfig.cashWallet && (
                <div className="flex justify-between items-center bg-onyx-elevated p-3 rounded-lg border border-[#222]">
                  <span className="text-xs text-[#888] font-medium uppercase tracking-wider">Cash Balance</span>
                  <span className="text-sm font-semibold text-[#d4a843]">₹ {(CustomerWallet.cashBalance || 0).toFixed(2)}</span>
                </div>
              )}
              {walletConfig.goldWallet && (
                <div className="flex justify-between items-start bg-onyx-elevated p-3 rounded-lg border border-[#222]">
                  <span className="text-xs text-[#888] font-medium uppercase tracking-wider mt-0.5">Gold Balance</span>
                  <div className="flex flex-col items-end gap-1">
                    <button 
                      onClick={() => billing.applyWalletBalance(CustomerWallet.metal22KBalance, '22K')}
                      className="text-sm font-semibold text-[#C9943A] hover:underline cursor-pointer"
                      title="Click to apply to Old Gold Exchange"
                    >
                      {(CustomerWallet.metal22KBalance || 0).toFixed(3)}g (22K)
                    </button>
                    <button 
                      onClick={() => billing.applyWalletBalance(CustomerWallet.metal24KBalance, '24K')}
                      className="text-sm font-semibold text-[#d4a843] hover:underline cursor-pointer"
                      title="Click to apply to Old Gold Exchange"
                    >
                      {(CustomerWallet.metal24KBalance || 0).toFixed(3)}g (24K)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#666] text-center italic py-2">No active wallet balances.</p>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="bg-onyx-surface border border-[#1e1e1e] rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3 mb-4 border-b border-[#222] pb-3">
          <div className="w-8 h-8 rounded-full bg-onyx-elevated flex items-center justify-center border border-border">
            <Package className="w-4 h-4 text-[#5c8aff]" />
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-wide">Active Orders</h2>
        </div>

        {Order && Order.length > 0 ? (
          <div className="flex flex-col gap-4">
            {Order.map((order: any) => {
              const inStamping = order._isInStampingCenter;
              return (
              <div 
                key={order.id} 
                className={`bg-onyx-elevated border border-onyx-border rounded-lg p-3 transition-colors ${inStamping ? 'opacity-80' : 'hover:border-[#5c8aff]/50 cursor-pointer group'}`}
                onClick={() => {
                  if (inStamping) return;
                  handleAddOrderToBilling(order);
                }}
                title={inStamping ? "Order in Stamping Center" : "Click to include in billing"}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold ${inStamping ? 'text-[#888]' : 'text-foreground group-hover:text-[#5c8aff] transition-colors'}`}>{order.orderNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-[#888] border border-border">
                    {order.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-[#777] text-xs mb-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {order.advance && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-[11px] text-[#aaa] font-medium flex justify-between">
                      <span>Advance Slip: <span className="text-foreground">{order.advance.advanceReceiptNumber}</span></span>
                      {order.advance.moneyAmount > 0 && <span className="text-[#d4a843]">₹{order.advance.moneyAmount.toFixed(2)}</span>}
                    </p>
                    {order.advance.metalWeight > 0 && (
                      <p className="text-[11px] text-[#aaa] mt-0.5 text-right">
                        Metal: <span className="text-[#d4a843]">{order.advance.metalWeight}g {order.advance.metalPurity}</span>
                      </p>
                    )}
                  </div>
                )}
                
                {inStamping ? (
                  <div className="mt-3 p-2 bg-[#2a1a1a] border border-[#5a2a2a] rounded text-[#ff6b6b] text-[10px] font-medium leading-tight">
                    ⚠️ Can't add order to invoice. Receive it from Stamping Center and add to inventory first.
                  </div>
                ) : (
                  <div className="mt-2 text-center text-[#5c8aff] text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    + Add to Bill
                  </div>
                )}
              </div>
            );})}
          </div>
        ) : (
          <p className="text-xs text-[#666] text-center italic py-2">No active orders pending delivery.</p>
        )}
      </div>
    </div>
  );
};

export default CustomerContextPanel;
