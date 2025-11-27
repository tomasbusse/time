import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthlyData {
  month: string
  assets: number
  liabilities: number
}

interface MonthlyValuationChartProps {
  data: MonthlyData[]
  onYearChange?: (year: number) => void
  currentYear?: number
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function MonthlyValuationChart({ data, onYearChange, currentYear = new Date().getFullYear() }: MonthlyValuationChartProps) {
  const [displayYear, setDisplayYear] = useState(currentYear)

  const handlePreviousYear = () => {
    const newYear = displayYear - 1
    setDisplayYear(newYear)
    onYearChange?.(newYear)
  }

  const handleNextYear = () => {
    const newYear = displayYear + 1
    setDisplayYear(newYear)
    onYearChange?.(newYear)
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-off-white rounded-lg border border-light-gray">
        <p className="text-gray text-center">
          No valuation data yet. Start by entering your first monthly valuation.
        </p>
      </div>
    )
  }

  // Format data with month names
  const formattedData = data.map((item, index) => ({
    ...item,
    monthLabel: MONTH_NAMES[index] || item.month,
  }))

  return (
    <div className="w-full bg-white rounded-lg border border-light-gray p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousYear}
            className="p-2 hover:bg-light-gray rounded-md transition-colors"
            title="Previous year"
          >
            <ChevronLeft className="w-5 h-5 text-gray" />
          </button>
          <h3 className="text-lg font-semibold text-dark-blue w-24 text-center">
            {displayYear}
          </h3>
          <button
            onClick={handleNextYear}
            className="p-2 hover:bg-light-gray rounded-md transition-colors"
            title="Next year"
          >
            <ChevronRight className="w-5 h-5 text-gray" />
          </button>
        </div>
        <p className="text-sm text-gray">12-Month Progress</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="monthLabel" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Amount (€)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            labelFormatter={(label) => `${label} ${displayYear}`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="assets"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Total Assets"
          />
          <Line
            type="monotone"
            dataKey="liabilities"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
            name="Total Liabilities"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
