# WORKRAIL v2.2 Project Structure

Complete overview of all project files and their purposes.

**Version:** 2.2.0
**Last Updated:** March 24, 2026
**Status:** ✅ Production Ready

---

## Directory Layout

```
Projeto Solicitação de maquina/
├── 📄 workrail_v2.html              ⭐ Main application (1307 lines)
├── 📄 firebaseProxy.js              🔐 Cloud Function for API key proxy
├── 📄 firestore.rules               🛡️ Firestore security rules
├── 📄 firebase.json                 ⚙️ Firebase Hosting configuration
├── 📄 deploy.ps1                    🚀 Deployment script (PowerShell)
├── 📄 .nojekyll                     🚫 GitHub Pages configuration
├── 📖 README.md                     📚 Project overview & features
├── 📖 DEPLOYMENT_GUIDE.md           📋 Step-by-step deployment instructions
├── 📖 IMPROVEMENTS_SUMMARY.md       ✨ Before/after improvements overview
├── 📖 PROJECT_STRUCTURE.md          🗂️ This file
└── 📂 Solicitações de maquina/     📦 Backups and documentation
```

---

## Core Application Files

### 1. **workrail_v2.html** ⭐ (1307 lines)
**Purpose:** Complete single-page application (SPA) for WORKRAIL

**Contents:**
- HTML5 structure (login page, app shell, modals)
- CSS3 styles (1000+ lines, responsive design)
- JavaScript ES6+ (5 modules, 700+ lines)
- DOMPurify library integration
- Toast notification system
- Input validation framework
- Real Firebase authentication
- Event delegation for performance

**Key Sections:**
1. **HEAD:**
   - Meta tags (charset, viewport, description, theme-color)
   - Google Fonts integration (DM Sans, DM Mono)
   - DOMPurify library script
   - Firebase SDK scripts (App, Auth, Database)
   - Comprehensive CSS with 5 responsive breakpoints

2. **BODY:**
   - Login page (with email, password, forgot password modal)
   - Toast container (for notifications)
   - Main app shell (topbar, sidebar, main content area)
   - 7 workflow screens (dashboard, solicitacoes, fornecedores, admin)
   - All screens initially hidden, shown via JavaScript

3. **JavaScript Modules:**
   - **Module 1:** Configuration (app settings, Firebase config)
   - **Module 2:** Utilities (validators, sanitizer, logger)
   - **Module 3:** Components (toast system, rate limiter)
   - **Module 4:** Firebase (initialization, auth handlers)
   - **Module 5:** Application (main logic, event listeners)

**Development:**
- Single HTML file for easy deployment to Firebase Hosting
- No build step required
- Self-contained (all CSS and JS inline)
- Modular organization for maintainability

**Production:** ✅ Ready for deployment

---

### 2. **firebaseProxy.js** 🔐 (198 lines)
**Purpose:** Cloud Function to securely distribute Firebase API key

**Deployment Target:** Google Cloud Functions

**Features:**
- ✅ HTTP endpoint: `GET /getFirebaseConfig`
- ✅ Returns Firebase configuration at runtime
- ✅ Rate limiting: 100 requests per minute per IP
- ✅ CORS validation for allowed origins
- ✅ Environment variable for API key (not in code)
- ✅ Request validation and security headers
- ✅ 10-minute cache directive
- ✅ Audit logging for security
- ✅ Health check endpoint
- ✅ Scheduled cleanup function

**Functions:**
1. `getFirebaseConfig()` - Main endpoint for config distribution
2. `health()` - Health check endpoint for monitoring
3. `cleanupRequestLog()` - Periodic cleanup of request logs

**Deployment Command:**
```bash
gcloud functions deploy getFirebaseConfig \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars FIREBASE_API_KEY="AIzaSy..."
```

**Usage in App:**
```javascript
const response = await fetch(
  'https://us-central1-workrail-solenis.cloudfunctions.net/getFirebaseConfig',
  { method: 'POST' }
);
const config = await response.json();
firebase.initializeApp(config);
```

**Production:** ✅ Ready for deployment

---

### 3. **firestore.rules** 🛡️ (229 lines)
**Purpose:** Server-side security rules and validation for Firestore

**Deployment Target:** Firebase Firestore

**Key Functions:**
- `isAuthenticated()` - Check if user is logged in
- `hasRole(role)` - Check if user has specific role
- `hasAnyRole(roles)` - Check if user has one of multiple roles
- `isDocumentOwner(userId)` - Check if user owns document
- `isValidEmail(email)` - Validate email format (RFC 5322)
- `isValidCPF(cpf)` - Validate Brazilian CPF format
- `isValidPhone(phone)` - Validate phone format
- `isValidStatus(status)` - Validate request status enum
- `isValidCNPJ(cnpj)` - Validate Brazilian CNPJ format
- `isRecentTimestamp(timestamp)` - Prevent future timestamps

**Protected Collections:**

#### `users` Collection
- **Read:** Only owner, admin, super_admin
- **Create:** Only super_admin
- **Update:** Owner (limited fields), admin
- **Delete:** Only super_admin

#### `solicitacoes` (Requests) Collection
- **Read:** All authenticated users
- **Create:** vendas, gestor, adm, super_admin (with validation)
- **Update:** Creator or admin (with validation)
- **Delete:** Only admin

#### `fornecedores` (Suppliers) Collection
- **Read:** All authenticated users
- **Create:** Only admin
- **Update:** Only admin
- **Delete:** Only admin

#### `auditoria` (Audit Logs) Collection
- **Read:** Only admin
- **Create:** System operations
- **Update/Delete:** Not allowed (immutable)

**User Roles:**
1. `super_admin` - Full system access
2. `adm` - Admin panel, manage users/suppliers
3. `gestor` - Manager, approve/reject requests
4. `vendas` - Create and manage requests
5. `fornecedor_ebst` - EBST supplier access
6. `fornecedor_hobart` - Hobart supplier access

**Deployment Command:**
```bash
firebase deploy --only firestore:rules
```

**Production:** ✅ Ready for deployment

---

## Configuration Files

### 4. **firebase.json** ⚙️ (60 lines)
**Purpose:** Firebase Hosting configuration

**Contents:**
- `hosting.public`: "." (root directory is public)
- `hosting.ignore`: Files to exclude from deployment
- `hosting.rewrites`: SPA rewrite rule
- `hosting.headers`: Cache control and security headers

**Key Settings:**
```json
{
  "hosting": {
    "public": ".",
    "rewrites": [
      {
        "source": "**",
        "destination": "/workrail_v2.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "**/*.{js,css}",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      }
    ]
  }
}
```

**TODO (v2.2+):**
- Add Content-Security-Policy header
- Add Cloud Function rewrites for `/api/*`
- Add X-Content-Type-Options header

---

### 5. **deploy.ps1** 🚀 (110 lines)
**Purpose:** PowerShell deployment script with pre-checks

**Features:**
- ✅ Checks for Firebase CLI
- ✅ Checks for Node.js
- ✅ Checks git status (warns about uncommitted changes)
- ✅ Supports multiple deployment modes
- ✅ Pretty-printed output with colors and emojis
- ✅ Error handling and success messages

**Usage:**
```powershell
.\deploy.ps1                    # Standard deployment
.\deploy.ps1 -Force             # Ignore uncommitted changes
.\deploy.ps1 -Preview           # Create preview channel
.\deploy.ps1 -Serve             # Local development server
.\deploy.ps1 -NoPrompt          # Skip user prompts
```

**Output Example:**
```
╔════════════════════════════════════════════════════════╗
║  WORKRAIL v2.1 — Deploy Automático Firebase Hosting   ║
╚════════════════════════════════════════════════════════╝

ℹ️  Verificando Firebase CLI...
✅ Firebase CLI detectado
ℹ️  Verificando Node.js...
✅ Node.js detectado
🚀 Iniciando deploy...
[Firebase deploy output...]
✅ DEPLOY CONCLUÍDO COM SUCESSO!
```

---

### 6. **.nojekyll**
**Purpose:** Disables GitHub Pages Jekyll processing

**Content:** Empty file

**Use Case:** If GitHub Pages hosting is added later

---

## Documentation Files

### 7. **README.md** 📖 (300+ lines)
**Purpose:** Project overview and quick start guide

**Sections:**
- Project information (version, status, framework)
- Access URLs (production, local, test credentials)
- File structure overview
- Feature list (7 major features)
- Security information
- Deployment instructions (quick start)
- Local testing instructions
- Troubleshooting guide
- Performance metrics
- Version history and changelog

**Maintenance:**
- Update version number with releases
- Update feature list as features are added
- Keep troubleshooting section current
- Document new deployment steps

---

### 8. **DEPLOYMENT_GUIDE.md** 📋 (400+ lines)
**Purpose:** Comprehensive step-by-step deployment guide

**Contents:**
1. **Prerequisites** - Software and account requirements
2. **Setup & Authentication** - Firebase CLI and gcloud setup
3. **Deployment Steps** - Correct order for deployment
4. **Cloud Functions** - Deploy getFirebaseConfig function
5. **Firestore Rules** - Deploy security rules
6. **Firestore Database** - Initialize collections
7. **Cloud Hosting** - Deploy to Firebase Hosting
8. **Testing** - Verification procedures for each component
9. **Troubleshooting** - Common issues and solutions
10. **Post-Deployment Checklist** - Final verification items

**Key Instructions:**
- Obtain Firebase API key
- Deploy Cloud Function
- Deploy Firestore rules
- Deploy hosting
- Test authentication, rate limiting, validation
- Test responsive design and accessibility
- Verify production URLs work

**Target Audience:**
- DevOps engineers
- System administrators
- Development team
- First-time deployers

---

### 9. **IMPROVEMENTS_SUMMARY.md** ✨ (500+ lines)
**Purpose:** Detailed overview of v2.2 improvements

**Contents:**
1. **Executive Summary** - Quick overview of changes
2. **Phase 1: Security** - Real auth, validation, XSS protection, rate limiting, Cloud Function, Firestore rules
3. **Phase 2: UI/UX** - Responsive design, toast notifications, accessibility, error messages
4. **Phase 3: Performance** - Event delegation, code organization, logging, error handling
5. **Phase 4: Quality** - Error states, modal handling, state management
6. **Files Created/Modified** - Complete file change list
7. **Metrics & Improvements** - Before/after comparison table
8. **Testing Checklist** - Verification procedures
9. **Deployment Instructions** - Quick deployment guide
10. **Next Steps** - Optional Phase 3+ improvements
11. **Success Criteria** - v2.2 release criteria

**Target Audience:**
- Project managers
- Team leads
- Code reviewers
- Quality assurance

---

### 10. **PROJECT_STRUCTURE.md** 🗂️ (This file)
**Purpose:** Overview of project files and organization

**Contents:**
- Directory layout
- File descriptions
- File purposes and usage
- Development notes
- Maintenance guidelines

---

## Additional Files (From Previous Sessions)

### EXTRACTION_SUMMARY.md
**Purpose:** Notes from earlier extraction work
**Status:** Reference only (can be archived)

---

## Development Workflow

### Local Development
```bash
# 1. Clone/open project
cd "05. Projetos/Projeto Solicitação de maquina"

# 2. Start local Firebase server
firebase serve --only hosting
# Access: http://localhost:5000

# 3. Edit files in your editor
# Changes auto-reload in browser

# 4. Test before deployment
# See DEPLOYMENT_GUIDE.md for testing procedures
```

### Pre-Deployment Checklist
- [ ] All code tested locally
- [ ] No console errors (F12 → Console)
- [ ] Responsive design verified (F12 → Device Mode)
- [ ] Input validation working
- [ ] Authentication working
- [ ] Rate limiting working
- [ ] Accessibility verified (keyboard navigation, ARIA labels)
- [ ] Lighthouse score 95+ (F12 → Lighthouse)
- [ ] All features documented

### Deployment Process
```bash
# 1. Ensure all changes committed
git status
git add .
git commit -m "v2.2: [feature description]"

# 2. Deploy Cloud Functions (if changed)
gcloud functions deploy getFirebaseConfig \
  --set-env-vars FIREBASE_API_KEY="..."

# 3. Deploy Firestore rules (if changed)
firebase deploy --only firestore:rules

# 4. Deploy hosting
firebase deploy --only hosting

# 5. Verify production
firebase open hosting:site
# Test at https://workrail-solenis.web.app
```

### Post-Deployment
- [ ] Test production URLs work
- [ ] Check Firebase console for errors
- [ ] Verify Firestore rules are active
- [ ] Monitor Cloud Function logs
- [ ] Check email notifications are working
- [ ] Monitor user feedback

---

## File Sizes

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| workrail_v2.html | 1307 | ~45KB | Main app |
| firebaseProxy.js | 198 | ~6KB | Cloud Function |
| firestore.rules | 229 | ~7KB | Security rules |
| firebase.json | 60 | ~1.5KB | Config |
| deploy.ps1 | 110 | ~4KB | Deployment script |
| README.md | 300+ | ~12KB | Documentation |
| DEPLOYMENT_GUIDE.md | 400+ | ~18KB | Deployment guide |
| IMPROVEMENTS_SUMMARY.md | 500+ | ~25KB | Improvements |
| PROJECT_STRUCTURE.md | 300+ | ~15KB | This file |
| **TOTAL** | **~3600** | **~130KB** | **Complete project** |

---

## Version History

### v2.2.0 (March 24, 2026) - SECURITY & MODERNIZATION RELEASE
- ✅ Real Firebase Authentication
- ✅ Input validation framework
- ✅ XSS protection (DOMPurify)
- ✅ Rate limiting (auth)
- ✅ Cloud Function proxy for API key
- ✅ Firestore security rules
- ✅ 5 responsive breakpoints
- ✅ Toast notification system
- ✅ Accessibility improvements (WCAG AA)
- ✅ Keyboard navigation
- ✅ Event delegation for performance
- ✅ Modular code organization
- ✅ Comprehensive documentation

### v2.1.x (Earlier releases)
- See IMPROVEMENTS_SUMMARY.md for detailed history

---

## Best Practices & Guidelines

### Code Style
- Use camelCase for functions and variables
- Use UPPER_CASE for constants
- Add JSDoc comments for all functions
- Keep lines under 100 characters
- Use meaningful variable names

### Security
- Always sanitize user input with `sanitizeInput()`
- Use VALIDATORS for input validation
- Never log sensitive data (passwords, tokens)
- Use Firebase tokens for CSRF protection
- Keep API keys in environment variables

### Testing
- Test on mobile (320px), tablet (768px), desktop (1024px)
- Test keyboard navigation (Tab, Enter, ESC)
- Test screen readers (NVDA/JAWS)
- Test with real Firebase credentials
- Run Lighthouse audit (target 95+)

### Performance
- Use event delegation for multiple listeners
- Cache Firebase queries with DataCache
- Lazy-load screens with ScreenManager
- Monitor Lighthouse score
- Check bundle size (<50KB gzipped)

### Accessibility
- Add ARIA labels to interactive elements
- Support keyboard navigation
- Maintain color contrast (4.5:1 WCAG AA)
- Test with screen readers
- Test with keyboard only (no mouse)

---

## Maintenance & Updates

### Regular Tasks
- Monitor Firebase logs weekly
- Check Firestore usage (cost optimization)
- Review user feedback monthly
- Update security patches as available
- Test backup and recovery procedures

### Version Updates
- Update version in `workrail_v2.html` (APP_CONFIG.version)
- Update version in `README.md` (Info table)
- Update version in deployment script comments
- Create new changelog entry
- Tag release in git

### Security Audits
- Quarterly security review
- Penetration testing (annually)
- Dependency updates (Firebase, DOMPurify)
- OWASP Top 10 compliance check
- Rate limit tuning based on usage

---

## Support & Contact

For questions or issues:
- 📧 **Email:** suporte@solenis.com.br
- 💬 **Teams:** Solenis Brasil
- 📖 **Docs:** See README.md and DEPLOYMENT_GUIDE.md
- 🐛 **Issues:** Create GitHub issue with reproduction steps
- 📞 **Emergency:** Contact development team lead

---

## License & Copyright

© 2024-2026 Solenis Brasil. All rights reserved.
Proprietary software. Restricted to Solenis Brasil employees only.

---

**Status:** ✅ Production Ready
**Maintained By:** Solenis Development Team
**Last Updated:** March 24, 2026
