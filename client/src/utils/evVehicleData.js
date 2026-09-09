/**
 * Indian EV Vehicle Database & Smart Charge Calculation Formulas
 * Architecture: Utility & Model Layer for UrbanPark EV Supercharger
 * Adheres strictly to 200-300 lines limit
 */

export const EV_VEHICLE_DATABASE = [
  {
    id: 'tata-nexon-max',
    brand: 'Tata',
    model: 'Nexon EV Max',
    type: 'Car / SUV',
    batteryKwh: 40.5,
    rangeKm: 453,
    maxDcKw: 50,
    acKw: 7.2,
    efficiencyKmPerKwh: 9.5
  },
  {
    id: 'tata-tiago-ev',
    brand: 'Tata',
    model: 'Tiago EV (Long Range)',
    type: 'Hatchback',
    batteryKwh: 24.0,
    rangeKm: 315,
    maxDcKw: 25,
    acKw: 3.3,
    efficiencyKmPerKwh: 11.2
  },
  {
    id: 'mg-zs-ev',
    brand: 'MG',
    model: 'ZS EV Executive',
    type: 'SUV',
    batteryKwh: 50.3,
    rangeKm: 461,
    maxDcKw: 50,
    acKw: 7.4,
    efficiencyKmPerKwh: 8.8
  },
  {
    id: 'mahindra-xuv400',
    brand: 'Mahindra',
    model: 'XUV400 EV',
    type: 'SUV',
    batteryKwh: 39.4,
    rangeKm: 456,
    maxDcKw: 50,
    acKw: 7.2,
    efficiencyKmPerKwh: 9.2
  },
  {
    id: 'byd-atto-3',
    brand: 'BYD',
    model: 'Atto 3 Superior',
    type: 'Luxury SUV',
    batteryKwh: 60.48,
    rangeKm: 521,
    maxDcKw: 80,
    acKw: 7.0,
    efficiencyKmPerKwh: 8.2
  },
  {
    id: 'ather-450x',
    brand: 'Ather',
    model: '450X Gen 3',
    type: '2-Wheeler',
    batteryKwh: 3.7,
    rangeKm: 146,
    maxDcKw: 3.3,
    acKw: 0.7,
    efficiencyKmPerKwh: 32.0
  },
  {
    id: 'ola-s1-pro',
    brand: 'Ola',
    model: 'S1 Pro Gen 2',
    type: '2-Wheeler',
    batteryKwh: 4.0,
    rangeKm: 181,
    maxDcKw: 3.0,
    acKw: 0.75,
    efficiencyKmPerKwh: 35.0
  },
  {
    id: 'custom-ev',
    brand: 'Custom',
    model: 'Custom EV Vehicle',
    type: 'Universal',
    batteryKwh: 30.0,
    rangeKm: 300,
    maxDcKw: 50,
    acKw: 7.2,
    efficiencyKmPerKwh: 10.0
  }
];

export const CHARGER_PROFILES = [
  {
    id: 'dc-fast-60',
    name: 'CCS-2 Ultra DC Fast',
    powerKw: 60,
    type: 'DC',
    color: '#10b981',
    description: 'Highway spec ultra-rapid charging'
  },
  {
    id: 'dc-fast-30',
    name: 'CCS-2 Commercial DC Fast',
    powerKw: 30,
    type: 'DC',
    color: '#059669',
    description: 'City mall / plaza fast charger'
  },
  {
    id: 'ac-type-2',
    name: 'Type-2 AC Smart Wallbox',
    powerKw: 7.2,
    type: 'AC',
    color: '#2563eb',
    description: 'Standard safe commercial AC charger'
  },
  {
    id: 'ac-slow',
    name: '16A 3-Pin Standard Socket',
    powerKw: 3.3,
    type: 'AC',
    color: '#6366f1',
    description: 'Universal residential / driveway socket'
  }
];

/**
 * Calculate energy required to charge between percentages
 */
export function computeEnergyRequiredKwh(batteryCapacityKwh, currentPct, targetPct) {
  const deltaPct = Math.max(0, targetPct - currentPct);
  // Account for ~8% charging and thermal losses
  const rawKwh = (batteryCapacityKwh * deltaPct) / 100;
  return Number((rawKwh * 1.08).toFixed(2));
}

/**
 * Calculate estimated charging time in minutes
 */
export function computeChargingTimeMinutes(kwhNeeded, chargerPowerKw, vehicleMaxDcKw, isDc = true) {
  if (kwhNeeded <= 0) return 0;
  // Effective charging speed is bottlenecked by the lower of charger or vehicle acceptance
  const effectivePowerKw = isDc ? Math.min(chargerPowerKw, vehicleMaxDcKw) : chargerPowerKw;
  const hours = kwhNeeded / Math.max(effectivePowerKw, 1.0);
  return Math.round(hours * 60);
}

/**
 * Format minutes into readable "X hrs Y mins"
 */
export function formatDurationHoursMinutes(totalMinutes) {
  if (totalMinutes <= 0) return '0 mins';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins}m`;
}

/**
 * Calculate estimated charging cost
 */
export function computeEstimatedCost(kwhNeeded, ratePerKwh = 18.5) {
  const cost = kwhNeeded * ratePerKwh;
  return Math.round(cost);
}

/**
 * Calculate estimated CO2 saved compared to a 1.5L petrol car
 * (Standard ICE emissions ~140g CO2/km; EV grid-mix adjusted savings ~92g/km)
 */
export function computeCo2OffsetKg(kwhCharged, efficiencyKmPerKwh = 10) {
  const kmAdded = kwhCharged * efficiencyKmPerKwh;
  const co2SavedKg = (kmAdded * 0.092);
  return Number(co2SavedKg.toFixed(1));
}
