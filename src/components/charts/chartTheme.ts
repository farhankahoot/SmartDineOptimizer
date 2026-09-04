/** Shared chart tokens so every panel on the Prediction dashboard reads as one system. */
export const chart = {
  maroon: '#7A1113',
  maroonSoft: '#A03236',
  gold: '#C9A24A',
  goldSoft: '#DCC085',
  grey: '#9CA3AF',
  axis: '#8A8A93',
  grid: '#EFEFF2',
  areaTop: 'rgba(160, 50, 54, 0.28)',
  areaBottom: 'rgba(160, 50, 54, 0.02)',
} as const

export const axisTick = { fontSize: 9.5, fill: chart.axis, fontWeight: 600 } as const

export const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid #EAEAEE',
    boxShadow: '0 8px 24px rgba(16,15,14,.12)',
    fontSize: 11,
    padding: '6px 10px',
  },
  labelStyle: { fontWeight: 700, color: '#1B1B1F', marginBottom: 2 },
  itemStyle: { padding: 0 },
} as const
