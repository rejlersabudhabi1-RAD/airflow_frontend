import InstrumentToolHub from './InstrumentToolHub'
import instrumentToolsService from '../../../services/instrumentTools.service'

const CABLE_SCHEDULE_TOOL = {
  title:       'Cable Schedule',
  description: 'Generate a per-cable schedule from the IO list, or validate an existing schedule for duplicates, missing fields and numeric integrity.',
  accent:      'from-violet-600 to-fuchsia-600',
  client:      instrumentToolsService.cableSchedule,
  columns:     [
    'cable_tag', 'from_tag', 'to_tag', 'cable_type', 'size', 'cores',
    'length_m', 'voltage', 'from_panel', 'to_panel', 'gland_from', 'gland_to', 'tray',
  ],
}

export default function CableSchedulePage() {
  return <InstrumentToolHub tool={CABLE_SCHEDULE_TOOL} />
}
