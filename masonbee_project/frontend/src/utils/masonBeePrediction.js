export function calculateMasonBeeLikelihood({
	hasPollinators,
	hasWater,
	hasClay,
	hasWoods,
	nearbyBeehouses,
	nearbyCommunityGardens,
}) {
	const explanation = [];

	// -----------------------------
	// 1. Assign ecological weights
	// -----------------------------
	const weights = {
		pollinators: 0.35, // flowers are essential
		water: 0.2, // important supporting factor
		clay: 0.2, // required for nesting
		woods: 0.15, // shelter + early blossoms
		beehouses: 0.4, // strongest predictor
		gardens: 0.3, // strong predictor
	};

	// -----------------------------
	// 2. Convert inputs to factors
	// -----------------------------
	let factors = [];

	if (hasPollinators) {
		factors.push(weights.pollinators);
		explanation.push('Nearby flowering plants provide early-season forage.');
	}

	if (hasWater) {
		factors.push(weights.water);
		explanation.push('Water source nearby helps bees regulate nest humidity.');
	}

	if (hasClay) {
		factors.push(weights.clay);
		explanation.push('Clay or exposed soil available for nest construction.');
	}

	if (hasWoods) {
		factors.push(weights.woods);
		explanation.push('Trees or shrubs provide shelter and early blossoms.');
	}

	if (nearbyBeehouses > 0) {
		factors.push(weights.beehouses);
		explanation.push('Active beehouse detected nearby.');
	}

	if (nearbyCommunityGardens > 0) {
		factors.push(weights.gardens);
		explanation.push('Community garden nearby — strong habitat indicator.');
	}

	// -----------------------------
	// 3. Non-linear scoring curve
	//    Prevents runaway optimism
	// -----------------------------
	let score = 1;
	for (const f of factors) {
		score *= 1 - f;
	}
	score = 1 - score; // convert to likelihood

	// Cap at 100%
	score = Math.min(score, 1);

	// -----------------------------
	// 4. Convert score → label
	// -----------------------------
	let label = 'Low';
	if (score >= 0.75) label = 'Excellent';
	else if (score >= 0.55) label = 'High';
	else if (score >= 0.35) label = 'Moderate';

	return {
		score, // 0–1
		label, // Low / Moderate / High / Excellent
		explanation, // array of strings
	};
}
