import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/useSEO'

export default function Account() {
  const [mode, setMode] = useState('signin')
  const navigate = useNavigate()

  return (
    <section className="section">
      <Seo
        title="Sign In | Sponge Account"
        description="Sign in to your Sponge account to view your hydration dashboard and manage your orders."
        path="/account"
        noindex
      />
      <div className="container auth">
        <div className="auth__card">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: 8 }}>
            <img className="brand__logo" src="/media/logo/mark.png" alt="" aria-hidden="true" /> Sponge
          </div>
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth__sub">
            {mode === 'signin'
              ? 'Sign in to view your hydration dashboard and orders.'
              : 'Set up an account to sync your Sponge and track your hydration.'}
          </p>

          <form onSubmit={(e) => { e.preventDefault(); navigate('/dashboard') }} className="auth__form">
            {mode === 'signup' && <label>Name<input required placeholder="Your name" /></label>}
            <label>Email<input type="email" required placeholder="you@email.com" /></label>
            <label>Password<input type="password" required placeholder="••••••••" /></label>
            <button type="submit" className="btn btn--primary btn--lg btn--block">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="auth__toggle">
            {mode === 'signin' ? (
              <>New to Sponge? <button className="link-btn" onClick={() => setMode('signup')}>Create an account</button></>
            ) : (
              <>Already have an account? <button className="link-btn" onClick={() => setMode('signin')}>Sign in</button></>
            )}
          </p>
          <p className="auth__demo">Demo account — any details open the sample <Link to="/dashboard">dashboard</Link>.</p>
        </div>
      </div>
    </section>
  )
}
