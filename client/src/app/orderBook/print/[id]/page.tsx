import { prisma } from "../../../../../libs/prisma";
import PrintButton from "./PrintButton";

export default async function PrintOrderSlip({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id: id },
    include: {
      karigar: true,
      items: {
        include: {
          category: true,
        },
      },
      advance: true,
    },
  });

  if (!order) return <div style={{color: "white"}}>Order not found</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', background: '#0a0a0a', padding: '40px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .print-wrapper * { box-sizing:border-box; font-family:'Inter',sans-serif; }
        .print-container { max-width:650px; width:100%; background:#141414; border:1px solid #222; border-radius:16px; padding:32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); color:#fff; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom:2px solid #D4A843; padding-bottom:16px; }
        .store-name { font-size:20px; font-weight:800; letter-spacing:2px; color:#D4A843; }
        .store-sub { font-size:10px; color:#888; letter-spacing:1px; margin-top:4px; }
        .date-box { text-align:right; }
        .date-label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; }
        .date-val { font-size:14px; font-weight:700; margin-top:2px; }
        .client-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }
        .client-name { font-size:18px; font-weight:700; color:#fff; }
        .client-phone { font-size:12px; color:#888; margin-top:2px; }
        .info-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
        .info-box { background:#1a1a1a; border:1px solid #2a2a2a; border-radius:10px; padding:10px 16px; }
        .info-box-label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; }
        .info-box-val { font-size:14px; font-weight:700; color:#D4A843; margin-top:2px; }
        .ref-box { text-align:right; }
        .ref-label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; }
        .ref-val { font-size:16px; font-weight:700; color:#fff; }
        .slip-val { font-size:16px; font-weight:800; color:#D4A843; font-style:italic; }
        .section-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; border-bottom:1px solid #2a2a2a; padding-bottom:8px; }
        .print-table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        .print-th { font-size:9px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:1px; text-align:left; padding:8px 12px; border-bottom:1px solid #2a2a2a; }
        .print-td { font-size:13px; padding:10px 12px; border-bottom:1px solid #1a1a1a; color:#ccc; }
        .td-main { font-weight:600; color:#fff; }
        .td-right { text-align:right; font-weight:700; color:#D4A843; }
        .advance-box { background:#1a1a1a; border:1px solid #D4A843; border-radius:12px; padding:16px; margin-bottom:20px; }
        .advance-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; }
        .advance-label { color:#888; }
        .advance-val { color:#fff; font-weight:600; }
        .terms { border-top:1px solid #2a2a2a; padding-top:16px; margin-top:16px; }
        .terms h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#fff; margin-bottom:8px; }
        .terms ul { list-style:none; padding:0; }
        .terms li { font-size:10px; color:#666; margin-bottom:4px; }
        .footer { text-align:center; margin-top:24px; font-size:9px; color:#555; letter-spacing:1px; }
        
        @media print {
          body { background:#fff; color:#000; padding:0; margin:0; }
          .print-wrapper { background:#fff; padding:0; }
          .print-container { box-shadow:none; border:none; border-radius:0; padding:0; max-width:100%; background:#fff; color:#000; }
          .store-name, .client-title, .section-title, .slip-val, .td-right { color:#000; }
          .client-name, .ref-val, .advance-val { color:#000; }
          .info-box, .advance-box { background:#fff; border:1px solid #000; }
          .print-th { border-bottom:1px solid #000; color:#000; }
          .print-td { border-bottom:1px solid #ccc; color:#000; }
          .td-main { color:#000; }
          .terms h4 { color:#000; }
          .terms li { color:#333; }
          button { display:none!important; }
        }
      `}} />
      
      <div className="print-wrapper w-full flex justify-center">
        <div className="print-container">
          <div style={{display: "flex", justifyContent: "flex-end", marginBottom: 20}}>
            <PrintButton />
          </div>

          {/* Header */}
          <div className="header">
            <div>
              <div className="store-name">THE CURATED ATELIER</div>
              <div className="store-sub">HERITAGE WING, NEW DELHI BRANCH</div>
              <div className="store-sub">GSTIN: 07AAAAA0000A1Z5</div>
            </div>
            <div className="date-box">
              <div className="date-label">Date of Issue</div>
              <div className="date-val">
                {new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div style={{ marginBottom: 20 }}>
            <div className="client-title">Client Details</div>
            <div className="client-name">{order.customerName}</div>
            <div className="client-phone">+91 {order.customerMobile}</div>
          </div>

          {/* Expected Delivery & Reference */}
          <div className="info-row">
            <div className="info-box">
              <div className="info-box-label">Expected Delivery</div>
              <div className="info-box-val">
                {new Date(order.deliveryDate).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className="ref-box">
              <div className="ref-label">Order Reference</div>
              <div className="ref-val">#{order.orderNumber}</div>
              <div className="ref-label" style={{marginTop: 8}}>Slip ID</div>
              <div className="slip-val">{order.advance?.advanceReceiptNumber || "—"}</div>
            </div>
          </div>

          {/* Commissioned Items */}
          <div className="section-title">Commissioned Items</div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="print-th">Category</th>
                <th className="print-th">Description</th>
                <th className="print-th" style={{textAlign: "right"}}>Weight / Size</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="print-td td-main">{item.category?.name || "—"}</td>
                  <td className="print-td">{item.description || "—"}</td>
                  <td className="print-td td-right">
                    {item.weight ? `${item.weight}g` : "—"}{item.measurement ? ` / ${item.measurement}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Advance Summary */}
          <div className="advance-box">
            <div className="client-title">Advance Summary</div>
            <div className="advance-row">
              <span className="advance-label">Cash Deposit</span>
              <span className="advance-val">₹ {Number(order.advance?.moneyAmount || 0).toLocaleString("en-IN")}</span>
            </div>
            {Number(order.advance?.metalWeight || 0) > 0 && (
              <div className="advance-row" style={{marginBottom: 0}}>
                <span className="advance-label">Exchange Metal ({order.advance?.metalPurity || "22K"})</span>
                <span className="advance-val">{Number(order.advance?.metalWeight || 0).toFixed(3)} g</span>
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="terms">
            <h4>Terms & Conditions</h4>
            <ul>
              <li>• Orders once placed cannot be cancelled after 24 hours of confirmation.</li>
              <li>• Delivery dates are estimates and may vary by +3 days based on artisanal complexity.</li>
              <li>• Final billing will be based on the gold rate prevalent at the time of delivery.</li>
              <li>• Jewellery must be collected within 15 days of the delivery notification.</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="footer">
            This is a digitally generated document by Atelier Ledger Vault System
          </div>
        </div>
      </div>
    </div>
  );
}
