import { useState, useEffect } from 'react'
import api from '@/lib/api'

export interface Professional {
  id: string
  name: string
  email: string
  role: string
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api
      .get<Professional[]>('/professionals')
      .then((res) => setProfessionals(res.data))
      .catch(() => setProfessionals([]))
      .finally(() => setLoading(false))
  }, [])

  return { professionals, loading }
}
