# 📄 Document Signature App

A production-ready digital signature platform similar to DocuSign, iLovePDF, and Adobe Sign. Securely upload documents, place digital signatures, and generate legally traceable signed PDFs with full audit trails.

## 🚀 Features

### ✅ Implemented Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Authentication** | ✅ | JWT-based authentication with Supabase |
| **Document Upload** | ✅ | PDF upload with drag & drop support |
| **Document Management** | ✅ | List, filter, search, and delete documents |
| **Signature Creation** | ✅ | 10+ signature styles (Classic, Elegant, Modern, etc.) |
| **Drag & Drop Signatures** | ✅ | Click-to-place or drag from sidebar |
| **Signature Resizing** | ✅ | Resize signatures with drag handles |
| **Signature Moving** | ✅ | Drag signatures to reposition |
| **PDF Generation** | ✅ | Generate signed PDF with embedded signatures |
| **Audit Trail** | ✅ | Track all document activities |
| **Email Requests** | ✅ | Send signature requests via email |
| **Public Signing** | ✅ | Sign documents without login |
| **Download Signed PDF** | ✅ | Download final signed documents |

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + Vite | UI Framework & Build Tool |
| Tailwind CSS | Styling |
| React Router DOM | Routing |
| React-PDF | PDF Rendering |
| React-RND | Drag & Resize |
| Axios | API Calls |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | API Server |
| Supabase | Database, Auth, Storage |
| PDF-Lib | PDF Generation |
| Multer | File Upload |
| Nodemailer | Email Service |
| JWT | Authentication |

### Deployment
| Service | Purpose |
|---------|---------|
| Render.com | Backend Hosting |
| Vercel | Frontend Hosting |
| Supabase | Database & Storage |

## 📁 Project Structure

```

document-signature-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── multer.js          # File upload config
│   │   │   └── supabase.js        # Supabase client
│   │   ├── controllers/
│   │   │   ├── authController.js  # Authentication
│   │   │   ├── documentController.js # Documents CRUD
│   │   │   ├── signatureController.js # Signatures
│   │   │   └── auditController.js # Audit trails
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   └── validation.js      # Request validation
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── documentRoutes.js
│   │   │   ├── signatureRoutes.js
│   │   │   └── auditRoutes.js
│   │   ├── services/
│   │   │   ├── pdfService.js      # PDF generation
│   │   │   ├── emailService.js    # Email sending
│   │   │   └── auditService.js    # Audit logging
│   │   └── server.js              # Entry point
│   ├── uploads/                   # Temporary uploads
│   ├── .env                       # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentCard.jsx   # Document card
│   │   │   ├── StatsCard.jsx      # Statistics card
│   │   │   ├── UploadModal.jsx    # Upload modal
│   │   │   ├── AuditTimeline.jsx  # Activity history
│   │   │   └── SignatureSidebar.jsx # Signature options
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DocumentDetail.jsx
│   │   │   └── PublicSignature.jsx
│   │   ├── services/
│   │   │   ├── api.js             # API calls
│   │   │   └── authService.js     # Authentication
│   │   ├── styles/
│   │   │   └── index.css          # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                        # Environment variables
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md

```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/document-signature-app.git
cd document-signature-app
```

2. Setup Backend

```bash
cd backend
npm install
```

Create .env file:

```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

3. Setup Supabase

1. Create a Supabase project
2. Run the SQL from database/schema.sql in Supabase SQL Editor
3. Create storage buckets:
   · documents (public)
   · signed-documents (public)

4. Start Backend

```bash
npm run dev
# Server running on http://localhost:5000
```

5. Setup Frontend

```bash
cd frontend
npm install
```

Create .env:

```env
VITE_API_URL=http://localhost:5000/api
```

6. Start Frontend

```bash
npm run dev
# Frontend running on http://localhost:5173
```

7. Access Application

Open http://localhost:5173 in your browser.

### 🔧 Environment Variables

Backend .env

Variable Description Required
PORT Server port Yes
SUPABASE_URL Supabase project URL Yes
SUPABASE_SERVICE_KEY Supabase service key Yes
JWT_SECRET JWT secret key Yes
JWT_EXPIRE Token expiry (e.g., 7d) No
FRONTEND_URL Frontend URL for CORS Yes
EMAIL_USER Email for notifications No
EMAIL_PASS Email password/app password No

Frontend .env

Variable Description Required
VITE_API_URL Backend API URL Yes

📊 Database Schema

Tables

· profiles - User profiles
· documents - Document metadata
· signatures - Signature placements
· audit_logs - Activity tracking

Storage Buckets

· documents - Original PDFs
· signed-documents - Signed PDFs

🔐 Authentication Flow

1. User registers → Supabase Auth creates user
2. User logs in → JWT token returned
3. Token stored in localStorage
4. Token sent in Authorization header
5. Protected routes verify JWT with Supabase

📝 API Endpoints

Auth Routes

Method Endpoint Description
POST /api/auth/register Register user
POST /api/auth/login Login user
GET /api/auth/me Get current user
POST /api/auth/logout Logout user

Document Routes

Method Endpoint Description
POST /api/documents/upload Upload PDF
GET /api/documents Get all documents
GET /api/documents/:id Get document
DELETE /api/documents/:id Delete document
GET /api/documents/:id/download Download PDF
PUT /api/documents/:id/status Update status

Signature Routes

Method Endpoint Description
POST /api/signatures Create signature
GET /api/signatures/document/:id Get signatures
POST /api/signatures/:token/sign Submit signature
DELETE /api/signatures/:id Delete signature

Audit Routes

Method Endpoint Description
GET /api/audit/document/:id Get document logs
GET /api/audit/user Get user logs
GET /api/audit/document/:id/summary Get summary

🎨 Signature Styles

Style Description
Classic Brush Script MT, cursive
Elegant Georgia, serif, italic
Modern Arial, sans-serif, bold
Handwritten Comic Sans MS, cursive
Formal Times New Roman, serif
Bold Impact, sans-serif
Script Lucida Handwriting, cursive
Vintage Courier New, monospace
Artistic Palatino Linotype, serif
Professional Calibri, sans-serif

🚢 Deployment

Deploy Backend (Render.com)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Set environment variables
5. Deploy

Deploy Frontend (Vercel)

1. Push code to GitHub
2. Create new project on Vercel
3. Import repository
4. Set environment variables
5. Deploy

Deploy Supabase

· Already cloud-hosted
· No additional deployment needed

🧪 Testing

Test Credentials

```
Email: test@example.com
Password: Test123456
```

Test Flow

1. Register → Login → Dashboard
2. Upload PDF document
3. Click document → Document Detail
4. Create signature → Place on PDF
5. Drag/Resize signature
6. Click "Sign Document"
7. Download signed PDF

🔒 Security Features

· ✅ JWT Authentication
· ✅ Password hashing (bcrypt)
· ✅ Row Level Security (RLS)
· ✅ CORS configuration
· ✅ Input validation
· ✅ Rate limiting (optional)
· ✅ HTTPS (production)
· ✅ Audit logging

📈 Performance

· ✅ Lazy loading
· ✅ Code splitting
· ✅ Image optimization
· ✅ API caching
· ✅ Database indexing

🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

📄 License

MIT License - see LICENSE file

👨‍💻 Author

Built as a comprehensive full-stack project demonstrating:

· ✅ Document lifecycle management
· ✅ Digital signature workflows
· ✅ Audit trail implementation
· ✅ Production-ready SaaS architecture

🙏 Acknowledgments

· Supabase for database & auth
· PDF-lib for PDF generation
· React-PDF for PDF rendering
· Tailwind CSS for styling

📞 Support

For issues:

1. Check browser console for errors
2. Check backend logs
3. Verify environment variables
4. Open GitHub issue

---

⭐ Star this repository if you find it useful!

📧 Contact: [your-email@example.com]

🔗 Live Demo: https://your-app.vercel.app

```

## Bonus: Quick SQL Schema File

Create `database/schema.sql`:

```sql
-- Create tables
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT DEFAULT 'application/pdf',
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending',
  signature_status TEXT DEFAULT 'not_started',
  signed_file_path TEXT,
  required_signatures INTEGER DEFAULT 1,
  signatures_completed INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signature_text TEXT,
  signature_style TEXT DEFAULT 'classic',
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  page_number INTEGER DEFAULT 1,
  width INTEGER DEFAULT 200,
  height INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  token TEXT UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_signatures_document ON signatures(document_id);
CREATE INDEX idx_signatures_token ON signatures(token);
CREATE INDEX idx_audit_document ON audit_logs(document_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Users can view signatures" ON signatures FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = signatures.document_id AND documents.owner_id = auth.uid())
);
CREATE POLICY "Users can insert signatures" ON signatures FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = signatures.document_id AND documents.owner_id = auth.uid())
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('signed-documents', 'signed-documents', true) ON CONFLICT (id) DO NOTHING;
```

---

Your README is ready! Copy and paste this into your README.md file. 🚀
