const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src', 'components', 'portals');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [
  // Container
  { from: /overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm/g, to: 'overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md' },
  
  // Table element
  { from: /<table className="w-full text-left text-xs( font-mono)?"(.*?)>/g, to: '<table className="w-full text-left"$2>' },
  
  // thead element
  { from: /<thead className="bg-emerald-100 text-emerald-800 font-bold border-b border-emerald-100 uppercase tracking-wider"/g, to: '<thead className="bg-[#059669] text-white font-semibold text-[15px]"' },
  { from: /<thead className="bg-emerald-950 text-emerald-800 border-b border-emerald-100"/g, to: '<thead className="bg-[#059669] text-white font-semibold text-[15px]"' },

  // tbody element
  { from: /<tbody className="divide-y divide-emerald-100 text-slate-600( bg-black\/40)?"/g, to: '<tbody className="divide-y divide-slate-100 text-[#334155] font-medium text-[15px]"' },
  
  // tr hover and alternating colors
  { from: /className="hover:bg-emerald-50"/g, to: 'className="even:bg-[#f8fafc] hover:bg-slate-50 transition-colors"' },

  // Unnecessary mono/bold styling on table cells, reverting them to inherit the clean font from tbody
  { from: / font-mono font-bold text-slate-900/g, to: ' text-[#0f172a]' },
  { from: / font-semibold text-emerald-700/g, to: ' text-emerald-700' },
  { from: / font-mono text-slate-500/g, to: ' text-slate-500' },
  { from: / font-mono/g, to: '' },
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
