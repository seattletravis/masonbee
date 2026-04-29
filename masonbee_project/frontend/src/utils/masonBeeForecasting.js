// -------------------------------------------------------------
// Mason Bee Forecast Engine (Clean, Corrected, Production-Ready)
// -------------------------------------------------------------

const SIX_WEEKS = 42; // days

export async function getMasonBeeForecast(lat, lon) {
	const today = new Date();

	// -------------------------------------------------------------
	// FETCH 1 YEAR OF HISTORICAL TEMPERATURES
	// -------------------------------------------------------------
	const start = new Date();
	start.setFullYear(today.getFullYear() - 1);

	const end = new Date();

	const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${start
		.toISOString()
		.slice(0, 10)}&end_date=${end
		.toISOString()
		.slice(0, 10)}&daily=temperature_2m_max&timezone=auto`;

	const res = await fetch(url);
	const data = await res.json();

	const temps = data.daily.temperature_2m_max;
	const dates = data.daily.time;

	// -------------------------------------------------------------
	// EMERGENCE (temperature-based)
	// -------------------------------------------------------------
	const emergenceDate = findEmergenceDate(temps, dates);
	const fallback = fallbackEmergenceDate(lat, today.getFullYear());

	const emergenceEarly = emergenceDate ? new Date(emergenceDate) : fallback;
	const emergenceLate = shiftDate(emergenceEarly, 14); // 2-week emergence window

	// -------------------------------------------------------------
	// ACTIVE SEASON (emergence → emergence + 6 weeks)
	// -------------------------------------------------------------
	const activeEarly = emergenceEarly;
	const activeLate = shiftDate(emergenceLate, SIX_WEEKS);

	// -------------------------------------------------------------
	// DORMANCY (after active season)
	// -------------------------------------------------------------
	const dormancyEarly = activeLate;
	const dormancyLate = shiftDate(activeLate, 60); // ~late summer

	// -------------------------------------------------------------
	// LAST YEAR DORMANCY (for "Last Event")
	// -------------------------------------------------------------
	const lastDormancyEarly = new Date(
		dormancyEarly.getFullYear() - 1,
		dormancyEarly.getMonth(),
		dormancyEarly.getDate(),
	);

	const lastDormancyLate = new Date(
		dormancyLate.getFullYear() - 1,
		dormancyLate.getMonth(),
		dormancyLate.getDate(),
	);

	// -------------------------------------------------------------
	// CURRENT EVENT (corrected)
	// -------------------------------------------------------------
	let currentEvent;

	if (today >= emergenceEarly && today <= emergenceLate) {
		currentEvent = {
			type: 'Emergence',
			early: formatDate(emergenceEarly),
			late: formatDate(emergenceLate),
		};
	} else if (today > emergenceLate && today <= activeLate) {
		currentEvent = {
			type: 'Active Season',
			early: formatDate(activeEarly),
			late: formatDate(activeLate),
		};
	} else if (today >= dormancyEarly && today <= dormancyLate) {
		currentEvent = {
			type: 'Dormancy',
			early: formatDate(dormancyEarly),
			late: formatDate(dormancyLate),
		};
	} else {
		// Winter fallback
		currentEvent = {
			type: 'Dormancy',
			early: formatDate(dormancyEarly),
			late: formatDate(dormancyLate),
		};
	}

	// -------------------------------------------------------------
	// NEXT EVENT (corrected)
	// -------------------------------------------------------------
	let nextEvent;

	if (today < emergenceEarly) {
		nextEvent = {
			type: 'Emergence',
			early: formatDate(emergenceEarly),
			late: formatDate(emergenceLate),
		};
	} else if (today <= activeLate) {
		nextEvent = {
			type: 'Dormancy',
			early: formatDate(dormancyEarly),
			late: formatDate(dormancyLate),
		};
	} else {
		// After dormancy → next year's emergence
		const nextEmergenceEarly = new Date(
			emergenceEarly.getFullYear() + 1,
			emergenceEarly.getMonth(),
			emergenceEarly.getDate(),
		);

		const nextEmergenceLate = shiftDate(nextEmergenceEarly, 14);

		nextEvent = {
			type: 'Emergence',
			early: formatDate(nextEmergenceEarly),
			late: formatDate(nextEmergenceLate),
		};
	}

	// -------------------------------------------------------------
	// STATUS TAG (uses corrected windows)
	// -------------------------------------------------------------
	const status = getBeeStatus(
		today,
		emergenceEarly,
		emergenceLate,
		dormancyEarly,
		dormancyLate,
	);

	// -------------------------------------------------------------
	// COCOON HANDLING WINDOW
	// -------------------------------------------------------------
	const cocoonSafeDate = shiftDate(dormancyLate, 90);

	// -------------------------------------------------------------
	// MUST PLACE BY (45 days before emergence)
	// -------------------------------------------------------------
	const mustPlaceBy = shiftDate(emergenceEarly, -45);

	// -------------------------------------------------------------
	// RETURN FORECAST OBJECT
	// -------------------------------------------------------------
	return {
		lastEvent: {
			type: 'Dormancy',
			early: formatDate(lastDormancyEarly),
			late: formatDate(lastDormancyLate),
		},
		currentEvent,
		nextEvent,
		status,
		cocoonSafeDate: formatDate(cocoonSafeDate),
		mustPlaceBy: formatDate(mustPlaceBy),
	};
}

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------

function rollingAverage(arr, window = 14) {
	const result = [];
	for (let i = 0; i < arr.length - window + 1; i++) {
		const slice = arr.slice(i, i + window);
		const avg = slice.reduce((a, b) => a + b, 0) / window;
		result.push(avg);
	}
	return result;
}

function findEmergenceDate(temps, dates) {
	const rolling = rollingAverage(temps, 14);
	for (let i = 0; i < rolling.length; i++) {
		if (rolling[i] >= 55) {
			return dates[i + 13];
		}
	}
	return null;
}

function fallbackEmergenceDate(lat, year) {
	if (lat >= 45) return new Date(year, 3, 15); // April 15
	if (lat >= 35) return new Date(year, 2, 25); // March 25
	return new Date(year, 1, 25); // February 25
}

function shiftDate(date, days) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function formatDate(d) {
	return d.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
}

function getBeeStatus(
	today,
	emergenceStart,
	emergenceEnd,
	dormancyStart,
	dormancyEnd,
) {
	if (today >= emergenceStart && today <= emergenceEnd) {
		return { event: 'Emergence', status: 'Active — Please do not disturb' };
	}

	if (today > emergenceEnd && today <= shiftDate(emergenceEnd, SIX_WEEKS)) {
		return { event: 'Active Season', status: 'Active — Bees are foraging' };
	}

	if (today >= dormancyStart && today <= dormancyEnd) {
		return { event: 'Dormancy', status: 'Dormant — OK to handle' };
	}

	if (today < emergenceStart) {
		return {
			event: 'Pre‑Emergence',
			status: 'Inactive — Bees are still dormant',
		};
	}

	return {
		event: 'Post‑Dormancy',
		status: 'Inactive — Bees are dormant again',
	};
}
