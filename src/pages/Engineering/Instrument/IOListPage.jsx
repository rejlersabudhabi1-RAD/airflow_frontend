import InstrumentToolHub from './InstrumentToolHub'
import instrumentToolsService from '../../../services/instrumentTools.service'

// Soft-coded tool configuration — UI metadata only.
const IO_LIST_TOOL = {
  title:       'IO List',
  description: 'Build a canonical Input/Output list from an instrument register, or validate an existing IO list against the project rule set.',
  accent:      'from-purple-600 to-indigo-600',
  client:      instrumentToolsService.ioList,
  columns:     [
    'tag', 'description', 'signal_type', 'pid',
    'location', 'panel', 'range', 'units', 'manufacturer', 'model',
  ],
}

export default function IOListPage() {
  return <InstrumentToolHub tool={IO_LIST_TOOL} />
}
