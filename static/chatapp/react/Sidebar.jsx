(function () {
  const items = [
    { key: 'summary', label: 'Generate Summary', icon: 'fas fa-file-alt' },
    { key: 'questions', label: 'Ask Questions', icon: 'fas fa-question-circle' },
    { key: 'events', label: 'Group Events', icon: 'fas fa-users' },
    { key: 'activity', label: 'Activity Analysis', icon: 'fas fa-chart-line' },
    { key: 'history', label: 'History', icon: 'fas fa-history' }
  ];

  function Sidebar({ activeItem, onItemClick }) {
    return (
      <aside className="w-full shrink-0 rounded-2xl bg-sidebar p-4 text-slate-200 shadow-xl md:sticky md:top-24 md:h-[calc(100vh-7rem)] md:w-72">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Navigation</p>
        <nav className="space-y-1.5">
          {items.map((item) => {
            const active = activeItem === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onItemClick(item.key)}
                className={[
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                ].join(' ')}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    );
  }

  window.Sidebar = Sidebar;
})();
