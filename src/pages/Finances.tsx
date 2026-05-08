import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import { Device } from '@capacitor/device';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useAppStore } from "../store";
import { motion } from "motion/react";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, Download, Filter, Search, User, RefreshCw, Printer } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

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
  const [isExporting, setIsExporting] = useState(false);

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

      // --- HEADER ---
      pdf.setFillColor(18, 18, 18);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FINANCE REPORT', margin, 26);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - margin, 26, { align: 'right' });
      pdf.text('Personal Hub', pageWidth - margin, 32, { align: 'right' });
      y = 50;

      // --- SUMMARY CARDS ---
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

      // --- TRANSACTIONS TABLE ---
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TRANSACTIONS', margin, y);
      y += 6;

      // Table header
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

      // Table rows
      const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      sortedExpenses.forEach((exp, index) => {
        // Check page overflow
        if (y + 9 > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }

        // Alternating row colors
        if (index % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, y, contentWidth, 8, 'F');
        }

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');

        // Type badge
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

        // Date on the right
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date(exp.date).toLocaleDateString(), pageWidth - margin, y + 5.5, { align: 'right' });

        y += 8;
      });

      if (sortedExpenses.length === 0) {
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(9);
        pdf.text('No transactions recorded.', margin, y + 10);
      }

      // --- FOOTER ---
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(180, 180, 180);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        pdf.text('Personal Hub — Finance Report', margin, pageHeight - 8);
      }

      const fileName = `FinanceReport_${new Date().toISOString().split('T')[0]}.pdf`;

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

  const totalIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = expenses
    .filter(e => e.type === 'expense')
    .reduce((acc, current) => {
      acc[current.category] = (acc[current.category] || 0) + current.amount;
      return acc;
    }, {} as Record<string, number>);

  const filteredExpenses = expenses
    .filter(e => filterCategory ? e.category.toLowerCase().includes(filterCategory.toLowerCase()) : true)
    .filter(e => filterItem ? e.description?.toLowerCase().includes(filterItem.toLowerCase()) : true)
    .filter(e => filterPerson ? e.person?.toLowerCase().includes(filterPerson.toLowerCase()) : true)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const chartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8" ref={reportRef}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2">FINANCES</h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Track your monthly expenses and income.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-bg hover:bg-highlight text-ink px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex items-center gap-2 border-2 border-ink rounded-xl hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 hover:-translate-x-1 flex-1 md:flex-none justify-center"
          >
            <Printer className="w-4 h-4" />
            PRINT / SAVE
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-bg hover:bg-highlight text-ink px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex items-center gap-2 border-2 border-ink rounded-xl hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 hover:-translate-x-1 flex-1 md:flex-none justify-center disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? "PREPARING..." : "EXPORT PDF"}
          </button>
          <button 
            onClick={() => { setShowAdd(!showAdd); setType('expense'); }}
            className="bg-ink hover:bg-sub text-bg px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex items-center gap-2 border-2 border-transparent rounded-xl hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 hover:-translate-x-1 flex-1 md:flex-none justify-center"
          >
            <Plus className="w-4 h-4" /> ADD RECORD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-bg p-4 md:p-6 flex flex-col items-start gap-3 md:gap-4 group hover:bg-highlight transition-all relative border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] col-span-2 md:col-span-1">
          <div className="p-2 md:p-3 border-2 border-ink bg-bg rounded-lg md:rounded-xl"><DollarSign className="w-5 h-5 md:w-6 md:h-6 text-ink" /></div>
          <div><p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub group-hover:text-ink">TOTAL BALANCE</p><h3 className="text-3xl md:text-4xl font-extrabold tracking-tighter mt-1 text-ink">${balance.toFixed(2)}</h3></div>
        </div>
        <div className="bg-bg p-4 md:p-6 flex flex-col items-start gap-3 md:gap-4 group hover:bg-highlight transition-all relative border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]">
          <div className="p-2 md:p-3 border-2 border-ink bg-bg rounded-lg md:rounded-xl"><ArrowUpRight className="w-4 h-4 md:w-6 md:h-6 text-green-500" /></div>
          <div><p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub group-hover:text-ink">INCOME</p><h3 className="text-2xl md:text-3xl font-extrabold tracking-tighter mt-1 text-ink">${totalIncome.toFixed(2)}</h3></div>
        </div>
        <div className="bg-bg p-4 md:p-6 flex flex-col items-start gap-3 md:gap-4 group hover:bg-highlight transition-all relative border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]">
          <div className="p-2 md:p-3 border-2 border-ink bg-bg rounded-lg md:rounded-xl"><ArrowDownRight className="w-4 h-4 md:w-6 md:h-6 text-red-500" /></div>
          <div><p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub group-hover:text-ink">EXPENSES</p><h3 className="text-2xl md:text-3xl font-extrabold tracking-tighter mt-1 text-ink">${totalExpense.toFixed(2)}</h3></div>
        </div>
      </div>

      {showAdd && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-highlight border-2 border-ink rounded-2xl md:rounded-3xl p-5 md:p-8 overflow-hidden print:hidden" onSubmit={handleAdd}
        >
          <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 md:py-4 font-bold text-[10px] md:text-[11px] uppercase rounded-xl tracking-widest transition-colors border-2 ${type === 'expense' ? 'bg-[var(--color-safe-red)] text-bg border-[var(--color-safe-red)]' : 'bg-bg text-ink border-ink hover:bg-sub hover:text-bg hover:border-sub'}`}>EXPENSE</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 md:py-4 font-bold text-[10px] md:text-[11px] uppercase rounded-xl tracking-widest transition-colors border-2 ${type === 'income' ? 'bg-[var(--color-safe-green)] text-bg border-[var(--color-safe-green)]' : 'bg-bg text-ink border-ink hover:bg-sub hover:text-bg hover:border-sub'}`}>INCOME</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Amount</label>
              <input required value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Category</label>
              <input required value={category} onChange={e => setCategory(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder={type === 'expense' ? 'Food, Rent...' : 'Salary, Freelance...'} />
            </div>
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Optional notes" />
            </div>
             <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Person (Optional)</label>
              <input value={person} onChange={e => setPerson(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Who?" />
            </div>
          </div>
          <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-ink hover:bg-bg border-2 border-transparent rounded-xl hover:border-ink font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center">CANCEL</button>
            <button type="submit" className="px-6 py-3 bg-ink hover:bg-bg hover:text-ink text-bg rounded-xl border-2 border-ink font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center">SAVE RECORD</button>
          </div>
        </motion.form>
      )}

      {/* FILTER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-ink absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            value={filterItem} onChange={e => setFilterItem(e.target.value)}
            placeholder="FILTER BY ITEM..." 
            className="w-full pl-12 pr-4 py-3 bg-bg border-2 border-ink rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-ink absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            placeholder="FILTER BY CATEGORY..." 
            className="w-full pl-12 pr-4 py-3 bg-bg border-2 border-ink rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
        <div className="relative">
          <User className="w-4 h-4 text-ink absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            value={filterPerson} onChange={e => setFilterPerson(e.target.value)}
            placeholder="FILTER BY PERSON..." 
            className="w-full pl-12 pr-4 py-3 bg-bg border-2 border-ink rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg flex flex-col border-2 border-ink rounded-3xl overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)] print:border-none print:shadow-none print:rounded-none">
          <div className="p-6 border-b-2 border-ink bg-line pb-4 print:bg-bg print:border-b-2">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink">TRANSACTIONS {filteredExpenses.length !== expenses.length && '(FILTERED)'}</h2>
          </div>
          <div className="divide-y-2 divide-ink flex-1">
            {filteredExpenses.map(exp => (
              <div key={exp.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between group transition-colors bg-bg gap-4 print:break-inside-avoid hover:bg-highlight relative">
                <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0 border-2 items-center justify-center flex bg-bg ${exp.type === 'income' ? 'border-[var(--color-safe-green)] text-[var(--color-safe-green)] shadow-[2px_2px_0px_transparent] group-hover:shadow-[2px_2px_0px_var(--color-safe-green)]' : 'border-[var(--color-safe-red)] text-[var(--color-safe-red)] shadow-[2px_2px_0px_transparent] group-hover:shadow-[2px_2px_0px_var(--color-safe-red)]'} transition-all`}>
                    {exp.type === 'income' ? <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" /> : <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                      <span className={`text-[8px] md:text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border-2 ${exp.type === 'income' ? 'border-[var(--color-safe-green)] text-[var(--color-safe-green)] bg-[var(--color-safe-green-bg)]' : 'border-[var(--color-safe-red)] text-[var(--color-safe-red)] bg-[var(--color-safe-red-bg)]'}`}>
                        {exp.type}
                      </span>
                      <h4 className="font-bold tracking-tight text-ink text-lg md:text-xl leading-none">{exp.category}</h4>
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub leading-snug">
                       {new Date(exp.date).toLocaleDateString()} 
                       {exp.description && ` • ${exp.description}`} 
                       {exp.person && ` • @${exp.person}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3 md:gap-6 mt-2 md:mt-0">
                  <span className={`font-extrabold tracking-tighter text-2xl md:text-3xl ${exp.type === 'income' ? 'text-[var(--color-safe-green)]' : 'text-ink'}`}>
                    {exp.type === 'income' ? '+' : '-'}${exp.amount.toFixed(2)}
                  </span>
                  <button onClick={() => removeExpense(exp.id)} className="text-sub hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl print:hidden bg-line md:bg-transparent border-2 border-transparent hover:border-red-500">
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredExpenses.length === 0 && <div className="p-16 text-center text-[10px] font-bold uppercase tracking-widest text-sub">No transactions matched.</div>}
          </div>
        </div>

        <div className="bg-bg p-6 flex flex-col border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)] min-h-[350px] print:break-inside-avoid print:shadow-none print:border-none">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink mb-6 pb-2 border-b-2 border-ink inline-block">EXPENSES BREAKDOWN</h2>
          {chartData.length > 0 ? (
            <div className="h-64 w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={chartData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="#000" 
                    strokeWidth={2}
                    isAnimationActive={false} // Disable animation on mobile for better reliability
                  >
                    {chartData.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} contentStyle={{ borderRadius: '0', border: '2px solid #000', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-sub">Not enough data</div>
          )}
        </div>
      </div>
    </div>
  );
}
