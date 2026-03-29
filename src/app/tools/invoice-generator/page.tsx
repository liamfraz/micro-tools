"use client";

import { useState, useMemo, useCallback } from "react";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolBreadcrumb from "@/components/ToolBreadcrumb";
import {
  generateFAQSchema,
  generateWebAppSchema,
  generateBreadcrumbSchema,
} from "@/lib/jsonld";

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${y}${m}${d}-${rand}`;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function thirtyDaysISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const PAYMENT_TERMS = [
  "Due on Receipt",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Net 90",
];

export default function InvoiceGeneratorPage() {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(todayISO);
  const [dueDate, setDueDate] = useState(thirtyDaysISO);
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [taxRate, setTaxRate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" },
  ]);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof Omit<LineItem, "id">, value: string) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    const tax = taxRate ? subtotal * ((parseFloat(taxRate) || 0) / 100) : 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items, taxRate]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (iso: string): string => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <title>
        Free Invoice Generator - Create &amp; Download PDF Invoices | DevTools Hub
      </title>
      <meta
        name="description"
        content="Free invoice generator to create professional invoices and download as PDF. Add line items, tax, payment terms, and notes. No sign-up required, runs entirely in your browser."
      />
      <JsonLd
        data={[
          generateWebAppSchema({
            slug: "invoice-generator",
            name: "Free Invoice Generator",
            description:
              "Create professional invoices and download as PDF. Add line items, tax, payment terms, and notes. Free and runs entirely in your browser.",
            category: "finance",
          }),
          generateBreadcrumbSchema({
            slug: "invoice-generator",
            name: "Free Invoice Generator",
            description:
              "Create professional invoices and download as PDF. Add line items, tax, payment terms, and notes.",
            category: "finance",
          }),
          generateFAQSchema([
            {
              question: "Is this invoice generator completely free?",
              answer:
                "Yes, this invoice generator is 100% free with no sign-up required. It runs entirely in your browser, so no data is sent to any server. You can create unlimited invoices and download them as PDFs using your browser's built-in print-to-PDF feature.",
            },
            {
              question: "How do I download my invoice as a PDF?",
              answer:
                "Click the 'Download PDF' button and your browser's print dialog will open. Select 'Save as PDF' as the destination (instead of a printer), then click Save. This uses your browser's native print-to-PDF functionality, so no external software is needed.",
            },
            {
              question: "What information should I include on an invoice?",
              answer:
                "A professional invoice should include: your company name and address, the client's name and address, a unique invoice number, the invoice date and due date, payment terms, an itemized list of services or products with quantities and prices, subtotal, any applicable tax, and the total amount due. You can also add notes or payment instructions.",
            },
            {
              question: "How are invoice numbers generated?",
              answer:
                "Invoice numbers are auto-generated using the format INV-YYMMDD-XXXX, where YYMMDD is the current date and XXXX is a random 4-digit number. You can edit the invoice number to use your own numbering system. Consistent invoice numbering helps with bookkeeping and tax records.",
            },
          ]),
        ]}
      />

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: white !important; margin: 0; padding: 0; }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              .print-invoice {
                display: block !important;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                z-index: 99999;
                padding: 40px;
                box-sizing: border-box;
                color: #1a1a1a;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
            }
          `,
        }}
      />

      {/* Printable invoice (hidden on screen) */}
      <div
        className="print-invoice"
        style={{ display: "none" }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Invoice header */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#111" }}>
                INVOICE
              </h1>
              <p style={{ color: "#666", marginTop: 4, fontSize: 14 }}>
                {invoiceNumber}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              {companyName && (
                <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{companyName}</p>
              )}
              {companyAddress && (
                <p
                  style={{ color: "#666", whiteSpace: "pre-line", marginTop: 4, fontSize: 13 }}
                >
                  {companyAddress}
                </p>
              )}
            </div>
          </div>

          {/* Bill To and dates */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Bill To
              </p>
              {clientName && (
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{clientName}</p>
              )}
              {clientAddress && (
                <p style={{ color: "#666", whiteSpace: "pre-line", marginTop: 4, fontSize: 13 }}>
                  {clientAddress}
                </p>
              )}
            </div>
            <div style={{ textAlign: "right", fontSize: 13 }}>
              <p style={{ margin: "0 0 4px 0" }}>
                <span style={{ color: "#888" }}>Invoice Date: </span>
                {formatDate(invoiceDate)}
              </p>
              <p style={{ margin: "0 0 4px 0" }}>
                <span style={{ color: "#888" }}>Due Date: </span>
                {formatDate(dueDate)}
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: "#888" }}>Payment Terms: </span>
                {paymentTerms}
              </p>
            </div>
          </div>

          {/* Line items table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #333" }}>
                <th style={{ textAlign: "left", padding: "8px 0", fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>
                  Description
                </th>
                <th style={{ textAlign: "right", padding: "8px 0", fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, width: 80 }}>
                  Qty
                </th>
                <th style={{ textAlign: "right", padding: "8px 0", fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, width: 120 }}>
                  Unit Price
                </th>
                <th style={{ textAlign: "right", padding: "8px 0", fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, width: 120 }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice) || 0;
                const amount = qty * price;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #e5e5e5" }}>
                    <td style={{ padding: "10px 0", fontSize: 14 }}>
                      {item.description || "—"}
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 0", fontSize: 14 }}>
                      {qty}
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 0", fontSize: 14 }}>
                      {formatCurrency(price)}
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 0", fontSize: 14 }}>
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
            <div style={{ width: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
                <span style={{ color: "#666" }}>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {taxRate && parseFloat(taxRate) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
                  <span style={{ color: "#666" }}>Tax ({parseFloat(taxRate)}%)</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  fontSize: 18,
                  fontWeight: 700,
                  borderTop: "2px solid #333",
                  marginTop: 4,
                }}
              >
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: 16 }}>
              <p style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Notes / Terms
              </p>
              <p style={{ color: "#444", whiteSpace: "pre-line", fontSize: 13 }}>{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Screen layout */}
      <div className="min-h-screen bg-slate-900 text-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ToolBreadcrumb slug="invoice-generator" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Free Invoice Generator
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Create professional invoices in seconds. Fill in your details, add
              line items, and download as a PDF — all for free, right in your
              browser.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left column: Form */}
            <div className="space-y-6">
              {/* Company Details */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Your Company Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="company-name"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Company Name
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your Company Name"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="company-address"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Company Address
                    </label>
                    <textarea
                      id="company-address"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder={"123 Business St\nCity, State 12345\nemail@company.com"}
                      rows={3}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Client Details */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Client Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="client-name"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Client Name
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client or Company Name"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="client-address"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Client Address
                    </label>
                    <textarea
                      id="client-address"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder={"456 Client Ave\nCity, State 67890"}
                      rows={3}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Invoice Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="invoice-number"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Invoice Number
                    </label>
                    <input
                      id="invoice-number"
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="payment-terms"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Payment Terms
                    </label>
                    <select
                      id="payment-terms"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PAYMENT_TERMS.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="invoice-date"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Invoice Date
                    </label>
                    <input
                      id="invoice-date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="due-date"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Due Date
                    </label>
                    <input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Line Items
                </h2>

                {/* Header row */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 mb-2 text-xs font-medium text-slate-400">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1" />
                </div>

                <div className="space-y-3">
                  {items.map((item) => {
                    const qty = parseFloat(item.quantity) || 0;
                    const price = parseFloat(item.unitPrice) || 0;
                    const lineTotal = qty * price;

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                      >
                        <div className="sm:col-span-5">
                          <label className="sm:hidden block text-xs text-slate-400 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            placeholder="Service or product"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="sm:hidden block text-xs text-slate-400 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, "quantity", e.target.value)
                            }
                            placeholder="1"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="sm:hidden block text-xs text-slate-400 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(item.id, "unitPrice", e.target.value)
                            }
                            placeholder="0.00"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-2 text-right text-sm font-medium text-slate-300">
                          <span className="sm:hidden text-xs text-slate-400 mr-2">
                            Amount:
                          </span>
                          {formatCurrency(lineTotal)}
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="text-red-400 hover:text-red-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors p-1"
                            aria-label="Remove line item"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="mt-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  + Add Line Item
                </button>
              </div>

              {/* Tax & Notes */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Tax &amp; Notes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="tax-rate"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Tax Rate (%)
                      <span className="text-slate-500 ml-1">(optional)</span>
                    </label>
                    <input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Notes / Terms
                    <span className="text-slate-500 ml-1">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment instructions, late fee policy, thank you note, etc."
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Right column: Live Preview */}
            <div>
              <div className="sticky top-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Invoice Preview
                  </h2>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                  >
                    Download PDF
                  </button>
                </div>

                <div className="bg-white rounded-lg p-6 sm:p-8 text-slate-900 shadow-lg">
                  {/* Preview header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">INVOICE</h3>
                      <p className="text-slate-500 text-sm mt-1">{invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      {companyName && (
                        <p className="font-semibold text-base">{companyName}</p>
                      )}
                      {companyAddress && (
                        <p className="text-slate-500 text-xs whitespace-pre-line mt-1">
                          {companyAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bill To + Dates */}
                  <div className="flex justify-between mb-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                        Bill To
                      </p>
                      {clientName && (
                        <p className="font-semibold text-sm">{clientName}</p>
                      )}
                      {clientAddress && (
                        <p className="text-slate-500 text-xs whitespace-pre-line mt-1">
                          {clientAddress}
                        </p>
                      )}
                      {!clientName && !clientAddress && (
                        <p className="text-slate-300 text-xs italic">
                          Client details will appear here
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <p>
                        <span className="text-slate-400">Date: </span>
                        {formatDate(invoiceDate)}
                      </p>
                      <p>
                        <span className="text-slate-400">Due: </span>
                        {formatDate(dueDate)}
                      </p>
                      <p>
                        <span className="text-slate-400">Terms: </span>
                        {paymentTerms}
                      </p>
                    </div>
                  </div>

                  {/* Line items table */}
                  <table className="w-full text-xs mb-4">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-2 text-slate-500 font-medium uppercase tracking-wider">
                          Description
                        </th>
                        <th className="text-right py-2 text-slate-500 font-medium uppercase tracking-wider w-12">
                          Qty
                        </th>
                        <th className="text-right py-2 text-slate-500 font-medium uppercase tracking-wider w-20">
                          Price
                        </th>
                        <th className="text-right py-2 text-slate-500 font-medium uppercase tracking-wider w-20">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const qty = parseFloat(item.quantity) || 0;
                        const price = parseFloat(item.unitPrice) || 0;
                        const lineTotal = qty * price;
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100"
                          >
                            <td className="py-2 text-slate-700">
                              {item.description || "—"}
                            </td>
                            <td className="py-2 text-right text-slate-700">
                              {qty}
                            </td>
                            <td className="py-2 text-right text-slate-700">
                              {formatCurrency(price)}
                            </td>
                            <td className="py-2 text-right text-slate-700">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-48">
                      <div className="flex justify-between py-1 text-xs">
                        <span className="text-slate-500">Subtotal</span>
                        <span>{formatCurrency(totals.subtotal)}</span>
                      </div>
                      {taxRate && parseFloat(taxRate) > 0 && (
                        <div className="flex justify-between py-1 text-xs">
                          <span className="text-slate-500">
                            Tax ({parseFloat(taxRate)}%)
                          </span>
                          <span>{formatCurrency(totals.tax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 text-sm font-bold border-t-2 border-slate-200 mt-1">
                        <span>Total</span>
                        <span>{formatCurrency(totals.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {notes && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                        Notes / Terms
                      </p>
                      <p className="text-xs text-slate-600 whitespace-pre-line">
                        {notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* How to Use / SEO content */}
          <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              How to Use the Free Invoice Generator
            </h2>
            <div className="text-slate-400 space-y-3">
              <p>
                Creating professional invoices has never been easier. This free
                invoice generator lets you build, preview, and download invoices
                as PDFs without signing up for any service or installing
                software.
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Enter your company name and address in the &quot;Your Company
                  Details&quot; section.
                </li>
                <li>
                  Fill in your client&apos;s name and address under &quot;Client
                  Details&quot;.
                </li>
                <li>
                  Review the auto-generated invoice number, set the invoice date,
                  due date, and payment terms.
                </li>
                <li>
                  Add line items with descriptions, quantities, and unit prices.
                  Click &quot;+ Add Line Item&quot; for additional rows.
                </li>
                <li>
                  Optionally set a tax rate and add notes or payment
                  instructions.
                </li>
                <li>
                  Preview your invoice in real time on the right side of the
                  screen.
                </li>
                <li>
                  Click &quot;Download PDF&quot; and select &quot;Save as
                  PDF&quot; in your browser&apos;s print dialog.
                </li>
              </ol>
              <p>
                All data stays in your browser. Nothing is sent to a server, and
                there are no usage limits or watermarks on your invoices.
              </p>
            </div>
          </section>

          <RelatedTools currentSlug="invoice-generator" />

          {/* FAQ Section */}
          <section className="mt-16 border-t border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is this invoice generator completely free?
                </h3>
                <p className="text-slate-400">
                  Yes, this invoice generator is 100% free with no sign-up
                  required. It runs entirely in your browser, so no data is sent
                  to any server. You can create unlimited invoices and download
                  them as PDFs using your browser&apos;s built-in print-to-PDF
                  feature.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I download my invoice as a PDF?
                </h3>
                <p className="text-slate-400">
                  Click the &quot;Download PDF&quot; button and your
                  browser&apos;s print dialog will open. Select &quot;Save as
                  PDF&quot; as the destination (instead of a printer), then click
                  Save. This uses your browser&apos;s native print-to-PDF
                  functionality, so no external software is needed.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What information should I include on an invoice?
                </h3>
                <p className="text-slate-400">
                  A professional invoice should include: your company name and
                  address, the client&apos;s name and address, a unique invoice
                  number, the invoice date and due date, payment terms, an
                  itemized list of services or products with quantities and
                  prices, subtotal, any applicable tax, and the total amount due.
                  You can also add notes or payment instructions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How are invoice numbers generated?
                </h3>
                <p className="text-slate-400">
                  Invoice numbers are auto-generated using the format
                  INV-YYMMDD-XXXX, where YYMMDD is the current date and XXXX is
                  a random 4-digit number. You can edit the invoice number to use
                  your own numbering system. Consistent invoice numbering helps
                  with bookkeeping and tax records.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
