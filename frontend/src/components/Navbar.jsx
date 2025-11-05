import { Link, NavLink, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser, removeAuthToken } from '../utils/auth';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = stored ? stored === 'dark' : prefersDark;
    setDark(shouldDark);
    document.documentElement.classList.toggle('dark', shouldDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button onClick={toggle} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
      {dark ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const user = getUser();

  const handleLogout = () => {
    removeAuthToken();
    navigate('/');
  };

  const linkClass = ({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-primary-700 dark:text-primary-100 bg-primary-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/80 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary-600 text-white grid place-items-center font-bold">AI</div>
            <span className="hidden sm:block text-sm font-semibold text-gray-900 dark:text-gray-100">Diabetes AI</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {!authed && <NavLink to="/" className={linkClass}>Home</NavLink>}
          {authed && (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/meals" className={linkClass}>Meals</NavLink>
              <NavLink to="/chat" className={linkClass}>Chat</NavLink>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!authed ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800">Log in</Link>
              <Link to="/signup" className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700">Sign up</Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {user?.name && (
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">Hi, {user.name.split(' ')[0]}</span>
              )}
              <button onClick={handleLogout} className="px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
