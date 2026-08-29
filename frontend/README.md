# CrossCompare Frontend

A modern React + TypeScript + Vite frontend for the Cross-App Comparison Agent.

## Features

- 🎨 **White + Olive/Emerald Design** - Clean, professional SaaS interface
- ⚡ **React + TypeScript + Vite** - Fast, type-safe development
- 🔍 **Intelligent Product Search** - Multi-app comparison with AI recommendations
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🎭 **GSAP Animations** - Smooth, premium interactions
- 🔐 **Secure Authentication** - JWT-based user authentication

## Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── CategoryTicker.tsx
│   │   ├── QueryInput.tsx
│   │   ├── ProductCard.tsx
│   │   ├── RecommendationCard.tsx
│   │   ├── ComparisonResults.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Footer.tsx
│   ├── pages/                # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── ComparisonHistory.tsx
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx
│   ├── services/             # API service layer
│   │   └── api.ts
│   ├── App.tsx               # Main app with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Setup

Create a `.env` file in the frontend root (optional):

```env
REACT_APP_API_URL=http://localhost:8000
```

### 3. Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## Design System

### Color Palette

- **Primary Olive**: #556B2F
- **Secondary Olive**: #6B7F3A
- **Emerald Highlight**: #059669
- **Light Emerald**: #EEF2E6
- **White**: #FFFFFF
- **Dark Text**: #172018
- **Secondary Text**: #667064
- **Border**: #E5E9E1

### Typography

- **Font Family**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700

### Components

#### Navbar
- Sticky top navigation
- Responsive PillNav-style menu with GSAP hover animations
- Authentication state indicator

#### Hero Section
- Headline highlighting "Best" with olive green
- Visual flow diagram showing comparison process
- Dual CTA buttons

#### Category Ticker
- Infinite horizontal scrolling categories
- GSAP animation with pause on hover
- Gradient fade edges

#### Query Input (RadiantPromptInput)
- Controlled input with animated border
- GSAP focus animations
- Loading state with spinner
- Enter-to-submit support

#### Product Cards (MagicBento)
- 3D tilt effect with GSAP
- Spotlight hover animation
- Emerald glow on recommended products
- Price, rating, delivery, and availability details

#### Recommendation Card
- Prominent emerald border and gradient background
- AI recommendation badge
- Reason explanation
- "Proceed with Selection" CTA

#### Comparison Results
- Displays all matching products
- Highlights recommended product
- Shows AI analysis message
- Handles empty states

#### How It Works
- Three-step visual guide
- Benefits grid
- Educational content

#### Footer
- Dark background (#172018)
- Links organized by category
- Copyright and legal links

## API Integration

The frontend integrates with the backend at `http://localhost:8000` with these endpoints:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/token` - Login (returns JWT token)
- `GET /auth/me` - Get current user

### Agent
- `POST /api/recommendations` - Get product recommendations
- `GET /api/comparison-history` - Get comparison history

## Authentication Flow

1. User registers/logs in on `/signup` or `/login`
2. JWT token is stored in localStorage
3. Token is automatically added to all API requests
4. Protected routes require authentication
5. Logout clears token and redirects to login

## Responsive Breakpoints

- **Desktop**: Full layout with two-column sections
- **Tablet (≤1024px)**: Adjusted spacing, single-column in some sections
- **Mobile (≤768px)**: Full-width, stacked layout, simplified navigation

## Performance Optimizations

- Code splitting with Vite
- Lazy loading with React Router
- GSAP animations are performance-optimized
- Images and assets are optimized
- CSS is scoped to components

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- **react**: UI library
- **react-dom**: DOM rendering
- **react-router-dom**: Client-side routing
- **axios**: HTTP client
- **gsap**: Animation library
- **typescript**: Type safety

## Development

### Run Development Server
```bash
npm run dev
```

### Build Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## Notes

- All colors follow the white + olive/emerald design system
- Animations use GSAP for performance
- Components are fully responsive
- TypeScript ensures type safety
- API calls are centralized in the api service
- Authentication is managed via React Context

## License

MIT

