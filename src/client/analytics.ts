import { trackLink } from '../lib/link-analytics'

document.addEventListener('click', trackLink)
document.addEventListener('auxclick', trackLink)
