import { formatDate } from '../meta-ads/format'
import { EventStats } from './EventStats'

export function EventCard({ evento, onSelect }) {
  return (
    <div className="pkt-eventos-card">
      <button className="pkt-eventos-card__header" onClick={() => onSelect(evento)}>
        {evento.image && <img src={evento.image} alt="" className="pkt-eventos-card__image" />}
        <div className="pkt-eventos-card__body">
          <span className="pkt-eventos-card__date">{formatDate(evento.start_date)}</span>
          <h3 className="pkt-eventos-card__title">{evento.name}</h3>
          <span className="pkt-eventos-card__total">
            {evento.totalParticipantes} participante{evento.totalParticipantes === 1 ? '' : 's'}
          </span>
        </div>
      </button>
      <div className="pkt-eventos-card__stats">
        <EventStats
          compareceram={evento.compareceram}
          naoCompareceram={evento.naoCompareceram}
          onDrillDown={(filtro) => onSelect(evento, filtro)}
        />
      </div>
    </div>
  )
}
