import { useState, useEffect, useId } from 'react';
import { User, Mail, CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import PasswordInput from './PasswordInput';
import { checkUsernameAvailability, registerUser } from '../api';

export default function RegistrationForm({ takenUsernames, onRegisterSuccess, selectedUsernameTest }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
  });

  // Username validation state: 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const usernameId = useId();
  const usernameHelpId = useId();
  const emailId = useId();
  const emailHelpId = useId();

  // If a test chip was clicked from the database list, populate it
  useEffect(() => {
    if (selectedUsernameTest) {
      setFormData((prev) => ({ ...prev, username: selectedUsernameTest }));
      setTouched((prev) => ({ ...prev, username: true }));
    }
  }, [selectedUsernameTest]);

  // Debounced username uniqueness checker calling the backend API
  useEffect(() => {
    const rawUsername = formData.username.trim();

    if (!rawUsername) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    // Format validation first
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(rawUsername)) {
      setUsernameStatus('invalid');
      if (rawUsername.length < 3) {
        setUsernameMessage('Username must be at least 3 characters.');
      } else if (rawUsername.length > 20) {
        setUsernameMessage('Username must not exceed 20 characters.');
      } else {
        setUsernameMessage('Only letters, numbers, and underscores are allowed.');
      }
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Checking availability on backend...');

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(rawUsername, controller.signal);
        if (result.available) {
          setUsernameStatus('available');
          setUsernameMessage(result.message || `@${rawUsername} is available!`);
        } else {
          setUsernameStatus(result.invalidFormat ? 'invalid' : 'taken');
          setUsernameMessage(result.message);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fallback to local array if backend is temporarily disconnected
          const isTaken = takenUsernames.some(
            (u) => u.toLowerCase() === rawUsername.toLowerCase()
          );
          if (isTaken) {
            setUsernameStatus('taken');
            setUsernameMessage(`@${rawUsername} is already registered.`);
          } else {
            setUsernameStatus('available');
            setUsernameMessage(`@${rawUsername} is available!`);
          }
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.username, takenUsernames]);

  // Email format validation
  const validateEmail = (val) => {
    if (!val) return 'Email address is required.';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  // Password validation
  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    if (val.length < 8) return 'Password must be at least 8 characters long.';
    return '';
  };

  const emailError = validateEmail(formData.email);
  const passwordError = validatePassword(formData.password);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true });

    // Final checks
    if (usernameStatus === 'checking') {
      setSubmitError('Please wait while the server verifies your username.');
      return;
    }

    if (usernameStatus !== 'available') {
      setSubmitError(usernameMessage || 'Please provide a valid, unique username.');
      return;
    }

    if (emailError || passwordError) {
      setSubmitError('Please correct the errors in the form before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await registerUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setIsSubmitting(false);
      onRegisterSuccess(response.user);

      // Reset form
      setFormData({ username: '', email: '', password: '' });
      setTouched({ username: false, email: false, password: false });
      setUsernameStatus('idle');
      setUsernameMessage('');
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <div className="submit-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {/* USERNAME FIELD */}
      <div className="field-group">
        <div className="field-header">
          <label htmlFor={usernameId} className="field-label">
            Username <span className="required-star">*</span>
          </label>
          <span className="field-hint">Unique handle (3-20 chars)</span>
        </div>

        <div className="input-wrapper">
          <span className="input-icon-prefix" aria-hidden="true">
            <User size={18} />
          </span>

          <input
            id={usernameId}
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            onBlur={() => handleBlur('username')}
            placeholder="e.g. quantum_coder"
            autoComplete="username"
            spellCheck="false"
            autoCapitalize="none"
            aria-describedby={usernameHelpId}
            aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
            className={`form-input has-prefix ${
              usernameStatus === 'available'
                ? 'input-valid'
                : (usernameStatus === 'taken' || usernameStatus === 'invalid') && touched.username
                ? 'input-error'
                : ''
            }`}
            required
          />

          {/* Right Status Indicator */}
          <div className="status-indicator" aria-live="polite">
            {usernameStatus === 'checking' && (
              <Loader2 className="status-spinner icon-checking" size={18} />
            )}
            {usernameStatus === 'available' && (
              <CheckCircle2 className="icon-available" size={18} />
            )}
            {(usernameStatus === 'taken' || (usernameStatus === 'invalid' && touched.username)) && (
              <XCircle className="icon-error" size={18} />
            )}
          </div>
        </div>

        {/* Username Status Message */}
        {usernameMessage && (
          <p
            id={usernameHelpId}
            className={`username-feedback ${
              usernameStatus === 'available'
                ? 'feedback-success'
                : usernameStatus === 'checking'
                ? 'feedback-checking'
                : 'feedback-error'
            }`}
            role={usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'alert' : 'status'}
          >
            {usernameMessage}
          </p>
        )}
      </div>

      {/* EMAIL FIELD */}
      <div className="field-group">
        <div className="field-header">
          <label htmlFor={emailId} className="field-label">
            Email Address <span className="required-star">*</span>
          </label>
        </div>

        <div className="input-wrapper">
          <span className="input-icon-prefix" aria-hidden="true">
            <Mail size={18} />
          </span>

          <input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={() => handleBlur('email')}
            placeholder="you@example.com"
            autoComplete="email"
            aria-describedby={emailHelpId}
            aria-invalid={Boolean(emailError && touched.email)}
            className={`form-input has-prefix ${
              touched.email && !emailError
                ? 'input-valid'
                : touched.email && emailError
                ? 'input-error'
                : ''
            }`}
            required
          />

          {touched.email && (
            <div className="status-indicator" aria-hidden="true">
              {!emailError ? (
                <CheckCircle2 className="icon-available" size={18} />
              ) : (
                <XCircle className="icon-error" size={18} />
              )}
            </div>
          )}
        </div>

        {touched.email && emailError && (
          <p id={emailHelpId} className="field-error-msg" role="alert">
            {emailError}
          </p>
        )}
      </div>

      {/* PASSWORD FIELD */}
      <PasswordInput
        value={formData.password}
        onChange={handleInputChange}
        onBlur={() => handleBlur('password')}
        error={passwordError}
        isTouched={touched.password}
      />

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isSubmitting || usernameStatus === 'checking' || usernameStatus === 'taken'}
        className={`submit-btn ${isSubmitting ? 'btn-loading' : ''}`}
        aria-label="Create account"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="btn-spinner" size={18} />
            <span>Registering Account on Server...</span>
          </>
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight size={18} className="btn-arrow" />
          </>
        )}
      </button>

      <div className="form-footer-note">
        <ShieldCheck size={14} className="security-icon" />
        <span>Secured by Express & bcryptjs password hashing.</span>
      </div>
    </form>
  );
}
