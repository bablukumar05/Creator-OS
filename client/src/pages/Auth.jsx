import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, ShieldCheck, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, message } from '../services/api';
import { useAuth } from '../store';
import { Button, Logo } from '../components/ui';
import { PageBackground } from '../components/ui';
import { validatePassword } from '../validations/auth';
function PasswordInput({ registration, label = 'Password', name = 'password' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          type={visible ? 'text' : 'password'}
          autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
          className="input pr-10"
          placeholder="Enter your password"
          {...registration}
        />
        <button
          className="icon-btn absolute right-0 top-0"
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
function OtpInput({ value, onChange }) {
  const refs = useRef([]);
  return (
    <div
      className="flex justify-between gap-1.5"
      onPaste={(e) => {
        // sanitize pasted otp to digits only and auto-advance focus
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (paste) {
          e.preventDefault();
          onChange(paste);
          refs.current[Math.min(paste.length, 5)]?.focus();
        }
      }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(e) => (refs.current[i] = e)}
          aria-label={`Code digit ${i + 1}`}
          autoFocus={i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          className="input h-12 w-[calc((100%-40px)/6)] px-1 text-center text-xl"
          value={value[i] || ''}
          onChange={(e) => {
            const next = value.padEnd(6, ' ').split('');
            next[i] = e.target.value.replace(/\D/g, '').slice(-1) || ' ';
            onChange(next.join('').trimEnd());
            if (next[i] !== ' ') refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i]) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight') refs.current[i + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}
export default function Auth() {
  const location = useLocation(),
    navigate = useNavigate();
  const route = location.pathname.slice(1);
  const { config, setUser } = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [otp, setOtp] = useState(''),
    [countdown, setCountdown] = useState(60);
  const [email, setEmail] = useState(location.state?.email || '');
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  useEffect(() => {
    reset();
    setError(
      new URLSearchParams(location.search).get('error')
        ? 'Social sign-in could not be completed. Try again or sign in with your existing email account.'
        : '',
    );
    setOtp('');
    setEmail(location.state?.email || '');
    setCountdown(60);
  }, [route]);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  const isLogin = route === 'login',
    isRegister = route === 'register',
    isOtp = ['verify-email', 'verify-reset-otp'].includes(route),
    isReset = route === 'reset-password',
    isForgot = route === 'forgot-password',
    isComplete = route === 'complete-account';
  const titles = {
    login: ['Welcome back.', 'Your ideas, your business, your space.'],
    register: ['Make room for what’s next.', 'A calmer home for your creative business.'],
    'verify-email': ['Check your inbox.', 'Enter the six-digit code to verify your email.'],
    'forgot-password': [
      'Let’s get you back in.',
      'We’ll email a code to help you reset your password.',
    ],
    'verify-reset-otp': ['A little security check.', 'Enter the six-digit password reset code.'],
    'reset-password': ['A fresh start.', 'Choose a strong password to secure your workspace.'],
    'complete-account': ['One last thing.', 'Add and verify your email to complete your account.'],
  };
  const submit = async (values) => {
    setBusy(true);
    setError('');
    try {
      if (isLogin) {
        const response = await api.post('/auth/login', values);
        const userData = response.data.data?.user || response.data.data;
        setUser(userData);
        navigate(userData?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        toast.success('Welcome back.');
      } else if (isRegister) {
        await api.post('/auth/register', values);
        navigate('/verify-email', { state: { email: values.email } });
      } else if (isForgot) {
        await api.post('/auth/forgot-password', { email: values.email });
        navigate('/verify-reset-otp', { state: { email: values.email } });
      } else if (isComplete) {
        await api.post('/auth/complete-social', { email: values.email });
        navigate('/verify-email', { state: { email: values.email } });
      } else if (isOtp) {
        const response = await api.post(
          `/auth/${route === 'verify-email' ? 'verify-email-otp' : 'verify-reset-otp'}`,
          { email, otp },
        );
        if (route === 'verify-email') {
          const userData = response.data.data?.user || response.data.data;
          setUser(userData);
          navigate(userData?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
          toast.success('Email verified.');
        } else navigate('/reset-password');
      } else if (isReset) {
        await api.post('/auth/reset-password', values);
        toast.success('Password reset. Sign in with your new password.');
        navigate('/login');
      }
    } catch (e) {
      setError(message(e));
      if (e.response?.data?.code === 'EMAIL_UNVERIFIED') setEmail(values.identifier);
    } finally {
      setBusy(false);
    }
  };
  const demo = async (role = 'creator') => {
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/auth/login', {
        identifier: `${role}@creatoros.demo`,
        password: role === 'admin' ? 'Admin@123' : 'Creator@123',
      });
      const userData = response.data.data?.user || response.data.data;
      setUser(userData);
      navigate(userData?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    setBusy(true);
    try {
      await api.post(
        `/auth/${route === 'verify-reset-otp' ? 'resend-reset-otp' : 'resend-verification-otp'}`,
        { email },
      );
      setCountdown(60);
      toast.success('If eligible, a new code has been sent.');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const password = watch('password') || '';
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  return (
    <div className="grid min-h-screen bg-white dark:bg-[#1b241d] lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#243e30] p-12 text-white lg:flex">
        <div className="mesh-pattern absolute inset-0" />
        <img
          src="/images/backgrounds/workspace.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-10 blur-sm"
        />
        <Link to="/" className="relative">
          <Logo light />
        </Link>
        <div className="relative max-w-lg">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] tracking-wide">
            <Leaf size={12} /> LESS BUSYWORK. MORE CREATING.
          </span>
          <h1 className="text-5xl font-medium leading-[1.16] tracking-[-2px]">
            Your creativity.
            <br />
            Your business.
            <br />
            <span className="text-[#bccdac]">Beautifully together.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#c2cbbb]">
            Plan your content, nurture partnerships, and grow on your own terms. There’s a place for
            it all.
          </p>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs leading-relaxed text-[#d6dfcf]">
              A focused workspace for the many hats you wear.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {['Content', 'Collaborations', 'Finances'].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-[10px] text-[#becbb6]">
                  <Check size={12} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="relative text-[10px] text-white/50">
          © {new Date().getFullYear()} CreatorOS · Made for the way you create.
        </p>
      </div>
      <main className="relative isolate flex flex-col justify-center px-6 py-10 sm:px-12">
        <PageBackground page="auth" />
        <Link to="/" className="mb-10 lg:hidden">
          <Logo />
        </Link>
        <div className="mx-auto w-full max-w-[390px]">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-xs text-muted">
            <ArrowLeft size={14} />
            Back to home
          </Link>
          <div className="mb-8">
            <h2 className="text-[30px] font-semibold tracking-[-1.2px]">
              {titles[route]?.[0] || 'Welcome.'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{titles[route]?.[1]}</p>
          </div>
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-[#ead8d1] bg-[#fbf3ef] p-3 text-xs leading-relaxed text-[#8a584b] dark:bg-[#3b2d26] dark:text-[#e5bcb0]"
            >
              {error}
              {email && isLogin && (
                <button
                  className="mt-2 block underline"
                  onClick={() => navigate('/verify-email', { state: { email } })}
                >
                  Verify your email
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit(submit)} method="post" className="space-y-4">
            {isRegister && (
              <div>
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  className="input"
                  placeholder="Your name"
                  autoComplete="name"
                  {...register('name', { required: true, minLength: 2 })}
                />
              </div>
            )}
            {(isLogin || isRegister || isForgot || isComplete) && (
              <div>
                <label className="label" htmlFor="identifier">
                  {isLogin ? 'Email or phone number' : 'Email address'}
                </label>
                <input
                  id="identifier"
                  className="input"
                  type={isLogin ? 'text' : 'email'}
                  autoComplete={isLogin ? 'username' : 'email'}
                  placeholder={isLogin ? 'you@example.com or +91…' : 'you@example.com'}
                  {...register(isLogin ? 'identifier' : 'email', { required: true })}
                />
              </div>
            )}
            {isRegister && (
              <div>
                <label className="label" htmlFor="phone">
                  Phone number <span className="text-muted">(optional)</span>
                </label>
                <input
                  id="phone"
                  className="input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone', { setValueAs: (v) => v.replace(/[\s()-]/g, '') })}
                />
              </div>
            )}
            {(isLogin || isRegister || isReset) && (
              <PasswordInput
                registration={register('password', {
                  required: true,
                  minLength: isLogin ? 1 : 8,
                  validate: isLogin ? undefined : validatePassword,
                })}
                label={isReset ? 'New password' : 'Password'}
              />
            )}
            {(isRegister || isReset) && (
              <>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${strength >= i ? 'bg-[#8ca575]' : 'bg-line'}`}
                    />
                  ))}
                </div>
                <p className="!mt-1 text-[10px] text-muted">
                  8+ characters with uppercase, lowercase, a number, and a symbol.
                </p>
                <PasswordInput
                  name="confirmPassword"
                  label="Confirm password"
                  registration={register('confirmPassword', {
                    required: true,
                    validate: (v) => v === password,
                  })}
                />
              </>
            )}
            {isLogin && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-muted">
                  <input type="checkbox" {...register('remember')} />
                  Remember me
                </label>
                <Link className="font-medium text-accent" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}
            {isRegister && (
              <label className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                <input
                  className="mt-0.5 shrink-0"
                  type="checkbox"
                  {...register('terms', { required: true })}
                />
                <span>
                  I agree to the{' '}
                  <Link className="underline" to="/terms" target="_blank">
                    Terms of use
                  </Link>{' '}
                  and{' '}
                  <Link className="underline" to="/privacy" target="_blank">
                    Privacy policy
                  </Link>
                  .
                </span>
              </label>
            )}
            {isOtp && (
              <>
                <div>
                  <label className="label" htmlFor="otp-email">
                    Email address
                  </label>
                  <input
                    id="otp-email"
                    className="input"
                    type="email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <OtpInput value={otp} onChange={setOtp} />
                <p className="text-[11px] text-muted">Your code is valid for 10 minutes.</p>
              </>
            )}
            {Object.keys(errors).length > 0 && (
              <p className="text-xs text-red-600" role="alert">
                {errors.password?.message ||
                  'Check the required fields and make sure your passwords match.'}
              </p>
            )}
            <Button
              className="w-full"
              type="submit"
              loading={busy}
              disabled={isOtp && !/^\d{6}$/.test(otp)}
            >
              {busy
                ? 'Please wait...'
                : isLogin
                  ? 'Sign in'
                  : isRegister
                    ? 'Create your account'
                    : isForgot
                      ? 'Send reset code'
                      : isOtp
                        ? 'Verify code'
                        : isReset
                          ? 'Reset password'
                          : 'Send verification code'}
              {!busy && <ArrowRight size={15} />}
            </Button>
          </form>
          {isOtp && (
            <div className="mt-5 text-center text-xs text-muted">
              Didn’t receive a code?{' '}
              <button
                disabled={countdown > 0 || busy || !email}
                className="ml-1 font-medium text-accent disabled:text-muted"
                onClick={resend}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          )}
          {(isLogin || isRegister) && (
            <>
              <div className="my-6 flex items-center gap-3 text-[10px] text-muted">
                <span className="h-px flex-1 bg-line" />
                or continue with
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="flex justify-center">
                {['facebook'].map((provider) => (
                  <button
                    key={provider}
                    className="btn btn-secondary w-full"
                    disabled={!config[provider] || busy}
                    title={
                      config[provider]
                        ? `Continue with ${provider}`
                        : `${provider} sign-in needs provider configuration`
                    }
                    onClick={() => {
                      setBusy(true);
                      window.location.href = `${api.defaults.baseURL}/auth/${provider}`;
                    }}
                  >
                    <span className="text-base font-bold">f</span>
                    <span className="capitalize">{provider}</span>
                  </button>
                ))}
              </div>
              {!config.facebook && (
                <p className="mt-2 text-center text-[10px] text-muted">
                  Social sign-in is available when connected by your administrator.
                </p>
              )}
              <p className="mt-7 text-center text-xs text-muted">
                {isLogin ? 'New to CreatorOS?' : 'Already have an account?'}{' '}
                <Link to={isLogin ? '/register' : '/login'} className="font-semibold text-accent">
                  {isLogin ? 'Create an account' : 'Sign in'}
                </Link>
              </p>
            </>
          )}
          {isLogin && config.demo && (
            <div className="mt-6 rounded-xl border border-line bg-canvas p-4">
              <p className="mb-3 text-xs font-medium">Take a look around</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  loading={busy}
                  onClick={() => demo()}
                >
                  Creator demo
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  loading={busy}
                  onClick={() => demo('admin')}
                >
                  Admin demo
                </Button>
              </div>
              <p className="mt-3 break-all text-[10px] leading-relaxed text-muted">
                creator@creatoros.demo · Creator@123
                <br />
                admin@creatoros.demo · Admin@123
              </p>
            </div>
          )}
          <p className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-muted">
            <ShieldCheck size={12} />A secure space for your creative business.
          </p>
        </div>
      </main>
    </div>
  );
}