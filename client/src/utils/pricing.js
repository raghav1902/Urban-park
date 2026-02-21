// Dynamic pricing based on hour and occupancy
export const getDynamicPrice = (basePrice, hour, totalSlots, availableSlots) => {
  const peakHours = [9, 10, 18, 19, 20];
  const offPeakHours = [0, 1, 2, 3, 4, 5, 23];

  let multiplier = 1;
  let label = 'Normal';

  // 1. Time-based pricing
  if (peakHours.includes(hour)) {
    multiplier = 1.5;
    label = 'Peak';
  } else if (offPeakHours.includes(hour)) {
    multiplier = 0.8;
    label = 'Off-Peak';
  }

  // 2. Occupancy-based Surge Pricing (Overrides or compounds?)
  // Let's make it compound for maximum realism
  const occupancyPercent = ((totalSlots - availableSlots) / totalSlots) * 100;

  if (availableSlots <= 2 || occupancyPercent >= 95) {
    multiplier *= 2.0;
    label = label === 'Normal' ? 'Critical Surge' : `${label} + Critical Surge`;
  } else if (occupancyPercent >= 80) {
    multiplier *= 1.5;
    label = label === 'Normal' ? 'High Demand' : `${label} + Surge`;
  }

  return {
    price: Math.round(basePrice * multiplier),
    label,
    multiplier: Number(multiplier.toFixed(2)),
    isSurge: occupancyPercent >= 80 || availableSlots <= 2
  };
};

// Mock demand prediction by hour
export const getDemandPrediction = () => {
  const baseOccupancy = [
    15, 10, 8, 7, 8, 20, 35, 60, 80, 92, 95, 88,
    82, 78, 72, 68, 75, 88, 95, 90, 78, 65, 45, 25
  ];
  return baseOccupancy.map((val, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    occupancy: val + Math.floor(Math.random() * 8 - 4),
    label: hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`
  }));
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (hours) => {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours}h`;
};
