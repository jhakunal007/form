import { CheckCircle2, User, Mail, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

export default function SuccessModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="success-overlay" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <div className="success-card">
        <div className="success-glow" aria-hidden="true" />
        
        <div className="success-badge-icon">
          <CheckCircle2 size={38} className="icon-success-check" />
        </div>

        <h2 id="success-title" className="success-heading">
          Account Created!
        </h2>
        <p className="success-subheading">
          Your unique username has been verified and registered into the system.
        </p>

        <div className="registered-info-box">
          <div className="info-row">
            <span className="info-label">
              <User size={15} /> Username
            </span>
            <span className="info-val highlight">@{user.username}</span>
          </div>
          <div className="info-row">
            <span className="info-label">
              <Mail size={15} /> Email
            </span>
            <span className="info-val">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">
              <Sparkles size={15} /> Uniqueness Status
            </span>
            <span className="info-val status-verified">100% Unique & Reserved</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn-modal-action"
          autoFocus
        >
          <RotateCcw size={16} />
          <span>Register Another User</span>
        </button>
      </div>
    </div>
  );
}
