# AIFlow Frontend

React 18 frontend application for AIFlow.

## Features

- React 18 with Vite
- Redux Toolkit for state management
- React Router for navigation
- Tailwind CSS for styling
- Formik & Yup for forms
- Axios for API calls
- JWT authentication
- Responsive design
- Environment-based API configuration

## Quick Start

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Create .env file:**
```bash
cp .env.example .env
# Edit .env with your backend API URL
```

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

5. **Preview production build:**
```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the frontend directory:

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000/api/v1
```

For production:
```bash
VITE_API_URL=https://your-backend-domain.railway.app/api/v1
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable components
│   │   ├── Common/   # Common UI components
│   │   └── Layout/   # Layout components
│   ├── config/       # Configuration files
│   ├── pages/        # Page components
│   ├── services/     # API services
│   ├── store/        # Redux store and slices
│   ├── App.jsx       # Main App component
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
├── index.html        # HTML template
├── vite.config.js    # Vite configuration
├── tailwind.config.js # Tailwind configuration
└── package.json      # Dependencies and scripts
```

## Technologies

- **Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **State Management:** Redux Toolkit 2.0
- **Routing:** React Router 6.20
- **HTTP Client:** Axios 1.6
- **Forms:** Formik 2.4, Yup 1.3
- **Styling:** Tailwind CSS 3.3
- **Notifications:** React Toastify 9.1

## API Integration

The frontend connects to the backend using the `VITE_API_URL` environment variable. API services are located in `src/services/`:

- `api.service.js` - Base API configuration
- `auth.service.js` - Authentication endpoints
- `user.service.js` - User management endpoints

## State Management

Redux Toolkit slices in `src/store/slices/`:

- `authSlice.js` - Authentication state
- `userSlice.js` - User data state
- `themeSlice.js` - Theme preferences

## Routing

Routes defined in `src/App.jsx`:

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard (protected)
- `/profile` - User profile (protected)

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Docker

Use the root `Dockerfile.frontend` to build a containerized version:

```bash
docker build -f ../Dockerfile.frontend -t aiflow-frontend .
docker run -p 3000:80 aiflow-frontend
```

## Development Guidelines

1. **Component Creation:**
   - Place in appropriate directory (`components/`, `pages/`)
   - Use functional components with hooks
   - Follow naming convention: PascalCase for components

2. **State Management:**
   - Use Redux for global state
   - Use local state for component-specific data
   - Create slices for new features

3. **API Calls:**
   - Use services from `src/services/`
   - Handle errors consistently
   - Show loading states

4. **Styling:**
   - Use Tailwind CSS utility classes
   - Keep custom CSS minimal
   - Maintain responsive design

## License

MIT
