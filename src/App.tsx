import { useLiveQuery } from 'dexie-react-hooks';
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { db } from './db';
import { Icon } from './components/Icon';
import { useNow } from './components/RestTimer';
import { fmtDuration } from './lib/units';
import { useSettings } from './settings';
import { Home } from './pages/Home';
import { RoutineEditor, Routines } from './pages/Routines';
import { CustomExerciseEditor, ExerciseDetail, Exercises } from './pages/Exercises';
import { Workout } from './pages/Workout';
import { History, WorkoutDetail } from './pages/History';
import { Settings } from './pages/Settings';

function ActiveBanner() {
  const { t } = useSettings();
  const active = useLiveQuery(() => db.active.get('current'), []);
  const loc = useLocation();
  const now = useNow(1000);
  if (!active || loc.pathname === '/workout') return null;
  const rest = active.restEndsAt ? Math.ceil((active.restEndsAt - now) / 1000) : 0;
  return (
    <Link to="/workout" className="active-banner">
      <span><strong>{t.activeWorkout}</strong> · {active.name}</span>
      <span>{rest > 0 ? <>⏱ {fmtDuration(rest)}</> : fmtDuration((now - active.startedAt) / 1000)} <Icon name="chevron" size={16} /></span>
    </Link>
  );
}

function TabBar() {
  const { t } = useSettings();
  const loc = useLocation();
  if (loc.pathname === '/workout') return null;
  const tabs = [
    { to: '/', icon: 'dumbbell', label: t.tabTrain, end: true },
    { to: '/routines', icon: 'list', label: t.tabRoutines },
    { to: '/exercises', icon: 'search', label: t.tabExercises },
    { to: '/history', icon: 'clock', label: t.tabHistory },
    { to: '/settings', icon: 'gear', label: t.tabSettings }
  ];
  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
          <Icon name={tab.icon} /><span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function App() {
  return (
    <HashRouter>
      <main className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/routines/:id" element={<RoutineEditor />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercises/custom/:id" element={<CustomExerciseEditor />} />
          <Route path="/exercises/:id" element={<ExerciseDetail />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<WorkoutDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <div className="bottom-dock">
        <ActiveBanner />
        <TabBar />
      </div>
    </HashRouter>
  );
}
