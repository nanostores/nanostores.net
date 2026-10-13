import { order } from '../config/order'

// A situation's chapter number: its place on the homepage, 0 when the
// homepage does not show it. The `*` blocks follow the numbered sections.
export const chapterNumber = (id: string) => order.indexOf(id) + 1
export const asteriskNumbers = [order.length + 1, order.length + 2] as const

// Lombard initials alternate rubric and lapis through the whole homepage
// and keep their color on the chapter's own page. Unnumbered chapters are
// rubric.
export const pigment = (number: number) =>
  number % 2 === 0 && number > 0 ? 'lapis' : 'rubric'
