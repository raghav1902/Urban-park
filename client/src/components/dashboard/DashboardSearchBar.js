import React from 'react';
import { IconSearch } from '../Icons';

/**
 * City Search Form, Text Filter & Radius Dropdown
 */
export default function DashboardSearchBar({
  locationSearchInput,
  setLocationSearchInput,
  handleLocationSearchSubmit,
  gpsLoading,
  search,
  setSearch,
  radiusKm,
  setRadiusKm
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
        background: '#f8fafc',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}
    >
      {/* Search City / Custom Area */}
      <form onSubmit={handleLocationSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="input"
            value={locationSearchInput}
            onChange={(e) => setLocationSearchInput(e.target.value)}
            placeholder="Type any City / Area (e.g. Vidyadhar Nagar, Connaught Place, Bandra...)"
            style={{ height: '40px', fontSize: '13px' }}
          />
        </div>
        <button
          type="submit"
          disabled={gpsLoading}
          className="btn btn-primary"
          style={{ height: '40px', padding: '0 16px', fontSize: '13px', fontWeight: '700' }}
        >
          Search Area
        </button>
      </form>

      {/* Text Search Filter */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <IconSearch size={15} />
        </div>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter parking spaces by name or street..."
          style={{ paddingLeft: '36px', height: '40px', fontSize: '13px' }}
        />
      </div>

      {/* Proximity Radius */}
      <div>
        <select
          className="input"
          value={radiusKm}
          onChange={(e) => setRadiusKm(e.target.value)}
          style={{ height: '40px', fontSize: '13px' }}
        >
          <option value="3">Within 3 km (Local Sector)</option>
          <option value="5">Within 5 km (Neighbourhood Zone)</option>
          <option value="10">Within 10 km (City Suburb)</option>
          <option value="15">Within 15 km (Greater City Area)</option>
          <option value="25">Within 25 km (Metropolitan Grid)</option>
          <option value="all">All Available Facilities (50 km)</option>
        </select>
      </div>
    </div>
  );
}
