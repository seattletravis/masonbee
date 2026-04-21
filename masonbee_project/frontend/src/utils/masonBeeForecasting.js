// ---------------------------------------------
// Mason Bee Forecasting Engine (Updated)
// ---------------------------------------------

export async function getMasonBeeForecast(lat, lon) {
	const end = new Date(); // today
	const start = new Date();
	start.setFullYear(end.getFullYear() - 1);

	// Fetch 1 year of historical daily max temps
	const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${start.toISOString().slice(0, 10)}&end_date=${end.toISOString().slice(0, 10)}&daily=temperature_2m_max&timezone=auto`;

	const res = await fetch(url);
	const data = await res.json();

	const temps = data.daily.temperature_2m_max;
	const dates = data.daily.time;

	// ---------------------------------------------
	// EMERGENCE DETECTION
	// ---------------------------------------------
	let emergence = findEmergenceDate(temps, dates);

	// Fallback if emergence not found
	if (!emergence) {
		emergence = fallbackEmergenceDate(lat, end.getFullYear());
	}

	let emergenceEarly = new Date(emergence);
	let emergenceLate = shiftDate(emergenceEarly, 14);

	// ---------------------------------------------
	// CURRENT YEAR DORMANCY (4–6 weeks after emergence)
	// ---------------------------------------------
	const dormancyEarly = shiftDate(emergenceEarly, 28); // 4 weeks
	const dormancyLate = shiftDate(emergenceLate, 42); // 6 weeks

	// ---------------------------------------------
	// LAST YEAR'S DORMANCY (for Last Event card)
	// ---------------------------------------------
	const lastYear = end.getFullYear() - 1;

	const lastEmergenceEarly = new Date(
		lastYear,
		emergenceEarly.getMonth(),
		emergenceEarly.getDate(),
	);
	const lastEmergenceLate = new Date(
		lastYear,
		emergenceLate.getMonth(),
		emergenceLate.getDate(),
	);

	const lastDormancyEarly = shiftDate(lastEmergenceEarly, 28);
	const lastDormancyLate = shiftDate(lastEmergenceLate, 42);

	// ---------------------------------------------
	// CURRENT EVENT DETECTION
	// ---------------------------------------------
	const today = new Date();
	const isEmergingNow = today >= emergenceEarly && today <= emergenceLate;

	// ---------------------------------------------
	// NEXT EVENT (if currently emerging → next is dormancy)
	// ---------------------------------------------
	const nextEvent = isEmergingNow
		? {
				type: 'Dormancy',
				early: formatDate(dormancyEarly),
				late: formatDate(dormancyLate),
				earlyDate: dormancyEarly,
				lateDate: dormancyLate,
			}
		: {
				type: 'Emergence',
				early: formatDate(emergenceEarly),
				late: formatDate(emergenceLate),
				earlyDate: emergenceEarly,
				lateDate: emergenceLate,
			};

	// ---------------------------------------------
	// MUST-HAVE-BEES-OUT-BY DATE
	// 10 months after last year's late emergence
	// ---------------------------------------------
	const mustPlaceBy = addMonths(lastEmergenceLate, 10);

	// ---------------------------------------------
	// COCOON HANDLING WINDOW (unchanged)
	// ---------------------------------------------
	const cocoonSafeDate = shiftDate(dormancyLate, 90);

	// ---------------------------------------------
	// RETURN FORECAST OBJECT
	// ---------------------------------------------
	return {
		lastEvent: {
			type: 'Dormancy',
			early: formatDate(lastDormancyEarly),
			late: formatDate(lastDormancyLate),
			earlyDate: lastDormancyEarly,
			lateDate: lastDormancyLate,
		},
		currentEvent: isEmergingNow
			? {
					type: 'Emergence',
					early: formatDate(emergenceEarly),
					late: formatDate(emergenceLate),
					earlyDate: emergenceEarly,
					lateDate: emergenceLate,
				}
			: null,
		nextEvent,
		cocoonSafeDate: formatDate(cocoonSafeDate),
		mustPlaceBy: formatDate(mustPlaceBy),
	};
}

// ---------------------------------------------
// Helper Functions
// ---------------------------------------------

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

function shiftDate(dateStr, days) {
	if (!dateStr) return null;
	const d = new Date(dateStr);
	if (isNaN(d)) return null;
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
