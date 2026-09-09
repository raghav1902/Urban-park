/**
 * Pricing Service - Dynamic and interval tariff algorithms
 * Architecture: Clean Service Layer
 */

/**
 * Dynamic Pricing Algorithm:
 * - Peak hours: 9-11 AM, 6-9 PM (1.5x multiplier)
 * - Off-peak: 12 AM - 6 AM, 11 PM (0.8x multiplier)
 * - Standard: 1.0x
 */
const computeDynamicPrice = (basePrice, hour) => {
  const peakHours = [9, 10, 18, 19, 20];
  const offPeakHours = [0, 1, 2, 3, 4, 5, 23];

  if (peakHours.includes(hour)) {
    return Math.round(basePrice * 1.5);
  }
  if (offPeakHours.includes(hour)) {
    return Math.round(basePrice * 0.8);
  }
  return basePrice;
};

/**
 * Dynamic Pricing Algorithm across interval:
 * Calculates hour-by-hour dynamic rates across the entire booking duration
 */
const computeIntervalDynamicPrice = (basePrice, startDate, endDate) => {
  const peakHours = [9, 10, 18, 19, 20];
  const offPeakHours = [0, 1, 2, 3, 4, 5, 23];

  const totalMs = endDate.getTime() - startDate.getTime();
  const totalHours = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60)));

  let totalCost = 0;
  const current = new Date(startDate);

  for (let i = 0; i < totalHours; i++) {
    const hour = current.getHours();
    let multiplier = 1.0;
    if (peakHours.includes(hour)) multiplier = 1.5;
    else if (offPeakHours.includes(hour)) multiplier = 0.8;

    totalCost += Math.round(basePrice * multiplier);
    current.setHours(current.getHours() + 1);
  }

  return { totalCost, totalHours };
};

module.exports = {
  computeDynamicPrice,
  computeIntervalDynamicPrice
};
