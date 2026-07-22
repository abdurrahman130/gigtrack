import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './Auth'
import GigList from './GigList'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="app-container">
      <header>
        <h1>GigTrack</h1>
        <button onClick={handleLogout}>Log Out</button>
      </header>
      <GigList session={session} />
    </div>
  )
}

export default App