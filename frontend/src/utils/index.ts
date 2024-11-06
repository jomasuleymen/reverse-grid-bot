import dateFormat from 'dateformat'

type FormatDateOptions = {
  showTime?: boolean
}

export const formatDate = (date: Date | string | number, options?: FormatDateOptions): string => {
  const format = options?.showTime ? 'dd.mm.yyyy HH:MM:ss' : 'dd.mm.yyyy'

  const parsedDate = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  return dateFormat(parsedDate, format)
}
