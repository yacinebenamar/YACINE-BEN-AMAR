const fs = require('fs');
const file = 'src/components/SmartLogin.tsx';
let code = fs.readFileSync(file, 'utf8');

const rolesRegex = /\{\/\* Roles \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
const newRoles = `{/* Roles */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id as any)}
                    className={\`flex flex-col items-center justify-center gap-3 py-4 px-2 rounded-2xl border-2 transition-all \${
                      selectedRole === role.id
                        ? 'border-fbm-green bg-fbm-green/10 text-fbm-green shadow-sm'
                        : 'border-slate-200 dark:border-fbm-blue-border bg-slate-50 dark:bg-fbm-blue text-slate-500 dark:text-slate-400 hover:border-fbm-green/50'
                    }\`}
                  >
                    <role.icon className="w-6 h-6" />
                    <span className="text-sm font-bold">{role.label}</span>
                  </button>
                ))}
              </div>`;

code = code.replace(rolesRegex, newRoles);
code = code.replace(/placeholder="yacine \/ ali"/g, 'placeholder="أدخل اسم المستخدم"');
fs.writeFileSync(file, code);
