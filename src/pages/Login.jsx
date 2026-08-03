import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './login.css'

const ADMIN_EMAIL = 'admin@pekate.com.br'

export function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | code | verifying | error
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
      setError('Não foi possível enviar o e-mail. Tente novamente em instantes.')
      setStatus('error')
      return
    }

    setStatus(trimmed === ADMIN_EMAIL ? 'code' : 'sent')
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    setStatus('verifying')
    setError(null)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: trimmed,
      token: code.trim(),
      type: 'email',
    })

    if (verifyError) {
      setError('Código inválido ou expirado. Confira o e-mail e tente de novo.')
      setStatus('code')
      return
    }
    // sucesso: AuthGate detecta a sessão automaticamente
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/pekate-logo.png" alt="Pekatê Brasil" className="login-logo" />
        <h1 className="login-title">Pekatê <em>Hub</em></h1>

        {status === 'sent' && (
          <>
            <p className="login-subtitle">
              Enviamos um link de acesso para <strong>{email}</strong>. Abra seu e-mail e clique nele pra entrar.
            </p>
            <button className="login-link-again" onClick={() => setStatus('idle')}>
              Usar outro e-mail
            </button>
          </>
        )}

        {(status === 'code' || status === 'verifying') && (
          <>
            <p className="login-subtitle">
              Enviamos um código de verificação para <strong>{email}</strong>. Digite abaixo pra entrar.
            </p>
            <form className="login-form" onSubmit={handleVerifyCode}>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="login-input login-input--code"
                disabled={status === 'verifying'}
              />
              <button type="submit" className="login-submit" disabled={status === 'verifying'}>
                {status === 'verifying' ? 'Verificando...' : 'Confirmar código'}
              </button>
            </form>
            {error && <p className="login-error">{error}</p>}
            <button className="login-link-again" onClick={() => setStatus('idle')}>
              Usar outro e-mail
            </button>
          </>
        )}

        {(status === 'idle' || status === 'sending' || status === 'error') && (
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
