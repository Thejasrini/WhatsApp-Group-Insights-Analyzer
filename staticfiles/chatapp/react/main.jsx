(function () {
  const root = document.getElementById('react-dashboard-root');
  if (!root) return;

  const initialGroup = root.getAttribute('data-group') || '';
  const app = ReactDOM.createRoot(root);
  app.render(<Dashboard initialGroup={initialGroup} />);
})();
