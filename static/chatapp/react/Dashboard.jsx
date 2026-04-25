(function () {
  const { useEffect, useMemo, useState } = React;

  function Dashboard({ initialGroup }) {
    const MotionDiv = (window.framerMotion && window.framerMotion.motion && window.framerMotion.motion.div) || 'div';

    const [activeItem, setActiveItem] = useState('summary');
    const [groupName, setGroupName] = useState(initialGroup || '');
    const [selectedOption, setSelectedOption] = useState('total');
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [summaryResult, setSummaryResult] = useState('Click a summary option to generate report output.');
    const [stats, setStats] = useState({
      totalMessages: 0,
      activeUsers: 0,
      peakTime: 'N/A',
      linksShared: 0
    });
    const [lineData, setLineData] = useState([]);
    const [barData, setBarData] = useState([]);

    const csrfToken = useMemo(() => {
      const meta = document.querySelector('meta[name="csrf-token"]');
      return (meta && meta.getAttribute('content')) || '';
    }, []);

    useEffect(() => {
      if (groupName) return;
      fetch('/api/get-groups/')
        .then((res) => res.json())
        .then((data) => {
          const groups = data.groups || [];
          if (groups.length > 0) {
            setGroupName(groups[0]);
          }
        })
        .catch(() => {
          setSummaryResult('Unable to load groups right now.');
        });
    }, [groupName]);

    useEffect(() => {
      if (!groupName) return;
      loadActivityData(groupName);
      loadBriefInsights(groupName);
    }, [groupName]);

    async function loadActivityData(group) {
      try {
        const res = await fetch('/api/activity/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          body: JSON.stringify({ group_name: group })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load activity');

        const hourly = Array.isArray(data.hourly_activity) ? data.hourly_activity : [];
        const daily = Array.isArray(data.daily_activity) ? data.daily_activity : [];
        const messageCounts = data.message_counts || {};

        const maxHourIndex = hourly.reduce((best, val, idx, arr) => (val > (arr[best] || 0) ? idx : best), 0);
        const peakTime = Number.isFinite(maxHourIndex) ? `${String(maxHourIndex).padStart(2, '0')}:00` : 'N/A';

        const totalMessages = Number(data.total_messages || 0);
        const activeUsers = Number(data.total_users || Object.keys(messageCounts).length || 0);

        setStats((prev) => ({
          ...prev,
          totalMessages,
          activeUsers,
          peakTime
        }));

        setLineData(hourly.map((count, hour) => ({ label: `${hour}:00`, messages: count || 0 })));

        const topUsers = Object.entries(messageCounts)
          .sort((a, b) => (b[1] || 0) - (a[1] || 0))
          .slice(0, 8)
          .map(([user, count]) => ({ user, messages: count || 0 }));

        setBarData(topUsers);

        if (daily.length > 0 && totalMessages === 0) {
          const fallbackTotal = daily.reduce((sum, val) => sum + (val || 0), 0);
          setStats((prev) => ({ ...prev, totalMessages: fallbackTotal }));
        }
      } catch (error) {
        setSummaryResult(`Activity load error: ${error.message}`);
      }
    }

    async function loadBriefInsights(group) {
      try {
        const res = await fetch('/api/summarize/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          body: JSON.stringify({ group_name: group, summary_type: 'brief' })
        });

        const data = await res.json();
        if (!res.ok) return;
        const linksShared = Number(data?.intelligence?.resources?.link_count || 0);
        setStats((prev) => ({ ...prev, linksShared }));
      } catch (error) {
        // keep dashboard usable even when optional stats fail
      }
    }

    async function handleSummary(option) {
      if (!groupName) {
        setSummaryResult('No group selected. Upload a chat first.');
        return;
      }

      setSelectedOption(option);
      setLoadingSummary(true);
      try {
        const payload = {
          group_name: groupName,
          summary_type: option
        };

        const res = await fetch('/api/summarize/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate summary');

        if (option === 'total') {
          setSummaryResult(data.summary || 'Total summary generated.');
        } else if (option === 'user_messages') {
          const userCount = Object.keys(data.user_messages || {}).length;
          setSummaryResult(`User Messages summary generated for ${userCount} users.`);
        }
      } catch (error) {
        setSummaryResult(`Summary error: ${error.message}`);
      } finally {
        setLoadingSummary(false);
      }
    }

    const heroTitle = activeItem === 'summary' ? 'Generate Summary' : 'WhatsApp Chat Analyzer';
    const heroSubtitle = activeItem === 'summary'
      ? 'Create comprehensive summaries of your chat conversations'
      : 'Analyze conversations, users, and trends with a modern analytics workspace.';

    const RechartsLib = window.Recharts || {};
    const ResponsiveContainer = RechartsLib.ResponsiveContainer;
    const LineChart = RechartsLib.LineChart;
    const Line = RechartsLib.Line;
    const XAxis = RechartsLib.XAxis;
    const YAxis = RechartsLib.YAxis;
    const CartesianGrid = RechartsLib.CartesianGrid;
    const Tooltip = RechartsLib.Tooltip;
    const BarChart = RechartsLib.BarChart;
    const Bar = RechartsLib.Bar;

    return (
      <div className="min-h-screen bg-appbg text-slate-900">
        <Navbar userName="Professor Desk" />

        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row">
          <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />

          <main className="min-w-0 flex-1 space-y-6">
            <MotionDiv
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-7 text-white shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Summary Workspace</p>
              <h2 className="mt-2 text-3xl font-bold">{heroTitle}</h2>
              <p className="mt-2 max-w-2xl text-blue-100">{heroSubtitle}</p>
              <p className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Active Group: {groupName || 'Loading...'}
              </p>
            </MotionDiv>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Summary Options</h3>
                <span className="text-sm text-slate-500">Pick an option to generate insights</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card
                  title="Total Summary"
                  description="High-level overview for the selected WhatsApp group."
                  icon="fas fa-layer-group"
                  selected={selectedOption === 'total'}
                  onClick={() => handleSummary('total')}
                />
                <Card
                  title="User Messages"
                  description="Breakdown of conversations grouped by users."
                  icon="fas fa-comments"
                  selected={selectedOption === 'user_messages'}
                  onClick={() => handleSummary('user_messages')}
                />
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm font-medium text-slate-500">Output</p>
                <p className="text-sm leading-6 text-slate-700">
                  {loadingSummary ? 'Generating summary...' : summaryResult}
                </p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard title="Total Messages" value={stats.totalMessages.toLocaleString()} icon="fas fa-envelope" accent="bg-blue-600" />
              <StatsCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon="fas fa-user-friends" accent="bg-emerald-600" />
              <StatsCard title="Peak Activity Time" value={stats.peakTime} icon="fas fa-clock" accent="bg-amber-500" />
              <StatsCard title="Links Shared" value={stats.linksShared.toLocaleString()} icon="fas fa-link" accent="bg-violet-600" />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-lg font-semibold">Messages Over Time</h4>
                <div className="h-72">
                  {ResponsiveContainer ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="messages" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">Chart library loading...</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-lg font-semibold">User Activity</h4>
                <div className="h-72">
                  {ResponsiveContainer ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="user" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="messages" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">Chart library loading...</div>
                  )}
                </div>
              </div>
            </section>

            <footer className="pt-2 text-center text-sm text-slate-500">© 2026 WhatsApp Chat Analyzer</footer>
          </main>
        </div>
      </div>
    );
  }

  window.Dashboard = Dashboard;
})();
