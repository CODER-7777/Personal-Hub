import React from "react";

export function TemplateGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-bg border-4 border-ink rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-[8px_8px_0px_var(--theme-ink)] relative">
        <h2 className="text-2xl font-extrabold uppercase tracking-tighter mb-4 text-ink">Timetable Image Template</h2>
        <p className="text-sm font-bold text-sub mb-6">
          For the best OCR results, upload a clear PNG or JPG image of your timetable formatted like a spreadsheet.
        </p>
        
        <div className="bg-line border-2 border-ink rounded-xl p-4 mb-6 overflow-x-auto">
          <table className="w-full text-left text-xs font-bold uppercase border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="p-2 border-r-2 border-ink">Time</th>
                <th className="p-2 border-r-2 border-ink">Monday</th>
                <th className="p-2 border-r-2 border-ink">Tuesday</th>
                <th className="p-2 border-r-2 border-ink">Wednesday</th>
                <th className="p-2 border-r-2 border-ink">Thursday</th>
                <th className="p-2">Friday</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-2 border-ink">
                <td className="p-2 border-r-2 border-ink">09:00 - 10:00</td>
                <td className="p-2 border-r-2 border-ink">Math 101</td>
                <td className="p-2 border-r-2 border-ink">Physics</td>
                <td className="p-2 border-r-2 border-ink">Math 101</td>
                <td className="p-2 border-r-2 border-ink">-</td>
                <td className="p-2">Chemistry</td>
              </tr>
              <tr>
                <td className="p-2 border-r-2 border-ink">10:00 - 11:00</td>
                <td className="p-2 border-r-2 border-ink">History</td>
                <td className="p-2 border-r-2 border-ink">-</td>
                <td className="p-2 border-r-2 border-ink">Biology</td>
                <td className="p-2 border-r-2 border-ink">History</td>
                <td className="p-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul className="list-disc pl-5 text-sm font-bold text-sub mb-8 space-y-2">
          <li>Ensure times are clearly readable (24hr or AM/PM).</li>
          <li>Ensure days of the week are columns or rows.</li>
          <li>Avoid cursive fonts or blurry screenshots.</li>
          <li>A digital screenshot of an Excel/Google Sheet is perfect!</li>
        </ul>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-ink text-bg font-bold uppercase tracking-widest rounded-xl hover:bg-sub transition-colors"
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}
