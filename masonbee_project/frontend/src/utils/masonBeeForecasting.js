// -------------------------------------------------------------
// Mason Bee Forecasting Engine (Your Biological Logic Version)
// -------------------------------------------------------------

export async function getMasonBeeForecast(lat, lon) {
	const today = new Date();

	// Fetch 1 year of historical temps for THIS YEAR emergence detection
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
	// THIS YEAR EMERGENCE (temperature-based)
	// -------------------------------------------------------------
	const emergenceDate = findEmergenceDate(temps, dates);
	const fallback = fallbackEmergenceDate(lat, today.getFullYear());

	const emergenceEarly = emergenceDate ? new Date(emergenceDate) : fallback;
	const emergenceLate = shiftDate(emergenceEarly, 14);

	// -------------------------------------------------------------
	// LAST YEAR EMERGENCE (your logic: subtract 1 year)
	// -------------------------------------------------------------
	const lastEmergenceEarly = new Date(
		emergenceEarly.getFullYear() - 1,
		emergenceEarly.getMonth(),
		emergenceEarly.getDate(),
	);

	const lastEmergenceLate = new Date(
		emergenceLate.getFullYear() - 1,
		emergenceLate.getMonth(),
		emergenceLate.getDate(),
	);

	// -------------------------------------------------------------
	// LAST YEAR DORMANCY (4–6 weeks after last-year emergence)
	// -------------------------------------------------------------
	const lastDormancyEarly = shiftDate(lastEmergenceEarly, 28);
	const lastDormancyLate = shiftDate(lastEmergenceLate, 42);

	// -------------------------------------------------------------
	// THIS YEAR DORMANCY (for next event)
	// -------------------------------------------------------------
	const dormancyEarly = shiftDate(emergenceEarly, 28);
	const dormancyLate = shiftDate(emergenceLate, 42);

	// -------------------------------------------------------------
	// CURRENT EVENT DETECTION
	// -------------------------------------------------------------
	const isEmergingNow = today >= emergenceEarly && today <= emergenceLate;

	// -------------------------------------------------------------
	// NEXT EVENT
	// -------------------------------------------------------------
	const nextEvent = isEmergingNow
		? {
				type: 'Dormancy',
				early: formatDate(dormancyEarly),
				late: formatDate(dormancyLate),
			}
		: {
				type: 'Emergence',
				early: formatDate(emergenceEarly),
				late: formatDate(emergenceLate),
			};

	// -------------------------------------------------------------
	// MUST-HAVE-BEES-OUT-BY (10 months after last-year late emergence)
	// -------------------------------------------------------------
	const mustPlaceBy = addMonths(lastEmergenceLate, 10);

	// -------------------------------------------------------------
	// COCOON HANDLING WINDOW (unchanged)
	// -------------------------------------------------------------
	const cocoonSafeDate = shiftDate(dormancyLate, 90);

	// -------------------------------------------------------------
	// RETURN FORECAST OBJECT
	// -------------------------------------------------------------
	return {
		lastEvent: {
			type: 'Dormancy',
			early: formatDate(lastDormancyEarly),
			late: formatDate(lastDormancyLate),
		},
		currentEvent: isEmergingNow
			? {
					type: 'Emergence',
					early: formatDate(emergenceEarly),
					late: formatDate(emergenceLate),
				}
			: null,
		nextEvent,
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

function addMonths(date, months) {
	const d = new Date(date);
	d.setMonth(d.getMonth() + months);
	return d;
}

function formatDate(d) {
	return d.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
}
