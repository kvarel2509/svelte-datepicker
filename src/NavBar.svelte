<script>
	import {createEventDispatcher} from 'svelte';

	const dispatch = createEventDispatcher();

	export let month;
	export let year;
	export let selected;
	export let selected2;
	export let start;
	export let end;
	export let canIncrementMonth;
	export let canDecrementMonth;
	export let monthsOfYear;
	export let activeGroupOption;

	let availableMonths;
	let availableYears;

	function heading_label_click() {
		// Определяет, как переключать вид календаря между день-месяц-год
		if (activeGroupOption.overviewState === 1) {
			switch (overviewState) {
				case 1:
					overviewState = 2
					break;
				case 2:
					overviewState = 3
					break;
				case 3:
					overviewState = 1
					break;
			}
		} else if (activeGroupOption.overviewState === 2) {
			switch (overviewState) {
				case 2:
					overviewState = 3
					break;
				case 3:
					overviewState = 2
					break;
			}
		}
	}

	function monthSelected(event, {m, i}) {
		// Задает действие после выбора месяца на календаре
		event.stopPropagation();
		if (!m.selectable) return;
		dispatch('monthSelected', i);
		if (activeGroupOption.overviewState === 1) overviewState = 1;
	}

	function yearSelected(ev, year) {
		// Задает действие после выбора года на календаре
		ev.stopPropagation();
		if (!year.selectable) return;
		dispatch('yearSelected', year.year);
		if ([1, 2].includes(activeGroupOption.overviewState)) overviewState = 2;
	}

	function _go(forward = true, overviewState) {
		// Определяет incr - на сколько месяцев переключиться при клике по кнопке переключения
		let incr
		if (overviewState === 1) {
			incr = (forward) ? 1 : -1
		} else if (overviewState === 2) {
			if (availableMonths[0].selectable && !forward) incr = -12
			else if (availableMonths[11].selectable && forward) incr = 12
			else incr = 0
		} else {
			if (availableYears[0].year > start.getFullYear() && !forward) incr = -144
			else if (availableYears[11].year < end.getFullYear() && forward) incr = 144
			else incr = 0
		}
		dispatch('incrementMonth', incr);
	}

	function goBack() {
		// Движение назад
		_go(false, overviewState);
	}

	function goForward() {
		// Движение вперед
		_go(true, overviewState);
	}

	function determine_heading_label(overviewState) {
		// Формирует текст в шапке календаря
		if (overviewState === 1) {
			// В словаре с месяцами ищем по индексу месяца
			return `${monthsOfYear[month][0]} ${year}`;
		} else if (overviewState === 2) {
			// выбранный год
			return year;
		} else if (overviewState === 3) {
			// тут список из 12 лет
			const from = availableYears[0].year;
			const to = availableYears[availableYears.length - 1].year;
			return `${from} - ${to}`;
		}
	}

	// отображение - 1 - дни, 2 - месяцы, 3 - года
	$: overviewState = activeGroupOption.overviewState

	// Подготовка данные для применения стиля between-selected
	$: selectedList = [selected.getTime(), selected2.getTime()].sort().map((i) => new Date(i))
	$: {
		let isOnLowerBoundary = start.getFullYear() === year;
		let isOnUpperBoundary = end.getFullYear() === year;
		// создаем массив, где каждому месяцу присваиваем selectable - выделяемый ли он
		availableMonths = monthsOfYear.map((m, i) => ({
					name: m[0],
					abbrev: m[1],
					selectable:
						(!isOnLowerBoundary && !isOnUpperBoundary)
						|| (
							(!isOnLowerBoundary || i >= start.getMonth())
							&& (!isOnUpperBoundary || i <= end.getMonth())
						)
				}
			)
		)
	}
	$: {
		let baseYear = year - year % 12;
		// создаем массив, где каждому году присваиваем selectable - выделяемый ли он
		availableYears = Array(12).fill(baseYear).map((yr, i) => {
			return {
				year: yr + i,
				selectable: yr + i >= start.getFullYear() && yr + i <= end.getFullYear()
			};
		});
	}
	$: heading_label = determine_heading_label(overviewState, month, year);
</script>

<div class="title">
	<div class="heading-section">
		<div class="control"
			class:enabled={canDecrementMonth}
			on:click={goBack}
		>
			<i class="arrow left"></i>
		</div>
		<div class="label" on:click={heading_label_click}>
			{heading_label}
		</div>
		<div class="control"
			class:enabled={canIncrementMonth}
			on:click={goForward}
		>
			<i class="arrow right"></i>
		</div>
	</div>
	<div class="month-selector" class:open={overviewState !== 1}>
		{#if overviewState === 2}
			{#each availableMonths as monthDefinition, index}
				<!--при клике по месяцу передаем в функцию ивент и словарь
				из m -славарь с названием месяца и возможностью его выбора и
				i - его индекс в availableMonths-->
				<div
					class="month-selector--month"
					class:selected={index === month && year === selected.getFullYear()|| activeGroupOption.overviewState === 2 && index === selected2.getMonth() && year === selected2.getFullYear()}
					class:between-selected={year > selectedList[0].getFullYear() && year < selectedList[1].getFullYear() || year === selectedList[0].getFullYear() && selectedList[0].getFullYear() === selectedList[1].getFullYear() && index > selectedList[0].getMonth() && index < selectedList[1].getMonth() || year === selectedList[0].getFullYear() && year < selectedList[1].getFullYear() && index > selectedList[0].getMonth() || year === selectedList[1].getFullYear() && year > selectedList[0].getFullYear() && index < selectedList[1].getMonth()}
					class:selectable={monthDefinition.selectable}
					on:click={e => monthSelected(e, { m: monthDefinition, i: index })}
				>
					<span>{monthDefinition.abbrev}</span>
				</div>
			{/each}
		{:else if overviewState === 3}
			{#each availableYears as yearDefinition}
				<div
					class="month-selector--month"
					class:selected={yearDefinition.year === year || activeGroupOption.overviewState === 3 && yearDefinition.year === selected2.getFullYear()}
					class:selectable={yearDefinition.selectable}
					class:between-selected={Math.min(...[year, selected2.getFullYear()]) < yearDefinition.year && yearDefinition.year < Math.max(...[year, selected2.getFullYear()]) && activeGroupOption.overviewState === 3}
					on:click={e => yearSelected(e, yearDefinition)}
				>
					<span>{yearDefinition.year}</span>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.heading-section {
		font-size: 20px;
		padding: 10px 10px;
		display: flex;
		justify-content: space-between;
		font-weight: bold;
	}

	.label {
		cursor: pointer;
		color: #1e1e1e;
		padding-top: 10px;
	}

	.month-selector {
		position: absolute;
		top: 50px;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--background-color);
		transition: all 300ms;
		transform: scale(1.2);
		opacity: 0;
		visibility: hidden;
		z-index: 1;
		text-align: center;
		font-size: 16px;
	}

	.month-selector.open {
		transform: scale(1);
		visibility: visible;
		opacity: 1;
	}

	.month-selector--month {
		width: 31.333%;
		height: 23%;
		display: inline-block;
		background-color: var(--day-background-color);
		opacity: 0.2;
	}

	.month-selector--month.selectable {
		opacity: 1;
	}

	.month-selector--month.selectable:hover {
		cursor: pointer;
		box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.15);
	}

	.month-selector--month.selected {
		background: var(--highlight-color);
		color: #fff;
	}

	.month-selector--month:before {
		content: ' ';
		display: inline-block;
		height: 100%;
		vertical-align: middle;
	}

	.month-selector--month span {
		vertical-align: middle;
		display: inline-block;
	}

	.control {
		padding: 0 8px;
		opacity: 0.2;
		transform: translateY(3px);
	}

	.control.enabled {
		opacity: 1;
		cursor: pointer;
	}

	.arrow {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-style: solid;
		border-color: #a9a9a9;
		border-width: 0;
		border-bottom-width: 2px;
		border-right-width: 2px;
	}

	.arrow.right {
		transform: rotate(-45deg);
		-webkit-transform: rotate(-45deg);
	}

	.arrow.left {
		transform: rotate(135deg);
		-webkit-transform: rotate(135deg);
	}

	.between-selected {
		background: #96dcff;
	}
</style>
