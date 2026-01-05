import React, { useState, useEffect, useRef } from 'react'
import { DOMAIN_EXPERT_CONFIG } from '../../config/domainExpert.config'

/**
 * PID2DGenerator Component
 * Generates 2D P&ID diagrams with domain expert recommendations
 * Uses HTML5 Canvas for pure 2D rendering
 * Configuration: src/config/domainExpert.config.js
 */

const PID2DGenerator = ({ pidData, pfdData }) => {
  const canvasRef = useRef(null)
  const [currentStage, setCurrentStage] = useState('stage1_layout')
  const [showExpertPanel, setShowExpertPanel] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [checklist, setChecklist] = useState(DOMAIN_EXPERT_CONFIG.qualityChecklist)

  // P&ID Canvas Settings (2D)
  const canvasSettings = {
    width: 1400,
    height: 1000,
    backgroundColor: '#ffffff',
    gridSize: 50,
    showGrid: true,
    gridColor: '#e5e7eb',
    
    // Standard P&ID Styling (2D)
    lineWidth: 2,
    equipmentLineWidth: 3,
    processLineColor: '#1f2937',
    utilityLineColor: '#6b7280',
    instrumentLineColor: '#3b82f6',
    
    // Font settings
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    tagFontSize: 10,
    
    // Equipment spacing (following expert recommendations)
    minEquipmentSpacing: 150,
    pipeSpacing: 30,
    instrumentOffset: 40
  }

  // Standard P&ID Symbols (2D)
  const drawEquipmentSymbol = (ctx, type, x, y, tag, size = 50) => {
    ctx.save()
    ctx.strokeStyle = canvasSettings.processLineColor
    ctx.lineWidth = canvasSettings.equipmentLineWidth
    ctx.fillStyle = '#ffffff'

    switch (type.toLowerCase()) {
      case 'pump':
      case 'centrifugal_pump':
        // Circle with internal arrow (standard pump symbol)
        ctx.beginPath()
        ctx.arc(x, y, size/2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        // Arrow inside
        ctx.beginPath()
        ctx.moveTo(x - size/4, y)
        ctx.lineTo(x + size/4, y)
        ctx.moveTo(x + size/8, y - size/8)
        ctx.lineTo(x + size/4, y)
        ctx.lineTo(x + size/8, y + size/8)
        ctx.stroke()
        break

      case 'tank':
      case 'vessel':
      case 'drum':
        // Rectangle (standard vessel symbol)
        const width = size * 0.8
        const height = size * 1.2
        ctx.beginPath()
        ctx.rect(x - width/2, y - height/2, width, height)
        ctx.fill()
        ctx.stroke()
        break

      case 'column':
      case 'tower':
        // Tall rectangle (standard column symbol)
        const colWidth = size * 0.6
        const colHeight = size * 2
        ctx.beginPath()
        ctx.rect(x - colWidth/2, y - colHeight/2, colWidth, colHeight)
        ctx.fill()
        ctx.stroke()
        // Add trays indication
        for (let i = 0; i < 5; i++) {
          const trayY = y - colHeight/2 + (i + 1) * colHeight/6
          ctx.beginPath()
          ctx.moveTo(x - colWidth/2, trayY)
          ctx.lineTo(x + colWidth/2, trayY)
          ctx.stroke()
        }
        break

      case 'heat_exchanger':
      case 'cooler':
      case 'heater':
        // Rectangle with crossed lines (standard heat exchanger)
        const hexWidth = size
        const hexHeight = size * 0.6
        ctx.beginPath()
        ctx.rect(x - hexWidth/2, y - hexHeight/2, hexWidth, hexHeight)
        ctx.fill()
        ctx.stroke()
        // Crossed lines
        ctx.beginPath()
        ctx.moveTo(x - hexWidth/2, y - hexHeight/2)
        ctx.lineTo(x + hexWidth/2, y + hexHeight/2)
        ctx.moveTo(x + hexWidth/2, y - hexHeight/2)
        ctx.lineTo(x - hexWidth/2, y + hexHeight/2)
        ctx.stroke()
        break

      case 'valve':
        // Triangle (standard valve symbol)
        ctx.beginPath()
        ctx.moveTo(x, y - size/2)
        ctx.lineTo(x + size/2, y + size/2)
        ctx.lineTo(x - size/2, y + size/2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break

      default:
        // Generic circle
        ctx.beginPath()
        ctx.arc(x, y, size/2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
    }

    // Draw tag
    if (tag) {
      ctx.fillStyle = '#1f2937'
      ctx.font = `bold ${canvasSettings.tagFontSize}px ${canvasSettings.fontFamily}`
      ctx.textAlign = 'center'
      ctx.fillText(tag, x, y + size/2 + 15)
    }

    ctx.restore()
  }

  // Draw pipe line (2D - orthogonal only)
  const drawPipeLine = (ctx, x1, y1, x2, y2, lineNumber, size) => {
    ctx.save()
    ctx.strokeStyle = canvasSettings.processLineColor
    ctx.lineWidth = canvasSettings.lineWidth

    // Draw orthogonal line (horizontal then vertical, or vice versa)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    
    // Determine routing (prefer horizontal-first)
    const midX = (x1 + x2) / 2
    ctx.lineTo(midX, y1) // Horizontal
    ctx.lineTo(midX, y2) // Vertical
    ctx.lineTo(x2, y2) // Horizontal
    ctx.stroke()

    // Draw line number and size
    if (lineNumber && size) {
      ctx.fillStyle = '#1f2937'
      ctx.font = `${canvasSettings.fontSize}px ${canvasSettings.fontFamily}`
      ctx.textAlign = 'center'
      ctx.fillText(`${lineNumber}`, midX, y1 - 5)
      ctx.fillText(`${size}`, midX, y1 + 15)
    }

    // Draw flow direction arrow
    ctx.beginPath()
    ctx.moveTo(x2 - 10, y2 - 5)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x2 - 10, y2 + 5)
    ctx.stroke()

    ctx.restore()
  }

  // Draw instrument symbol
  const drawInstrument = (ctx, type, x, y, tag) => {
    ctx.save()
    const radius = 20

    // Circle (standard instrument symbol)
    ctx.strokeStyle = canvasSettings.instrumentLineColor
    ctx.lineWidth = 2
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Tag
    if (tag) {
      ctx.fillStyle = '#1f2937'
      ctx.font = `${canvasSettings.tagFontSize}px ${canvasSettings.fontFamily}`
      ctx.textAlign = 'center'
      ctx.fillText(tag, x, y + radius + 12)
    }

    ctx.restore()
  }

  // Draw grid
  const drawGrid = (ctx) => {
    if (!canvasSettings.showGrid) return

    ctx.save()
    ctx.strokeStyle = canvasSettings.gridColor
    ctx.lineWidth = 0.5

    const gridSize = canvasSettings.gridSize
    for (let x = 0; x < canvasSettings.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasSettings.height)
      ctx.stroke()
    }

    for (let y = 0; y < canvasSettings.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasSettings.width, y)
      ctx.stroke()
    }

    ctx.restore()
  }

  // Main render function
  const renderPID = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Background
    ctx.fillStyle = canvasSettings.backgroundColor
    ctx.fillRect(0, 0, canvasSettings.width, canvasSettings.height)

    // Grid
    drawGrid(ctx)

    // Render equipment (following expert recommendations - left to right flow)
    if (pidData?.equipment_list) {
      const equipmentCount = pidData.equipment_list.length
      const spacing = Math.min(canvasSettings.minEquipmentSpacing, 
                               (canvasSettings.width - 200) / Math.max(equipmentCount, 1))

      pidData.equipment_list.forEach((equipment, index) => {
        const x = 100 + index * spacing
        const y = canvasSettings.height / 2
        drawEquipmentSymbol(ctx, equipment.equipment_type || 'vessel', x, y, equipment.tag)
      })

      // Draw connecting pipes (left to right)
      for (let i = 0; i < equipmentCount - 1; i++) {
        const x1 = 100 + i * spacing + 50
        const y1 = canvasSettings.height / 2
        const x2 = 100 + (i + 1) * spacing - 50
        const y2 = canvasSettings.height / 2
        drawPipeLine(ctx, x1, y1, x2, y2, `${100 + i}-P-${i + 1}`, '4"')
      }
    }

    // Render instruments
    if (pidData?.instrument_list) {
      const equipmentCount = pidData.equipment_list?.length || 0
      const spacing = Math.min(canvasSettings.minEquipmentSpacing,
                               (canvasSettings.width - 200) / Math.max(equipmentCount, 1))

      pidData.instrument_list.forEach((instrument, index) => {
        const equipIndex = Math.floor(index / 2)
        const x = 100 + equipIndex * spacing
        const y = (canvasSettings.height / 2) + (index % 2 === 0 ? -80 : 80)
        drawInstrument(ctx, instrument.instrument_type, x, y, instrument.tag)

        // Connection line to equipment
        ctx.strokeStyle = canvasSettings.instrumentLineColor
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(x, y + (index % 2 === 0 ? 20 : -20))
        ctx.lineTo(x, canvasSettings.height / 2 + (index % 2 === 0 ? -50 : 50))
        ctx.stroke()
        ctx.setLineDash([])
      })
    }

    // Title block (bottom right - standard P&ID practice)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(canvasSettings.width - 350, canvasSettings.height - 150, 330, 130)
    
    ctx.fillStyle = '#000000'
    ctx.font = `bold 14px ${canvasSettings.fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillText('P&ID DRAWING', canvasSettings.width - 340, canvasSettings.height - 125)
    
    ctx.font = `12px ${canvasSettings.fontFamily}`
    ctx.fillText(`Drawing No: ${pidData?.pid_drawing_number || 'P&ID-XXX-001'}`, 
                 canvasSettings.width - 340, canvasSettings.height - 105)
    ctx.fillText(`Title: ${pidData?.pid_title || 'Process System'}`, 
                 canvasSettings.width - 340, canvasSettings.height - 85)
    ctx.fillText(`Revision: ${pidData?.pid_revision || 'A'}`, 
                 canvasSettings.width - 340, canvasSettings.height - 65)
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 
                 canvasSettings.width - 340, canvasSettings.height - 45)
    ctx.fillText('Designed by: AI Assistant with Expert Guidance', 
                 canvasSettings.width - 340, canvasSettings.height - 25)

    ctx.restore()
  }

  // Mouse handlers for pan
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5))
  }

  const exportToPNG = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `PID_2D_${pidData?.pid_drawing_number || 'export'}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const exportToSVG = () => {
    // SVG export would be implemented here
    alert('SVG export feature coming soon!')
  }

  useEffect(() => {
    renderPID()
  }, [pidData, zoom, pan, currentStage])

  const currentStageData = DOMAIN_EXPERT_CONFIG.designStages.find(s => s.id === currentStage)

  const toggleChecklistItem = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Expert Recommendations Panel */}
      {showExpertPanel && (
        <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            {/* Expert Profile */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{DOMAIN_EXPERT_CONFIG.expert.avatar}</span>
                <div>
                  <h3 className="font-bold">{DOMAIN_EXPERT_CONFIG.expert.name}</h3>
                  <p className="text-xs text-blue-100">{DOMAIN_EXPERT_CONFIG.expert.credentials}</p>
                </div>
              </div>
              <p className="text-sm text-blue-100">{DOMAIN_EXPERT_CONFIG.expert.specialization}</p>
            </div>

            {/* Design Stages */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Design Stages</h4>
              <div className="space-y-2">
                {DOMAIN_EXPERT_CONFIG.designStages.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => setCurrentStage(stage.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      currentStage === stage.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{stage.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{stage.name}</div>
                        <div className="text-xs text-gray-600">{stage.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Stage Recommendations */}
            {currentStageData && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>{currentStageData.icon}</span>
                  Expert Recommendations
                </h4>
                <div className="space-y-4">
                  {currentStageData.expertRecommendations.map(rec => (
                    <div
                      key={rec.id}
                      className={`border-l-4 p-4 rounded-r-lg ${
                        rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-bold text-gray-900 text-sm">{rec.title}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'critical' ? 'bg-red-200 text-red-800' :
                          rec.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{rec.recommendation}</p>
                      <p className="text-xs text-gray-600 italic mb-2">{rec.rationale}</p>
                      {rec.examples && (
                        <div className="text-xs text-gray-700">
                          <div className="font-medium mb-1">Examples:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {rec.examples.map((ex, i) => (
                              <li key={i}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rec.standards && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {rec.standards.map((std, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                              {std}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Checklist */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>✅</span>
                Quality Checklist
              </h4>
              <div className="space-y-2">
                {checklist.map(item => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">{item.item}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800">
                  Completion: {checklist.filter(i => i.checked).length} / {checklist.length}
                </div>
                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${(checklist.filter(i => i.checked).length / checklist.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowExpertPanel(!showExpertPanel)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>{showExpertPanel ? '👨‍🔬 Hide' : '👨‍🔬 Show'} Expert</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                −
              </button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 5))}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                +
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToPNG}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export PNG
            </button>
            <button
              onClick={exportToSVG}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export SVG
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          <canvas
            ref={canvasRef}
            width={canvasSettings.width}
            height={canvasSettings.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className="cursor-move"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
          
          {/* Help overlay */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-xs space-y-1">
            <div><strong>Controls:</strong></div>
            <div>• Drag to pan</div>
            <div>• Scroll to zoom</div>
            <div>• Click stages for expert guidance</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PID2DGenerator
