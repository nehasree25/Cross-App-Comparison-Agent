import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="revenue-tooltip">
        <p className="tooltip-date">{formatDateDisplay(data.date)}</p>
        <p className="tooltip-revenue">Revenue: ₹{data.revenue.toLocaleString('en-IN')}</p>
      </div>
    )
  }
  return null
}

export function RevenueChart({ data, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="revenue-chart-container">
        <div className="revenue-loading">Loading revenue...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="revenue-chart-container">
        <div className="revenue-error">Unable to load revenue data.</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="revenue-chart-container">
        <div className="revenue-empty">No revenue data available.</div>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(item => ({
    date: item.date,
    revenue: item.revenue,
    displayDate: formatDateLabel(item.date),
  }))

  // Format Y-axis values
  const formatYAxis = (value) => {
    if (value === 0) return '₹0'
    if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
    return `₹${value}`
  }

  return (
    <div className="revenue-chart-container">
      <div className="revenue-chart-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 20, left: 0, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tickFormatter={formatYAxis}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="revenue"
              fill="#047857"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Helper: Format date for display (e.g., "Aug 24")
function formatDateLabel(dateString) {
  try {
    const date = new Date(dateString + 'T00:00:00Z')
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

// Helper: Format date for tooltip (e.g., "Aug 24, 2026")
function formatDateDisplay(dateString) {
  try {
    const date = new Date(dateString + 'T00:00:00Z')
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}
