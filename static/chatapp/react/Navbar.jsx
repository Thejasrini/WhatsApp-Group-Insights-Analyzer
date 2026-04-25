(function () {
  function Navbar({ userName }) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-6">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">WhatsApp Chat Analyzer</h1>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <i className="fas fa-user text-xs"></i>
            </div>
            <span className="text-sm font-medium text-slate-700">{userName || 'Analyst'}</span>
          </div>
        </div>
      </header>
    );
  }

  window.Navbar = Navbar;
})();
