import { useSEO } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import { team } from '../data'

export default function Team() {
  useSEO({
    title: 'Meet the Team | Sponge Hydration',
    description: 'The people building Sponge — the clip-on hydration tracker that works with any water bottle.',
    path: '/team',
  })

  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow="Team" title="The people behind Sponge">
          A small team obsessed with making hydration effortless.
        </SectionHead>
        <figure className="founders">
          <img src="/media/team/founders.jpg" alt="Sponge co-founders Chris and Nathan" />
          <figcaption>Co-founders Christopher Miglio and Nathan Katzaroff.</figcaption>
        </figure>
        <div className="features">
          {team.map((m) => (
            <article className="team-card" key={m.name}>
              {m.img
                ? <img className="team-card__photo" src={m.img} alt={m.name} loading="lazy" />
                : <div className="team-card__av">{m.initial}</div>}
              <h3>{m.name}</h3>
              <span className="team-card__role">{m.role}</span>
              <p>{m.bio}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
