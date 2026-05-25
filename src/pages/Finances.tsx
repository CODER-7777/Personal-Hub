import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import { Device } from '@capacitor/device';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useAppStore } from "../store";
import { motion } from "motion/react";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, Download, Filter, Search, User, RefreshCw, Printer, Calendar, Camera } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { isSameDay, isSameMonth, isSameYear, parseISO } from "date-fns";
import { GoogleGenAI, Type } from "@google/genai";
import imageCompression from "browser-image-compression";

const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#8b5cf6'];

export default function Finances() {
  const { expenses, addExpense, removeExpense } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [person, setPerson] = useState("");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterItem, setFilterItem] = useState("");
  const [filterPerson, setFilterPerson] = useState("");
  
  // Time filter sublevels
  const [timeFilter, setTimeFilter] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('all');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    addExpense({
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      category,
      description,
      person,
      type,
      date: new Date().toISOString(),
    });
    setAmount("");
    setCategory("");
    setDescription("");
    setPerson("");
    setShowAdd(false);
  };

  const reportRef = useRef<HTMLDivElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleReceiptScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      toast.info("Analyzing receipt...");

      const compressedFile = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 2048 });
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY);
        
        if (!apiKey) {
          toast.error("Gemini API Key missing in environment variables.");
          setIsScanning(false);
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: "Extract the expense details from this receipt image. Use logical categories like Food, Utilities, Transport, Shopping." },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          },
          config: {
            safetySettings: [],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER, description: "Total amount on the receipt" },
                category: { type: Type.STRING, description: "Logical category of the expense" },
                description: { type: Type.STRING, description: "Brief summary or merchant name" },
                person: { type: Type.STRING, description: "Person name if visible, otherwise empty" },
              },
              required: ["amount", "category", "description"]
            }
          }
        });

        if (response.text) {
          try {
            const parsed = JSON.parse(response.text);
            addExpense({
              id: crypto.randomUUID(),
              amount: parsed.amount,
              category: parsed.category,
              description: parsed.description || "Scanned Receipt",
              person: parsed.person || "",
              type: 'expense',
              date: new Date().toISOString(),
            });
            toast.success("Receipt scanned and added successfully!");
          } catch(e) {
            toast.error("Failed to parse the receipt correctly.");
            console.error(e);
          }
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.error("Error processing receipt image.");
      console.error(error);
      setIsScanning(false);
    } finally {
      if (scanInputRef.current) scanInputRef.current.value = "";
    }
  };

  // Filter by time
  const now = new Date();
  const timeFilteredExpenses = expenses.filter(e => {
    if (timeFilter === 'all') return true;
    const date = parseISO(e.date);
    if (timeFilter === 'daily') return isSameDay(date, now);
    if (timeFilter === 'monthly') return isSameMonth(date, now);
    if (timeFilter === 'yearly') return isSameYear(date, now);
    return true;
  });

  const totalIncome = timeFilteredExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = timeFilteredExpenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = timeFilteredExpenses
    .filter(e => e.type === 'expense')
    .reduce((acc, current) => {
      acc[current.category] = (acc[current.category] || 0) + current.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  const filteredExpenses = timeFilteredExpenses
    .filter(e => filterCategory ? e.category.toLowerCase().includes(filterCategory.toLowerCase()) : true)
    .filter(e => filterItem ? e.description?.toLowerCase().includes(filterItem.toLowerCase()) : true)
    .filter(e => filterPerson ? e.person?.toLowerCase().includes(filterPerson.toLowerCase()) : true)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // PDF Export logic
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      toast.info("Generating PDF report...");
      
      const info = await Device.getInfo();
      const isMobile = info.platform === 'android' || info.platform === 'ios';

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      pdf.setFillColor(18, 18, 18);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`FINANCE REPORT (${timeFilter.toUpperCase()})`, margin, 26);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin, 26, { align: 'right' });
      y = 50;

      const cardWidth = (contentWidth - 10) / 3;
      const drawCard = (x: number, label: string, value: string, color: [number, number, number]) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.setFillColor(248, 248, 248);
        pdf.roundedRect(x, y, cardWidth, 28, 3, 3, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, x + 5, y + 10);
        pdf.setFontSize(16);
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, x + 5, y + 23);
      };

      drawCard(margin, 'TOTAL BALANCE', `$${balance.toFixed(2)}`, [0, 0, 0]);
      drawCard(margin + cardWidth + 5, 'INCOME', `$${totalIncome.toFixed(2)}`, [34, 197, 94]);
      drawCard(margin + (cardWidth + 5) * 2, 'EXPENSES', `$${totalExpense.toFixed(2)}`, [239, 68, 68]);
      y += 36;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TRANSACTIONS', margin, y);
      y += 6;

      pdf.setFillColor(18, 18, 18);
      pdf.rect(margin, y, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      const colX = [margin + 3, margin + 20, margin + 55, margin + 100, margin + 140];
      pdf.text('TYPE', colX[0], y + 5.5);
      pdf.text('CATEGORY', colX[1], y + 5.5);
      pdf.text('DESCRIPTION', colX[2], y + 5.5);
      pdf.text('PERSON', colX[3], y + 5.5);
      pdf.text('AMOUNT', colX[4], y + 5.5);
      y += 8;
      
      filteredExpenses.forEach((exp, index) => {
        if (y + 9 > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }

        if (index % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, y, contentWidth, 8, 'F');
        }

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');

        if (exp.type === 'income') {
          pdf.setTextColor(34, 197, 94);
          pdf.text('INCOME', colX[0], y + 5.5);
        } else {
          pdf.setTextColor(239, 68, 68);
          pdf.text('EXPENSE', colX[0], y + 5.5);
        }

        pdf.setTextColor(30, 30, 30);
        pdf.setFont('helvetica', 'bold');
        pdf.text(exp.category.substring(0, 20), colX[1], y + 5.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text((exp.description || '-').substring(0, 25), colX[2], y + 5.5);
        pdf.text((exp.person || '-').substring(0, 20), colX[3], y + 5.5);

        const amtStr = `${exp.type === 'income' ? '+' : '-'}$${exp.amount.toFixed(2)}`;
        if (exp.type === 'income') pdf.setTextColor(34, 197, 94);
        else pdf.setTextColor(30, 30, 30);
        pdf.setFont('helvetica', 'bold');
        pdf.text(amtStr, colX[4], y + 5.5);

        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(6);
        pdf.text(new Date(exp.date).toLocaleDateString(), pageWidth - margin, y + 5.5, { align: 'right' });
        y += 8;
      });

      if (filteredExpenses.length === 0) {
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(9);
        pdf.text('No transactions recorded.', margin, y + 10);
      }

      const fileName = `FinanceReport_${timeFilter}_${new Date().toISOString().split('T')[0]}.pdf`;

      if (isMobile) {
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
        });
        
        await Share.share({
          title: 'Finance Report',
          text: 'Here is your finance report',
          url: savedFile.uri,
          dialogTitle: 'Open Finance Report',
        });
        toast.success("PDF generated and shared!");
      } else {
        pdf.save(fileName);
        toast.success("PDF Report downloaded!");
      }
    } catch (error: any) {
      console.error("PDF Export failed", error);
      toast.error(`Export Failed: ${error.message || "Check memory/permissions"}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8" ref={reportRef}>
      
      {/* HEADER & TIME FILTER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2">FINANCES</h1>
          <div className="flex gap-2 mt-2 md:mt-4 overflow-x-auto pb-2">
            {(['all', 'daily', 'monthly', 'yearly'] as const).map(filter => (
              <button 
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 text-[10px] md:text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all border-2 whitespace-nowrap ${timeFilter === filter ? 'bg-ink text-bg border-ink shadow-[3px_3px_0px_var(--theme-ink)]' : 'bg-bg text-ink border-ink hover:bg-highlight hover:shadow-[3px_3px_0px_var(--theme-ink)]'}`}
              >
                {filter === 'all' ? 'LIFETIME' : filter}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 print:hidden">
          <input type="file" accept="image/*" className="hidden" ref={scanInputRef} onChange={handleReceiptScan} />
          <button 
            onClick={() => scanInputRef.current?.click()}
            disabled={isScanning}
            className="bg-bg hover:bg-highlight text-ink px-4 md:px-6 py-3 font-extrabold uppercase tracking-widest text-[10px] md:text-[12px] transition-all flex items-center gap-2 border-2 border-ink rounded-xl hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 flex-1 md:flex-none justify-center disabled:opacity-50"
          >
            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {isScanning ? "SCANNING..." : "SCAN RECEIPT"}
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-bg hover:bg-highlight text-ink px-4 md:px-6 py-3 font-extrabold uppercase tracking-widest text-[10px] md:text-[12px] transition-all flex items-center gap-2 border-2 border-ink rounded-xl hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 flex-1 md:flex-none justify-center disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            EXPORT PDF
          </button>
          <button 
            onClick={() => { setShowAdd(!showAdd); setType('expense'); }}
            className="bg-ink hover:bg-sub text-bg px-4 md:px-6 py-3 font-extrabold uppercase tracking-widest text-[10px] md:text-[12px] transition-all flex items-center gap-2 border-2 border-transparent rounded-xl hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 flex-1 md:flex-none justify-center"
          >
            <Plus className="w-4 h-4" /> ADD RECORD
          </button>
        </div>
      </div>

      {/* TOP CHARTS & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PIE CHART MOVED TO TOP */}
        <div className="bg-bg p-6 flex flex-col border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)] min-h-[300px] lg:col-span-1 print:break-inside-avoid print:shadow-none print:border-none">
          <h2 className="text-[12px] md:text-[14px] font-extrabold uppercase tracking-widest text-ink mb-2 pb-2 border-b-2 border-ink inline-block">EXPENSES BREAKDOWN</h2>
          {chartData.length > 0 ? (
            <div className="h-48 md:h-64 w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={chartData} 
                    cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" 
                    paddingAngle={5} dataKey="value" stroke="#000" strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {chartData.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} contentStyle={{ borderRadius: '8px', border: '2px solid #000', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[12px] font-extrabold uppercase tracking-widest text-sub">No expenses to chart</div>
          )}
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-2 gap-4 md:gap-6">
          <div className="bg-bg p-6 flex flex-col justify-center items-start gap-4 hover:bg-highlight transition-all border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)] sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-3 border-2 border-ink bg-bg rounded-xl"><DollarSign className="w-6 h-6 md:w-8 md:h-8 text-ink" /></div>
              <p className="text-[12px] md:text-[14px] font-extrabold uppercase tracking-widest text-sub">TOTAL BALANCE</p>
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-ink">${balance.toFixed(2)}</h3>
          </div>
          
          <div className="bg-bg p-5 md:p-6 flex flex-col justify-center items-start gap-3 hover:bg-highlight transition-all border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
            <div className="flex items-center gap-2">
              <div className="p-2 border-2 border-ink bg-bg rounded-lg"><ArrowUpRight className="w-5 h-5 text-green-500" /></div>
              <p className="text-[10px] md:text-[12px] font-extrabold uppercase tracking-widest text-sub">INCOME</p>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter text-ink">${totalIncome.toFixed(2)}</h3>
          </div>
          
          <div className="bg-bg p-5 md:p-6 flex flex-col justify-center items-start gap-3 hover:bg-highlight transition-all border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
            <div className="flex items-center gap-2">
              <div className="p-2 border-2 border-ink bg-bg rounded-lg"><ArrowDownRight className="w-5 h-5 text-red-500" /></div>
              <p className="text-[10px] md:text-[12px] font-extrabold uppercase tracking-widest text-sub">EXPENSES</p>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter text-ink">${totalExpense.toFixed(2)}</h3>
          </div>
        </div>

      </div>

      {showAdd && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-highlight border-2 border-ink rounded-3xl p-6 md:p-8 overflow-hidden print:hidden" onSubmit={handleAdd}
        >
          <div className="flex gap-4 mb-6">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-4 font-extrabold text-[12px] uppercase rounded-xl tracking-widest transition-colors border-2 ${type === 'expense' ? 'bg-[var(--color-safe-red)] text-bg border-[var(--color-safe-red)]' : 'bg-bg text-ink border-ink hover:bg-sub hover:text-bg hover:border-sub'}`}>EXPENSE</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-4 font-extrabold text-[12px] uppercase rounded-xl tracking-widest transition-colors border-2 ${type === 'income' ? 'bg-[var(--color-safe-green)] text-bg border-[var(--color-safe-green)]' : 'bg-bg text-ink border-ink hover:bg-sub hover:text-bg hover:border-sub'}`}>INCOME</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-ink mb-2">Amount</label>
              <input required value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-base font-bold bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-ink mb-2">Category</label>
              <input required value={category} onChange={e => setCategory(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-base font-bold bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder={type === 'expense' ? 'Food, Rent...' : 'Salary, Freelance...'} />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-ink mb-2">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-base font-bold bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Optional notes" />
            </div>
             <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-ink mb-2">Person (Optional)</label>
              <input value={person} onChange={e => setPerson(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-base font-bold bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Who?" />
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-ink hover:bg-bg border-2 border-transparent rounded-xl hover:border-ink font-extrabold uppercase tracking-widest text-[11px] transition-colors text-center">CANCEL</button>
            <button type="submit" className="px-6 py-3 bg-ink hover:bg-bg hover:text-ink text-bg rounded-xl border-2 border-ink font-extrabold uppercase tracking-widest text-[11px] transition-colors text-center">SAVE RECORD</button>
          </div>
        </motion.form>
      )}

      {/* FILTER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="relative">
          <Search className="w-5 h-5 text-ink absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            value={filterItem} onChange={e => setFilterItem(e.target.value)}
            placeholder="FILTER BY ITEM..." 
            className="w-full pl-12 pr-4 py-3 bg-bg border-2 border-ink rounded-xl text-[11px] font-extrabold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 text-ink absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            placeholder="FILTER BY CATEGORY..." 
            className="w-full pl-12 pr-4 py-3 bg-bg border-2 border-ink rounded-xl text-[11px] font-extrabold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
        <div className="relative">
          <User className="w-5 h-5 text-ink absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            value={filterPerson} onChange={e => setFilterPerson(e.target.value)}
            placeholder="FILTER BY PERSON..." 
            className="w-full pl-12 pr-4 py-3 bg-bg border-2 border-ink rounded-xl text-[11px] font-extrabold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
      </div>

      <div className="bg-bg flex flex-col border-2 border-ink rounded-3xl overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)] print:border-none print:shadow-none print:rounded-none">
        <div className="p-6 border-b-2 border-ink bg-line pb-4 print:bg-bg print:border-b-2">
          <h2 className="text-[12px] font-extrabold uppercase tracking-widest text-ink">TRANSACTIONS {filteredExpenses.length !== timeFilteredExpenses.length && '(FILTERED)'}</h2>
        </div>
        <div className="divide-y-2 divide-ink flex-1">
          {filteredExpenses.map(exp => (
            <div key={exp.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between group transition-colors bg-bg gap-4 hover:bg-highlight relative">
              <div className="flex items-start md:items-center gap-4 w-full md:w-auto">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex-shrink-0 border-2 items-center justify-center flex bg-bg ${exp.type === 'income' ? 'border-[var(--color-safe-green)] text-[var(--color-safe-green)] shadow-[3px_3px_0px_transparent] group-hover:shadow-[3px_3px_0px_var(--color-safe-green)]' : 'border-[var(--color-safe-red)] text-[var(--color-safe-red)] shadow-[3px_3px_0px_transparent] group-hover:shadow-[3px_3px_0px_var(--color-safe-red)]'} transition-all`}>
                  {exp.type === 'income' ? <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8" /> : <ArrowDownRight className="w-6 h-6 md:w-8 md:h-8" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md border-2 ${exp.type === 'income' ? 'border-[var(--color-safe-green)] text-[var(--color-safe-green)] bg-[var(--color-safe-green-bg)]' : 'border-[var(--color-safe-red)] text-[var(--color-safe-red)] bg-[var(--color-safe-red-bg)]'}`}>
                      {exp.type}
                    </span>
                    <h4 className="font-extrabold tracking-tight text-ink text-lg md:text-xl leading-none">{exp.category}</h4>
                  </div>
                  <p className="text-[10px] md:text-[12px] font-extrabold uppercase tracking-widest text-sub leading-snug">
                      <Calendar className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {new Date(exp.date).toLocaleDateString()} 
                      {exp.description && ` • ${exp.description}`} 
                      {exp.person && ` • @${exp.person}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 mt-2 md:mt-0">
                <span className={`font-extrabold tracking-tighter text-xl md:text-2xl ${exp.type === 'income' ? 'text-[var(--color-safe-green)]' : 'text-ink'}`}>
                  {exp.type === 'income' ? '+' : '-'}${exp.amount.toFixed(2)}
                </span>
                <button onClick={() => removeExpense(exp.id)} className="text-sub hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl print:hidden bg-line md:bg-transparent border-2 border-transparent hover:border-red-500">
                  <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>
          ))}
          {filteredExpenses.length === 0 && <div className="p-16 text-center text-[12px] font-extrabold uppercase tracking-widest text-sub">No transactions matched.</div>}
        </div>
      </div>
    </div>
  );
}
