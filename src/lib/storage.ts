// localStorage può lanciare (iframe sandbox, navigazione privata): si ripiega su una memoria temporanea
const memory = new Map<string, string>()

export const safeStorage = {
  get(key: string): string | null {
    try { return window.localStorage.getItem(key) } catch { return memory.get(key) ?? null }
  },
  set(key: string, value: string) {
    try { window.localStorage.setItem(key, value) } catch { memory.set(key, value) }
  },
}
