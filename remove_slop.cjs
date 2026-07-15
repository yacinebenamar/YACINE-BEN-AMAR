const fs = require('fs');

function removeSlop(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    // Remove the fake server pill in the mobile header
    code = code.replace(/<div className="mt-6 bg-slate-[^>]+>\s*<div className="flex items-center justify-center[^>]+>\s*<Bell[^>]+>\s*<\/div>\s*<div className="flex items-center gap-2">\s*<div className="text-right">\s*<span[^>]+>.*?<\/span>\s*<span[^>]+>.*?<\/span>\s*<\/div>\s*<div[^>]+>\s*<\/div>\s*<\/div>/s, '');
    
    // Check if it left an empty </div> and clean it if so, but regex above might be brittle.
    // Let's do it safer by just removing the entire block if it matches the text.
    code = code.replace(/<div className="mt-6 bg-slate-[^>]+>[\s\S]*?DZ-REGIONAL-PORT:3000[\s\S]*?<\/div>\s*<\/div>/, '');

    // Let's look for "DZ-REGIONAL-PORT:3000" and remove its parent container
    fs.writeFileSync(file, code);
    console.log("Cleaned slop from", file);
}

removeSlop('src/components/AdminDashboard.tsx');
removeSlop('src/components/WorkerDashboard.tsx');
