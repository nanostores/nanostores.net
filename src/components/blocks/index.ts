import PricingDemo from './PricingDemo.astro'
import HooksBeforeAfter from './HooksBeforeAfter.astro'
import IslandsDiagram from './IslandsDiagram.astro'
import ContextCompare from './ContextCompare.astro'
import LiveConnection from './LiveConnection.astro'
import FrameworkFiles from './FrameworkFiles.astro'

export const blocks = {
  'static-page': PricingDemo,
  'logic-outside-hooks': HooksBeforeAfter,
  islands: IslandsDiagram,
  'outgrowing-context': ContextCompare,
  'live-connection': LiveConnection,
  'multi-framework': FrameworkFiles,
} as const
