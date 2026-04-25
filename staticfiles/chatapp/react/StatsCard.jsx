(function () {
  function StatsCard({ title, value, icon, accent }) {
    const MotionDiv = (window.framerMotion && window.framerMotion.motion && window.framerMotion.motion.div) || 'div';
    const accentClass = accent || 'bg-primary';

    return (
      <MotionDiv
        whileHover={{ y: -3 }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
          <div className={["flex h-12 w-12 items-center justify-center rounded-xl text-white", accentClass].join(' ')}>
            <i className={icon}></i>
          </div>
        </div>
      </MotionDiv>
    );
  }

  window.StatsCard = StatsCard;
})();
