import React, { useState, useMemo, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { getDemandPrediction } from '../utils/pricing';
import { IconTrendingUp } from './Icons';
import DemandKpiSummary from './demand/DemandKpiSummary';
import { buildChartData, buildChartOptions } from './demand/demandChartConfig';

/**
 * Enterprise Responsive Demand Forecast Telemetry Component
 */
export default function DemandChart() {
  const [filter, setFilter] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const rawData = useMemo(() => getDemandPrediction(), []);

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

  const chartData = useMemo(
    () => buildChartData(filteredData, chartType, isMobile),
    [filteredData, chartType, isMobile]
  );

  const chartOptions = useMemo(
    () => buildChartOptions(isMobile, filter),
    [isMobile, filter]
  );

  const timeframeFilters = [
    { key: 'all', label: 'All 24 Hours' },
    { key: 'peak', label: 'Peak Windows (Surge)' },
    { key: 'morning', label: 'Morning (6 AM - 1 PM)' },
    { key: 'evening', label: 'Evening (3 PM - 10 PM)' }
  ];

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
      <DemandKpiSummary stats={stats} />

      {/* Timeframe Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        {timeframeFilters.map((tab) => (
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
        <div style={{ height: isMobile ? '220px' : '260px', minWidth: isMobile && filter === 'all' ? '480px' : '100%' }}>
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
