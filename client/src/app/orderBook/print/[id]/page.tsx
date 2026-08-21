import { prisma } from "../../../../../libs/prisma";
import PrintButton from "./PrintButton";

export default async function PrintOrderSlip({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = (await prisma.order.findUnique({
    where: { id: id },
    include: {
      karigar: true,
      items: {
        include: { category: true }
      },
      advance: true,
    },
  })) as any;

  if (!order) return <div style={{color: "black"}}>Order not found</div>;

  const branch = order.branchId
    ? await prisma.branch.findUnique({
        where: { id: order.branchId },
        include: { settings: true },
      })
    : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', background: '#f8f9fa', padding: '40px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .print-wrapper * { box-sizing:border-box; font-family:'Inter',sans-serif; }
        .print-container { max-width:650px; width:100%; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; padding:32px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); color:#000000; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom:2px solid #D4A843; padding-bottom:16px; }
        .store-name { font-size:20px; font-weight:800; letter-spacing:2px; color:#D4A843; }
        .store-sub { font-size:10px; color:#555; letter-spacing:1px; margin-top:4px; }
        .date-box { text-align:right; }
        .date-label { font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px; }
        .date-val { font-size:14px; font-weight:700; margin-top:2px; color:#000; }
        .client-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }
        .client-name { font-size:18px; font-weight:700; color:#000; }
        .client-phone { font-size:12px; color:#555; margin-top:2px; }
        .info-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
        .info-box { background:#fafafa; border:1px solid #e5e7eb; border-radius:10px; padding:10px 16px; }
        .info-box-label { font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px; }
        .info-box-val { font-size:14px; font-weight:700; color:#D4A843; margin-top:2px; }
        .ref-box { text-align:right; }
        .ref-label { font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px; }
        .ref-val { font-size:16px; font-weight:700; color:#000; }
        .slip-val { font-size:16px; font-weight:800; color:#D4A843; font-style:italic; }
        .section-title { font-size:10px; font-weight:700; color:#D4A843; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; border-bottom:1px solid #e5e7eb; padding-bottom:8px; }
        .print-table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        .print-th { font-size:9px; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:1px; text-align:left; padding:8px 12px; border-bottom:1px solid #e5e7eb; }
        .print-td { font-size:13px; padding:10px 12px; border-bottom:1px solid #f3f4f6; color:#333; }
        .td-main { font-weight:600; color:#000; }
        .td-right { text-align:right; font-weight:700; color:#D4A843; }
        .advance-box { background:#fafafa; border:1px solid #D4A843; border-radius:12px; padding:16px; margin-bottom:20px; }
        .advance-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; }
        .advance-label { color:#555; }
        .advance-val { color:#000; font-weight:600; }
        .terms { border-top:1px solid #e5e7eb; padding-top:16px; margin-top:16px; }
        .terms h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#000; margin-bottom:8px; }
        .terms ul { list-style:none; padding:0; }
        .terms li { font-size:10px; color:#666; margin-bottom:4px; }
        .footer { text-align:center; margin-top:24px; font-size:9px; color:#888; letter-spacing:1px; }
        
        @media print {
          body { background:#fff; color:#000; padding:0; margin:0; }
          .print-wrapper { background:#fff; padding:0; }
          .print-container { box-shadow:none; border:none; border-radius:0; padding:0; max-width:100%; background:#fff; color:#000; }
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
              <div className="store-name">{branch?.settings?.invoiceHeaderText || branch?.settings?.shopName || branch?.name || "STORE NAME"}</div>
              <div className="store-sub">{branch?.settings?.address || branch?.address || "Store Address"}</div>
              {(branch?.settings?.phoneNumbers || branch?.phone) && (
                <div className="store-sub">Phone: {branch?.settings?.phoneNumbers || branch?.phone}</div>
              )}
              {branch?.settings?.gstNumber && (
                <div className="store-sub">GSTIN: {branch?.settings?.gstNumber.toUpperCase()}</div>
              )}
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
              {(!order.items || order.items.length === 0) && (
                <tr>
                  <td className="print-td" colSpan={3} style={{textAlign: "center"}}>No items found.</td>
                </tr>
              )}
            </tbody>
          </table>

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
            {branch?.settings?.termsAndConditions ? (
              <div style={{ fontSize: "10px", color: "#666", whiteSpace: "pre-wrap" }}>
                {branch.settings.termsAndConditions}
              </div>
            ) : (
              <ul>
                <li>• Orders once placed cannot be cancelled after 24 hours of confirmation.</li>
                <li>• Delivery dates are estimates and may vary by +3 days based on artisanal complexity.</li>
                <li>• Final billing will be based on the gold rate prevalent at the time of delivery.</li>
                <li>• Jewellery must be collected within 15 days of the delivery notification.</li>
              </ul>
            )}
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
