# WORKRAIL v2.2 Deployment Guide

Complete guide for deploying WORKRAIL v2.2 with security enhancements, Cloud Functions, and Firestore Rules.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup & Authentication](#setup--authentication)
3. [Deployment Steps](#deployment-steps)
4. [Cloud Functions](#cloud-functions)
5. [Firestore Security Rules](#firestore-security-rules)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Software Requirements
- **Node.js**: v16 or higher
  ```bash
  node --version  # Check installed version
  ```

- **Firebase CLI**: Latest version
  ```bash
  npm install -g firebase-tools@latest
  firebase --version
  ```

- **Google Cloud SDK (gcloud CLI)**: Latest version
  ```bash
  gcloud version
  gcloud components update
  ```

### Firebase Project Setup
1. Create or access your Firebase project at https://console.firebase.google.com
2. Project ID: `workrail-solenis`
3. Enable these services:
   - ✅ Authentication (Email/Password)
   - ✅ Realtime Database
   - ✅ Firestore Database
   - ✅ Cloud Storage (for file uploads)
   - ✅ Cloud Functions
   - ✅ Cloud Hosting

### Google Cloud Project Setup
1. Enable these APIs in Google Cloud Console:
   - Cloud Functions API
   - Cloud Build API
   - Cloud Logging API

## Setup & Authentication

### Step 1: Login to Firebase and Google Cloud

```bash
# Login to Firebase
firebase login

# Verify Firebase login
firebase projects:list

# Login to Google Cloud
gcloud auth login

# Set default project
gcloud config set project workrail-solenis
```

### Step 2: Configure Firebase Locally

```bash
# Navigate to project directory
cd "05. Projetos/Projeto Solicitação de maquina"

# Initialize Firebase (if not already done)
firebase init

# Or use existing config
firebase use workrail-solenis
```

### Step 3: Obtain Firebase API Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `workrail-solenis`
3. Go to **Settings** → **Project Settings**
4. Copy the **API Key** from the "General" tab
   - It looks like: `AIzaSy...`
5. Store safely - you'll need it for Cloud Function deployment

## Deployment Steps

### ⚠️ IMPORTANT: Deployment Order

Deploy in this exact order to avoid conflicts:

1. **Cloud Functions** (getFirebaseConfig) ← API Key proxy
2. **Firestore Security Rules** ← Server-side validation
3. **Firestore Database** ← Initialize collections
4. **Cloud Hosting** ← Deploy HTML/CSS/JS

---

## Cloud Functions

### What is the API Key Proxy?

The `getFirebaseConfig` Cloud Function securely distributes your Firebase API key without exposing it in the HTML source code.

**Why?**
- API keys in client-side code are visible in developer tools
- Cloud Function adds rate limiting and request validation
- Reduces attack surface for API key misuse

### Deploy getFirebaseConfig Function

#### Step 1: Prepare the Function

The `firebaseProxy.js` file is already in your project directory.

#### Step 2: Deploy the Function

```bash
# Replace YOUR_API_KEY_HERE with the Firebase API Key you copied
gcloud functions deploy getFirebaseConfig \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars FIREBASE_API_KEY="AIzaSy..." \
  --memory 256MB \
  --timeout 60s
```

**Parameters explained:**
- `--runtime nodejs18`: Node.js 18 runtime
- `--trigger-http`: HTTP trigger (responds to web requests)
- `--allow-unauthenticated`: Public endpoint (required for client-side initialization)
- `--region us-central1`: US Central region (closest to South America)
- `--set-env-vars`: Set API key as environment variable
- `--memory 256MB`: 256MB memory allocation
- `--timeout 60s`: 60 second timeout

#### Step 3: Verify Deployment

```bash
# List deployed functions
gcloud functions list

# Test the function
curl -X POST https://us-central1-workrail-solenis.cloudfunctions.net/getFirebaseConfig

# Check logs
gcloud functions logs read getFirebaseConfig --limit 50
```

Expected response:
```json
{
  "apiKey": "AIzaSy...",
  "authDomain": "workrail-solenis.firebaseapp.com",
  "projectId": "workrail-solenis",
  "storageBucket": "workrail-solenis.appspot.com",
  "messagingSenderId": "000000000000",
  "appId": "1:000000000000:web:0000000000000000",
  "cacheControl": "public, max-age=600"
}
```

### Update HTML to Use Cloud Function

Update `workrail_v2.html` to call the Cloud Function:

```javascript
// In initializeFirebase() function
async function initializeFirebase() {
  try {
    // Fetch config from Cloud Function instead of hardcoding
    const response = await fetch(
      'https://us-central1-workrail-solenis.cloudfunctions.net/getFirebaseConfig',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) throw new Error('Failed to fetch Firebase config');

    const firebaseConfig = await response.json();
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.database();

    setupAuthStateListener();
  } catch (error) {
    Logger.error('Firebase initialization failed', error);
    toast.show('❌ Erro ao conectar ao servidor', 'error');
  }
}
```

---

## Firestore Security Rules

### What are Security Rules?

Firestore Rules are server-side validation that:
- Enforce role-based access control (6 user roles)
- Validate data format (email, phone, CPF)
- Prevent unauthorized data access
- Protect against injection attacks

### Deploy Firestore Rules

The `firestore.rules` file defines all validation rules.

```bash
# Deploy Firestore Rules
firebase deploy --only firestore:rules
```

### Verify Rules Deployment

```bash
# Test rules with a specific user
firebase functions:config:set rules.version=v2.2

# Check deployed rules
firebase rules:list
```

### Rule Validation Examples

The rules validate:
- ✅ Email format (RFC 5322 simplified)
- ✅ Brazilian CPF (11 digits)
- ✅ Phone format (10+ digits with +55 prefix for Brazil)
- ✅ Request status (only specific values: pending, approved, etc.)
- ✅ CNPJ format (Brazilian company registration)
- ✅ User roles (6 specific roles only)
- ✅ Timestamp validation (no future dates)

---

## Firestore Database

### Initialize Collections

Create these collections in Firestore (Firebase Console):

#### Collection 1: `users`
```
- userId (doc ID)
  - email: string
  - name: string
  - role: string (super_admin|adm|gestor|vendas|fornecedor_ebst|fornecedor_hobart)
  - phone: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

#### Collection 2: `solicitacoes` (Requests)
```
- requestId (doc ID)
  - email: string
  - phone: string
  - cpf: string
  - status: string (pending|approved|rejected|in_progress|completed|archived)
  - createdBy: string (userId)
  - createdAt: timestamp
  - updatedAt: timestamp
```

#### Collection 3: `fornecedores` (Suppliers)
```
- supplierId (doc ID)
  - cnpj: string
  - name: string
  - email: string
  - phone: string
  - status: string (active|inactive|suspended)
  - createdAt: timestamp
  - updatedAt: timestamp
```

#### Collection 4: `auditoria` (Audit Log)
```
- auditId (doc ID)
  - userId: string
  - action: string
  - details: object
  - timestamp: timestamp
  - ipAddress: string
```

---

## Cloud Hosting

### Deploy to Firebase Hosting

#### Option 1: Automatic Deployment (PowerShell)

```powershell
# Windows PowerShell
.\deploy.ps1

# With options
.\deploy.ps1 -Force      # Ignore uncommitted changes
.\deploy.ps1 -Preview    # Create preview channel
.\deploy.ps1 -Serve      # Local development server
```

#### Option 2: Manual Deployment (Bash/CMD)

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy with version
firebase deploy --only hosting --message "v2.2.0 security release"
```

#### Option 3: Preview Channel (For Testing)

```bash
# Create preview channel
firebase hosting:channel:deploy staging

# View preview URL
firebase hosting:channels:list

# Merge to production
firebase hosting:channels:open staging  # Review changes
firebase hosting:channels:cleanup staging  # Delete when done
```

### Verify Hosting Deployment

```bash
# Check deployment history
firebase deploy:list

# View current hosting status
firebase hosting:sites:list

# Open production site
firebase open hosting:site

# View logs
firebase functions:logs read --limit 100
```

### Expected URLs After Deployment

- **Production**: https://workrail-solenis.web.app
- **Alternate**: https://workrail-solenis.firebaseapp.com
- **Preview**: https://workrail-solenis--{channel}.web.app

---

## Testing

### Test Authentication

```bash
# Open the app
firebase open hosting:site

# Login with test account
Email: test@solenis.com.br
Password: TestPassword123

# Expected: Should authenticate with Firebase
```

### Test Rate Limiting

```bash
# Try to login 6+ times with wrong password
# Expected: After 5 attempts, should show rate limit warning
# Expected: Should wait 15 minutes before retry
```

### Test Input Validation

```bash
# Test invalid email
Input: "notanemail"
Expected: "❌ Email inválido"

# Test weak password
Input: "weak"
Expected: "🔐 Senha inválida (min 8 chars, 1 uppercase, 1 number)"

# Test invalid CPF
Input: "000.000.000-00"
Expected: "❌ CPF inválido"
```

### Test Toast Notifications

```bash
# Login successfully
Expected: "✅ Bem-vindo, user!"  // Toast appears & auto-dismisses

# Failed login
Expected: "❌ Erro na autenticação"  // Toast appears
```

### Test Responsive Design

```bash
# Test on different screen sizes
- Mobile (375px): Sidebar collapses to icons
- Tablet (768px): Full sidebar with labels
- Desktop (1024px+): 3-column layout

# Use Chrome DevTools
F12 → Toggle Device Toolbar (Ctrl+Shift+M)
```

### Test Keyboard Navigation

```bash
# Login page
Tab → Cycle through email, password, forgot password, login button
Enter → Submit form
Escape → Clear errors (if implemented)

# Modals
Escape → Close forgot password modal
Tab → Cycle through modal buttons
```

---

## Troubleshooting

### Issue: API Key Not Working

```
Error: "apiKey invalid"
```

**Solution:**
1. Verify API Key from Firebase Console Settings
2. Ensure API Key has correct format (AIzaSy...)
3. Redeploy Cloud Function with new API Key:
   ```bash
   gcloud functions deploy getFirebaseConfig \
     --set-env-vars FIREBASE_API_KEY="CORRECT_KEY"
   ```

### Issue: Cloud Function Returns 403

```
Error: "Access Denied"
```

**Solution:**
1. Ensure `--allow-unauthenticated` flag was set
2. Check CORS origin restrictions
3. Redeploy with correct settings:
   ```bash
   gcloud functions deploy getFirebaseConfig \
     --allow-unauthenticated
   ```

### Issue: Firestore Rules Blocking All Requests

```
Error: "Missing or insufficient permissions"
```

**Solution:**
1. Verify `firestore.rules` syntax (Firebase Console)
2. Check user has correct role in custom claims
3. Test with super_admin role first

### Issue: Firebase Auth Not Working

```
Error: "auth is not defined"
```

**Solution:**
1. Ensure `initializeFirebase()` completes before `setupAuthStateListener()`
2. Add error handling in Cloud Function response
3. Check browser console (F12) for detailed errors

### Issue: Rate Limiter Not Working

```
Error: "Rate limit not enforced"
```

**Solution:**
1. Check `AuthRateLimiter` class in HTML
2. Verify rate limit window (15 minutes)
3. Test with multiple failed login attempts

### Issue: Toast Notifications Not Showing

```
No notifications appear after actions
```

**Solution:**
1. Verify toast container exists in HTML
2. Check CSS for `.toast-container` (z-index: 9999)
3. Open browser console to check for errors

---

## Post-Deployment Checklist

- [ ] Cloud Function getFirebaseConfig is deployed and responding
- [ ] Firestore Rules are deployed and validated
- [ ] Firebase Hosting is deployed to production
- [ ] Authentication works with real Firebase credentials
- [ ] Input validation is working for all forms
- [ ] Rate limiter blocks after 5 failed attempts
- [ ] Toast notifications appear for all actions
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Keyboard navigation works (Tab, Enter, ESC)
- [ ] ARIA labels are present (accessibility audit)
- [ ] Console shows no errors (F12 → Console)
- [ ] Lighthouse score is 95+ (Ctrl+Shift+I → Lighthouse)
- [ ] HTTPS is enforced (URL shows 🔒)
- [ ] CSP headers are set (F12 → Network → check Response Headers)
- [ ] Audit logs are being recorded in Firestore

---

## Support & Documentation

For more information:
- 📧 Email: suporte@solenis.com.br
- 💬 Teams: Solenis Brasil
- 📋 GitHub: [Project Repository]
- 📖 Firebase Docs: https://firebase.google.com/docs
- 🔐 Security: https://firebase.google.com/docs/database/security

---

**Version:** 2.2.0
**Last Updated:** March 24, 2026
**Status:** ✅ Production Ready
