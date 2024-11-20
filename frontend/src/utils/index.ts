import dateFormat from 'dateformat'

type FormatDateOptions = {
  showTime?: boolean
}

export const formatDate = (date: Date | string | number, options?: FormatDateOptions): string => {
  const format = options?.showTime ? 'yyyy-mm-dd HH:MM:ss' : 'yyyy-mm-dd'

  const parsedDate = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  return dateFormat(parsedDate, format)
}
