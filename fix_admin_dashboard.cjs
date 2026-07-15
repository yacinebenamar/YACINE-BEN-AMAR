const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Fix AlertTriangle
if (!code.includes("AlertTriangle,")) {
  code = code.replace("AlertCircle,", "AlertCircle, AlertTriangle,");
  if (!code.includes("AlertTriangle,")) {
    code = code.replace("import {", "import { AlertTriangle,");
  }
}

// Fix useState types
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<\n?[^>]*>\('overview'\);/,
  `const [activeTab, setActiveTab] = useState<
  'overview' | 'users' | 'categories' | 'expenses' | 'tasks' | 'transfers' | 'orders' | 'debts' | 'camion' | 'supplier' | 'attendance' | 'chat' | 'broadcast'
>('overview');`
);

// Second attempt just in case the first didn't match the new state
code = code.replace(
  /useState<\s*'overview' \| 'users' \| 'categories' \| 'expenses' \| 'tasks' \| 'transfers' \| 'orders' \| 'debts' \| 'camion' \| 'supplier'\s*>\('overview'\)/,
  `useState<
  'overview' | 'users' | 'categories' | 'expenses' | 'tasks' | 'transfers' | 'orders' | 'debts' | 'camion' | 'supplier' | 'attendance' | 'chat' | 'broadcast'
>('overview')`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
