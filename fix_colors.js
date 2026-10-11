const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src', 'components', 'portals');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [
  { from: /text-white/g, to: 'text-slate-900' },
  { from: /text-gray-300/g, to: 'text-slate-600' },
  { from: /text-gray-400/g, to: 'text-slate-500' },
  { from: /text-emerald-300/g, to: 'text-emerald-700' },
  { from: /text-emerald-400/g, to: 'text-emerald-800' },
  { from: /bg-emerald-950\/80/g, to: 'bg-emerald-100' },
  { from: /bg-emerald-950\/30/g, to: 'bg-emerald-50' },
  { from: /bg-emerald-950\/90/g, to: 'bg-emerald-50' },
  { from: /bg-red-950\/90/g, to: 'bg-red-50' },
  { from: /bg-red-950/g, to: 'bg-red-100' },
  { from: /text-red-400/g, to: 'text-red-700' },
  { from: /text-red-300/g, to: 'text-red-700' },
  { from: /bg-black\/60/g, to: 'bg-white' },
  { from: /glass-panel/g, to: 'bg-white shadow-sm' },
  { from: /glass-card/g, to: 'bg-white shadow-sm' },
  { from: /border-emerald-500\/30/g, to: 'border-emerald-200' },
  { from: /border-emerald-500\/20/g, to: 'border-emerald-100' },
  { from: /border-emerald-500\/40/g, to: 'border-emerald-300' },
  { from: /divide-emerald-500\/10/g, to: 'divide-emerald-100' },
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
