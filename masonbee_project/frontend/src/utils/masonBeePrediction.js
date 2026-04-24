export function calculateMasonBeeLikelihood({
	hasPollinators,
	hasWater,
	hasClay,
	hasWoods,
	nearbyBeehouses,
	nearbyCommunityGardens,
}) {
	let score = 0;
	const explanation = [];

	if (hasPollinators) {
		score += 2;
		explanation.push('Early-season pollinators nearby.');
	}

	if (hasWater) {
		score += 2;
		explanation.push('Water source detected within 100 ft.');
	}

	if (hasClay) {
		score += 2;
		explanation.push('Clay source available.');
	}

	if (hasWoods) {
		score += 2;
		explanation.push('Wooded area nearby.');
	}

	if (nearbyBeehouses > 0) {
		score += nearbyBeehouses > 1 ? 4 : 3;
		explanation.push('Active beehouse(s) nearby.');
	}

	if (nearbyCommunityGardens > 0) {
		score += 3;
		explanation.push('Near a community garden.');
	}

	let rating = 'Low';
	if (score >= 3 && score <= 5) rating = 'Moderate';
	if (score >= 6 && score <= 8) rating = 'High';
	if (score >= 9) rating = 'Excellent';

	return { score, rating, explanation };
}
