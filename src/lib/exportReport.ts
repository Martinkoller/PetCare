import api from './api'

export async function downloadCsvReport(
  endpoint: string,
  filename: string,
  params?: Record<string, string>
) {
  const token = localStorage.getItem('token') ?? localStorage.getItem('portal_token') ?? ''
  const query = params ? '?' + new URLSearchParams(params).toString() : ''

  const response = await api.get(`${endpoint}${query}`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
