(function () {
  function Card({ title, icon, selected, onClick, description }) {
    const MotionDiv = (window.framerMotion && window.framerMotion.motion && window.framerMotion.motion.div) || 'div';

    return (
      <MotionDiv
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={[
          'group cursor-pointer rounded-2xl border bg-white p-5 transition-all duration-300 shadow-sm',
          selected
            ? 'border-primary ring-2 ring-primary/20 shadow-md'
            : 'border-slate-200 hover:border-primary/40 hover:shadow-md'
        ].join(' ')}
      >
        <div className="flex items-start gap-4">
          <div
            className={[
              'flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-colors',
              selected ? 'bg-primary' : 'bg-slate-900 group-hover:bg-primary'
            ].join(' ')}
          >
            <i className={icon}></i>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </MotionDiv>
    );
  }

  window.Card = Card;
})();
