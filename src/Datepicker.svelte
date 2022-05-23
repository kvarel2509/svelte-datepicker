<script>
	import Month from './Month.svelte'
	import NavBar from './NavBar.svelte'
	import Popover from './Popover.svelte'
	import {getMonths} from './lib/helpers'
	import {createEventDispatcher} from 'svelte'
	import {formatDate} from 'timeUtils'

	const dispatch = createEventDispatcher()
	const today = new Date()
	const oneYear = 1000 * 60 * 60 * 24 * 365
	const oneDay = 1000 * 60 * 60 * 24
	const groupOptions = [
		{'name': 'день', 'overviewState': 1, 'groupingParameter': 'day'},
		{'name': 'неделя', 'overviewState': 1, 'groupingParameter': 'week'},
		{'name': 'месяц', 'overviewState': 2, 'groupingParameter': 'month'},
		{'name': 'квартал', 'overviewState': 2, 'groupingParameter': 'quarter'},
		{'name': 'год', 'overviewState': 3, 'groupingParameter': 'year'},
	]
	const fastFilters = [
		{'name': 'неделя'},
		{'name': 'месяц'},
		{'name': 'прошлая неделя'},
		{'name': 'прошлый месяц'},
		{'name': 'год'}
	]

	export let formattedSelected;
	export let filterSet = {
		dateStart: formatDate(new Date(today.getTime() - oneDay * 7), '#{Y}-#{m}-#{d}'),
		dateEnd: formatDate(today, '#{Y}-#{m}-#{d}'),
		groupingParameter: 'day'
	}
	export let format = '#{d}.#{m}.#{Y}'
	// Диапазон дат, на который формируется календарь
	export let startLeftCalendar = new Date(Date.now() - oneYear * 3)
	export let endRightCalendar = new Date(Date.now() + oneYear * 3)
	export let daysOfWeek = [
		['Понедельник', 'Пн'],
		['Вторник', 'Вт'],
		['Среда', 'Ср'],
		['Четверг', 'Чт'],
		['Пятница', 'Пт'],
		['Суббота', 'Сб'],
		['Воскресенье', 'Вс'],
	];
	export let monthsOfYear = [
		['Январь', 'Янв'],
		['Февраль', 'Фев'],
		['Март', 'Мар'],
		['Апрель', 'Апр'],
		['Май', 'Май'],
		['Июнь', 'Июнь'],
		['Июль', 'Июль'],
		['Август', 'Авг'],
		['Сентябрь', 'Сен'],
		['Октябрь', 'Окт'],
		['Ноябрь', 'Ноя'],
		['Декабрь', 'Дек'],
	]
	// Стилизация календаря:
	export let style = ''
	export let buttonBackgroundColor = '#2c97de'
	export let buttonBorderColor = '#ffffff'
	export let buttonTextColor = '#ffffff'
	export let highlightColor = '#2c97de'
	export let dayBackgroundColor = 'none'
	export let dayTextColor = '#000000'
	export let dayBorderColor = '#ffffff'
	export let dayHighlightedBackgroundColor = '#e7e7e7'
	export let dayHighlightedTextColor = '#000000'
	export let backgroundColor = '#ffffff'
	export let textColor = '#000000'

	// Переменные для правого и левого графиков
	let selectedLeftCalendar = new Date(filterSet.dateStart)
	let selectedRightCalendar = new Date(filterSet.dateEnd)
	let endLeftCalendar = selectedRightCalendar
	let highlightedLeftCalendar = selectedLeftCalendar
	$: monthLeftCalendar = selectedLeftCalendar.getMonth()
	$: yearLeftCalendar = selectedLeftCalendar.getFullYear()
	let monthIndexLeftCalendar = 0
	let startRightCalendar = selectedLeftCalendar
	let highlightedRightCalendar = selectedRightCalendar
	$: monthRightCalendar = selectedRightCalendar.getMonth()
	$: yearRightCalendar = selectedRightCalendar.getFullYear()
	let monthIndexRightCalendar = 0

	let popover
	let dateChosen = false
	let alwaysOpen = false
	let trigger = null
	let selectableCallback = null
	let activeGroupOption = groupOptions[0]
	let shakeHighlightTimeout
	let shouldShakeDate = false
	let isOpen = false
	let isClosing = false
	today.setHours(0, 0, 0, 0)

	function selectActiveGroupOption(option) {
		// Запускается в момент смены группировки. Заменяет даты, регистрирует их и меняет группировку.
		activeGroupOption = option
		if (activeGroupOption.name === 'месяц') {
			selectedLeftCalendar.setDate(1)
			selectedRightCalendar.setDate(1)
			selectedRightCalendar.setMonth(selectedRightCalendar.getMonth() + 1)
			selectedRightCalendar = new Date(selectedRightCalendar.getTime() - oneDay)
		} else if (activeGroupOption.name === 'год') {
			selectedLeftCalendar = new Date(selectedLeftCalendar.getFullYear(), 0, 1)
			selectedRightCalendar = new Date(selectedRightCalendar.getFullYear(), 11, 31)
		} else if (activeGroupOption.name === 'квартал') {
			selectedLeftCalendar.setDate(1)
			let m = selectedLeftCalendar.getMonth()
			selectedLeftCalendar.setMonth(m - m % 3)
			selectedRightCalendar.setDate(1)
			m = selectedRightCalendar.getMonth()
			selectedRightCalendar.setMonth(m - m % 3 + 3)
			selectedRightCalendar = new Date(selectedRightCalendar.getTime() - oneDay)
		}
		registerSelection(selectedLeftCalendar, 'left', false)
		registerSelection(selectedRightCalendar, 'right', false)
		filterSet.groupingParameter = option.groupingParameter
	}

	function fastSelectDate(type) {
		// Запускается в момент активации быстрого фильтра. Вычисляет даты и регистрирует их.
		if (activeGroupOption.name === 'день') {
			let currentDate = new Date()
			let startDate, endDate, d
			if (type === 'неделя') {
				d = currentDate.getDay()
				startDate = new Date(currentDate.getTime() - oneDay * (d - 1))
				endDate = new Date(currentDate.getTime() + oneDay * ((7 - d) % 7))
			} else if (type === 'месяц') {
				currentDate.setDate(1)
				startDate = new Date(currentDate)
				currentDate.setMonth(currentDate.getMonth() + 1)
				endDate = new Date(currentDate - oneDay)
			} else if (type === 'прошлая неделя') {
				currentDate = new Date(currentDate.getTime() - oneDay * 7)
				d = currentDate.getDay()
				startDate = new Date(currentDate.getTime() - oneDay * (d - 1))
				endDate = new Date(currentDate.getTime() + oneDay * ((7 - d) % 7))
			} else if (type === 'прошлый месяц') {
				currentDate.setDate(15)
				currentDate.setTime(currentDate.getTime() - oneDay * 31)
				currentDate.setDate(1)
				startDate = new Date(currentDate)
				currentDate.setMonth(currentDate.getMonth() + 1)
				endDate = new Date(currentDate.getTime() - oneDay)
			} else if (type === 'год') {
				startDate = new Date(currentDate.getFullYear(), 0, 1)
				endDate = new Date(currentDate.getFullYear(), 11, 31)
			}
			startDate = checkBorder(startDate, 'left')
			endDate = checkBorder(endDate, 'right')
			if (startDate.getMonth() !== monthLeftCalendar) {
				monthIndexLeftCalendar = monthIndexLeftCalendar + (startDate.getMonth() - monthLeftCalendar)
				changeMonth(startDate.getMonth(), 'left')
			}
			if (endDate.getMonth() !== monthRightCalendar) {
				monthIndexRightCalendar = monthIndexRightCalendar + (endDate.getMonth() - monthRightCalendar)
				changeMonth(endDate.getMonth(), 'right')
			}
			if (endDate >= selectedLeftCalendar) {
				registerSelection(endDate, 'right', false)
				registerSelection(startDate, 'left', false)
			} else {
				registerSelection(startDate, 'left', false)
				registerSelection(endDate, 'right', false)
			}
		}
	}

	function checkBorder(date, calendar) {
		// Проверяет, выходит ли дата за пределы календаря
		if (calendar === 'left') return (date < startLeftCalendar) ? startLeftCalendar : date
		else return (date > endRightCalendar) ? endRightCalendar : date
	}

	function assignValueToTrigger(formatted) {
		// Форматирование даты
		if (!trigger || alwaysOpen) return
		trigger.innerHTML = formatted
	}

	function changeMonth(selectedMonth, calendar) {
		// Устанавливает значение месяца. Действие зависит от типа активной группировки.
		if (calendar === 'left') {
			monthLeftCalendar = selectedMonth
			highlightedLeftCalendar = new Date(yearLeftCalendar, monthLeftCalendar, 1);
			if (activeGroupOption.overviewState === 2) {
				if (activeGroupOption.name === 'квартал') {
					let m = highlightedLeftCalendar.getMonth()
					highlightedLeftCalendar.setMonth(m - m % 3)
				}
				registerSelection(highlightedLeftCalendar, 'left')
			}
		} else {
			monthRightCalendar = selectedMonth
			highlightedRightCalendar = new Date(yearRightCalendar, monthRightCalendar, 1)
			if (activeGroupOption.overviewState === 2) {
				if (activeGroupOption.name === 'квартал') {
					let m = highlightedRightCalendar.getMonth()
					highlightedRightCalendar.setMonth(m - m % 3 + 3)
				} else {
					highlightedRightCalendar.setMonth(highlightedRightCalendar.getMonth() + 1)
				}
				highlightedRightCalendar = checkBorder(new Date(highlightedRightCalendar.getTime() - oneDay), 'right')
				registerSelection(highlightedRightCalendar, 'right')
			}
		}
	}

	function changeYear(selectedYear, calendar) {
		// Устанавливает значение года. Действие зависит от типа активной группировки.
		if (calendar === 'left') {
			yearLeftCalendar = selectedYear
			if (activeGroupOption.overviewState === 3) {
				highlightedLeftCalendar = checkBorder(new Date(yearLeftCalendar, 0, 1), 'left')
				registerSelection(highlightedLeftCalendar, 'left')
			} else {
				highlightedLeftCalendar = checkBorder(new Date(yearLeftCalendar, monthLeftCalendar, 1), 'left')
			}
		} else {
			yearRightCalendar = selectedYear
			if (activeGroupOption.overviewState === 3) {
				highlightedRightCalendar = checkBorder(new Date(yearRightCalendar, 11, 31), 'right')
				registerSelection(highlightedRightCalendar, 'right')
			} else {
				highlightedRightCalendar = checkBorder(new Date(yearRightCalendar, monthRightCalendar, 1), 'right')
			}
		}
	}

	function incrementMonth(direction, calendar, day = 1) {
		// Вызывается в момент клика по элементам управления. Меняет отображаемый месяц при возможности.
		if (calendar === 'left') {
			if (direction === 1 && !canIncrementMonthLeftCalendar) return;
			if (direction === -1 && !canDecrementMonthLeftCalendar) return;
			let current = new Date(yearLeftCalendar, monthLeftCalendar, 1)
			current.setMonth(current.getMonth() + direction)
			monthLeftCalendar = current.getMonth()
			yearLeftCalendar = current.getFullYear()
			highlightedLeftCalendar = new Date(yearLeftCalendar, monthLeftCalendar, day)
		} else {
			if (direction === 1 && !canIncrementMonthRightCalendar) return;
			if (direction === -1 && !canDecrementMonthRightCalendar) return;
			let current = new Date(yearRightCalendar, monthRightCalendar, 1)
			current.setMonth(current.getMonth() + direction)
			monthRightCalendar = current.getMonth()
			yearRightCalendar = current.getFullYear()
			highlightedRightCalendar = new Date(yearRightCalendar, monthRightCalendar, day)
		}
	}

	function getDefaultHighlighted(selected) {
		// Инициализация даты при открытии календаря. По умолчанию возвращает текущее значение
		return new Date(selected)
	}

	function checkIfVisibleDateIsSelectable(date, calendar) {
		// Проверяет на возможность выбора даты на календаре.
		const proposedDay = getDayCalendar(date.getMonth(), date.getDate(), date.getFullYear(), calendar)
		return proposedDay && proposedDay.selectable
	}

	function shakeDate(date) {
		// Анимирование в случае выбора недопустимой даты
		clearTimeout(shakeHighlightTimeout)
		shouldShakeDate = date
		shakeHighlightTimeout = setTimeout(() => {shouldShakeDate = false}, 100)
	}

	function registerSelection(chosen, calendar, flag = true) {
		// Регистрация выбранной даты. Меняет дату при необходимости, проверяет ее на вхождение в допустимый
		// диапазон.
		if (activeGroupOption.name === 'неделя') {
			let d = chosen.getDay()
			if (calendar === 'left') {
				chosen = new Date(chosen.getTime() - oneDay * (d - 1))
			} else {
				chosen = new Date(chosen.getTime() + oneDay * ((7 - d) % 7))
			}
		}
		chosen = checkBorder(chosen, calendar)
		if (flag && !checkIfVisibleDateIsSelectable(chosen, calendar)) return shakeDate(chosen)
		if (calendar === 'left') {
			selectedLeftCalendar = chosen
			startRightCalendar = chosen
		} else {
			selectedRightCalendar = chosen
			endLeftCalendar = chosen
		}
		dateChosen = true
		assignValueToTrigger(formattedSelected)
		filterSet.dateStart = formatDate(selectedLeftCalendar, '#{Y}-#{m}-#{d}')
		filterSet.dateEnd = formatDate(selectedRightCalendar, '#{Y}-#{m}-#{d}')
		return dispatch('dateSelected', {date: chosen})
	}

	function registerClose(event) {
		// Формирует событие для FilterBlock. Указывает, нужно ли обновлять данные графиков.
		dispatch('close_calendar', {status: event.detail})
	}

	function registerOpen() {
		// При открытии календаря определяет, выбранные даты по умолчанию
		highlightedLeftCalendar = getDefaultHighlighted(selectedLeftCalendar)
		monthLeftCalendar = selectedLeftCalendar.getMonth()
		yearLeftCalendar = selectedLeftCalendar.getFullYear()
		highlightedRightCalendar = getDefaultHighlighted(selectedRightCalendar)
		monthRightCalendar = selectedRightCalendar.getMonth()
		yearRightCalendar = selectedRightCalendar.getFullYear()
		dispatch('open')
	}

	function getDayCalendar (m, d, y, calendar) {
		// Определяет положение даты внутри календаря
		let theMonth = (calendar === 'left')
			? monthsLeftCalendar.find(aMonth => aMonth.month === m && aMonth.year === y)
			: monthsRightCalendar.find(aMonth => aMonth.month === m && aMonth.year === y)
		if (!theMonth) return null
		for (let i = 0; i < theMonth.weeks.length; ++i) {
			for (let j = 0; j < theMonth.weeks[i].days.length; ++j) {
				let aDay = theMonth.weeks[i].days[j]
				if (aDay.month === m && aDay.day === d && aDay.year === y) return aDay
			}
		}
		return null
	}
	// Календари
	$: monthsLeftCalendar = getMonths(startLeftCalendar, endLeftCalendar, selectableCallback);
	$: monthsRightCalendar = getMonths(startRightCalendar, endRightCalendar, selectableCallback);
	// Если календари формируются заново, пересчет индекса активного месяца
	$: {
		for (let i = 0; i < monthsLeftCalendar.length; ++i) {
			if (monthsLeftCalendar[i].month === monthLeftCalendar && monthsLeftCalendar[i].year === yearLeftCalendar) {
				monthIndexLeftCalendar = i;
				break
			}
		}
	}
	$: {
		for (let i = 0; i < monthsRightCalendar.length; ++i) {
			if (monthsRightCalendar[i].month === monthRightCalendar && monthsRightCalendar[i].year === yearRightCalendar) {
				monthIndexRightCalendar = i;
				break
			}
		}
	}
	// переменные-помощники для формирования календаря
	$: visibleMonthLeftCalendar = monthsLeftCalendar[monthIndexLeftCalendar]
	$: visibleMonthIdLeftCalendar = yearLeftCalendar + monthLeftCalendar / 100
	$: lastVisibleDateLeftCalendar = visibleMonthLeftCalendar.weeks[visibleMonthLeftCalendar.weeks.length - 2].days[6].date;
	$: firstVisibleDateLeftCalendar = visibleMonthLeftCalendar.weeks[0].days[0].date;
	$: canIncrementMonthLeftCalendar = monthIndexLeftCalendar < monthsLeftCalendar.length - 1;
	$: canDecrementMonthLeftCalendar = monthIndexLeftCalendar > 0;
	$: visibleMonthRightCalendar = monthsRightCalendar[monthIndexRightCalendar]
	$: visibleMonthIdRightCalendar = yearRightCalendar + monthRightCalendar / 100
	$: lastVisibleDateRightCalendar = visibleMonthRightCalendar.weeks[visibleMonthRightCalendar.weeks.length - 1].days[6].date;
	$: firstVisibleDateRightCalendar = visibleMonthRightCalendar.weeks[0].days[0].date;
	$: canIncrementMonthRightCalendar = monthIndexRightCalendar < monthsRightCalendar.length - 1;
	$: canDecrementMonthRightCalendar = monthIndexRightCalendar > 0;
	$: wrapperStyle = `
	--button-background-color: ${buttonBackgroundColor};
	--button-border-color: ${buttonBorderColor};
	--button-text-color: ${buttonTextColor};
	--highlight-color: ${highlightColor};
	--day-background-color: ${dayBackgroundColor};
	--day-text-color: ${dayTextColor};
	--day-border-color: ${dayBorderColor};
	--day-highlighted-background-color: ${dayHighlightedBackgroundColor};
	--day-highlighted-text-color: ${dayHighlightedTextColor};
	--background-color: ${backgroundColor};
	--text-color: ${textColor};
	${style}
	`;
	$: {
		formattedSelected = formatDate(selectedLeftCalendar, format) + ' ' + '-' + ' ' + formatDate(selectedRightCalendar, format)
	}
</script>


<div class="datepicker" class:open="{isOpen}" class:closing="{isClosing}" style={wrapperStyle}>
	<!--Структура календаря определяется компонентом Popover-->
	<Popover
		bind:this="{popover}"
		bind:open="{isOpen}"
		bind:shrink="{isClosing}"
		{trigger}
		{alwaysOpen}
		on:opened="{registerOpen}"
		on:closed="{registerClose}"
	>
		<div slot="trigger">
			<slot
				{selectedLeftCalendar}
				{selectedRightCalendar}
				{formattedSelected}
			>
				{#if !trigger}
					<button class="calendar-button" type="button">
						{formattedSelected}
					</button>
				{/if}
			</slot>
		</div>
		<div slot="left-calendar">
			<div class="calendar">
				<!--Шапка формируется компонентом NavBar-->
				<NavBar
					month={monthLeftCalendar}
					year={yearLeftCalendar}
					selected={selectedLeftCalendar}
					selected2={selectedRightCalendar}
					canIncrementMonth={canIncrementMonthLeftCalendar}
					canDecrementMonth={canDecrementMonthLeftCalendar}
					start={startLeftCalendar}
					end={endLeftCalendar}
					{activeGroupOption}
					{monthsOfYear}
					on:monthSelected={e => changeMonth(e.detail, 'left')}
					on:yearSelected={e => changeYear(e.detail, 'left')}
					on:incrementMonth={e => incrementMonth(e.detail, 'left')}
				/>
				<div class="legend">
					{#each daysOfWeek as day}
						<span>{day[1]}</span>
					{/each}
				</div>
				<!--таблица с датами формируется компонентом Month-->
				<Month
					visibleMonth={visibleMonthLeftCalendar}
					selected={selectedLeftCalendar}
					selected2={selectedRightCalendar}
					highlighted={highlightedLeftCalendar}
					{shouldShakeDate}
					id={visibleMonthIdLeftCalendar}
					on:dateSelected={e => registerSelection(e.detail, 'left')}
				/>
			</div>
		</div>
		<div slot="right-calendar">
			<div class="calendar">
				<NavBar
					month={monthRightCalendar}
					year={yearRightCalendar}
					selected={selectedRightCalendar}
					selected2={selectedLeftCalendar}
					canIncrementMonth={canIncrementMonthRightCalendar}
					canDecrementMonth={canDecrementMonthRightCalendar}
					start={startRightCalendar}
					end={endRightCalendar}
					{activeGroupOption}
					{monthsOfYear}
					on:monthSelected={e => changeMonth(e.detail, 'right')}
					on:yearSelected={e => changeYear(e.detail, 'right')}
					on:incrementMonth={e => incrementMonth(e.detail, 'right')}
				/>
				<div class="legend">
					{#each daysOfWeek as day}
						<span>{day[1]}</span>
					{/each}
				</div>
				<Month
					visibleMonth={visibleMonthRightCalendar}
					selected={selectedRightCalendar}
					selected2="{selectedLeftCalendar}"
					highlighted={highlightedRightCalendar}
					{shouldShakeDate}
					id={visibleMonthIdRightCalendar}
					on:dateSelected={e => registerSelection(e.detail, 'right')}
				/>
			</div>
		</div>
		<div slot="group">
			<div class="col-md-3">Группировка на графиках</div>
			<div class="col-md-9">
				{#each groupOptions as option}
					<button
						class="btn-option"
						on:click="{() => {selectActiveGroupOption(option)}}"
						active={option === activeGroupOption}
					>
						{option.name}
					</button>
				{/each}
			</div>
		</div>
		<div slot="fast-filters">
			<div class="col-md-3">Быстрые фильтры</div>
			<div class="col-md-9">
				{#each fastFilters as option, i}
					<button
						on:click={() => {fastSelectDate(option.name)}}
						class="btn-link fast-link"
					>
						{option.name}
					</button>
				{/each}
			</div>
		</div>
		<div slot="apply">
			<button
				on:click={() => popover.close('apply')}
				class="btn-option"
				active=true
			>
				Применить
			</button>
		</div>
	</Popover>
</div>
<style>
	.fast-link {
		color: #2C97DE;
		margin: -5px;
	}

	.btn-option {
		border-radius: 6px;
		border: 1px solid white;
		height: 30px;
		margin: 3px;
	}

	.datepicker {
		display: inline-block;
		margin: auto;
		text-align: center;
		overflow: visible;
	}

	[active=true] {
		background: #2C97DE;
		color: white;
	}

	[active=false] {
		background: #f2f2f2;
		color: #7f7f7f
	}

	.calendar-button {
		padding: 10px 45px;
		border: 1px solid var(--button-border-color);
		display: block;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		background: var(--button-background-color);
		color: var(--button-text-color);
		box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.1);
		font-weight: bold;
		border-radius: 6px;
	}

	.calendar-button:hover {
		background: #1e81c4
	}

	.calendar-button:active {
		background: #1e81c4;
		color: #80c1eb;
	}

	*,
	*:before,
	*:after {
		box-sizing: inherit;
	}

	.calendar {
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
		user-select: none;
		width: 100vw;
		padding: 10px;
		padding-top: 0;
		background-color: var(--background-color);
		color: var(--text-color);
	}

	@media (min-width: 260px) {
		.calendar {
			height: auto;
			width: 260px;
			max-width: 100%;
		}
	}

	.legend {
		color: var(--text-color);
		margin-bottom: 3px;
		margin-left: -8%;
	}

	.legend span {
		width: 12%;
		display: inline-block;
		text-align: center;
	}
</style>
