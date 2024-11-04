const getElementById = (id: string) => document.getElementById(id)!

const ketPrefix = 'trading-bot-'

const setLocalStorage = (key: string, value: any): void => {
  value &&
    localStorage.setItem(
      `${ketPrefix}${key}`,
      typeof value === 'string' ? value : JSON.stringify(value),
    )
}

const getLocalStorage = <T>(key: string, isParse = false): T => {
  const cache = localStorage.getItem(`${ketPrefix}${key}`) ?? ''
  return isParse ? JSON.parse(cache) : cache
}

const setSessionStorage = (key: string, value: any): void => {
  value &&
    sessionStorage.setItem(
      `${ketPrefix}${key}`,
      typeof value === 'string' ? value : JSON.stringify(value),
    )
}

const getSessionStorage = <T>(key: string, isParse = false): T => {
  const cache = sessionStorage.getItem(`${ketPrefix}${key}`) ?? ''
  return isParse ? JSON.parse(cache) : cache
}

export { getElementById, setLocalStorage, getLocalStorage, setSessionStorage, getSessionStorage }
