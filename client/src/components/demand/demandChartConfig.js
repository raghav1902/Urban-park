import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function buildChartData(filteredData, chartType, isMobile) {
  const labels = filteredData.map((d) => d.label);
  const values = filteredData.map((d) => d.occupancy);

  const barColors = filteredData.map((d) => {
    if (d.occupancy >= 85) return '#ef4444';
    if (d.occupancy >= 65) return '#f59e0b';
    return '#3b82f6';
  });

  return {
    labels,
    datasets: [
      {
        type: chartType,
        label: 'Demand %',
        data: values,
        backgroundColor:
          chartType === 'bar'
            ? barColors
            : (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 240);
                gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
                gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)');
                return gradient;
              },
        borderColor: chartType === 'bar' ? 'transparent' : '#2563eb',
        borderWidth: chartType === 'bar' ? 0 : 2.5,
        fill: chartType === 'line',
        tension: 0.35,
        borderRadius: chartType === 'bar' ? 6 : 0,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: isMobile ? 3 : 4,
        pointHoverRadius: 6
      }
    ]
  };
}

export function buildChartOptions(isMobile, filter) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => `Time: ${items[0].label}`,
          label: (ctx) => {
            const val = ctx.parsed.y;
            const status =
              val >= 85
                ? 'High Surge (1.5x Multiplier)'
                : val >= 65
                ? 'Moderate Demand (1.2x)'
                : 'Standard Flow (1.0x)';
            return [`Occupancy: ${val}% Expected`, `Traffic Status: ${status}`];
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: isMobile ? 10 : 11, weight: '500' },
          autoSkip: true,
          maxTicksLimit: isMobile ? (filter === 'all' ? 8 : 12) : 24,
          maxRotation: 0
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#f1f5f9',
          borderDash: [4, 4]
        },
        ticks: {
          color: '#64748b',
          font: { size: isMobile ? 10 : 11 },
          stepSize: 25,
          callback: (v) => `${v}%`
        }
      }
    }
  };
}
