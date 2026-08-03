import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './login.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return

    if (!trimmed.endsWith('@pekate.com.br')) {
      setError('Use seu e-mail corporativo (@pekate.com.br).')
      setStatus('error')
      return
    }

    setStatus('sending')
    setError(null)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    })

    if (authError) {
      setError('Não foi possível enviar o link. Tente novamente em instantes.')
      setStatus('error')
      return
    }

    setStatus('sent')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/pekate-logo.png" alt="Pekatê Brasil" className="login-logo" />
        <h1 className="login-title">Pekatê <em>Hub</em></h1>

        {status === 'sent' ? (
          <>
            <p className="login-subtitle">
              Enviamos um link de acesso para <strong>{email}</strong>. Abra seu e-mail e clique nele pra entrar.
            </p>
            <button className="login-link-again" onClick={() => setStatus('idle')}>
              Usar outro e-mail
            </button>
          </>
        ) : (
          <>
            <p className="login-subtitle">Entre com seu e-mail corporativo para receber o link de acesso.</p>
            <form className="login-form" onSubmit={handleSubmit}>
              <input
                type="email"
                required
                placeholder="voce@pekate.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                disabled={status === 'sending'}
              />
              <button type="submit" className="login-submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Enviando...' : 'Enviar link de acesso'}
              </button>
            </form>
            {status === 'error' && <p className="login-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
