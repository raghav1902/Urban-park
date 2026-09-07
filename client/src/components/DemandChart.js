import React, { useState, useMemo, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
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
import { getDemandPrediction } from '../utils/pricing';
import { IconBarChart, IconClock, IconZap, IconTrendingUp } from './Icons';

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

/**
 * Enterprise Responsive Demand Forecast Telemetry Component
 * - 100% Responsive with auto-skipping axis labels and mobile scroll container
 * - Interactive timeframe filtering (24h, Peak, Morning, Evening)
 * - Dual chart mode: Bar Chart & Smooth Area Trendline
 * - White theme palette with crisp contrast and real-time peak analytics
 */
export default function DemandChart() {
  const [filter, setFilter] = useState('all'); // 'all', 'peak', 'morning', 'evening'
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;

  // Generate mock telemetry data
  const rawData = useMemo(() => getDemandPrediction(), []);

  // Filtered dataset according to timeframe selection
  const filteredData = useMemo(() => {
    if (filter === 'peak') {
      return rawData.filter((_, idx) => (idx >= 8 && idx <= 12) || (idx >= 17 && idx <= 21));
    }
    if (filter === 'morning') {
      return rawData.filter((_, idx) => idx >= 6 && idx <= 13);
    }
    if (filter === 'evening') {
      return rawData.filter((_, idx) => idx >= 15 && idx <= 22);
    }
    return rawData;
  }, [filter, rawData]);

  // Telemetry KPIs
  const stats = useMemo(() => {
    let max = { occupancy: -1, label: '' };
    let min = { occupancy: 101, label: '' };
    let sum = 0;

    rawData.forEach((item) => {
      sum += item.occupancy;
      if (item.occupancy > max.occupancy) max = item;
      if (item.occupancy < min.occupancy) min = item;
    });

    return {
      peakHour: max.label,
      peakValue: max.occupancy,
      lowestHour: min.label,
      lowestValue: min.occupancy,
      average: Math.round(sum / rawData.length)
    };
  }, [rawData]);

  const labels = filteredData.map((d) => d.label);
  const values = filteredData.map((d) => d.occupancy);

  const barColors = filteredData.map((d) => {
    if (d.occupancy >= 85) return '#ef4444'; // High surge (Red)
    if (d.occupancy >= 65) return '#f59e0b'; // Moderate demand (Amber)
    return '#3b82f6'; // Optimal flow (Royal Blue)
  });

  const chartData = {
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

  const chartOptions = {
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

  return (
    <div className="card" style={{ background: '#ffffff', padding: isMobile ? '16px' : '24px', marginBottom: '28px' }}>
      {/* Top Header & View Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '14px',
          marginBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '6px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#2563eb'
              }}
            >
              <IconTrendingUp size={18} />
            </span>
            <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#0f172a' }}>
              Hourly Demand Forecast Telemetry
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Anticipated city traffic volume — Morning (9-11 AM) &amp; Evening (6-8 PM) surges
          </p>
        </div>

        {/* View Switchers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* Chart Type Toggle */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: chartType === 'bar' ? '#ffffff' : 'transparent',
                color: chartType === 'bar' ? '#0f172a' : '#64748b',
                boxShadow: chartType === 'bar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Bar View
            </button>
            <button
              onClick={() => setChartType('line')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: chartType === 'line' ? '#ffffff' : 'transparent',
                color: chartType === 'line' ? '#0f172a' : '#64748b',
                boxShadow: chartType === 'line' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Area Trend
            </button>
          </div>

          <span className="badge badge-blue">Predictive AI</span>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '18px',
          background: '#f8fafc',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Peak Surge
          </span>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#ef4444' }}>
            {stats.peakHour} ({stats.peakValue}%)
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Avg Daily Load
          </span>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#2563eb' }}>
            {stats.average}% Capacity
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Off-Peak Saver
          </span>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#059669' }}>
            {stats.lowestHour} ({stats.lowestValue}%)
          </div>
        </div>
      </div>

      {/* Timeframe Filter Pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '16px'
        }}
      >
        {[
          { key: 'all', label: 'All 24 Hours' },
          { key: 'peak', label: 'Peak Windows (Surge)' },
          { key: 'morning', label: 'Morning (6 AM - 1 PM)' },
          { key: 'evening', label: 'Evening (3 PM - 10 PM)' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '9999px',
              border: filter === tab.key ? '1px solid #2563eb' : '1px solid #e2e8f0',
              background: filter === tab.key ? '#eff6ff' : '#ffffff',
              color: filter === tab.key ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Responsive Chart Container */}
      <div
        style={{
          width: '100%',
          overflowX: isMobile && filter === 'all' ? 'auto' : 'hidden',
          paddingBottom: isMobile && filter === 'all' ? '6px' : '0'
        }}
      >
        <div
          style={{
            height: isMobile ? '220px' : '260px',
            minWidth: isMobile && filter === 'all' ? '480px' : '100%'
          }}
        >
          {chartType === 'bar' ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Responsive Legend Footer */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '12px',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3b82f6' }} />
            Normal Demand (&lt;65%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f59e0b' }} />
            Moderate Surge (65–84%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ef4444' }} />
            Critical Peak (&ge;85%)
          </span>
        </div>
        {isMobile && filter === 'all' && (
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Scroll horizontally for 24h</span>
        )}
      </div>
    </div>
  );
}
