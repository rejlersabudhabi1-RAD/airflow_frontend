import InstrumentToolHub from './InstrumentToolHub'
import instrumentToolsService from '../../../services/instrumentTools.service'

const CABLE_BLOCK_TOOL = {
  title:       'Cable Block Diagram',
  description: 'Aggregate IO points into cable bundles (per panel, per signal type) for the cable block diagram, or QC an existing bundle list.',
  accent:      'from-indigo-600 to-blue-600',
  client:      instrumentToolsService.cableBlockDiagram,
  columns:     ['system', 'source', 'destination', 'cable_type', 'function', 'qty'],
}

export default function CableBlockDiagramPage() {
  return <InstrumentToolHub tool={CABLE_BLOCK_TOOL} />
}
