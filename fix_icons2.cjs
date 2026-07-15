const fs = require('fs');
let code = fs.readFileSync('src/components/WorkerDashboard.tsx', 'utf8');
code = code.replace(/, TrendingUp, Clock, Calendar, Truck, Package, UserCheck, MessageSquare } from "lucide-react";/, ', TrendingUp } from "lucide-react";');
fs.writeFileSync('src/components/WorkerDashboard.tsx', code);
