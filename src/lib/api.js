const API_URL = 'http://localhost:3005/api'

function getToken() {
  return localStorage.getItem('sinafury_token')
}

function setToken(token) {
  localStorage.setItem('sinafury_token', token)
}

function clearToken() {
  localStorage.removeItem('sinafury_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  return data
}

export const api = {
  // Auth
  signUp: async (firstName, lastName, email, password) => {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    })
    setToken(data.token)
    return data
  },

  signIn: async (email, password) => {
    const data = await request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    return data
  },

  signOut: () => {
    clearToken()
  },

  getMe: () => request('/auth/me'),

  hasToken: () => !!getToken(),

  // Profile
  getProfile: () => request('/profile'),

  updateProfile: (data) => request('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Account management
  changePassword: (currentPassword, newPassword) => request('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  }),

  deleteAccount: () => request('/auth/account', { method: 'DELETE' }),

  // Program notification
  getProgramUpdated: () => request('/profile/program-updated'),
  markProgramSeen: () => request('/profile/program-seen', { method: 'POST' }),
  startCountdown: () => request('/profile/start-countdown', { method: 'POST' }),
  resetPayment: () => request('/profile/reset-payment', { method: 'POST' }),
  getCycles: () => request('/profile/cycles'),

  // Chat (user)
  getMessages: () => request('/chat'),

  sendMessage: (text) => request('/chat', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),

  getUnreadCount: () => request('/chat/unread'),

  markChatRead: () => request('/chat/read', { method: 'POST' }),

  sendChatImage: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return request('/chat/image', { method: 'POST', body: formData })
  },

  // Completed days
  getCompletedDays: () => request('/profile/completed'),

  updateCompletedDays: (completedDays) => request('/profile/completed', {
    method: 'PUT',
    body: JSON.stringify({ completedDays }),
  }),

  updateCycleCompletedDays: (cycleNumber, completedDays) => request(`/profile/cycles/${cycleNumber}/completed`, {
    method: 'PUT',
    body: JSON.stringify({ completedDays }),
  }),

  // File upload
  uploadFile: async (bucket, filename, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return request(`/upload/${bucket}/${filename}`, {
      method: 'POST',
      body: formData,
    })
  },

  // Get file URL
  getFileUrl: (path) => path ? `http://localhost:3005/uploads/${path}` : null,

  // Admin — uses separate token storage
  adminSignIn: async (username, password) => {
    const data = await request('/admin/signin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    localStorage.setItem('sinafury_admin_token', data.token)
    return data
  },

  adminSignOut: () => {
    localStorage.removeItem('sinafury_admin_token')
  },

  adminHasToken: () => !!localStorage.getItem('sinafury_admin_token'),

  adminRequest: async (path, options = {}) => {
    const token = localStorage.getItem('sinafury_admin_token')
    const headers = { ...options.headers, 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_URL}${path}`, { ...options, headers })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Something went wrong')
    return data
  },

  adminGetUsers: () => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminDeleteUser: (id) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminClearEdited: (id, sections) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${id}/clear-edited`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections }),
    }).then(r => r.json())
  },

  adminMarkViewed: (id) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${id}/viewed`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(r => r.json())
  },

  adminGetUser: (id) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${id}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminGetCycles: (userId) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${userId}/cycles`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminGetChat: (userId) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${userId}/chat`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminGetUnread: () => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/unread`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminMarkChatRead: (userId) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${userId}/chat/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminSendChatImage: (userId, file) => {
    const token = localStorage.getItem('sinafury_admin_token')
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${API_URL}/admin/users/${userId}/chat/image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminSendChat: (userId, text) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${userId}/chat`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },

  adminSetProgram: (userId, program) => {
    const token = localStorage.getItem('sinafury_admin_token')
    return fetch(`${API_URL}/admin/users/${userId}/program`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ program }),
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d })
  },
}
