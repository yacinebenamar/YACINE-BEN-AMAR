const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string } | null>(null);",
  `  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);`
);

// We need to pass toggleTheme to AdminDashboard and WorkerDashboard
code = code.replace(
  "onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}",
  "onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}\n          onToggleTheme={toggleTheme}\n          isDarkMode={isDarkMode}"
);

code = code.replace(
  "onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}",
  "onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}\n          onToggleTheme={toggleTheme}\n          isDarkMode={isDarkMode}"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Added theme state to App.tsx");
