import * as React from "react";

interface BillItem {
  id: string;
  description: string;
  amount: number;
}

interface ReceiptPrinterProps {
  /** The unique system transaction identifier tracking reference */
  invoiceNumber: string;
  guestName: string;
  guestEmail: string;
  roomNumber: string;
  stayDays: number;
  baseAmount: number;
  discountAmount: number;
  gstAmount: number;
  netAmount: number;
  /** Array of incidental lines like meal tabs or room service logs */
  incidentals?: BillItem[];
}

/**
 * Marakale Itemized Receipt Printer Component
 * Strips formatting cleanly when triggering window.print() execution hooks.
 */
export function ReceiptPrinter({
  invoiceNumber,
  guestName,
  guestEmail,
  roomNumber,
  stayDays,
  baseAmount,
  discountAmount,
  gstAmount,
  netAmount,
  incidentals = [],
}: ReceiptPrinterProps) {
  
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const triggerPrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const incidentalTotal = incidentals.reduce((sum, item) => sum + item.amount, 0);
  const absoluteFinalTotal = netAmount + incidentalTotal;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0">
      {/* Action Header Banner - Hidden during physical layout execution */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 print:hidden">
        <div>
          <h3 className="text-base font-bold text-slate-900">Invoicing Matrix</h3>
          <p className="text-xs text-slate-500">Verify total bill parameters before triggering hard copy output.</p>
        </div>
        <button
          onClick={triggerPrint}
          className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          🖨️ Print Invoice Document
        </button>
      </div>

      {/* Corporate Printable Template Framing */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Marakale Serviced Apartments</h2>
            <p className="text-xs text-slate-500">Premium Living & Customer Excellence</p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-0.5">
            <p className="font-bold text-slate-900">INVOICE: #{invoiceNumber}</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Guest Metadata Ledger Blocks */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs print:bg-transparent print:border-slate-300">
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">Billed To</p>
            <p className="font-bold text-slate-900">{guestName}</p>
            <p className="text-slate-600">{guestEmail}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">Allocation Details</p>
            <p className="font-bold text-slate-900">Room Unit: {roomNumber}</p>
            <p className="text-slate-600">Total Stay: {stayDays} Nights</p>
          </div>
        </div>

        {/* Primary Invoice Line Itemizations */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Itemized Account Records</p>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-medium print:bg-transparent">
                  <th className="p-2.5">Description Details</th>
                  <th className="p-2.5 text-right">Line Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="p-2.5">Base Lodging Fees ({stayDays} nights)</td>
                  <td className="p-2.5 text-right">{formatCurrency(baseAmount)}</td>
                </tr>
                {discountAmount > 0 && (
                  <tr className="text-emerald-700 font-medium">
                    <td className="p-2.5">Length-of-Stay Tier Discount Applied</td>
                    <td className="p-2.5 text-right">-{formatCurrency(discountAmount)}</td>
                  </tr>
                )}
                
                {/* Incidental Additions Subheading */}
                {incidentals.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2.5">{item.description}</td>
                    <td className="p-2.5 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                
                <tr>
                  <td className="p-2.5 text-slate-600">Standard Goods & Services Tax (10% GST)</td>
                  <td className="p-2.5 text-right text-slate-600">{formatCurrency(gstAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Master Balanced Accounting Footers */}
        <div className="flex justify-end pt-2">
          <div className="w-48 text-xs space-y-1.5 border-t border-slate-200 pt-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Balance:</span>
              <span>{formatCurrency(baseAmount - discountAmount + incidentalTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST Entry Line:</span>
              <span>{formatCurrency(gstAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-900">
              <span>Grand Total Paid:</span>
              <span>{formatCurrency(absoluteFinalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
