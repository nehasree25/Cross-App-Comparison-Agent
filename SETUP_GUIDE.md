# COMPLETE SETUP GUIDE - Cross-App Comparison Agent

## Project Structure

```
Cross-App-Comparison-Agent/
├── backend/                    # Python FastAPI backend (already set up)
│   ├── app/
│   │   ├── agents/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── tools/
│   │   ├── database.py
│   │   └── main.py
│   ├── data/
│   ├── env/                    # Python virtual environment
│   ├── main.py
│   └── requirements.txt
│
├── frontend/                   # React + Vite frontend (NEW)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── CategoryTicker.tsx
│   │   │   ├── QueryInput.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── RecommendationCard.tsx
│   │   │   ├── ComparisonResults.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── (+ CSS files for each)
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── ComparisonHistory.tsx
│   │   │   └── (+ CSS files for each)
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   └── README.md
│
└── README.md
```

## Installation Instructions

### Step 1: Backend Setup (Already Done)

The backend is already configured. Just ensure you have:
- Python 3.13+
- Virtual environment activated
- Dependencies installed from `requirements.txt`

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This installs:
- React 18.3.1
- TypeScript
- Vite
- GSAP for animations
- Axios for API calls
- React Router for navigation

### Step 3: Backend - Start the Server

In the `backend` directory:

```bash
# Activate virtual environment
env\Scripts\Activate          # Windows
source env/bin/activate       # Mac/Linux

# Start the backend server
python main.py
# or
uvicorn app.main:app --reload
```

Backend runs on: **http://localhost:8000**

### Step 4: Frontend - Start the Development Server

In the `frontend` directory:

```bash
npm run dev
```

Frontend runs on: **http://localhost:5173**

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## Features & Flow

### User Journey

1. **Landing Page** (`/`)
   - Hero section with comparison overview
   - Category ticker showing available products
   - "How It Works" section

2. **Authentication**
   - Sign Up (`/signup`) - Create account
   - Login (`/login`) - Authenticate user
   - Stored JWT token for secure API calls

3. **Main Comparison Flow**
   - User enters query: "Find laptops under ₹50,000 with rating > 4.5"
   - Frontend sends to backend: `POST /api/recommendations`
   - Backend AI agent searches multiple merchants
   - Results displayed with:
     - AI recommendation card (highlighted)
     - All matching products in a grid
     - Product comparison across merchants

4. **Comparison History** (`/history`)
   - View all past comparisons
   - Query, category, product count, timestamp
   - Access only with authentication

## Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Olive | #556B2F | Buttons, accents, active states |
| Secondary Olive | #6B7F3A | Hover states |
| Emerald | #059669 | Highlights |
| Light Emerald | #EEF2E6 | Backgrounds |
| White | #FFFFFF | Main background |
| Dark Text | #172018 | Main text |
| Border | #E5E9E1 | Dividers |

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700

### Key Components

#### Navbar
- Logo + "CrossCompare"
- Navigation menu
- Auth buttons / User greeting
- Responsive mobile menu

#### Hero Section
- Large headline: "Compare Across Apps. Choose the Best."
- Visual flow diagram
- Primary CTA: "Start Comparing"

#### Query Input
- Large search input
- Animated border on focus
- Emerald submit button
- Helpful suggestion text

#### Product Cards
- Product name, brand, merchant
- Price (emphasized in olive)
- Rating with review count
- Delivery time
- Availability status
- View Product button
- Hover effects with 3D tilt + spotlight

#### Recommendation Card
- "✦ AI RECOMMENDED" badge
- Prominent emerald border
- Product details
- Recommendation reason
- "Proceed with Selection" button

#### Comparison Results
- Summary of query
- All products in responsive grid
- AI analysis message

#### How It Works
- 3-step visual guide
- Benefits section

## API Integration

### Authentication Flow

**Register**
```
POST /auth/register
Body: { username: string, password: string }
Response: { id, username }
```

**Login**
```
POST /auth/token
Body: FormData { username, password }
Response: { access_token, token_type }
```

**Get Current User**
```
GET /auth/me
Headers: Authorization: Bearer {token}
Response: { id, username }
```

### Product Recommendations

**Get Recommendations**
```
POST /api/recommendations
Headers: Authorization: Bearer {token}
Body: { message: string }
Response: {
  message: string,
  recommended_product: {
    product_id, product_name, brand, final_price, 
    merchant, rating, delivery_time_days, reason
  },
  products: [{
    product_id, product_name, brand, category,
    final_price, merchant, rating, review_count,
    delivery_time_days, in_stock
  }, ...]
}
```

**Get Comparison History**
```
GET /api/comparison-history
Headers: Authorization: Bearer {token}
Response: [{
  id, user_id, user_query, category, 
  product_count, created_at
}, ...]
```

## Environment Configuration

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
```

Backend API URL is automatically proxied in Vite dev server.

## Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

Creates optimized build in `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

## Troubleshooting

### Issue: "Cannot GET /" when opening http://localhost:5173

**Solution**: Ensure `npm run dev` is running in the frontend directory.

### Issue: API calls failing / CORS errors

**Solution**: 
- Check backend is running on http://localhost:8000
- Verify Vite proxy config in `vite.config.ts`
- Check browser console for exact error

### Issue: Login not working

**Solution**:
- Backend must be running
- Verify credentials are correct
- Check localStorage has `access_token`
- Clear localStorage and try again

### Issue: Animations not smooth

**Solution**:
- Open DevTools Performance tab
- Check for CPU-bound operations
- GSAP is already optimized
- Reduce motion settings if needed

## Development Workflow

1. **Backend changes**: Restart `python main.py`
2. **Frontend changes**: Auto-reload with Vite dev server
3. **Component styling**: Edit corresponding `.css` files
4. **API changes**: Update `src/services/api.ts`

## Testing the Full Flow

1. Open http://localhost:5173
2. Click "Sign Up" or "Login"
3. Create account or login
4. Enter a product query in the search box
5. View results and recommendation
6. Click "View History" to see past comparisons

## Key Technologies

### Backend
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- LangChain (AI agent framework)
- Groq (LLM provider)

### Frontend
- React 18 (UI library)
- TypeScript (type safety)
- Vite (build tool)
- GSAP (animations)
- Axios (HTTP client)
- React Router (navigation)

## Support & Documentation

- Backend README: [backend/README.md](backend/README.md)
- Frontend README: [frontend/README.md](frontend/README.md)
- Design Spec: Provided in initial prompt
- GitHub: [repo-link]

---

**Ready to compare products across apps with AI recommendations!** 🚀

