'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { auth, googleProvider } from '../lib/firebase'
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import Image from 'next/image'
import Link from 'next/link'
import GoogleIcon from '../assets/google.png'
import axios from 'axios'
import { SITE } from '@/lib/site'

const SignInModal = ({ open, onClose }) => {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const mapGoogleAuthError = (err) => {
    const code = err?.code || ''
    if (code === 'auth/operation-not-allowed') {
      return 'Google sign-in is not enabled. In Firebase Console → Authentication → Sign-in method, enable Google.'
    }
    if (code === 'auth/unauthorized-domain') {
      return 'This domain is not authorized. In Firebase Console → Authentication → Settings → Authorized domains, add localhost and nilaas.in.'
    }
    if (code === 'auth/popup-blocked') {
      return 'Popup was blocked by the browser. Allow popups for this site and try again.'
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in was cancelled.'
    }
    if (code === 'auth/invalid-api-key') {
      return 'Invalid Firebase API key. Restart the server after updating .env.'
    }
    if (code === 'auth/network-request-failed') {
      return 'Network request failed. Check internet, disable VPN/ad-blockers for localhost, then hard-refresh and try again.'
    }
    if (code === 'auth/configuration-not-found') {
      return 'Firebase Auth is not set up for this project. Enable Authentication in Firebase Console.'
    }
    return err?.message || 'Google sign-in failed'
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, googleProvider)

      const bonusClaimed = localStorage.getItem('welcomeBonusClaimed')
      if (bonusClaimed === 'true') {
        localStorage.setItem('freeShippingEligible', 'true')
        localStorage.removeItem('welcomeBonusClaimed')
      }

      try {
        const token = await result.user.getIdToken()
        await axios.post(
          '/api/send-welcome-email',
          { email: result.user.email, name: result.user.displayName },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
      }

      onClose()
    } catch (err) {
      console.error('Google sign-in error:', err?.code, err)
      setError(mapGoogleAuthError(err))
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    setError('')
    if (!email) {
      setError('Enter your email to reset password.')
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setError('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (isRegister) {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }
    setLoading(true)
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (name) {
          await updateProfile(userCredential.user, { displayName: name })
        }

        const bonusClaimed = localStorage.getItem('welcomeBonusClaimed')
        if (bonusClaimed === 'true') {
          localStorage.setItem('freeShippingEligible', 'true')
          localStorage.removeItem('welcomeBonusClaimed')
        }

        try {
          const token = await userCredential.user.getIdToken()
          await axios.post(
            '/api/send-welcome-email',
            { email, name },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError)
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Authentication failed')
    }
    setLoading(false)
  }

  const inputClass =
    'w-full border border-[#2a1210]/20 bg-[#faf6f2] px-3.5 py-3 text-sm text-[#2a1210] placeholder:text-[#9a7d72] outline-none focus:border-[#2a1210] transition-colors'

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a0f0d]/60 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#faf6f2] w-full max-w-4xl overflow-hidden relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 z-20 p-2 text-[#2a1210] hover:bg-[#2a1210]/5 transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
          {/* Left — fashion brand panel */}
          <div className="relative hidden md:block bg-[#1a0f0d] min-h-[520px]">
            <Image
              src="/find-store-fashion-hero.png"
              alt="Nilaas fashion"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0d] via-[#1a0f0d]/55 to-[#1a0f0d]/20" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-[#f5ebe4]">
              <p className="font-serif text-4xl tracking-tight text-white mb-3">{SITE.name}</p>
              <h3 className="text-lg font-medium text-[#f0ddd3] leading-snug">
                Dresses & co-ords, made to wear
              </h3>
              <p className="text-[#c9a99a] mt-2 text-sm leading-relaxed max-w-xs">
                Sign in to save favourites, track orders, and shop new drops from Kozhikode.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="p-6 sm:p-8 flex flex-col justify-center bg-[#faf6f2]">
            <div className="mb-7">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-2 md:hidden">
                {SITE.name}
              </p>
              <h2 className="font-serif text-3xl text-[#2a1210]">
                {isRegister ? 'Create account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-[#6e5048] mt-1.5">
                {isRegister ? 'Join Nilaas with your email' : 'Sign in to continue shopping'}
              </p>
            </div>

            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full name"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {isRegister && (
                <input
                  type="password"
                  placeholder="Confirm password"
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              )}

              {!isRegister && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs font-medium text-[#6b2f28] hover:text-[#2a1210] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="mt-1 bg-[#2a1210] hover:bg-[#4a221c] text-[#f5ebe4] font-semibold py-3 text-sm uppercase tracking-wide transition-colors disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            {error && (
              <div
                className={`text-center text-xs mt-3 ${
                  error.includes('sent') ? 'text-emerald-700' : 'text-[#8b3a2f]'
                }`}
              >
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#2a1210]/12" />
              <span className="text-[#9a7d72] text-[11px] uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-[#2a1210]/12" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border border-[#2a1210]/20 bg-white py-3 px-4 text-sm font-medium hover:border-[#2a1210]/40 transition-colors"
              disabled={loading}
            >
              <Image src={GoogleIcon} alt="Google" width={18} height={18} style={{ objectFit: 'contain' }} />
              <span className="text-[#2a1210]">Continue with Google</span>
            </button>

            <div className="text-center mt-5">
              <button
                className="text-sm text-[#6b2f28] hover:text-[#2a1210] font-medium transition-colors"
                onClick={() => setIsRegister((v) => !v)}
                type="button"
              >
                {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </button>
            </div>

            <p className="text-[11px] text-[#9a7d72] text-center mt-4 leading-relaxed">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="underline text-[#6b2f28]" onClick={onClose}>
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline text-[#6b2f28]" onClick={onClose}>
                Privacy Policy
              </Link>
              .
            </p>

            <div id="recaptcha-container" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignInModal
