import { useSEO } from '../components/useSEO'
import { BatteryIcon, DropletIcon, FilmIcon, FlameIcon, GamepadIcon, LockIcon, PhoneIcon } from '../components/icons'

const week = [
  { d: 'Mon', pct: 96 },
  { d: 'Tue', pct: 88 },
  { d: 'Wed', pct: 72 },
  { d: 'Thu', pct: 104 },
  { d: 'Fri', pct: 65 },
  { d: 'Sat', pct: 92 },
  { d: 'Sun', pct: 78 },
]

const sips = [
  { time: '8:15 AM', ml: 240, label: 'Morning glass' },
  { time: '10:02 AM', ml: 180, label: 'Desk bottle' },
  { time: '12:30 PM', ml: 320, label: 'Lunch' },
  { time: '2:45 PM', ml: 210, label: 'Afternoon top-up' },
  { time: '4:20 PM', ml: 160, label: 'Gym bottle' },
]

export default function Dashboard() {
  useSEO({
    title: 'Your Hydration Dashboard | Sponge',
    description: 'Track your daily water intake, streaks, and trends with the Sponge hydration dashboard.',
    path: '/dashboard',
  })

  const goal = 2600
  const current = 1110
  const pct = Math.round((current / goal) * 100)

  return (
    <section className="section dashboard">
      <div className="container">
        <div className="dash-head">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1 className="page-title" style={{ margin: '12px 0 4px' }}>Good afternoon, Nathan</h1>
            <p style={{ color: 'var(--ink-soft)', margin: 0 }}>Here’s how your hydration is going today.</p>
          </div>
          <div className="dash-device">
            <span className="dash-device__name"><DropletIcon size={14} /> Sponge · Desk bottle</span>
            <span className="dash-device__batt"><BatteryIcon size={14} /> 64% · synced 2 min ago</span>
          </div>
        </div>

        <div className="dash-grid">
          {/* Goal ring */}
          <div className="dash-card dash-card--ring">
            <h3>Today’s goal</h3>
            <div
              className="dash-ring"
              style={{ background: `conic-gradient(var(--blue-600) ${pct * 3.6}deg, var(--surface-deep) 0)` }}
            >
              <div className="dash-ring__inner">
                <strong>{pct}%</strong>
                <span>{(current / 1000).toFixed(2)}L / {(goal / 1000).toFixed(1)}L</span>
              </div>
            </div>
            <p className="dash-card__hint">{(goal - current)} ml to go — about 2 more glasses.</p>
          </div>

          {/* Stats */}
          <div className="dash-card">
            <h3>This week</h3>
            <div className="dash-stats">
              <div><strong>6</strong><span>day streak <FlameIcon size={13} /></span></div>
              <div><strong>86%</strong><span>avg. goal hit</span></div>
              <div><strong>2.2L</strong><span>daily average</span></div>
            </div>
            <div className="dash-bars">
              {week.map((w) => (
                <div className="dash-bar" key={w.d}>
                  <div className="dash-bar__track">
                    <div
                      className="dash-bar__fill"
                      style={{ height: `${Math.min(100, w.pct)}%`, background: w.pct >= 100 ? 'var(--aqua-400)' : 'var(--blue-500)' }}
                    />
                  </div>
                  <span>{w.d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* App lock */}
          <div className="dash-card dash-card--lock">
            <h3>App lock</h3>
            <p className="dash-card__hint">Unlocks at 100% of today’s goal.</p>
            <div className="dash-lock-row"><PhoneIcon size={15} /> Social <span className="lock"><LockIcon size={12} /> locked</span></div>
            <div className="dash-lock-row"><GamepadIcon size={15} /> Games <span className="lock"><LockIcon size={12} /> locked</span></div>
            <div className="dash-lock-row"><FilmIcon size={15} /> Streaming <span className="unlock">✓ unlocked</span></div>
            <div className="dash-progress">
              <div className="dash-progress__fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="dash-card__hint">Drink {goal - current} ml more to unlock everything.</span>
          </div>

          {/* Recent sips */}
          <div className="dash-card dash-card--wide">
            <h3>Today’s sips</h3>
            <table className="dash-table">
              <tbody>
                {sips.map((s) => (
                  <tr key={s.time}>
                    <td className="dash-table__time">{s.time}</td>
                    <td>{s.label}</td>
                    <td className="dash-table__ml">+{s.ml} ml</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="app-strip">
          <h3>Right from your pocket</h3>
          <p>The free Sponge app brings your hydration goal, app-lock, and lock-screen widget everywhere you go.</p>
          <div className="app-strip__shots">
            <img src="/media/app/lockscreen.png" alt="Sponge lock-screen widget showing 67% of goal" loading="lazy" />
            <img src="/media/app/applock.png" alt="Sponge app-lock unlock goal screen" loading="lazy" />
            <img src="/media/app/goal.png" alt="Setting a daily hydration goal" loading="lazy" />
            <img src="/media/app/settings.png" alt="Sponge app settings with hydration locks" loading="lazy" />
          </div>
        </div>

        <p className="dash-foot">
          This is a live preview of the Sponge web dashboard. Your real data syncs automatically from
          your Sponge device and the free mobile app.
        </p>
      </div>
    </section>
  )
}
