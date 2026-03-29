/**
 * Matching Engine
 * ===============
 * Takes questionnaire answers and scores every vehicle in the database.
 * Returns top N recommendations ranked by composite score.
 */

import vehicles from '../data/vehicles';

// ── Normalize a value to 0–100 ──
function normalize(value, min, max) {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

// ── Inverse normalize (lower is better, e.g., complaints) ──
function normalizeInverse(value, min, max) {
  return 100 - normalize(value, min, max);
}

// ── Derive scoring weights from questionnaire answers ──
export function deriveWeights(answers) {
  const w = {
    priceFit: 1.0,        // always important
    reliability: 0.5,
    safety: 0.5,
    fuelEconomy: 0.3,
    sizeFit: 0.6,
    featureMatch: 0.3,
    terrainCapability: 0.3,
    maintenanceCost: 0.3,
    longevity: 0.3,
    rideQuality: 0.3,
    resaleValue: 0.3,
  };

  // Q4: resale value importance (scale 1-5)
  if (answers[4]) w.resaleValue = answers[4] / 5;

  // Q5: maintenance cost comfort
  if (answers[5] === 'low') w.maintenanceCost = 0.9;
  else if (answers[5] === 'medium') w.maintenanceCost = 0.5;
  else if (answers[5] === 'high') w.maintenanceCost = 0.1;

  // Q6: fuel cost priority
  if (answers[6] === 'very') w.fuelEconomy = 1.0;
  else if (answers[6] === 'somewhat') w.fuelEconomy = 0.6;
  else w.fuelEconomy = 0.2;

  // Q16/Q17: terrain (off-road / snow)
  if (answers[16] === 'frequently' || answers[17] === 'frequently') w.terrainCapability = 1.0;
  else if (answers[16] === 'sometimes' || answers[17] === 'sometimes') w.terrainCapability = 0.6;

  // Q19: ride quality importance (scale 1-5)
  if (answers[19]) w.rideQuality = answers[19] / 5;

  // Q25: reliability importance (scale 1-5)
  if (answers[25]) w.reliability = answers[25] / 5;

  // Q29: safety importance (scale 1-5)
  if (answers[29]) w.safety = answers[29] / 5;

  // Features weighting from Q29-Q36
  const featureQs = [29, 30, 31, 32, 33, 34, 35, 36];
  const featureImportance = featureQs.filter(q => answers[q] === 'must' || answers[q] === 'need' || (typeof answers[q] === 'number' && answers[q] >= 4)).length;
  w.featureMatch = featureImportance > 3 ? 0.8 : featureImportance > 1 ? 0.5 : 0.2;

  // Q23/Q24: longevity
  if (answers[24] === '10+' || answers[24] === 'forever') w.longevity = 0.9;
  else if (answers[24] === '5-10') w.longevity = 0.6;
  else w.longevity = 0.3;

  // Normalize weights to sum to 1
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(w)) {
    w[key] = w[key] / total;
  }

  return w;
}

// ── Apply hard filters ──
function applyFilters(vehicle, answers) {
  // Budget filter
  const budget = answers[1] || 50000;
  const price = vehicle.usedPriceRange ? vehicle.usedPriceRange[1] : vehicle.msrp;
  if (price > budget * 1.15) return false; // 15% grace

  // Condition filter
  const conditions = answers[7] || ['new', 'used', 'cpo'];
  if (Array.isArray(conditions)) {
    const isNew = vehicle.year >= 2024;
    const isUsed = vehicle.year < 2024;
    if (isNew && !conditions.includes('new')) return false;
    if (isUsed && !conditions.includes('used') && !conditions.includes('cpo')) return false;
  }

  // Seating filter
  const riders = answers[8] || 2;
  if (vehicle.seating < riders) return false;

  // Body style filter
  const bodyStyles = answers[42];
  if (Array.isArray(bodyStyles) && bodyStyles.length > 0) {
    if (!bodyStyles.includes(vehicle.bodyStyle)) return false;
  }

  // Brand filter
  const brandPrefs = answers[44];
  if (brandPrefs && typeof brandPrefs === 'object') {
    if (brandPrefs.exclude && brandPrefs.exclude.includes(vehicle.make)) return false;
    if (brandPrefs.include && brandPrefs.include.length > 0 && !brandPrefs.include.includes(vehicle.make)) return false;
  }

  // EV filter
  if (answers[37] === 'no' && vehicle.fuelType === 'electric') return false;
  if (answers[38] === 'no' && vehicle.fuelType === 'hybrid') return false;

  // MPG filter
  const minMpg = answers[40];
  if (minMpg && minMpg !== 'dont_care') {
    const mpgThreshold = parseInt(minMpg);
    if (vehicle.fuelType !== 'electric' && vehicle.mpgCombined < mpgThreshold) return false;
  }

  // Towing filter
  if (answers[20] === 'heavy' && vehicle.towCapacity < 3500) return false;
  if (answers[20] === 'light' && vehicle.towCapacity < 1000 && vehicle.bodyStyle !== 'sedan' && vehicle.bodyStyle !== 'coupe') return false;

  // Driving position
  if (answers[46] === 'high' && (vehicle.bodyStyle === 'sedan' || vehicle.bodyStyle === 'coupe' || vehicle.bodyStyle === 'convertible')) return false;
  if (answers[46] === 'low' && (vehicle.bodyStyle === 'truck' || vehicle.bodyStyle === 'minivan')) return false;

  return true;
}

// ── Score a single vehicle ──
function scoreVehicle(vehicle, answers, weights) {
  const scores = {};

  // Price fit (how well does price match budget)
  const budget = answers[1] || 50000;
  const price = vehicle.usedPriceRange ? ((vehicle.usedPriceRange[0] + vehicle.usedPriceRange[1]) / 2) : vehicle.msrp;
  const priceRatio = price / budget;
  if (priceRatio <= 0.7) scores.priceFit = 70; // under budget but might be cheap
  else if (priceRatio <= 1.0) scores.priceFit = 100 - (1 - priceRatio) * 30; // sweet spot
  else scores.priceFit = Math.max(0, 100 - (priceRatio - 1) * 300); // over budget penalty

  // Reliability
  scores.reliability = vehicle.reliabilityScore;

  // Safety
  scores.safety = (vehicle.safetyRating / 5) * 100;

  // Fuel economy
  if (vehicle.fuelType === 'electric') {
    scores.fuelEconomy = 95;
  } else if (vehicle.fuelType === 'hybrid') {
    scores.fuelEconomy = normalize(vehicle.mpgCombined, 20, 55);
  } else {
    scores.fuelEconomy = normalize(vehicle.mpgCombined, 15, 40);
  }

  // Size fit
  const riders = answers[8] || 2;
  const seatDiff = vehicle.seating - riders;
  scores.sizeFit = seatDiff >= 0 ? Math.min(100, 80 + seatDiff * 5) : 0;

  // Cargo
  const cargoNeed = answers[21];
  if (cargoNeed === 'max' && vehicle.cargoVolume < 30) scores.sizeFit *= 0.6;
  if (cargoNeed === 'lots' && vehicle.cargoVolume < 20) scores.sizeFit *= 0.7;

  // Feature match
  let featureScore = 0;
  let featureCount = 0;
  const featureMap = {
    29: ['hasAEB', 'hasLaneAssist', 'hasBSM'],
    30: ['hasBackupCam'],
    32: ['hasCarPlay'],
    34: ['hasAdaptiveCruise'],
    35: ['hasSunroof'],
    36: ['hasHeatedSeats'],
  };
  for (const [qId, features] of Object.entries(featureMap)) {
    const answer = answers[parseInt(qId)];
    if (answer === 'must' || answer === 'need' || (typeof answer === 'number' && answer >= 4)) {
      featureCount++;
      const hasAll = features.every(f => vehicle[f]);
      if (hasAll) featureScore++;
    }
  }
  scores.featureMatch = featureCount > 0 ? (featureScore / featureCount) * 100 : 80;

  // Terrain capability
  const needsAWD = answers[16] === 'frequently' || answers[17] === 'frequently';
  const prefersAWD = answers[16] === 'sometimes' || answers[17] === 'sometimes';
  const hasAWD = vehicle.drivetrain === 'AWD' || vehicle.drivetrain === '4WD';
  if (needsAWD) scores.terrainCapability = hasAWD ? 100 : 20;
  else if (prefersAWD) scores.terrainCapability = hasAWD ? 100 : 60;
  else scores.terrainCapability = 80;

  // Maintenance cost
  const maintenanceComfort = answers[5];
  if (maintenanceComfort === 'low') {
    scores.maintenanceCost = normalizeInverse(vehicle.maintenanceCostAnnual, 300, 1100);
  } else if (maintenanceComfort === 'medium') {
    scores.maintenanceCost = vehicle.maintenanceCostAnnual < 700 ? 85 : 60;
  } else {
    scores.maintenanceCost = 80;
  }

  // Longevity
  const targetMiles = answers[23] || 100000;
  scores.longevity = normalize(vehicle.lifespanMiles, targetMiles * 0.5, targetMiles * 2);

  // Ride quality
  scores.rideQuality = 70; // baseline — would be enriched with real data in Phase 2

  // Resale value
  scores.resaleValue = vehicle.resaleValueScore;

  // Compute composite
  let composite = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    composite += (scores[dim] || 50) * weight;
  }

  return { composite: Math.round(composite), scores };
}

// ── Generate deep links ──
function generateDeepLinks(vehicle, answers) {
  const zip = answers[49] || '28202';
  const radius = answers[48] || '50';
  const make = encodeURIComponent(vehicle.make.toLowerCase());
  const model = encodeURIComponent(vehicle.model.toLowerCase().replace(/\s+/g, '-'));

  return {
    carscom: `https://www.cars.com/shopping/results/?dealer_id=&keyword=&list_price_max=${Math.round((answers[1] || 50000) * 1.05)}&list_price_min=&makes[]=${vehicle.make.toLowerCase()}&maximum_distance=${radius === 'any' ? 'all' : radius}&mileage_max=&models[]=${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase().replace(/\s+/g, '_')}&sort=best_match_desc&stock_type=all&zip=${zip}`,
    autotrader: `https://www.autotrader.com/cars-for-sale/all-cars/${vehicle.make.toLowerCase()}/${vehicle.model.toLowerCase().replace(/\s+/g, '-')}/${zip}?requestId=search&searchRadius=${radius === 'any' ? '0' : radius}`,
    cargurus: `https://www.cargurus.com/Cars/inventorylisting/ajaxNewListingSearch.action?zip=${zip}&showNegotiable=true&sortDir=ASC&sourceContext=carGurusHomePageModel&distance=${radius === 'any' ? '500' : radius}&entitySelectingHelper.selectedEntity=${make}+${model}`,
  };
}

// ── Generate match reasons ──
function generateReasons(vehicle, scores, answers) {
  const reasons = [];
  const tradeoffs = [];

  if (scores.reliability >= 85) reasons.push(`Excellent reliability record — ${vehicle.make} ${vehicle.model} is known for lasting well beyond 200K miles`);
  if (scores.safety >= 90) reasons.push('Top safety pick with a 5-star NHTSA rating');
  if (vehicle.fuelType === 'hybrid' && answers[6] !== 'not_important') reasons.push(`Outstanding fuel efficiency at ${vehicle.mpgCombined} MPG combined`);
  if (vehicle.fuelType === 'electric') reasons.push(`Zero fuel costs — estimated ${vehicle.evRange} mile range`);
  if (scores.priceFit >= 90) reasons.push('Fits comfortably within your budget');
  if (scores.terrainCapability >= 90 && (answers[17] === 'frequently' || answers[16] === 'frequently')) reasons.push(`${vehicle.drivetrain} drivetrain handles snow and rough terrain well`);
  if (vehicle.resaleValueScore >= 80) reasons.push('Holds its value exceptionally well');
  if (vehicle.maintenanceCostAnnual < 500) reasons.push('Very affordable to maintain');
  if (scores.featureMatch >= 90) reasons.push('Has all the features you asked for');

  if (vehicle.mpgCombined < 25 && vehicle.fuelType === 'gas') tradeoffs.push('Fuel economy is on the lower side');
  if (vehicle.maintenanceCostAnnual > 800) tradeoffs.push('Higher-than-average maintenance costs');
  if (vehicle.complaintCount > 60) tradeoffs.push('Above-average number of consumer complaints');
  if (vehicle.recallCount > 4) tradeoffs.push('Has had several recalls (though all addressable)');
  if (!vehicle.hasCarPlay && answers[32] === 'must') tradeoffs.push('Does not support Apple CarPlay / Android Auto');

  // Ensure at least one reason
  if (reasons.length === 0) reasons.push(`Solid overall match for your needs with a composite score of ${scores.composite}`);

  return { reasons: reasons.slice(0, 4), tradeoffs: tradeoffs.slice(0, 3) };
}

// ── Main matching function ──
export function findMatches(answers, topN = 8) {
  const weights = deriveWeights(answers);

  const results = vehicles
    .filter(v => applyFilters(v, answers))
    .map(v => {
      const { composite, scores } = scoreVehicle(v, answers, weights);
      const deepLinks = generateDeepLinks(v, answers);
      const { reasons, tradeoffs } = generateReasons(v, scores, answers);
      return {
        vehicle: v,
        composite,
        scores,
        deepLinks,
        reasons,
        tradeoffs,
      };
    })
    .sort((a, b) => b.composite - a.composite)
    .slice(0, topN);

  return { results, weights };
}
