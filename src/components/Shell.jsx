import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Sidebar from './Sidebar.jsx';

// Outer chrome: sidebar (240px) + the active layout. Padded content for
// "regular" screens (PagesList/Media/Settings/Backup) is provided by
// `<PaddedOutlet>`; layouts that need full-bleed (PostTypeShell's 3-col
// editor view) render their own `<Outlet />` directly.
export default function Shell() {
  const { passwordIsDefault } = useAuth();
  return (
    // `h-screen` (not `min-h-screen`) gives the flex column a definite
    // height — required for the page-editor surface to actually fill the
    // viewport via `flex-1 min-h-0`. Internal scrolling is owned by
    // `<PaddedOutlet>` and the editor's own panes.
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 antialiased">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {passwordIsDefault && <DefaultPasswordBanner />}
        <Outlet />
      </div>
    </div>
  );
}

export function PaddedOutlet() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-5xl">
        <Outlet />
      </div>
    </main>
  );
}

// Persistent banner — does not auto-dismiss. Disappears the instant the
// password is rotated (auth refreshes after the change-password mutation).
// Tone is checklist-item, not alarm: "finish setup" rather than "insecure".
function DefaultPasswordBanner() {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-sm text-amber-900"
    >
      <span>
        Set a strong admin password to finish setup.
      </span>
      <Link
        to="/settings/security"
        className="font-medium underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700"
      >
        Open Security settings
      </Link>
    </div>
  );
}
