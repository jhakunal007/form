import { useState, useId } from 'react';
import { Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';

export default function PasswordInput({ value, onChange, onBlur, error, isTouched }) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();
  const hintId = useId();

  // Password requirement rules
  const hasMinLength = value.length >= 8;
  const hasMixedCase = /[a-z]/.test(value) && /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  const passedCount = [hasMinLength, hasMixedCase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthMeta = () => {
    if (!value) return { label: '', color: 'transparent', percent: 0 };
    if (passedCount <= 1) return { label: 'Weak', color: '#f43f5e', percent: 25 };
    if (passedCount === 2) return { label: 'Fair', color: '#f59e0b', percent: 50 };
    if (passedCount === 3) return { label: 'Good', color: '#3b82f6', percent: 75 };
    return { label: 'Strong & Secure', color: '#10b981', percent: 100 };
  };

  const strength = getStrengthMeta();

  return (
    <div className="field-group">
      <div className="field-header">
        <label htmlFor={inputId} className="field-label">
          Password <span className="required-star">*</span>
        </label>
        {value.length > 0 && (
          <span 
            className="strength-badge" 
            style={{ color: strength.color }}
            aria-live="polite"
          >
            {strength.label}
          </span>
        )}
      </div>

      <div className="input-wrapper">
        <input
          id={inputId}
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Create a strong password"
          autoComplete="new-password"
          aria-describedby={hintId}
          aria-invalid={Boolean(error && isTouched)}
          className={`form-input password-input ${error && isTouched ? 'input-error' : ''}`}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="toggle-password-btn"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="icon" size={18} aria-hidden="true" />
          ) : (
            <Eye className="icon" size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Password Strength Progress Bar */}
      {value.length > 0 && (
        <div className="strength-meter-track" aria-hidden="true">
          <div
            className="strength-meter-fill"
            style={{
              width: `${strength.percent}%`,
              backgroundColor: strength.color,
            }}
          />
        </div>
      )}

      {/* Real-time Requirement Checklist */}
      <div id={hintId} className="password-checklist">
        <div className={`rule-item ${hasMinLength ? 'met' : ''}`}>
          {hasMinLength ? <Check size={13} /> : <span className="rule-dot" />}
          <span>At least 8 characters</span>
        </div>
        <div className={`rule-item ${hasMixedCase ? 'met' : ''}`}>
          {hasMixedCase ? <Check size={13} /> : <span className="rule-dot" />}
          <span>Uppercase & lowercase letters</span>
        </div>
        <div className={`rule-item ${hasNumber ? 'met' : ''}`}>
          {hasNumber ? <Check size={13} /> : <span className="rule-dot" />}
          <span>At least 1 number (0-9)</span>
        </div>
        <div className={`rule-item ${hasSpecial ? 'met' : ''}`}>
          {hasSpecial ? <Check size={13} /> : <span className="rule-dot" />}
          <span>Special character (e.g. !@#$)</span>
        </div>
      </div>

      {error && isTouched && (
        <p className="field-error-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
