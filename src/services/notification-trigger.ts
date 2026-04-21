type TriggerFn = (payload: {
  type: string
  vars: Record<string, string>
  clientId: string
  clientName: string
  petName?: string
  phone?: string
}) => void

let _trigger: TriggerFn | null = null

export function registerNotificationTrigger(fn: TriggerFn) {
  _trigger = fn

  return () => {
    if (_trigger === fn) {
      _trigger = null
    }
  }
}

export function triggerNotification(payload: Parameters<TriggerFn>[0]) {
  _trigger?.(payload)
}
