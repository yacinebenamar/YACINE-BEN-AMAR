const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `      {/* Mobile Glassmorphic Bottom Navigation */}`;

const replacement = `      {/* Chat FAB */}
      <button 
        onClick={() => setActiveTab('chat')}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-[#76BC21] hover:bg-[#62a118] text-[#000839] rounded-full shadow-[0_0_20px_rgba(118,188,33,0.4)] flex items-center justify-center z-50 transition-transform active:scale-95"
      >
        <MessageSquare className="w-7 h-7" />
        <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
          3
        </span>
      </button>

      {/* Mobile Glassmorphic Bottom Navigation */}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("FAB added.");
} else {
  console.log("Could not find targetStr to add FAB.");
}
