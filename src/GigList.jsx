import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const STATUSES = ['Applied', 'Interviewing', 'Hired', 'Completed', 'Paid']

export default function GigList({ session }) {
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [platform, setPlatform] = useState('')
  const [client, setClient] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching gigs:', error)
    } else {
      setGigs(data)
    }
    setLoading(false)
  }

  const handleAddGig = async (e) => {
    e.preventDefault()

    const { error } = await supabase.from('gigs').insert({
      user_id: session.user.id,
      platform,
      client,
      description,
      budget: budget ? parseFloat(budget) : null,
      deadline: deadline || null,
      status: 'Applied',
    })

    if (error) {
      alert('Error adding gig: ' + error.message)
    } else {
      setPlatform('')
      setClient('')
      setDescription('')
      setBudget('')
      setDeadline('')
      setShowForm(false)
      fetchGigs()
    }
  }

  const handleStatusChange = async (gigId, newStatus) => {
    const { error } = await supabase
      .from('gigs')
      .update({ status: newStatus })
      .eq('id', gigId)

    if (error) {
      alert('Error updating status: ' + error.message)
    } else {
      fetchGigs()
    }
  }

  const handleDelete = async (gigId) => {
    if (!confirm('Delete this gig?')) return

    const { error } = await supabase.from('gigs').delete().eq('id', gigId)

    if (error) {
      alert('Error deleting gig: ' + error.message)
    } else {
      fetchGigs()
    }
  }

  // Dashboard stats
  const totalGigs = gigs.length
  const wonGigs = gigs.filter((g) => ['Hired', 'Completed', 'Paid'].includes(g.status)).length
  const winRate = totalGigs > 0 ? Math.round((wonGigs / totalGigs) * 100) : 0
  const totalEarnings = gigs
    .filter((g) => g.status === 'Paid')
    .reduce((sum, g) => sum + (g.budget || 0), 0)

  return (
    <div className="gig-list-container">
      <div className="dashboard">
        <div className="stat-card">
          <span className="stat-number">{totalGigs}</span>
          <span className="stat-label">Total Gigs</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{winRate}%</span>
          <span className="stat-label">Win Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">${totalEarnings.toFixed(0)}</span>
          <span className="stat-label">Total Earned</span>
        </div>
      </div>

      <button className="add-gig-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : '+ Add New Gig'}
      </button>

      {showForm && (
        <form onSubmit={handleAddGig} className="gig-form">
          <input
            type="text"
            placeholder="Platform (e.g. Upwork, Fiverr)"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Client name"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <textarea
            placeholder="Job description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <input
            type="number"
            placeholder="Budget ($)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <button type="submit">Save Gig</button>
        </form>
      )}

      {loading ? (
        <p>Loading gigs...</p>
      ) : gigs.length === 0 ? (
        <p className="empty-state">No gigs yet. Add your first one above!</p>
      ) : (
        <div className="gig-grid">
          {gigs.map((gig) => (
            <div key={gig.id} className="gig-card">
              <div className="gig-card-header">
                <h3>{gig.platform}</h3>
                <button className="delete-btn" onClick={() => handleDelete(gig.id)}>
                  ✕
                </button>
              </div>
              {gig.client && <p className="gig-client">{gig.client}</p>}
              {gig.description && <p className="gig-description">{gig.description}</p>}
              <div className="gig-meta">
                {gig.budget && <span>${gig.budget}</span>}
                {gig.deadline && <span>Due: {gig.deadline}</span>}
              </div>
              <select
                value={gig.status}
                onChange={(e) => handleStatusChange(gig.id, e.target.value)}
                className={`status-select status-${gig.status.toLowerCase()}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}