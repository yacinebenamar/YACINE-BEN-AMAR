const fs = require('fs');
const file = 'src/components/SmartLogin.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Password \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
code = code.replace(regex, `
              <div className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    اسم المستخدم
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full bg-slate-50 dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-xl py-3.5 pl-4 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-fbm-blue-card focus:ring-2 focus:ring-fbm-green/20 focus:border-fbm-green transition-all outline-none font-medium text-left"
                      placeholder="أدخل اسم المستخدم"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full bg-slate-50 dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-xl py-3.5 pl-4 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-fbm-blue-card focus:ring-2 focus:ring-fbm-green/20 focus:border-fbm-green transition-all outline-none font-medium text-left"
                      placeholder="••••••••"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
`);

fs.writeFileSync(file, code);
