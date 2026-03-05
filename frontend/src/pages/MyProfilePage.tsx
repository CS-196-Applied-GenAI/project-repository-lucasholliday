import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { apiFetch } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/TextField'

type MePayload = {
  username: string
  bio?: string | null
  profile_picture?: string | null
}

export function MyProfilePage() {
  const { me, setMe } = useAuth()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [profilePicture, setProfilePicture] = useState('')

  useEffect(() => {
    setUsername(me?.username ?? '')
    setBio(me?.bio ?? '')
    setProfilePicture(me?.profile_picture ?? '')
  }, [me])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const updated = await apiFetch<MePayload>('/users/me', {
      method: 'PATCH',
      body: {
        username,
        bio,
        profile_picture: profilePicture,
      },
    })

    setMe(updated)
  }

  return (
    <main>
      <h1 className='text-2xl font-semibold text-[var(--text-primary)]'>My Profile</h1>

      <Card as='section' className='mt-4 space-y-3 p-4'>
        <p>
          <strong className='text-[var(--accent-300)]'>Username:</strong> {me?.username ?? 'Unknown'}
        </p>

        {me?.profile_picture ? (
          <img src={me.profile_picture} alt={`${me.username} profile`} className='h-16 w-16 rounded-full object-cover' />
        ) : (
          <Avatar username={me?.username ?? 'me'} />
        )}

        <p>
          <strong className='text-[var(--accent-300)]'>Bio:</strong> {me?.bio ? me.bio : 'No bio'}
        </p>
      </Card>

      <Card as='form' className='mt-6 space-y-3 p-4' onSubmit={onSubmit}>
        <TextField id='profile-username' label='Username' value={username} onChange={(event) => setUsername(event.target.value)} />

        <TextField id='profile-bio' label='Bio' value={bio} onChange={(event) => setBio(event.target.value)} />

        <TextField
          id='profile-picture'
          label='Profile Picture URL'
          value={profilePicture}
          onChange={(event) => setProfilePicture(event.target.value)}
        />

        <Button type='submit' variant='primary'>
          Save Profile
        </Button>
      </Card>
    </main>
  )
}
