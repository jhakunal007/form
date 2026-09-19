import { Users, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RegisteredUsersBadge({ takenUsernames, onSelectUsername }) {
  return (
    <div className="taken-users-panel">
      <div className="taken-panel-header">
        <div className="panel-title-group">
          <Users size={16} className="panel-icon" />
          <h3 className="panel-title">Existing Database Usernames</h3>
        </div>
        <span className="count-pill">{takenUsernames.length} reserved</span>
      </div>

      <p className="panel-desc">
        Click any username below to automatically fill the input and test uniqueness collision handling:
      </p>

      <div className="username-chips-list">
        {takenUsernames.map((uname) => (
          <button
            key={uname}
            type="button"
            className="username-chip"
            onClick={() => onSelectUsername(uname)}
            title={`Click to test collision for '${uname}'`}
          >
            <span className="chip-at">@</span>
            <span className="chip-name">{uname}</span>
          </button>
        ))}
      </div>

      <div className="uniqueness-tip">
        <Sparkles size={14} className="tip-icon" />
        <span>Try typing a brand new name (e.g. <code>nebula_dev</code>) to see the instant availability check!</span>
      </div>
    </div>
  );
}
