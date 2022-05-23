function getCalendarPage (month, year, dayProps) {
	// Формирует словарь для конкретного месяца
	let date = new Date(year, month, 1);
	// Так как в JS неделя начинается с ВСК, ему присваивается 0, а нам нужно, чтобы неделя начиналась с ПНд,
	// совершается сдвиг по формуле (date.getDay()+6) % 7)
	date.setDate(date.getDate() - ((date.getDay()+6) % 7))
	let nextMonth = month === 11 ? 0 : month + 1;
	let weeks = [];
	while (date.getMonth() !== nextMonth || ((date.getDay() + 6) % 7) !== 0 || weeks.length !== 6) {
		if (((date.getDay() + 6) % 7) === 0) weeks.unshift({days: [], id: `${year}${month}${year}${weeks.length}`});
		const updated = Object.assign({
			partOfMonth: date.getMonth() === month,
			day: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear(),
			date: new Date(date)
		}, dayProps(date));
		weeks[0].days.push(updated);
		date.setDate(date.getDate() + 1);
	}
	weeks.reverse();
	return {month, year, weeks};
}

function getDayPropsHandler (start, end, selectableCallback) {
	// Определяет для каждого дня, находится ли он в допустимом диапазоне, можно ли его выбрать на календаре
	let today = new Date()
	today.setHours(0, 0, 0, 0)
	return date => {
		const isInRange = date >= start && date <= end
		return {
			isInRange,
			selectable: isInRange && (!selectableCallback || selectableCallback(date)),
			isToday: date.getTime() === today.getTime()
		}
	}
}

export function getMonths(start, end, selectableCallback = null) {
	// формирует словарь с месяцами, которые будут отображаться на календаре
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);
	let endDate = new Date(end.getFullYear(), end.getMonth() + 1, 1);
	let months = [];
	let date = new Date(start.getFullYear(), start.getMonth(), 1);
	let dayPropsHandler = getDayPropsHandler(start, end, selectableCallback);
	while (date < endDate) {
		months.push(getCalendarPage(date.getMonth(), date.getFullYear(), dayPropsHandler));
		date.setMonth(date.getMonth() + 1);
	}
	return months;
}

export const areDatesEquivalent = (a, b) => a.getDate() === b.getDate()
	&& a.getMonth() === b.getMonth()
	&& a.getFullYear() === b.getFullYear();