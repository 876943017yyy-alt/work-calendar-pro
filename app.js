const STORAGE_KEY = 'schedule-ledger-v1';
const TAGS_STORAGE_KEY = 'schedule-ledger-tags-v1';
const CLIENTS_STORAGE_KEY = 'schedule-ledger-clients-v1';
const TRASH_STORAGE_KEY = 'schedule-ledger-trash-v1';
const OVERVIEW_STORAGE_KEY = 'schedule-ledger-overview-collapsed';
const OTHER_INCOME_STORAGE_KEY = 'schedule-ledger-other-income-v1';
const INCOME_TARGET_STORAGE_KEY = 'schedule-ledger-income-targets-v1';
const TEMPLATES_STORAGE_KEY = 'schedule-ledger-templates-v1';
const DEFAULT_TAGS = [
  { id: 'teaching', name: '家教', color: '#5f7f64' },
  { id: 'personal', name: '个人', color: '#7b6b9b' },
  { id: 'other', name: '其他', color: '#c28452' }
];
const money = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' });
const HOUR_HEIGHT = 48;
const SNAP_MINUTES = 15;
const TAG_COLORS = ['#4F6F52','#2F7D74','#238A8D','#2E75B6','#3D5A98','#4967A9','#5B5EA6','#6F58A8','#8C5AA8','#A64D79','#B84C65','#C0504D','#D05A4E','#D26A3A','#E0833A','#D6A329','#B69B2D','#7F8B4C','#6B8E5E','#4E8B7A','#527D8C','#65727A','#7A6F68','#8A6D5A'];
let weekInteraction = null;
let weekCreateInteraction = null;
let suppressWeekClickUntil = 0;
let monthClickTimer;
let selectedRepeatDates = new Set();
let repeatCalendarDate = new Date();
let copiedEvent = null;
let pasteMode = false;
let contextEventId = '';
let contextPasteTarget = null;
let activeEventId = '';
let monthDragEventId = '';
let dateNavigatorDate = new Date();
let weekWheelLocked = false;
let exportWeekDate = new Date();
let exportMode = 'client';
let exportPeriod = 'week';
let exportLayout = 'calendar';
let exportClientId = '';
let editingTagId = null;
let tagDeleteArmed = false;
let tagDeleteTimer;
let editingClientId = null;
let clientDeleteArmed = false;
let clientDeleteTimer;
let managerDeleteArmed = false;
let managerDeleteTimer;
let permanentTrashArmedId = null;
let permanentTrashTimer;
let selectedOtherIncomeTags = new Set();
let otherIncomeDeleteArmed = false;
let otherIncomeDeleteTimer;
let contributionTagFilter = '';
let otherIncomeTagFilter = '';
let statsBreakdownPeriod = 'month';
let statsPeriod = 'month';
let statsBreakdownType = 'tag';
let otherIncomeRepeatDates = new Set();
let otherIncomeCalendarDate = new Date();
let exportHideTitle = false;
let exportHideClient = false;

const state = {
  viewDate: new Date(),
  selectedDate: toDateKey(new Date()),
  viewMode: localStorage.getItem('schedule-ledger-view') || 'month',
  events: loadEvents(),
  draftEvent: null,
  tags: loadTags(),
  clients: loadClients(),
  trash: loadTrash(),
  otherIncome: loadOtherIncome(),
  incomeTargets: loadIncomeTargets(),
  templates: loadTemplates(),
  incomeYear: new Date().getFullYear(),
  incomeMonth: new Date().getMonth() + 1,
  activePage: 'calendar',
  overviewCollapsed: localStorage.getItem(OVERVIEW_STORAGE_KEY) === 'true',
  statsYear: fromDateKey(toDateKey(new Date())).getFullYear(),
  statsMonth: fromDateKey(toDateKey(new Date())).getMonth() + 1
};

const els = Object.fromEntries([
  'calendarGrid','monthTitle','selectedWeekday','selectedDate','eventList','dayIncome',
  'monthIncome','monthCount','monthHours','incomeTagChart','countTagChart','hoursTagChart','incomeTagCaption','countTagCaption','hoursTagCaption','incomeTargetCaption','incomeTargetProgress','setIncomeTarget','incomeTargetPopover','incomeTargetInput','cancelIncomeTarget','saveIncomeTarget','sidebarEditor','dayOverview',
  'eventForm','eventId','eventTitle','eventDate','eventStart','eventEnd','eventDuration','eventStartPicker','eventStartButton','eventStartText','eventStartMenu','eventEndPicker','eventEndButton','eventEndText','eventEndMenu','eventTemplate','saveEventTemplate','deleteEventTemplate',
  'eventIncome','eventClient','eventNote','eventTag','newTagEditor','newTagName','newTagColor','customTagColor','customColorValue',
  'tagPicker','tagPickerButton','selectedTagList','tagMenu','tagColorPalette','saveTagBtn','deleteTagBtn','tagEditorHint',
  'clientPicker','clientPickerButton','selectedClientAvatar','selectedClientName','clientMenu','clientEditor','clientNameInput','saveClientBtn','deleteClientBtn','clientEditorHint',
  'eventRepeat','eventRepeatPicker','eventRepeatButton','eventRepeatText','eventRepeatMenu','repeatEditor','repeatCustom','repeatUseFrequency','repeatFrequencyFields','repeatInterval','repeatUnit','repeatUntil','repeatCalendarPrev','repeatCalendarNext','repeatCalendarTitle','repeatCalendar','repeatDatesInput','repeatDatesHint','contributionPeriod','contributionTitle','contributionTagFilters','contributionTotal','contributionMonths','contributionGraph',
  'dialogTitle','dialogEyebrow','deleteBtn','deletePopover','autosaveStatus','nlPanel','nlInput','toast',
  'menuBtn','overviewToggle','todayBtn','dateNavigator','dateNavigatorPrev','dateNavigatorNext','dateNavigatorTitle','dateNavigatorGrid','dateNavigatorToday','weekScrubberWrap','weekPrevButton','weekNextButton','summarySection','calendarPage','managementPage','managementEyebrow','managementTitle','backToCalendar','exportWeekBtn','weekExportPage','backFromExport','exportWeekPrev','exportWeekNext','exportWeekTitle','exportClientRow','exportClientChoices','exportSheet','copyWeekExport','printWeekExport','exportHideTitle','exportHideClient','homeOtherIncomeList','viewOtherIncome','addHomeOtherIncome',
  'sideDrawer','drawerScrim','closeDrawer','trashBadge','statsView','tagsView','clientsView','otherIncomeView','trashView','statsYear','statsMonth','incomeYear','incomeMonth',
  'statsMonthIncome','statsMonthPaidCount','statsMonthHours','statsBreakdown','breakdownTitle','statsRangeStart','statsRangeEnd','statsPrimaryLabel','statsTargetLabel','statsPeriodTarget','statsScheduleCountLabel','statsScheduleCount','statsPrimaryHoursLabel','statsClientsLabel','statsClientCount','contributionMultiYear','contributionScroll',
  'managerTagList','managerClientList','trashList','managerEditor','managerEditorEyebrow','managerEditorTitle','managerEntityId','managerEntityType','managerEntityName','otherIncomeTotal','otherIncomeList','addOtherIncome','incomeEditor','incomeEditorEyebrow','incomeEditorTitle','otherIncomeId','otherIncomeName','otherIncomeDate','otherIncomeAmount','otherIncomeTagChoices','newOtherIncomeTag','otherIncomeNote','otherIncomeRepeat','otherIncomeRepeatUntil','otherIncomeRepeatUntilField','otherIncomeCustomDatesField','otherIncomeCalendarPrev','otherIncomeCalendarNext','otherIncomeCalendarTitle','otherIncomeCalendar','deleteOtherIncome','cancelOtherIncome','saveOtherIncome',
  'managerColorArea','managerColorPalette','managerCustomColor','managerColorValue','managerDeleteEntity','managerCancelEdit','managerSaveEntity','managerAddTag','managerAddClient',
  'calendarContextMenu','contextCopy','contextDelete','contextPaste','contextCancelPaste'
].map(id => [id, document.getElementById(id)]));

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function loadTags() {
  try {
    const saved = JSON.parse(localStorage.getItem(TAGS_STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_TAGS.map(tag => ({ ...tag }));
  } catch { return DEFAULT_TAGS.map(tag => ({ ...tag })); }
}

function saveTags() { localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(state.tags)); }

function loadClients() {
  try {
    const saved = JSON.parse(localStorage.getItem(CLIENTS_STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function saveClients() { localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(state.clients)); }

function loadTrash() {
  try {
    const saved = JSON.parse(localStorage.getItem(TRASH_STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function saveTrash() { localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(state.trash)); }

function loadOtherIncome() {
  try {
    const saved = JSON.parse(localStorage.getItem(OTHER_INCOME_STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function saveOtherIncome() { localStorage.setItem(OTHER_INCOME_STORAGE_KEY, JSON.stringify(state.otherIncome)); }

function loadIncomeTargets() {
  try {
    const saved = JSON.parse(localStorage.getItem(INCOME_TARGET_STORAGE_KEY));
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}

function saveIncomeTargets() { localStorage.setItem(INCOME_TARGET_STORAGE_KEY, JSON.stringify(state.incomeTargets)); }

function loadTemplates() {
  try { const saved = JSON.parse(localStorage.getItem(TEMPLATES_STORAGE_KEY)); return Array.isArray(saved) ? saved : []; }
  catch { return []; }
}
function saveTemplates() { localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(state.templates)); }
function renderOtherIncomeCalendar() {
  const d = otherIncomeCalendarDate; const first = new Date(d.getFullYear(), d.getMonth(), 1); const offset = (first.getDay()+6)%7; const days = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  els.otherIncomeCalendarTitle.textContent = `${d.getFullYear()}年${d.getMonth()+1}月`;
  let html = ''; for (let i=0;i<offset;i++) html += '<button class="outside" type="button" disabled></button>';
  for (let day=1;day<=days;day++) { const key = toDateKey(new Date(d.getFullYear(),d.getMonth(),day)); html += `<button type="button" class="${otherIncomeRepeatDates.has(key)?'selected':''}" data-other-income-date="${key}">${day}</button>`; }
  els.otherIncomeCalendar.innerHTML = html;
}
function renderEventTemplates(selected = '') {
  if (!els.eventTemplate) return;
  els.eventTemplate.innerHTML = '<option value="">不使用模板</option>' + state.templates.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');
  els.eventTemplate.value = selected || '';
  els.deleteEventTemplate.classList.toggle('hidden', !selected);
}
function applyEventTemplate(id) {
  const t = state.templates.find(item => item.id === id); if (!t) return;
  els.eventTitle.value = t.title || '';
  els.eventDuration.value = t.duration ?? .5;
  els.eventIncome.value = t.income ?? 0;
  els.eventNote.value = t.note || '';
  setWorkMode(t.workMode || 'online');
  renderTagOptions(t.tagIds || []); renderClientOptions(t.clientId || '');
  els.eventTemplate.value = id; els.deleteEventTemplate.classList.remove('hidden');
  autoSaveFromEditor();
}
function saveCurrentEventTemplate() {
  const values = readEditorValues('template');
  const name = values.title || '未命名模板';
  const item = { id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `tpl-${Date.now()}`, name, title: values.title, duration: values.duration, income: values.income, note: values.note, tagIds: values.tagIds, clientId: values.clientId, workMode: values.workMode };
  state.templates.push(item); saveTemplates(); renderEventTemplates(item.id); showToast('日程模板已保存');
}
function deleteEventTemplate() {
  const id = els.eventTemplate.value; if (!id) return;
  state.templates = state.templates.filter(t => t.id !== id); saveTemplates(); renderEventTemplates(); showToast('模板已删除');
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
}

function escapeHtml(value = '') {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function getTag(tagId) { return state.tags.find(tag => tag.id === tagId); }
function getClient(clientId) { return state.clients.find(client => client.id === clientId); }
function tagStyle(tag) { return tag ? `--tag-color:${tag.color};` : ''; }
function getEventTagIds(event = {}) {
  const ids = Array.isArray(event.tagIds) ? event.tagIds : (event.tagId ? [event.tagId] : []);
  return [...new Set(ids)].filter(id => Boolean(getTag(id)));
}
function getEventTags(event = {}) { return getEventTagIds(event).map(getTag).filter(Boolean); }
function getPrimaryTag(event = {}) { return getEventTags(event)[0] || null; }
function eventClientName(event = {}) { return event.client || getClient(event.clientId)?.name || ''; }
function eventPriceLabel(event = {}) {
  const income = Number(event.income || 0);
  return income > 0 ? `¥${formatNumber(income)}` : '';
}
function eventWorkMode(event = {}) { return event.workMode === 'offline' ? 'offline' : 'online'; }
function parseSelectedTagIds(value = els.eventTag?.value || '') {
  return [...new Set(String(value).split(',').filter(id => Boolean(getTag(id))))];
}
function removeTagFromEvent(event, tagId) {
  const ids = getEventTagIds(event).filter(id => id !== tagId);
  event.tagIds = ids;
  event.tagId = ids[0] || '';
}

function render() {
  renderCalendar();
  renderSelectedDay();
  renderSummary();
  renderContributionGraph();
  applyOverviewState();
  renderTrashBadge();
  if (state.activePage !== 'calendar') renderManagementPage();
}

function renderCalendar() {
  if (state.viewMode === 'week') {
    renderWeekCalendar();
    return;
  }
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  els.monthTitle.textContent = `${year}年 ${month + 1}月`;
  updateViewControls();
  els.calendarGrid.innerHTML = '';

  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);
  const todayKey = toDateKey(new Date());

  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = toDateKey(date);
    const dayEvents = eventsForDate(key);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = `calendar-day${date.getMonth() !== month ? ' outside' : ''}${key === state.selectedDate ? ' selected' : ''}${key === todayKey ? ' today' : ''}`;
    cell.dataset.date = key;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `${month + 1}月${date.getDate()}日，${dayEvents.length}项日程`);
    cell.innerHTML = `<span class="day-number">${date.getDate()}</span>` +
      dayEvents.slice(0, 2).map(event => {
        const tag = getPrimaryTag(event);
        const clientName = eventClientName(event);
        const price = eventPriceLabel(event);
        return `<span class="event-chip${event.id === '__draft__' ? ' draft' : ''}${tag ? ' has-tag' : ''}${price ? ' has-income' : ''}" data-id="${event.id}" draggable="${event.id !== '__draft__'}" style="${tagStyle(tag)}"><span class="event-chip-label">${escapeHtml(event.start)} ${escapeHtml(event.title)}${clientName ? ` · ${escapeHtml(clientName)}` : ''}</span>${price ? `<b class="event-chip-price">${price}</b>` : ''}</span>`;
      }).join('') +
      (dayEvents.length > 2 ? `<span class="more-events">还有 ${dayEvents.length - 2} 项</span>` : '');
    cell.addEventListener('click', () => {
      clearTimeout(monthClickTimer);
      if (pasteMode && copiedEvent) {
        pasteMode = false;
        suppressWeekClickUntil = Date.now() + 500;
        pasteCopiedEvent({ date: key, start: copiedEvent.start });
        return;
      }
      if (date.getMonth() === month) selectDate(key);
      else monthClickTimer = setTimeout(() => selectDate(key), 400);
    });
    cell.addEventListener('dblclick', () => {
      if (Date.now() < suppressWeekClickUntil) return;
      clearTimeout(monthClickTimer);
      state.selectedDate = key;
      const selected = fromDateKey(key);
      state.viewDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
      setViewMode('week');
    });
    cell.addEventListener('contextmenu', e => openMonthContextMenu(e, key));
    cell.addEventListener('dragover', e => { if (monthDragEventId) { e.preventDefault(); cell.classList.add('drag-target'); } });
    cell.addEventListener('dragleave', () => cell.classList.remove('drag-target'));
    cell.addEventListener('drop', e => dropMonthEvent(e, key));
    cell.querySelectorAll('.event-chip[draggable="true"]').forEach(chip => {
      chip.addEventListener('click', e => { e.stopPropagation(); openEdit(chip.dataset.id); });
      chip.addEventListener('dragstart', e => { monthDragEventId = chip.dataset.id; activeEventId = chip.dataset.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', chip.dataset.id); });
      chip.addEventListener('dragend', () => { monthDragEventId = ''; document.querySelectorAll('.calendar-day.drag-target').forEach(day => day.classList.remove('drag-target')); });
    });
    els.calendarGrid.appendChild(cell);
  }
}

function renderWeekCalendar() {
  const anchor = fromDateKey(state.selectedDate);
  const offset = (anchor.getDay() + 6) % 7;
  const weekStart = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - offset);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  els.monthTitle.textContent = sameYear
    ? `${weekStart.getFullYear()}年 ${weekStart.getMonth() + 1}月${weekStart.getDate()}日—${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
    : `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日—${weekEnd.getFullYear()}年${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
  updateViewControls();
  els.calendarGrid.innerHTML = '';
  const todayKey = toDateKey(new Date());
  const weekdayNames = ['一', '二', '三', '四', '五', '六', '日'];
  const weekdayEl = document.getElementById('weekdays');
  weekdayEl.innerHTML = '<span class="time-heading">时间</span>' + weekdayNames.map((name, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
    return `<span class="${toDateKey(date) === todayKey ? 'today-label' : ''}">周${name} · ${date.getMonth() + 1}/${date.getDate()}</span>`;
  }).join('');

  const timeAxis = document.createElement('div');
  timeAxis.className = 'time-axis';
  timeAxis.setAttribute('aria-hidden', 'true');
  timeAxis.innerHTML = Array.from({ length: 24 }, (_, hour) =>
    `<div class="time-slot"><span>${String(hour).padStart(2, '0')}:00</span></div>`
  ).join('');
  els.calendarGrid.appendChild(timeAxis);

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    const key = toDateKey(date);
    const dayEvents = eventsForDate(key);
    const overlapLayout = computeOverlapLayout(dayEvents);
    const cell = document.createElement('div');
    cell.className = `week-day-column${key === state.selectedDate ? ' selected' : ''}${key === todayKey ? ' today' : ''}`;
    cell.dataset.date = key;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `${date.getMonth() + 1}月${date.getDate()}日，${dayEvents.length}项日程`);
    cell.innerHTML = dayEvents.map(event => {
      const [hour, minute] = event.start.split(':').map(Number);
      const top = (hour * 60 + minute) * HOUR_HEIGHT / 60;
      const height = Math.min(24 * HOUR_HEIGHT - top, Math.max(25, Number(event.duration) * HOUR_HEIGHT));
      const layout = overlapLayout.get(event.id) || { lane: 0, lanes: 1 };
      const indent = Math.min(layout.lane, 7) * 10;
      const tag = getPrimaryTag(event);
      const clientName = eventClientName(event);
      const price = eventPriceLabel(event);
      return `<button type="button" class="week-event${event.id === '__draft__' ? ' draft' : ''}${layout.lanes > 1 ? ' overlapping' : ''}${tag ? ' has-tag' : ''}${price ? ' has-income' : ''}" data-id="${event.id}" style="${tagStyle(tag)}top:${top}px;height:${height}px;left:${3 + indent}px;right:auto;width:calc(100% - ${6 + indent}px);z-index:${2 + layout.lane}" aria-label="${escapeHtml(event.start)} 的日程${price ? `，收入${price}` : ''}">
        <strong>${escapeHtml(event.title)}</strong>${price ? `<b class="week-event-price">${price}</b>` : ''}<small>${escapeHtml(event.start)} · ${formatDuration(event.duration)}${clientName ? ` · ${escapeHtml(clientName)}` : ''}</small><span class="resize-handle" aria-label="拖动调整时长"></span>
      </button>`;
    }).join('');
    if (key === todayKey) {
      const now = new Date();
      const currentTop = (now.getHours() * 60 + now.getMinutes()) * HOUR_HEIGHT / 60;
      cell.insertAdjacentHTML('beforeend', `<span class="current-time-line" style="top:${currentTop}px" aria-hidden="true"></span>`);
    }
    cell.addEventListener('click', e => createFromWeekGrid(e, key, cell));
    cell.addEventListener('pointerdown', e => startWeekCreateSelection(e, key, cell));
    cell.addEventListener('contextmenu', e => openWeekContextMenu(e, key, cell));
    cell.addEventListener('keydown', e => { if (e.key === 'Enter') openCreate(key); });
    cell.querySelectorAll('.week-event').forEach(button => {
      button.addEventListener('click', e => { e.stopPropagation(); button.dataset.id === '__draft__' ? showSidebarEditor() : openEdit(button.dataset.id); });
      button.addEventListener('pointerdown', startMoveEvent);
      button.querySelector('.resize-handle').addEventListener('pointerdown', startResizeEvent);
    });
    els.calendarGrid.appendChild(cell);
  }

  requestAnimationFrame(() => {
    const scroll = document.getElementById('calendarScroll');
    const selectedEvents = eventsForDate(state.selectedDate);
    const firstHour = selectedEvents.length ? Number(selectedEvents[0].start.split(':')[0]) : 8;
    scroll.scrollTop = Math.max(0, (firstHour - 1) * HOUR_HEIGHT);
  });
}

function computeOverlapLayout(events) {
  const result = new Map();
  const items = events.map(event => ({
    event,
    start: timeToMinutes(event.start),
    end: Math.min(24 * 60, timeToMinutes(event.start) + Number(event.duration) * 60)
  })).sort((a, b) => a.start - b.start || b.end - a.end);
  const groups = [];
  let group = [];
  let groupEnd = -1;
  items.forEach(item => {
    if (group.length && item.start >= groupEnd) {
      groups.push(group);
      group = [];
      groupEnd = -1;
    }
    group.push(item);
    groupEnd = Math.max(groupEnd, item.end);
  });
  if (group.length) groups.push(group);

  groups.forEach(cluster => {
    const laneEnds = [];
    cluster.forEach(item => {
      let lane = laneEnds.findIndex(end => end <= item.start);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = item.end;
      item.lane = lane;
    });
    const lanes = laneEnds.length;
    cluster.forEach(item => result.set(item.event.id, { lane: item.lane, lanes }));
  });
  return result;
}

function createFromWeekGrid(e, dateKey, column) {
  if (e.target.closest('.week-event') || weekInteraction || weekCreateInteraction || Date.now() < suppressWeekClickUntil) return;
  if (state.draftEvent) {
    state.draftEvent = null;
    state.selectedDate = dateKey;
    hideSidebarEditor();
    renderPreservingPosition();
    showToast('未修改的新日程已撤销');
    return;
  }
  const rect = column.getBoundingClientRect();
  const rawMinutes = (e.clientY - rect.top) / HOUR_HEIGHT * 60;
  const minutes = clamp(snapMinutes(rawMinutes), 0, 24 * 60 - SNAP_MINUTES);
  contextPasteTarget = { date: dateKey, start: minutesToTime(minutes) };
  if (pasteMode && copiedEvent) {
    pasteMode = false;
    pasteCopiedEvent(contextPasteTarget);
    return;
  }
  const duration = Math.min(.5, (24 * 60 - minutes) / 60);
  state.selectedDate = dateKey;
  openCreate(dateKey, { start: minutesToTime(minutes), duration, preserveScroll: true });
}

function startWeekCreateSelection(e, dateKey, column) {
  if (e.button !== 0 || e.target.closest('.week-event') || state.draftEvent || weekInteraction || weekCreateInteraction) return;
  const rect = column.getBoundingClientRect();
  const startMinutes = clamp(snapMinutes((e.clientY - rect.top) / HOUR_HEIGHT * 60), 0, 24 * 60 - SNAP_MINUTES);
  weekCreateInteraction = {
    pointerId: e.pointerId, pointerTarget: column, column, dateKey,
    startX: e.clientX, startY: e.clientY, startMinutes, currentMinutes: startMinutes,
    active: false, preview: null,
    timer: setTimeout(() => activateWeekCreateSelection(), 300)
  };
  column.setPointerCapture(e.pointerId);
  column.addEventListener('pointermove', moveWeekCreateSelection);
  column.addEventListener('pointerup', finishWeekCreateSelection);
  column.addEventListener('pointercancel', cancelWeekCreateSelection);
}

function activateWeekCreateSelection() {
  const action = weekCreateInteraction;
  if (!action || action.active) return;
  pasteMode = false;
  action.active = true;
  action.preview = document.createElement('div');
  action.preview.className = 'week-create-preview';
  action.preview.innerHTML = '<strong>新日程</strong><small>拖动选择时间段</small>';
  action.column.appendChild(action.preview);
  document.body.classList.add('selecting-time');
  updateWeekCreatePreview(action.startMinutes);
}

function moveWeekCreateSelection(e) {
  const action = weekCreateInteraction;
  if (!action || e.pointerId !== action.pointerId) return;
  if (!action.active) {
    if (Math.hypot(e.clientX - action.startX, e.clientY - action.startY) > 10) cancelWeekCreateSelection(e);
    return;
  }
  autoScrollWeek(e.clientY, e.clientX);
  const rect = action.column.getBoundingClientRect();
  action.currentMinutes = clamp(snapMinutes((e.clientY - rect.top) / HOUR_HEIGHT * 60), 0, 24 * 60 - SNAP_MINUTES);
  updateWeekCreatePreview(action.currentMinutes);
}

function updateWeekCreatePreview(pointerMinutes) {
  const action = weekCreateInteraction;
  if (!action?.preview) return;
  let start = Math.min(action.startMinutes, pointerMinutes);
  let end = Math.max(action.startMinutes, pointerMinutes);
  if (end === start) end = Math.min(24 * 60, start + 30);
  start = Math.min(start, end - SNAP_MINUTES);
  action.selectionStart = start;
  action.selectionEnd = end;
  action.preview.style.top = `${start / 60 * HOUR_HEIGHT}px`;
  action.preview.style.height = `${Math.max(25, (end - start) / 60 * HOUR_HEIGHT)}px`;
  action.preview.querySelector('small').textContent = `${minutesToTime(start)}–${end === 24 * 60 ? '24:00' : minutesToTime(end)}`;
}

function finishWeekCreateSelection(e) {
  const action = weekCreateInteraction;
  if (!action || e.pointerId !== action.pointerId) return;
  const active = action.active;
  const dateKey = action.dateKey;
  const start = action.selectionStart;
  const end = action.selectionEnd;
  cleanupWeekCreateSelection();
  if (!active) return;
  suppressWeekClickUntil = Date.now() + 400;
  state.selectedDate = dateKey;
  openCreate(dateKey, { start: minutesToTime(start), duration: Math.max(.25, (end - start) / 60), preserveScroll: true });
}

function cancelWeekCreateSelection(e) {
  if (e && weekCreateInteraction && e.pointerId !== weekCreateInteraction.pointerId) return;
  cleanupWeekCreateSelection();
}

function cleanupWeekCreateSelection() {
  const action = weekCreateInteraction;
  if (!action) return;
  clearTimeout(action.timer);
  action.pointerTarget?.removeEventListener('pointermove', moveWeekCreateSelection);
  action.pointerTarget?.removeEventListener('pointerup', finishWeekCreateSelection);
  action.pointerTarget?.removeEventListener('pointercancel', cancelWeekCreateSelection);
  action.preview?.remove();
  document.body.classList.remove('selecting-time');
  weekCreateInteraction = null;
}

function openWeekContextMenu(e, dateKey, column) {
  e.preventDefault();
  const eventButton = e.target.closest('.week-event');
  const rect = column.getBoundingClientRect();
  const minutes = clamp(snapMinutes((e.clientY - rect.top) / HOUR_HEIGHT * 60), 0, 24 * 60 - SNAP_MINUTES);
  contextEventId = eventButton?.dataset.id && eventButton.dataset.id !== '__draft__' ? eventButton.dataset.id : '';
  contextPasteTarget = { date: dateKey, start: minutesToTime(minutes) };
  showCalendarContextMenu(e.clientX, e.clientY);
}

function openMonthContextMenu(e, dateKey) {
  e.preventDefault();
  const chip = e.target.closest('.event-chip');
  contextEventId = chip?.dataset.id && chip.dataset.id !== '__draft__' ? chip.dataset.id : '';
  contextPasteTarget = { date: dateKey, start: copiedEvent?.start || '09:00' };
  showCalendarContextMenu(e.clientX, e.clientY);
}

function showCalendarContextMenu(x, y) {
  if (contextEventId) activeEventId = contextEventId;
  els.contextCopy.classList.toggle('hidden', !contextEventId);
  els.contextDelete.classList.toggle('hidden', !contextEventId);
  els.contextPaste.classList.toggle('hidden', !copiedEvent);
  els.contextCancelPaste.classList.toggle('hidden', !pasteMode);
  if (!contextEventId && !copiedEvent && !pasteMode) return;
  els.calendarContextMenu.classList.remove('hidden');
  const width = 220;
  const height = els.calendarContextMenu.offsetHeight || 120;
  els.calendarContextMenu.style.left = `${Math.min(x, window.innerWidth - width - 8)}px`;
  els.calendarContextMenu.style.top = `${Math.min(y, window.innerHeight - height - 8)}px`;
}

function hideCalendarContextMenu() {
  els.calendarContextMenu.classList.add('hidden');
  contextEventId = '';
}

function copyEvent(id) {
  const event = state.events.find(item => item.id === id);
  if (!event) return;
  copiedEvent = { ...event, recurrence: null };
  delete copiedEvent.id;
  delete copiedEvent.seriesId;
  activeEventId = id;
  contextPasteTarget = { date: event.date, start: event.start };
  pasteMode = true;
  hideCalendarContextMenu();
  showToast('已复制日程，点击空白处或按 Ctrl+V 粘贴');
}

function pasteCopiedEvent(target = {}) {
  if (!copiedEvent) return;
  const date = target.date || state.selectedDate;
  const requestedStart = target.start || copiedEvent.start || '09:00';
  const maxStart = Math.max(0, 24 * 60 - Math.max(SNAP_MINUTES, Number(copiedEvent.duration || .5) * 60));
  const start = minutesToTime(clamp(timeToMinutes(requestedStart), 0, maxStart));
  const event = {
    ...copiedEvent,
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `copy-${Date.now()}-${Math.random()}`,
    date,
    start,
    recurrence: null
  };
  state.events.push(event);
  state.selectedDate = date;
  activeEventId = event.id;
  saveEvents();
  renderPreservingPosition();
  hideCalendarContextMenu();
  showToast(`已粘贴到 ${date} ${start}`);
}

function renderPreservingPosition() {
  const scroll = document.getElementById('calendarScroll');
  const position = { top: scroll.scrollTop, left: scroll.scrollLeft, pageY: window.scrollY };
  render();
  requestAnimationFrame(() => {
    scroll.scrollTop = position.top;
    scroll.scrollLeft = position.left;
    window.scrollTo(0, position.pageY);
  });
}

function dropMonthEvent(e, dateKey) {
  if (!monthDragEventId) return;
  e.preventDefault();
  const event = state.events.find(item => item.id === monthDragEventId);
  monthDragEventId = '';
  document.querySelectorAll('.calendar-day.drag-target').forEach(day => day.classList.remove('drag-target'));
  if (!event || event.date === dateKey) return;
  event.date = dateKey;
  state.selectedDate = dateKey;
  syncRecurrenceSeries(event);
  saveEvents();
  render();
  showToast(`已移动到 ${dateKey}`);
}

function getEventById(id) {
  return id === '__draft__' ? state.draftEvent : state.events.find(item => item.id === id);
}

function startMoveEvent(e) {
  if (e.button !== 0 || e.target.closest('.resize-handle')) return;
  e.preventDefault();
  e.stopPropagation();
  const button = e.currentTarget;
  const event = getEventById(button.dataset.id);
  if (!event) return;
  const rect = button.getBoundingClientRect();
  weekInteraction = {
    mode: 'move', pointerId: e.pointerId, button, event,
    pointerTarget: button,
    startX: e.clientX, startY: e.clientY, grabOffsetY: e.clientY - rect.top,
    moved: false, targetDate: event.date, targetMinutes: timeToMinutes(event.start), ghost: null
  };
  button.setPointerCapture(e.pointerId);
  button.addEventListener('pointermove', moveWeekEvent);
  button.addEventListener('pointerup', finishWeekInteraction);
  button.addEventListener('pointercancel', cancelWeekInteraction);
}

function moveWeekEvent(e) {
  const action = weekInteraction;
  if (!action || action.mode !== 'move') return;
  if (!action.moved && Math.hypot(e.clientX - action.startX, e.clientY - action.startY) < 5) return;
  if (!action.moved) {
    action.moved = true;
    action.button.classList.add('drag-source');
    action.ghost = action.button.cloneNode(true);
    action.ghost.classList.add('drag-ghost');
    action.ghost.querySelector('.resize-handle')?.remove();
    document.body.appendChild(action.ghost);
    document.body.classList.add('dragging-event');
  }
  autoScrollWeek(e.clientY, e.clientX);
  const column = document.elementsFromPoint(e.clientX, e.clientY)
    .map(el => el.closest?.('.week-day-column')).find(Boolean);
  if (!column) return;
  document.querySelectorAll('.week-day-column.drag-target').forEach(el => el.classList.remove('drag-target'));
  column.classList.add('drag-target');
  const columnRect = column.getBoundingClientRect();
  const durationMinutes = Number(action.event.duration) * 60;
  const rawMinutes = (e.clientY - columnRect.top - action.grabOffsetY) / HOUR_HEIGHT * 60;
  action.targetMinutes = clamp(snapMinutes(rawMinutes), 0, 24 * 60 - durationMinutes);
  action.targetDate = column.dataset.date;
  const top = columnRect.top + action.targetMinutes / 60 * HOUR_HEIGHT;
  Object.assign(action.ghost.style, {
    position: 'fixed', left: `${columnRect.left + 4}px`, top: `${top}px`,
    width: `${columnRect.width - 8}px`, height: `${Math.max(25, Number(action.event.duration) * HOUR_HEIGHT)}px`
  });
  const small = action.ghost.querySelector('small');
  if (small) small.textContent = `${minutesToTime(action.targetMinutes)} · ${formatDuration(action.event.duration)}${eventClientName(action.event) ? ` · ${eventClientName(action.event)}` : ''}`;
}

function startResizeEvent(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  const button = e.currentTarget.closest('.week-event');
  const event = getEventById(button.dataset.id);
  if (!event) return;
  weekInteraction = {
    mode: 'resize', pointerId: e.pointerId, button, event,
    pointerTarget: e.currentTarget,
    startY: e.clientY, startScrollTop: document.getElementById('calendarScroll').scrollTop,
    originalDuration: Number(event.duration), newDuration: Number(event.duration), moved: false
  };
  e.currentTarget.setPointerCapture(e.pointerId);
  e.currentTarget.addEventListener('pointermove', resizeWeekEvent);
  e.currentTarget.addEventListener('pointerup', finishWeekInteraction);
  e.currentTarget.addEventListener('pointercancel', cancelWeekInteraction);
  button.classList.add('resizing');
}

function resizeWeekEvent(e) {
  const action = weekInteraction;
  if (!action || action.mode !== 'resize') return;
  autoScrollWeek(e.clientY, e.clientX);
  const scrollDelta = document.getElementById('calendarScroll').scrollTop - action.startScrollTop;
  const deltaMinutes = snapMinutes((e.clientY - action.startY + scrollDelta) / HOUR_HEIGHT * 60);
  const startMinutes = timeToMinutes(action.event.start);
  const maxDuration = (24 * 60 - startMinutes) / 60;
  action.newDuration = clamp(action.originalDuration + deltaMinutes / 60, .25, maxDuration);
  action.moved = Math.abs(e.clientY - action.startY) >= 3;
  action.button.style.height = `${Math.max(25, action.newDuration * HOUR_HEIGHT)}px`;
  const small = action.button.querySelector('small');
  if (small) small.textContent = `${action.event.start} · ${formatDuration(action.newDuration)}${eventClientName(action.event) ? ` · ${eventClientName(action.event)}` : ''}`;
}

function finishWeekInteraction(e) {
  const action = weekInteraction;
  if (!action || e.pointerId !== action.pointerId) return;
  if (action.moved) {
    if (action.mode === 'move') {
      action.event.date = action.targetDate;
      action.event.start = minutesToTime(action.targetMinutes);
      state.selectedDate = action.targetDate;
      const movedDate = fromDateKey(action.targetDate);
      state.viewDate = new Date(movedDate.getFullYear(), movedDate.getMonth(), 1);
      showToast(`已移至 ${action.event.start}`);
    } else {
      action.event.duration = action.newDuration;
      showToast(`时长已调整为 ${formatDuration(action.newDuration)}`);
    }
    if (action.event.id === '__draft__') {
      els.eventDate.value = action.event.date;
      els.eventStart.value = action.event.start;
      els.eventDuration.value = action.event.duration;
      els.eventEnd.value = endTimeFromStartDuration(action.event.start, action.event.duration);
      promoteDraftToSaved();
      setAutosaveStatus('已自动保存', 'saved');
    } else {
      if (els.eventId.value === action.event.id) {
        els.eventDate.value = action.event.date;
        els.eventStart.value = action.event.start;
        els.eventDuration.value = action.event.duration;
        els.eventEnd.value = endTimeFromStartDuration(action.event.start, action.event.duration);
        setAutosaveStatus('已自动保存', 'saved');
      }
      syncRecurrenceSeries(action.event);
      saveEvents();
    }
  }
  cleanupWeekInteraction();
  if (action.moved) render();
}

function cancelWeekInteraction() {
  cleanupWeekInteraction();
  render();
}

function cleanupWeekInteraction() {
  if (!weekInteraction) return;
  suppressWeekClickUntil = weekInteraction.moved ? Date.now() + 350 : suppressWeekClickUntil;
  const target = weekInteraction.pointerTarget;
  target?.removeEventListener('pointermove', moveWeekEvent);
  target?.removeEventListener('pointermove', resizeWeekEvent);
  target?.removeEventListener('pointerup', finishWeekInteraction);
  target?.removeEventListener('pointercancel', cancelWeekInteraction);
  weekInteraction.ghost?.remove();
  weekInteraction.button?.classList.remove('drag-source', 'resizing');
  document.body.classList.remove('dragging-event');
  document.querySelectorAll('.week-day-column.drag-target').forEach(el => el.classList.remove('drag-target'));
  weekInteraction = null;
}

function autoScrollWeek(pointerY, pointerX) {
  const scroll = document.getElementById('calendarScroll');
  const rect = scroll.getBoundingClientRect();
  if (pointerY < rect.top + 70) scroll.scrollTop -= 18;
  else if (pointerY > rect.bottom - 45) scroll.scrollTop += 18;
  if (pointerX < rect.left + 78) scroll.scrollLeft -= 18;
  else if (pointerX > rect.right - 35) scroll.scrollLeft += 18;
}

function snapMinutes(value) { return Math.round(value / SNAP_MINUTES) * SNAP_MINUTES; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function timeToMinutes(time) { const [h, m] = time.split(':').map(Number); return h * 60 + m; }
function minutesToTime(minutes) {
  const safe = clamp(Math.round(minutes), 0, 24 * 60 - 1);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function endTimeFromStartDuration(start, duration) {
  const minutes = (timeToMinutes(start) + Math.round(Number(duration) * 60)) % (24 * 60);
  return minutesToTime(minutes);
}

function syncTimeFields(source) {
  if (source === 'end') {
    const start = timeToMinutes(els.eventStart.value || '00:00');
    const end = timeToMinutes(els.eventEnd.value || '00:00');
    let delta = end - start;
    if (delta <= 0) delta = end === 0 && start > 0 ? 24 * 60 - start : SNAP_MINUTES;
    els.eventDuration.value = formatNumber(Math.max(.25, delta / 60));
  } else {
    els.eventEnd.value = endTimeFromStartDuration(els.eventStart.value || '00:00', Number(els.eventDuration.value) || .5);
  }
  syncUnifiedPickerDisplays();
}

const REPEAT_PICKER_OPTIONS = [
  ['none', '不重复'], ['daily', '每天'], ['weekly', '每周'],
  ['monthly', '每月'], ['yearly', '每年'], ['custom', '自定义…']
];

function syncUnifiedPickerDisplays() {
  if (els.eventStartText) els.eventStartText.textContent = els.eventStart.value || '00:00';
  if (els.eventEndText) els.eventEndText.textContent = els.eventEnd.value || '00:00';
  if (els.eventRepeatText) els.eventRepeatText.textContent = REPEAT_PICKER_OPTIONS.find(item => item[0] === els.eventRepeat.value)?.[1] || '不重复';
}

function closeUnifiedPickers(except = '') {
  ['Start', 'End', 'Repeat'].forEach(name => {
    if (name === except) return;
    els[`event${name}Picker`].classList.remove('open');
    els[`event${name}Menu`].classList.add('hidden');
    els[`event${name}Button`].setAttribute('aria-expanded', 'false');
  });
}

function toggleUnifiedPicker(name) {
  const picker = els[`event${name}Picker`];
  const opening = els[`event${name}Menu`].classList.contains('hidden');
  if (opening) renderUnifiedPickerMenus();
  closeUnifiedPickers(opening ? name : '');
  picker.classList.toggle('open', opening);
  els[`event${name}Menu`].classList.toggle('hidden', !opening);
  els[`event${name}Button`].setAttribute('aria-expanded', String(opening));
  if (opening) requestAnimationFrame(() => els[`event${name}Menu`].querySelector('.selected')?.scrollIntoView({ block: 'center' }));
}

function renderUnifiedPickerMenus() {
  const times = Array.from({ length: 96 }, (_, index) => minutesToTime(index * 15));
  [['Start', els.eventStart.value], ['End', els.eventEnd.value]].forEach(([name, selected]) => {
    els[`event${name}Menu`].innerHTML = times.map(time => `<button class="unified-picker-option${time === selected ? ' selected' : ''}" type="button" data-picker-value="${time}">${time}<i>${time === selected ? '✓' : ''}</i></button>`).join('');
  });
  els.eventRepeatMenu.innerHTML = REPEAT_PICKER_OPTIONS.map(([value, label]) => `<button class="unified-picker-option${value === els.eventRepeat.value ? ' selected' : ''}" type="button" data-picker-value="${value}">${label}<i>${value === els.eventRepeat.value ? '✓' : ''}</i></button>`).join('');
  syncUnifiedPickerDisplays();
}

function chooseUnifiedPicker(name, value) {
  const input = els[`event${name}`];
  input.value = value;
  closeUnifiedPickers();
  renderUnifiedPickerMenus();
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function updateViewControls() {
  const isWeek = state.viewMode === 'week';
  document.getElementById('monthViewBtn').classList.toggle('active', !isWeek);
  document.getElementById('weekViewBtn').classList.toggle('active', isWeek);
  document.getElementById('prevMonth').setAttribute('aria-label', isWeek ? '上一周' : '上个月');
  document.getElementById('nextMonth').setAttribute('aria-label', isWeek ? '下一周' : '下个月');
  els.monthTitle.classList.add('date-title-clickable');
  els.monthTitle.setAttribute('role', 'button');
  els.monthTitle.setAttribute('tabindex', '0');
  els.calendarGrid.classList.toggle('week-view', isWeek);
  els.weekScrubberWrap.classList.toggle('hidden', !isWeek);
  const weekdays = document.getElementById('weekdays');
  const calendarScroll = document.getElementById('calendarScroll');
  calendarScroll.classList.toggle('week-view-scroll', isWeek);
  if (!isWeek) { calendarScroll.scrollTop = 0; calendarScroll.scrollLeft = 0; }
  weekdays.classList.toggle('week-view', isWeek);
  if (!isWeek) weekdays.innerHTML = '<span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>';
}

function setDateNavigatorOpen(open) {
  els.dateNavigator.classList.toggle('hidden', !open);
  els.monthTitle.setAttribute('aria-expanded', String(open));
  if (open) {
    dateNavigatorDate = fromDateKey(state.selectedDate);
    renderDateNavigator();
  }
}

function renderDateNavigator() {
  const year = dateNavigatorDate.getFullYear();
  const month = dateNavigatorDate.getMonth();
  els.dateNavigatorTitle.textContent = `${year}年 ${month + 1}月`;
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const todayKey = toDateKey(new Date());
  els.dateNavigatorGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    return `<button type="button" data-navigator-date="${key}" class="${date.getMonth() !== month ? 'outside ' : ''}${key === state.selectedDate ? 'selected ' : ''}${key === todayKey ? 'today' : ''}">${date.getDate()}</button>`;
  }).join('');
}

function selectNavigatorDate(key) {
  state.selectedDate = key;
  const date = fromDateKey(key);
  state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
  setDateNavigatorOpen(false);
  renderPreservingPosition();
}

function navigateWeek(direction) {
  const selected = fromDateKey(state.selectedDate);
  selected.setDate(selected.getDate() + direction * 7);
  state.selectedDate = toDateKey(selected);
  state.viewDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
  renderPreservingPosition();
}

function weekBounds(anchorValue) {
  const anchor = anchorValue instanceof Date ? new Date(anchorValue) : fromDateKey(anchorValue);
  const offset = (anchor.getDay() + 6) % 7;
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - offset);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end };
}

function openWeekExport() {
  exportWeekDate = fromDateKey(state.selectedDate);
  if (!exportClientId || (exportClientId !== '__all__' && !state.clients.some(client => client.id === exportClientId))) exportClientId = '__all__';
  state.activePage = 'export';
  activeEventId = '';
  els.nlPanel.classList.add('hidden');
  els.calendarPage.classList.add('hidden');
  els.managementPage.classList.add('hidden');
  els.weekExportPage.classList.remove('hidden');
  els.todayBtn.classList.add('hidden');
  els.overviewToggle.classList.add('hidden');
  renderWeekExport();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeExportWeek(direction) {
  if (exportPeriod === 'month') exportWeekDate = new Date(exportWeekDate.getFullYear(), exportWeekDate.getMonth() + direction, 1);
  else exportWeekDate.setDate(exportWeekDate.getDate() + direction * 7);
  renderWeekExport();
}

function mergeBusyIntervals(events) {
  const intervals = events.map(event => {
    const travel = eventWorkMode(event) === 'offline' ? 30 : 0;
    const start = Math.max(8 * 60, timeToMinutes(event.start) - travel);
    const end = Math.min(22 * 60, timeToMinutes(event.start) + Number(event.duration || 0) * 60 + travel);
    return { start, end };
  }).filter(item => item.end > item.start).sort((a, b) => a.start - b.start);
  return intervals.reduce((merged, item) => {
    const last = merged[merged.length - 1];
    if (last && item.start <= last.end) last.end = Math.max(last.end, item.end);
    else merged.push({ ...item });
    return merged;
  }, []);
}

function freeIntervalsForDate(dateKey) {
  const busy = mergeBusyIntervals(state.events.filter(event => event.date === dateKey));
  const free = [];
  let cursor = 8 * 60;
  busy.forEach(item => {
    if (item.start > cursor) free.push({ start: cursor, end: item.start });
    cursor = Math.max(cursor, item.end);
  });
  if (cursor < 22 * 60) free.push({ start: cursor, end: 22 * 60 });
  return free;
}

function exportEventsForDate(dateKey) {
  const client = getClient(exportClientId);
  const includeAll = exportClientId === '__all__';
  if (!includeAll && !client) return [];
  return state.events.filter(event => event.date === dateKey && (includeAll || event.clientId === client.id || (!event.clientId && event.client === client.name))).filter(event => {
    const start = timeToMinutes(event.start);
    const end = start + Number(event.duration || 0) * 60;
    return end > 8 * 60 && start < 22 * 60;
  }).sort((a, b) => a.start.localeCompare(b.start));
}

function exportEventRange(event) {
  const start = Math.max(8 * 60, timeToMinutes(event.start));
  const end = Math.min(22 * 60, timeToMinutes(event.start) + Number(event.duration || 0) * 60);
  return `${minutesToTime(start)}–${minutesToTime(end)}`;
}

function exportPeriodRange() {
  if (exportPeriod !== 'month') return weekBounds(exportWeekDate);
  const start = new Date(exportWeekDate.getFullYear(), exportWeekDate.getMonth(), 1);
  const end = new Date(exportWeekDate.getFullYear(), exportWeekDate.getMonth() + 1, 0);
  return { start, end };
}

function exportPeriodTitle(start, end) {
  if (exportPeriod === 'month') return `${start.getFullYear()}年 ${start.getMonth() + 1}月`;
  const sameYear = start.getFullYear() === end.getFullYear();
  return sameYear
    ? `${start.getFullYear()}年 ${start.getMonth() + 1}月${start.getDate()}日—${end.getMonth() + 1}月${end.getDate()}日`
    : `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日—${end.getFullYear()}年${end.getMonth() + 1}月${end.getDate()}日`;
}

function exportWeekGrid(weekStart) {
  const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const dates = Array.from({ length: 7 }, (_, index) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index));
  const headers = dates.map((date, index) => `<span>${weekdayNames[index]}<b>${date.getMonth() + 1}/${date.getDate()}</b></span>`).join('');
  const axis = Array.from({ length: 15 }, (_, index) => `<span style="top:${index * 48}px">${String(index + 8).padStart(2, '0')}:00</span>`).join('');
  const columns = dates.map(date => {
    const key = toDateKey(date);
    if (exportMode === 'free') {
      return `<div class="export-day-column">${freeIntervalsForDate(key).map(slot => {
        const top = (slot.start - 8 * 60) * 48 / 60;
        const height = Math.max(23, (slot.end - slot.start) * 48 / 60);
        return `<div class="export-block available" style="top:${top}px;height:${height}px"><strong>可预约</strong><small>${minutesToTime(slot.start)}–${minutesToTime(slot.end)}</small></div>`;
      }).join('')}</div>`;
    }
    return `<div class="export-day-column">${exportEventsForDate(key).map(event => {
      const rawStart = timeToMinutes(event.start);
      const rawEnd = rawStart + Number(event.duration || 0) * 60;
      const visibleStart = Math.max(8 * 60, rawStart);
      const visibleEnd = Math.min(22 * 60, rawEnd);
      const top = (visibleStart - 8 * 60) * 48 / 60;
      const height = Math.max(23, (visibleEnd - visibleStart) * 48 / 60);
      const tag = getPrimaryTag(event);
      const client = eventClientName(event);
      return `<div class="export-block appointment" style="${tagStyle(tag)}top:${top}px;height:${height}px"><strong>${exportHideTitle ? '日程' : escapeHtml(event.title)}</strong><small>${exportEventRange(event)}${!exportHideClient && client ? ` · ${escapeHtml(client)}` : ''}</small></div>`;
    }).join('')}</div>`;
  }).join('');
  return `<div class="export-schedule-head"><span>时间</span>${headers}</div><div class="export-schedule-body"><div class="export-time-axis">${axis}</div>${columns}</div>`;
}

function exportListRows() {
  const { start, end } = exportPeriodRange();
  const rows = [];
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = toDateKey(date);
    const items = exportMode === 'free'
      ? freeIntervalsForDate(key).map(slot => ({ time: `${minutesToTime(slot.start)}–${minutesToTime(slot.end)}`, title: '可预约', client: '', tag: null, meta: '空闲档期' }))
      : exportEventsForDate(key).map(event => ({ time: exportEventRange(event), title: exportHideTitle ? '日程' : event.title, client: exportHideClient ? '' : eventClientName(event), tag: getPrimaryTag(event), meta: eventWorkMode(event) === 'offline' ? '线下' : '线上' }));
    rows.push({ date: new Date(date), items });
  }
  return rows;
}

function renderExportList() {
  const rows = exportListRows();
  return `<div class="export-list">${rows.map(row => {
    const dateLabel = `${row.date.getMonth() + 1}月${row.date.getDate()}日 周${'日一二三四五六'[row.date.getDay()]}`;
    const items = row.items.length ? row.items.map(item => `<article class="export-list-item" style="${tagStyle(item.tag)}"><time>${escapeHtml(item.time)}</time><div><strong>${escapeHtml(item.title)}</strong><small>${[item.client, item.meta].filter(Boolean).map(escapeHtml).join(' · ')}</small></div></article>`).join('') : '<div class="export-list-empty">暂无安排</div>';
    return `<section class="export-list-day"><h3>${dateLabel}</h3>${items}</section>`;
  }).join('')}</div>`;
}

function renderWeekExport() {
  const { start, end } = exportPeriodRange();
  els.exportWeekTitle.textContent = exportPeriodTitle(start, end);
  document.querySelectorAll('[data-export-mode]').forEach(button => button.classList.toggle('active', button.dataset.exportMode === exportMode));
  document.querySelectorAll('[data-export-period]').forEach(button => button.classList.toggle('active', button.dataset.exportPeriod === exportPeriod));
  document.querySelectorAll('[data-export-layout]').forEach(button => button.classList.toggle('active', button.dataset.exportLayout === exportLayout));
  els.exportClientRow.classList.toggle('hidden', exportMode !== 'client');
  const client = getClient(exportClientId);
  els.exportClientChoices.innerHTML = `<button class="export-client-chip${exportClientId === '__all__' ? ' active' : ''}" type="button" data-export-client="__all__"><i style="--avatar:#3f6b50">全</i>全部客户</button>` + state.clients.map(client => `<button class="export-client-chip${client.id === exportClientId ? ' active' : ''}" type="button" data-export-client="${client.id}"><i style="--avatar:${clientAvatarColor(client.name)}">${escapeHtml(client.name.slice(0, 1))}</i>${escapeHtml(client.name)}</button>`).join('');
  const periodWord = exportPeriod === 'month' ? '月' : '周';
  const heading = exportMode === 'free' ? `本${periodWord}空闲档期` : `${exportClientId === '__all__' ? '全部客户' : (client?.name || '未选择客户')} · 本${periodWord}课程/预定`;
  let grids = '';
  if (exportLayout === 'list') {
    grids = renderExportList();
  } else if (exportPeriod === 'month') {
    const firstWeek = weekBounds(start).start;
    for (const cursor = new Date(firstWeek); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
      const labelEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 6);
      grids += `<section class="export-month-week"><h3>${cursor.getMonth() + 1}/${cursor.getDate()}—${labelEnd.getMonth() + 1}/${labelEnd.getDate()}</h3>${exportWeekGrid(cursor)}</section>`;
    }
  } else {
    grids = exportWeekGrid(start);
  }
  els.exportSheet.innerHTML = `<div class="export-sheet-title"><span>工作日历pro</span><h2>${escapeHtml(heading)}</h2><small>${els.exportWeekTitle.textContent} · 08:00–22:00</small></div>${grids}<footer>让每一段时间，都有价值。 Every hour counts.</footer>`;
}

function weekExportText() {
  const { start, end } = exportPeriodRange();
  const client = getClient(exportClientId);
  const periodWord = exportPeriod === 'month' ? '月' : '周';
  const lines = [exportMode === 'free' ? `本${periodWord}空闲档期` : `${exportClientId === '__all__' ? '全部客户' : (client?.name || '未选择客户')}的本${periodWord}课程/预定`, `${els.exportWeekTitle.textContent}（08:00–22:00）`, ''];
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = toDateKey(date);
    const entries = exportMode === 'free'
      ? freeIntervalsForDate(key).map(slot => `${minutesToTime(slot.start)}–${minutesToTime(slot.end)} 可预约`)
      : exportEventsForDate(key).map(event => `${exportEventRange(event)} ${exportHideTitle ? '日程' : event.title}${!exportHideClient && eventClientName(event) ? `（${eventClientName(event)}）` : ''}`);
    lines.push(`${date.getMonth() + 1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]}`, ...(entries.length ? entries.map(item => `  ${item}`) : ['  暂无安排']), '');
  }
  return lines.join('\n');
}

async function copyWeekExportText() {
  const text = weekExportText();
  try { await navigator.clipboard.writeText(text); }
  catch {
    const textarea = document.createElement('textarea');
    textarea.value = text; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
  }
  showToast('日程列表文字已复制');
}

async function printWeekExport() {
  renderWeekExport();
  const { start, end } = exportPeriodRange();
  const dates = []; for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
  const isList = exportLayout === 'list'; const cellW = 150; const left = 78; const rowH = 42; const headerH = 72;
  const width = isList ? 980 : left + (exportPeriod === 'month' ? 7 : 7) * cellW + 24;
  const height = isList ? 100 + dates.length * 72 : headerH + 15 * rowH + 48;
  const canvas = document.createElement('canvas'); canvas.width = width * 2; canvas.height = height * 2; const ctx = canvas.getContext('2d'); ctx.scale(2, 2); ctx.fillStyle = '#fffefa'; ctx.fillRect(0, 0, width, height); ctx.fillStyle = '#20352a'; ctx.font = '700 22px Arial,"Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`工作日历pro · ${exportPeriodTitle(start, end)}`, width / 2, 34);
  if (isList) {
    ctx.textAlign = 'left'; ctx.font = '600 14px Arial,"Microsoft YaHei",sans-serif'; let y = 78;
    dates.forEach(date => { const key = toDateKey(date); ctx.fillStyle = '#356447'; ctx.fillText(`${date.getMonth()+1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]}`, 28, y); const items = exportMode === 'free' ? freeIntervalsForDate(key).map(s => ({ time: `${minutesToTime(s.start)}–${minutesToTime(s.end)}`, title: '可预约' })) : exportEventsForDate(key).map(e => ({ time: exportEventRange(e), title: exportHideTitle ? '日程' : e.title, client: exportHideClient ? '' : eventClientName(e) })); ctx.font = '13px Arial,"Microsoft YaHei",sans-serif'; ctx.fillStyle = '#425149'; ctx.fillText(items.length ? items.map(i => `${i.time}  ${i.title}${i.client ? `（${i.client}）` : ''}`).join('  ·  ') : '暂无安排', 190, y); y += 72; });
  } else {
    const gridTop = headerH; ctx.font = '600 13px Arial,"Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#5f6d64'; ctx.fillText('时间', left / 2, 58); dates.slice(0, 7).forEach((date, i) => ctx.fillText(`${date.getMonth()+1}/${date.getDate()}`, left + i * cellW + cellW / 2, 58));
    for (let h = 0; h <= 15; h++) { const y = gridTop + h * rowH; ctx.strokeStyle = '#dfe6e0'; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + 7 * cellW, y); ctx.stroke(); if (h < 15) { ctx.fillStyle = '#7b877e'; ctx.textAlign = 'right'; ctx.fillText(`${String(h + 8).padStart(2,'0')}:00`, left - 8, y + 5); } }
    for (let i = 0; i <= 7; i++) { const x = left + i * cellW; ctx.strokeStyle = '#dfe6e0'; ctx.beginPath(); ctx.moveTo(x, gridTop); ctx.lineTo(x, gridTop + 15 * rowH); ctx.stroke(); }
    dates.slice(0, 7).forEach((date, i) => { const key = toDateKey(date); const items = exportMode === 'free' ? freeIntervalsForDate(key).map(s => ({ start:s.start, end:s.end, title:'可预约' })) : exportEventsForDate(key).map(e => ({ start:Math.max(480,timeToMinutes(e.start)), end:Math.min(1320,timeToMinutes(e.start)+Number(e.duration||0)*60), title:exportHideTitle?'日程':e.title, client:exportHideClient?'':eventClientName(e), tag:getPrimaryTag(e) })); items.forEach(item => { const x = left + i * cellW + 5; const y = gridTop + (item.start - 480) / 60 * rowH + 2; const h = Math.max(22, (item.end - item.start) / 60 * rowH - 4); ctx.fillStyle = item.tag?.color || '#dbe8dc'; ctx.fillRect(x, y, cellW - 10, h); ctx.fillStyle = '#24382b'; ctx.textAlign = 'left'; ctx.font = '600 12px Arial,"Microsoft YaHei",sans-serif'; ctx.fillText(item.title, x + 7, y + 16); ctx.font = '10px Arial,"Microsoft YaHei",sans-serif'; ctx.fillText(`${minutesToTime(item.start)}–${minutesToTime(item.end)}${item.client ? ` · ${item.client}` : ''}`, x + 7, y + 31); }); });
  }
  const link = document.createElement('a'); link.download = `工作日历pro-${exportPeriodTitle(start, end).replace(/[^\d年月日—]/g, '')}.png`; link.href = canvas.toDataURL('image/png'); link.click(); showToast('日程表 PNG 图片已导出');
}

function setViewMode(mode) {
  state.viewMode = mode;
  localStorage.setItem('schedule-ledger-view', mode);
  const selected = fromDateKey(state.selectedDate);
  state.viewDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
  render();
}

function eventsForDate(key) {
  const events = state.events.filter(e => e.date === key);
  if (state.draftEvent?.date === key) events.push(state.draftEvent);
  return events.sort((a, b) => a.start.localeCompare(b.start));
}

function selectDate(key) {
  state.selectedDate = key;
  const date = fromDateKey(key);
  if (date.getMonth() !== state.viewDate.getMonth() || date.getFullYear() !== state.viewDate.getFullYear()) {
    state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
    render();
    return;
  }
  document.querySelectorAll('.calendar-day.selected').forEach(cell => cell.classList.remove('selected'));
  document.querySelector(`.calendar-day[data-date="${key}"]`)?.classList.add('selected');
  renderSelectedDay();
  renderSummary();
}

function renderSelectedDay() {
  const date = fromDateKey(state.selectedDate);
  const dayEvents = eventsForDate(state.selectedDate);
  els.selectedWeekday.textContent = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(date);
  els.selectedDate.textContent = `${date.getMonth() + 1}月${date.getDate()}日`;
  const activeIncome = dayEvents.reduce((sum, e) => sum + Number(e.income), 0);
  els.dayIncome.textContent = money.format(activeIncome);

  if (!dayEvents.length) {
    els.eventList.innerHTML = `<div class="empty-state"><span class="empty-icon">☼</span><p>今天还没有安排</p><small>给时间留一点期待</small></div>`;
    return;
  }
  els.eventList.innerHTML = dayEvents.map(event => `
    <article class="event-card" data-id="${event.id}" tabindex="0">
      <div class="event-card-top"><h3>${escapeHtml(event.title)}</h3>${eventPriceLabel(event) ? `<span class="income event-price-badge">${eventPriceLabel(event)}</span>` : ''}</div>
      <div class="event-meta">${escapeHtml(event.start)} · ${formatDuration(event.duration)}${eventClientName(event) ? ` · ${escapeHtml(eventClientName(event))}` : ''}</div>
      ${getEventTags(event).map(tag => `<span class="event-tag" style="--tag-color:${tag.color}">${escapeHtml(tag.name)}</span>`).join('')}
    </article>`).join('');
  els.eventList.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => openEdit(card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openEdit(card.dataset.id); });
    card.addEventListener('contextmenu', e => {
      e.preventDefault();
      contextEventId = card.dataset.id === '__draft__' ? '' : card.dataset.id;
      const event = getEventById(card.dataset.id);
      contextPasteTarget = event ? { date: event.date, start: event.start } : null;
      showCalendarContextMenu(e.clientX, e.clientY);
    });
  });
}

function renderSummary() {
  const summaryDate = fromDateKey(state.selectedDate);
  const prefix = `${summaryDate.getFullYear()}-${String(summaryDate.getMonth() + 1).padStart(2, '0')}`;
  const monthEvents = state.events.filter(e => e.date.startsWith(prefix));
  const monthOtherIncome = state.otherIncome.filter(item => item.date.startsWith(prefix));
  const paidEvents = monthEvents.filter(e => Number(e.income) > 0);
  const scheduleIncome = monthEvents.reduce((sum, e) => sum + Number(e.income), 0);
  const extraIncome = monthOtherIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const income = scheduleIncome + extraIncome;
  const hours = monthEvents.reduce((sum, e) => sum + Number(e.duration), 0);
  const target = Number(state.incomeTargets[prefix] || 0);
  const progress = target > 0 ? income / target * 100 : 0;
  els.monthIncome.textContent = money.format(income);
  els.incomeTargetCaption.textContent = target > 0 ? `目标 ${money.format(target)} · 已完成 ${Math.round(progress)}%` : '尚未设置本月目标';
  els.incomeTargetProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  els.monthCount.innerHTML = `${paidEvents.length} <em>个</em>`;
  els.monthHours.innerHTML = `${formatNumber(hours)} <em>小时</em>`;
  renderTagDonut(els.incomeTagChart, els.incomeTagCaption, [...monthEvents, ...monthOtherIncome], item => Number(item.amount ?? item.income), '收入');
  renderTagDonut(els.countTagChart, els.countTagCaption, paidEvents, () => 1, '有收入日程');
  renderTagDonut(els.hoursTagChart, els.hoursTagCaption, monthEvents, event => Number(event.duration), '工时');
  renderHomeOtherIncome();
}

function renderHomeOtherIncome() {
  const summaryDate = fromDateKey(state.selectedDate);
  const prefix = `${summaryDate.getFullYear()}-${String(summaryDate.getMonth() + 1).padStart(2, '0')}`;
  const records = state.otherIncome.filter(item => String(item.date || '').startsWith(prefix));
  if (!records.length) {
    els.homeOtherIncomeList.innerHTML = `<div class="home-income-empty">${summaryDate.getFullYear()}年${summaryDate.getMonth() + 1}月还没有其他收入记录。</div>`;
    return;
  }
  const grouped = new Map();
  records.forEach(item => {
    const tags = getEventTags(item);
    const targets = tags.length ? tags : [{ id: '__untagged__', name: '无标签', color: '#A8AAA3' }];
    targets.forEach(tag => {
      const group = grouped.get(tag.id) || { ...tag, count: 0, amount: 0 };
      group.count += 1;
      group.amount += Number(item.amount || 0) / targets.length;
      grouped.set(tag.id, group);
    });
  });
  const rows = [...grouped.entries()].sort((a, b) => b[1].amount - a[1].amount);
  els.homeOtherIncomeList.innerHTML = rows.map(([id, group]) => `<button class="home-income-row home-income-summary" type="button" data-home-income-tag="${id}"><div class="income-source-icon" style="--income-color:${group.color}">¥</div><div class="home-income-main"><b>${escapeHtml(group.name)}</b><span>${summaryDate.getFullYear()}年${summaryDate.getMonth() + 1}月 · ${group.count} 笔其他收入</span><div class="income-row-tags"><i style="--tag-color:${group.color}">${escapeHtml(group.name)}</i></div></div><strong>${money.format(group.amount)}</strong></button>`).join('');
}

function openIncomeTargetEditor() {
  const date = fromDateKey(state.selectedDate);
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  els.incomeTargetInput.value = state.incomeTargets[key] || '';
  els.incomeTargetPopover.classList.remove('hidden');
  setTimeout(() => els.incomeTargetInput.focus(), 0);
}

function saveIncomeTargetValue() {
  const date = fromDateKey(state.selectedDate);
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const value = Math.max(0, Number(els.incomeTargetInput.value) || 0);
  if (value > 0) state.incomeTargets[key] = value; else delete state.incomeTargets[key];
  saveIncomeTargets();
  els.incomeTargetPopover.classList.add('hidden');
  renderSummary();
  showToast(value > 0 ? '本月收入目标已保存' : '本月收入目标已清除');
}

function renderTagDonut(element, caption, events, valueOf, metricName) {
  const values = new Map();
  events.forEach(event => {
    const tags = getEventTags(event);
    const value = Math.max(0, valueOf(event));
    if (!tags.length) values.set('__untagged__', (values.get('__untagged__') || 0) + value);
    else tags.forEach(tag => values.set(tag.id, (values.get(tag.id) || 0) + value / tags.length));
  });
  const total = [...values.values()].reduce((sum, value) => sum + value, 0);
  if (!total) {
    element.style.setProperty('--donut-bg', 'conic-gradient(#d8d9d3 0 100%)');
    element.innerHTML = '<span class="donut-center-label">无</span>';
    element.title = `本月暂无${metricName}数据`;
    caption.textContent = '暂无标签占比';
    return;
  }
  let cursor = 0;
  const segments = [];
  const descriptions = [];
  let topLabel = '标签';
  let topValue = -1;
  values.forEach((value, key) => {
    if (!value) return;
    const tag = key === '__untagged__' ? null : getTag(key);
    const color = tag?.color || '#A8AAA3';
    const start = cursor;
    cursor += value / total * 100;
    segments.push(`${color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`);
    descriptions.push(`${tag?.name || '无标签'} ${Math.round(value / total * 100)}%`);
    if (value > topValue) { topValue = value; topLabel = tag?.name || '无标签'; }
  });
  element.style.setProperty('--donut-bg', `conic-gradient(${segments.join(',')})`);
  element.innerHTML = `<span class="donut-center-label">${escapeHtml(topLabel.slice(0, 3))}</span>`;
  element.title = `${metricName}占比：${descriptions.join('，')}`;
  caption.textContent = descriptions.join(' · ');
}

function renderContributionGraph() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedYear = Number(state.statsYear) || today.getFullYear();
  const customRange = statsPeriod === 'custom' && els.statsRangeStart.value && els.statsRangeEnd.value;
  const rangeStart = customRange ? fromDateKey(els.statsRangeStart.value) : new Date(selectedYear, 0, 1);
  const rangeEnd = customRange ? fromDateKey(els.statsRangeEnd.value) : new Date(selectedYear, 11, 31);
  const yearStart = rangeStart;
  const mondayOffset = (yearStart.getDay() + 6) % 7;
  const start = new Date(yearStart.getFullYear(), yearStart.getMonth(), yearStart.getDate() - mondayOffset);
  const end = rangeEnd;
  const weeks = Math.ceil(((end - start) / 86400000 + 1) / 7);
  if (contributionTagFilter && contributionTagFilter !== '__untagged__' && !getTag(contributionTagFilter)) contributionTagFilter = '';
  const filterTag = contributionTagFilter === '__untagged__' ? { name: '无标签' } : getTag(contributionTagFilter);
  els.contributionPeriod.textContent = filterTag ? `已筛选：${filterTag.name}` : '全部标签';
  els.contributionTitle.textContent = customRange ? `${rangeStart.getFullYear()}—${rangeEnd.getFullYear()}年时间贡献图` : `${selectedYear}年时间贡献图`;
  els.contributionTagFilters.innerHTML = `<button class="contribution-filter${!contributionTagFilter ? ' active' : ''}" type="button" data-contribution-tag="">全部</button>` + state.tags.map(tag => `<button class="contribution-filter${contributionTagFilter === tag.id ? ' active' : ''}" type="button" data-contribution-tag="${tag.id}"><i style="--tag-color:${tag.color}"></i>${escapeHtml(tag.name)}</button>`).join('') + `<button class="contribution-filter${contributionTagFilter === '__untagged__' ? ' active' : ''}" type="button" data-contribution-tag="__untagged__"><i style="--tag-color:#A8AAA3"></i>无标签</button>`;
  const hoursByDate = new Map();
  state.events.forEach(event => {
    const date = fromDateKey(event.date);
    if (customRange ? (date < rangeStart || date > rangeEnd) : date.getFullYear() !== selectedYear) return;
    const tagIds = getEventTagIds(event);
    if (contributionTagFilter === '__untagged__' && tagIds.length) return;
    if (contributionTagFilter && contributionTagFilter !== '__untagged__' && !tagIds.includes(contributionTagFilter)) return;
    hoursByDate.set(event.date, (hoursByDate.get(event.date) || 0) + Number(event.duration || 0));
  });
  const total = [...hoursByDate.values()].reduce((sum, value) => sum + value, 0);
  els.contributionTotal.textContent = formatNumber(total);
  const cells = [];
  const monthPositions = [];
  let previousMonth = -1;
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);
      const key = toDateKey(date);
      const hours = hoursByDate.get(key) || 0;
      const level = hours === 0 ? 0 : hours < 1 ? 1 : hours < 2 ? 2 : hours < 4 ? 3 : 4;
      const outside = date < yearStart || date > end;
      const future = !outside && date > today;
      cells.push(`<i class="contribution-cell level-${outside ? 0 : level}${outside ? ' future' : future ? ' future' : ''}" data-contribution-date="${key}" style="grid-column:${week + 1};grid-row:${day + 1}" title="${outside ? '所选年份之外' : `${date.getMonth() + 1}月${date.getDate()}日 · ${formatNumber(hours)}小时`}"></i>`);
      if (day === 0 && !outside && date.getMonth() !== previousMonth) {
        monthPositions.push({ week: week + 1, name: `${date.getMonth() + 1}月` });
        previousMonth = date.getMonth();
      }
    }
  }
  els.contributionGraph.innerHTML = cells.join('');
  els.contributionMonths.innerHTML = monthPositions.map(item => `<span style="grid-column:${item.week}">${item.name}</span>`).join('');
  els.contributionGraph.style.gridTemplateColumns = `repeat(${weeks}, 12px)`;
  els.contributionMonths.style.gridTemplateColumns = `repeat(${weeks}, 12px)`;
  const multi = customRange && rangeStart.getFullYear() !== rangeEnd.getFullYear();
  els.contributionMultiYear.classList.toggle('hidden', !multi);
  els.contributionScroll.classList.toggle('hidden', multi);
  if (multi) {
    const parts = [];
    for (let yr = rangeStart.getFullYear(); yr <= rangeEnd.getFullYear(); yr++) {
      const ys = new Date(yr, 0, 1); const ye = new Date(yr, 11, 31); const mo = (ys.getDay() + 6) % 7; const gs = new Date(yr, 0, 1 - mo); const gw = Math.ceil(((ye - gs) / 86400000 + 1) / 7); const cells2 = [];
      for (let w = 0; w < gw; w++) for (let d = 0; d < 7; d++) { const dt = new Date(gs); dt.setDate(gs.getDate() + w * 7 + d); const key = toDateKey(dt); const hrs = hoursByDate.get(key) || 0; const out = dt.getFullYear() !== yr; const lvl = hrs === 0 ? 0 : hrs < 1 ? 1 : hrs < 2 ? 2 : hrs < 4 ? 3 : 4; cells2.push(`<i class="contribution-cell level-${out ? 0 : lvl}${out ? ' future' : ''}" data-contribution-date="${key}" style="grid-column:${w + 1};grid-row:${d + 1}" title="${key} · ${formatNumber(hrs)}小时"></i>`); }
      parts.push(`<section class="contribution-year-block"><h3>${yr}年</h3><div class="contribution-body"><div class="contribution-weekdays"><span>一</span><span>三</span><span>五</span></div><div class="contribution-grid" style="grid-template-columns:repeat(${gw},12px)">${cells2.join('')}</div></div></section>`);
    }
    els.contributionMultiYear.innerHTML = parts.join('');
  } else els.contributionMultiYear.innerHTML = '';
}

function applyOverviewState() {
  els.summarySection.classList.toggle('hidden', state.overviewCollapsed);
  els.overviewToggle.classList.toggle('collapsed', state.overviewCollapsed);
  els.overviewToggle.querySelector('span').textContent = '';
  els.overviewToggle.setAttribute('aria-label', state.overviewCollapsed ? '展开概览' : '收起概览');
  els.overviewToggle.setAttribute('aria-expanded', String(!state.overviewCollapsed));
}

function toggleOverview() {
  state.overviewCollapsed = !state.overviewCollapsed;
  localStorage.setItem(OVERVIEW_STORAGE_KEY, String(state.overviewCollapsed));
  applyOverviewState();
}

function setDrawerOpen(open) {
  els.sideDrawer.classList.toggle('open', open);
  els.drawerScrim.classList.toggle('hidden', !open);
  els.sideDrawer.setAttribute('aria-hidden', String(!open));
  els.menuBtn.setAttribute('aria-expanded', String(open));
}

function showPage(page, statFocus = '') {
  state.activePage = page;
  if (page !== 'calendar') { pasteMode = false; activeEventId = ''; }
  setDrawerOpen(false);
  els.managerEditor.classList.add('hidden');
  els.incomeEditor.classList.add('hidden');
  els.calendarPage.classList.toggle('hidden', page !== 'calendar');
  els.managementPage.classList.toggle('hidden', page === 'calendar');
  els.weekExportPage.classList.add('hidden');
  els.overviewToggle.classList.toggle('hidden', page !== 'calendar');
  els.todayBtn.classList.toggle('hidden', page !== 'calendar');
  document.querySelectorAll('.drawer-nav [data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === page));
  if (page === 'calendar') {
    els.managerEditor.classList.add('hidden');
    render();
    return;
  }
  if (page === 'stats') {
    const date = fromDateKey(state.selectedDate);
    state.statsYear = date.getFullYear();
    state.statsMonth = date.getMonth() + 1;
    state.statFocus = statFocus;
  }
  renderManagementPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderManagementPage() {
  const pages = { stats: els.statsView, income: els.otherIncomeView, trash: els.trashView };
  Object.entries(pages).forEach(([name, element]) => element.classList.toggle('hidden', state.activePage !== name));
  els.tagsView.classList.toggle('hidden', state.activePage !== 'entities');
  els.clientsView.classList.toggle('hidden', state.activePage !== 'entities');
  const titles = { stats: ['数据洞察', '统计'], entities: ['集中管理', '标签与客户'], income: ['收入记录', '其他收入'], trash: ['误删保护', '回收站'] };
  const title = titles[state.activePage] || titles.stats;
  els.managementEyebrow.textContent = title[0];
  els.managementTitle.textContent = title[1];
  if (state.activePage === 'stats') renderStatsPage();
  if (state.activePage === 'entities') { renderManagedTags(); renderManagedClients(); }
  if (state.activePage === 'income') renderOtherIncomePage();
  if (state.activePage === 'trash') renderTrashPage();
  renderTrashBadge();
}

function renderStatsPage() {
  if (!els.statsMonth.options.length) {
    els.statsMonth.innerHTML = Array.from({ length: 12 }, (_, index) => `<option value="${index + 1}">${index + 1}月</option>`).join('');
  }
  els.statsYear.value = state.statsYear;
  els.statsMonth.value = state.statsMonth;
  const todayKey = toDateKey(new Date());
  if (!els.statsRangeStart.value) els.statsRangeStart.value = `${state.statsYear}-${String(state.statsMonth).padStart(2,'0')}-01`;
  if (!els.statsRangeEnd.value) els.statsRangeEnd.value = todayKey;
  document.querySelectorAll('[data-stats-period]').forEach(button => button.classList.toggle('active', button.dataset.statsPeriod === statsPeriod));
  document.querySelectorAll('.stats-custom-date').forEach(el => el.classList.toggle('hidden', statsPeriod !== 'custom'));
  document.querySelectorAll('.stats-year-month').forEach(el => el.classList.toggle('hidden', statsPeriod === 'custom'));
  const yearPrefix = `${state.statsYear}-`;
  const monthPrefix = `${state.statsYear}-${String(state.statsMonth).padStart(2, '0')}`;
  const yearEvents = state.events.filter(event => event.date.startsWith(yearPrefix));
  const monthEvents = yearEvents.filter(event => event.date.startsWith(monthPrefix));
  const yearOtherIncome = state.otherIncome.filter(item => item.date.startsWith(yearPrefix));
  const monthOtherIncome = yearOtherIncome.filter(item => item.date.startsWith(monthPrefix));
  const customStart = els.statsRangeStart.value; const customEnd = els.statsRangeEnd.value || customStart;
  const rangeEvents = state.events.filter(event => event.date >= customStart && event.date <= customEnd);
  const rangeOtherIncome = state.otherIncome.filter(item => item.date >= customStart && item.date <= customEnd);
  const isCustom = statsPeriod === 'custom';
  const primaryEvents = isCustom ? rangeEvents : statsPeriod === 'year' ? yearEvents : monthEvents;
  const secondaryEvents = isCustom ? rangeEvents : yearEvents;
  const primaryOtherIncome = isCustom ? rangeOtherIncome : statsPeriod === 'year' ? yearOtherIncome : monthOtherIncome;
  const secondaryOtherIncome = isCustom ? rangeOtherIncome : yearOtherIncome;
  const monthIncome = primaryEvents.reduce((sum, event) => sum + Number(event.income || 0), 0) + primaryOtherIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const yearIncome = secondaryEvents.reduce((sum, event) => sum + Number(event.income || 0), 0) + secondaryOtherIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthHours = primaryEvents.reduce((sum, event) => sum + Number(event.duration || 0), 0);
  const yearHours = secondaryEvents.reduce((sum, event) => sum + Number(event.duration || 0), 0);
  const periodName = isCustom ? '期间' : statsPeriod === 'year' ? '本年' : '本月';
  els.statsPrimaryLabel.textContent = `${periodName}总收入`;
  els.statsTargetLabel.textContent = `${periodName}收入目标`;
  els.statsPrimaryHoursLabel.textContent = `${periodName}有收入小时数`;
  els.statsScheduleCountLabel.textContent = `${periodName}日程数`;
  els.statsClientsLabel.textContent = `${periodName}客户`;
  els.statsMonthIncome.textContent = money.format(monthIncome);
  els.statsMonthPaidCount.textContent = `${primaryEvents.filter(event => Number(event.income) > 0).length} 个工时收入日程 · ${primaryOtherIncome.length} 笔其他收入`;
  els.statsMonthHours.textContent = `${formatNumber(primaryEvents.filter(event => Number(event.income) > 0).reduce((sum, event) => sum + Number(event.duration || 0), 0))} 小时`;
  els.statsScheduleCount.textContent = `${primaryEvents.length} 个`;
  els.statsClientCount.textContent = `${new Set(primaryEvents.map(event => eventClientName(event)).filter(Boolean)).size} 个`;
  const targetKey = isCustom ? `${customStart}_${customEnd}` : `${state.statsYear}-${String(state.statsMonth).padStart(2,'0')}`;
  els.statsPeriodTarget.textContent = money.format(Number(state.incomeTargets[targetKey] || 0));
  const grouped = new Map();
  [...primaryEvents, ...primaryOtherIncome].forEach(record => {
    const tags = getEventTags(record);
    const targets = tags.length ? tags : [{ id: '__untagged__', name: '无标签', color: '#A8AAA3' }];
    targets.forEach(tag => {
      const group = grouped.get(tag.id) || { name: tag.name, color: tag.color, income: 0, hours: 0, count: 0 };
      group.income += Number(record.amount ?? record.income ?? 0) / targets.length;
      group.hours += Number(record.duration || 0) / targets.length;
      group.count += 1 / targets.length;
      grouped.set(tag.id, group);
    });
  });
  const breakdown = [...grouped.values()].sort((a, b) => b.income - a.income || b.hours - a.hours);
  const scaleTotal = monthIncome || monthHours || 1;
  const yearGrouped = new Map();
  [...yearEvents, ...yearOtherIncome].forEach(record => {
    const tags = getEventTags(record); const targets = tags.length ? tags : [{ id: '__untagged__', name: '无标签', color: '#A8AAA3' }];
    targets.forEach(tag => { const group = yearGrouped.get(tag.id) || { name: tag.name, color: tag.color, income: 0, hours: 0, count: 0 }; group.income += Number(record.amount ?? record.income ?? 0) / targets.length; group.hours += Number(record.duration || 0) / targets.length; group.count += 1 / targets.length; yearGrouped.set(tag.id, group); });
  });
  const yearBreakdown = [...yearGrouped.values()].sort((a, b) => b.income - a.income || b.hours - a.hours); const yearScale = yearIncome || yearHours || 1;
  const makeBreakdown = (entries, mode) => { const map = new Map(); entries.forEach(event => { const names = mode === 'client' ? [{ id: eventClientName(event) || '__none__', name: eventClientName(event) || '无客户', color: '#7b8f82' }] : mode === 'mode' ? [{ id: eventWorkMode(event), name: eventWorkMode(event) === 'offline' ? '线下' : '线上', color: eventWorkMode(event) === 'offline' ? '#c28452' : '#4c7aa8' }] : getEventTags(event).length ? getEventTags(event) : [{ id:'__untagged__', name:'无标签', color:'#A8AAA3' }]; names.forEach(tag => { const g = map.get(tag.id) || { name: tag.name, color: tag.color, income: 0, hours: 0, count: 0 }; g.income += Number(event.amount ?? event.income ?? 0) / names.length; g.hours += Number(event.duration || 0) / names.length; g.count += 1 / names.length; map.set(tag.id, g); }); }); return [...map.values()].sort((a,b)=>b.income-a.income||b.hours-a.hours); };
  const activeBreakdown = statsBreakdownType === 'tag' ? (isCustom ? makeBreakdown([...primaryEvents, ...primaryOtherIncome], 'tag') : statsBreakdownPeriod === 'year' ? yearBreakdown : breakdown) : makeBreakdown(primaryEvents, statsBreakdownType);
  const activeScale = statsBreakdownPeriod === 'year' ? yearScale : scaleTotal;
  const activeIncome = statsBreakdownPeriod === 'year' ? yearIncome : monthIncome;
  els.statsBreakdown.innerHTML = activeBreakdown.length ? activeBreakdown.map(item => `<article class="breakdown-row"><i style="--entity-color:${item.color}"></i><div><b>${escapeHtml(item.name)}</b><span>${formatNumber(item.count)} 项 · ${formatNumber(item.hours)} 小时</span><em style="--bar-width:${Math.max(4, (activeIncome ? item.income : item.hours) / activeScale * 100)}%;--entity-color:${item.color}"></em></div><strong>${money.format(item.income)}</strong></article>`).join('') : `<div class="manager-empty">${statsBreakdownPeriod === 'year' ? '本年' : '这个月'}还没有标签数据</div>`;
  els.breakdownTitle.textContent = statsBreakdownType === 'client' ? '客户构成' : statsBreakdownType === 'mode' ? '线上/线下构成' : '标签构成';
  document.querySelectorAll('[data-breakdown-type]').forEach(button => button.classList.toggle('active', button.dataset.breakdownType === statsBreakdownType));
  renderContributionGraph();
  document.querySelectorAll('[data-stats-card]').forEach(card => card.classList.toggle('focused', Boolean(state.statFocus) && card.dataset.statsCard === state.statFocus));
  if (state.statFocus) setTimeout(() => document.querySelector(`[data-stats-card="${state.statFocus}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

function renderManagedTags() {
  els.managerTagList.innerHTML = state.tags.length ? state.tags.map(tag => {
    const events = state.events.filter(event => getEventTagIds(event).includes(tag.id));
    const otherIncome = state.otherIncome.filter(item => getEventTagIds(item).includes(tag.id));
    const income = events.reduce((sum, event) => sum + Number(event.income || 0), 0) + otherIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `<article class="entity-row"><i class="entity-color" style="--entity-color:${tag.color}"></i><div><b>${escapeHtml(tag.name)}</b><span>${events.length} 项日程 · ${otherIncome.length} 笔其他收入 · ${money.format(income)}</span></div><button class="button ghost" type="button" data-edit-tag="${tag.id}">编辑</button></article>`;
  }).join('') : '<div class="manager-empty">还没有标签，创建一个颜色分类吧</div>';
}

function renderManagedClients() {
  els.managerClientList.innerHTML = state.clients.length ? state.clients.map(client => {
    const events = state.events.filter(event => event.clientId === client.id);
    const income = events.reduce((sum, event) => sum + Number(event.income || 0), 0);
    return `<article class="entity-row"><i class="client-avatar" style="--avatar:${clientAvatarColor(client.name)}">${escapeHtml(client.name.slice(0, 1))}</i><div><b>${escapeHtml(client.name)}</b><span>${events.length} 项日程 · ${money.format(income)}</span></div><button class="button ghost" type="button" data-edit-client="${client.id}">编辑</button></article>`;
  }).join('') : '<div class="manager-empty">还没有客户资料</div>';
}

function renderOtherIncomePage() {
  els.incomeYear.value = state.incomeYear;
  els.incomeMonth.value = state.incomeMonth;
  const prefix = `${state.incomeYear}-${String(state.incomeMonth).padStart(2, '0')}`;
  const records = state.otherIncome.filter(item => {
    if (!String(item.date || '').startsWith(prefix)) return false;
    const tags = getEventTagIds(item);
    if (!otherIncomeTagFilter) return true;
    if (otherIncomeTagFilter === '__untagged__') return !tags.length;
    return tags.includes(otherIncomeTagFilter);
  }).sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
  const total = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const filterTag = otherIncomeTagFilter === '__untagged__' ? { name: '无标签' } : getTag(otherIncomeTagFilter);
  els.otherIncomeTotal.textContent = `${state.incomeYear}年${state.incomeMonth}月${filterTag ? ` · ${filterTag.name}` : ''} · ${records.length} 笔 · ${money.format(total)}`;
  els.otherIncomeList.innerHTML = records.length ? records.map(item => {
    const tags = getEventTags(item);
    return `<article class="entity-row other-income-row"><i class="income-source-icon">¥</i><div><b>${escapeHtml(item.name || '其他收入')}</b><span>${escapeHtml(item.date)}${item.note ? ` · ${escapeHtml(item.note)}` : ''}</span><div class="income-row-tags">${tags.map(tag => `<i style="--tag-color:${tag.color}">${escapeHtml(tag.name)}</i>`).join('')}</div></div><strong>${money.format(Number(item.amount || 0))}</strong><button class="button ghost" type="button" data-edit-other-income="${item.id}">编辑</button></article>`;
  }).join('') : '<div class="manager-empty spacious"><span>¥</span><b>还没有其他收入</b><small>可以记录投资收入、补助、奖学金或生活费</small></div>';
}

function renderOtherIncomeTagChoices() {
  els.otherIncomeTagChoices.innerHTML = state.tags.length ? state.tags.map(tag => `<button class="income-tag-choice${selectedOtherIncomeTags.has(tag.id) ? ' selected' : ''}" type="button" data-other-income-tag="${tag.id}"><i style="--tag-color:${tag.color}"></i>${escapeHtml(tag.name)}<em>${selectedOtherIncomeTags.has(tag.id) ? '✓' : ''}</em></button>`).join('') : '<span class="section-hint">暂无标签，可先在标签页创建</span>';
}

function openOtherIncomeEditor(id = '') {
  const item = state.otherIncome.find(record => record.id === id);
  els.otherIncomeId.value = item?.id || '';
  els.otherIncomeName.value = item?.name || '';
  els.otherIncomeDate.value = item?.date || state.selectedDate;
  els.otherIncomeAmount.value = item?.amount ?? 0;
  els.otherIncomeNote.value = item?.note || '';
  els.otherIncomeRepeat.value = item?.repeat || 'none';
  els.otherIncomeRepeatUntil.value = item?.repeatUntil || '';
  otherIncomeRepeatDates = new Set(String(item?.repeatDates || '').split(/[\s,，;；]+/).filter(Boolean));
  otherIncomeCalendarDate = item?.date ? fromDateKey(item.date) : new Date();
  els.otherIncomeRepeatUntilField.classList.toggle('hidden', !['daily','weekly','monthly','yearly'].includes(els.otherIncomeRepeat.value));
  els.otherIncomeCustomDatesField.classList.toggle('hidden', els.otherIncomeRepeat.value !== 'custom');
  renderOtherIncomeCalendar();
  selectedOtherIncomeTags = new Set(getEventTagIds(item || {}));
  els.incomeEditorEyebrow.textContent = item ? '修改记录' : '新建记录';
  els.incomeEditorTitle.textContent = item ? '编辑其他收入' : '记录其他收入';
  els.deleteOtherIncome.classList.toggle('hidden', !item);
  els.deleteOtherIncome.textContent = '删除记录';
  otherIncomeDeleteArmed = false;
  clearTimeout(otherIncomeDeleteTimer);
  renderOtherIncomeTagChoices();
  els.incomeEditor.classList.remove('hidden');
  setTimeout(() => els.otherIncomeName.focus(), 30);
}

function saveOtherIncomeRecord() {
  const id = els.otherIncomeId.value;
  const name = els.otherIncomeName.value.trim();
  const date = els.otherIncomeDate.value;
  const amount = Math.max(0, Number(els.otherIncomeAmount.value) || 0);
  if (!name) { els.otherIncomeName.focus(); return; }
  if (!date) { els.otherIncomeDate.focus(); return; }
  if (amount <= 0) { els.otherIncomeAmount.focus(); showToast('请输入大于 0 的收入金额'); return; }
  const repeat = els.otherIncomeRepeat.value || 'none';
  const repeatUntil = els.otherIncomeRepeatUntil.value || '';
  const repeatDates = [...otherIncomeRepeatDates].join(',');
  if (['daily','weekly','monthly','yearly'].includes(repeat) && (!repeatUntil || repeatUntil <= date)) { els.otherIncomeRepeatUntil.focus(); showToast('请选择晚于收入日期的重复结束日期'); return; }
  if (repeat === 'custom' && !repeatDates) { showToast('请在日历中选择至少一个重复日期'); return; }
  const item = state.otherIncome.find(record => record.id === id) || { id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `income-${Date.now()}` };
  Object.assign(item, { name, date, amount, note: els.otherIncomeNote.value.trim(), tagIds: [...selectedOtherIncomeTags], repeat, repeatUntil, repeatDates });
  if (!id) {
    state.otherIncome.push(item);
    if (repeat === 'custom') {
      const dates = [...new Set(repeatDates.split(',').filter(value => value && value !== date))];
      dates.forEach((dateValue, index) => state.otherIncome.push({ ...item, id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `income-${Date.now()}-${index}`, date: dateValue, repeat: 'none', repeatUntil: '', repeatDates: '' }));
    } else if (repeat !== 'none' && repeatUntil && repeatUntil > date) {
      const cursor = new Date(`${date}T00:00:00`); const end = new Date(`${repeatUntil}T00:00:00`); let guard = 0;
      while (guard++ < 500 && cursor < end) {
        if (repeat === 'daily') cursor.setDate(cursor.getDate() + 1);
        else if (repeat === 'weekly') cursor.setDate(cursor.getDate() + 7);
        else if (repeat === 'monthly') cursor.setMonth(cursor.getMonth() + 1);
        else cursor.setFullYear(cursor.getFullYear() + 1);
        if (cursor > end) break;
        state.otherIncome.push({ ...item, id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `income-${Date.now()}-${guard}`, date: toDateKey(cursor), repeat: 'none', repeatUntil: '' });
      }
    }
  }
  saveOtherIncome();
  els.incomeEditor.classList.add('hidden');
  renderOtherIncomePage();
  renderSummary();
  if (state.activePage === 'stats') renderStatsPage();
  showToast('其他收入已保存');
}

function deleteOtherIncomeRecord() {
  const id = els.otherIncomeId.value;
  if (!id) return;
  if (!otherIncomeDeleteArmed) {
    otherIncomeDeleteArmed = true;
    els.deleteOtherIncome.textContent = '再次点击确认';
    otherIncomeDeleteTimer = setTimeout(() => { otherIncomeDeleteArmed = false; els.deleteOtherIncome.textContent = '删除记录'; }, 3000);
    return;
  }
  state.otherIncome = state.otherIncome.filter(item => item.id !== id);
  saveOtherIncome();
  els.incomeEditor.classList.add('hidden');
  renderOtherIncomePage();
  renderSummary();
  showToast('其他收入已删除');
}

function renderTrashBadge() {
  const count = state.trash.reduce((sum, group) => sum + (group.events?.length || 0), 0);
  els.trashBadge.textContent = count;
  els.trashBadge.classList.toggle('hidden', count === 0);
}

function renderTrashPage() {
  els.trashList.innerHTML = state.trash.length ? state.trash.map(group => {
    const events = group.events || [];
    const event = events.find(item => !item.seriesId) || events[0] || {};
    const deletedAt = new Date(group.deletedAt);
    const dateText = Number.isNaN(deletedAt.getTime()) ? '' : `${deletedAt.getMonth() + 1}月${deletedAt.getDate()}日 ${String(deletedAt.getHours()).padStart(2, '0')}:${String(deletedAt.getMinutes()).padStart(2, '0')}`;
    return `<article class="trash-row"><div class="trash-icon">♲</div><div><b>${escapeHtml(event.title || '未命名日程')}</b><span>${escapeHtml(event.date || '')} ${escapeHtml(event.start || '')}${events.length > 1 ? ` · 含 ${events.length} 条重复日程` : ''}</span><small>${dateText} 删除</small></div><div class="trash-actions"><button class="button ghost" type="button" data-restore-trash="${group.id}">恢复</button><button class="button danger" type="button" data-delete-trash="${group.id}">彻底删除</button></div></article>`;
  }).join('') : '<div class="manager-empty spacious"><span>♲</span><b>回收站是空的</b><small>删除的日程会先保存在这里</small></div>';
}

function openManagerEditor(type, id = '') {
  els.managerEditor.classList.remove('over-income');
  const entity = type === 'tag' ? getTag(id) : getClient(id);
  els.managerEntityType.value = type;
  els.managerEntityId.value = entity?.id || '';
  els.managerEntityName.value = entity?.name || '';
  els.managerEditorEyebrow.textContent = entity ? '修改资料' : '新建资料';
  els.managerEditorTitle.textContent = `${entity ? '编辑' : '新建'}${type === 'tag' ? '标签' : '客户'}`;
  els.managerColorArea.classList.toggle('hidden', type !== 'tag');
  els.managerDeleteEntity.classList.toggle('hidden', !entity);
  els.managerDeleteEntity.textContent = type === 'tag' ? '删除标签' : '删除客户';
  managerDeleteArmed = false;
  clearTimeout(managerDeleteTimer);
  if (type === 'tag') renderManagerColors(entity?.color || TAG_COLORS[0]);
  els.managerEditor.classList.remove('hidden');
  setTimeout(() => els.managerEntityName.focus(), 30);
}

function renderManagerColors(selectedColor) {
  const color = selectedColor.toUpperCase();
  els.managerCustomColor.value = color;
  els.managerColorValue.textContent = color;
  els.managerColorPalette.innerHTML = TAG_COLORS.map(item => `<button class="color-swatch${item.toUpperCase() === color ? ' selected' : ''}" type="button" data-manager-color="${item}" style="--swatch:${item}" aria-label="${item}"></button>`).join('');
}

function saveManagerEntity() {
  const type = els.managerEntityType.value;
  const id = els.managerEntityId.value;
  const name = els.managerEntityName.value.trim();
  if (!name) { els.managerEntityName.focus(); return; }
  if (type === 'tag') {
    if (state.tags.some(item => item.name === name && item.id !== id)) { showToast('标签名称已存在'); return; }
    const tag = getTag(id) || { id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `tag-${Date.now()}` };
    tag.name = name; tag.color = els.managerCustomColor.value.toUpperCase();
    if (!id) state.tags.push(tag);
    saveTags();
  } else {
    if (state.clients.some(item => item.name === name && item.id !== id)) { showToast('客户名称已存在'); return; }
    const client = getClient(id) || { id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `client-${Date.now()}` };
    client.name = name;
    if (!id) state.clients.push(client);
    state.events.forEach(event => { if (event.clientId === client.id) event.client = name; });
    state.trash.forEach(group => group.events?.forEach(event => { if (event.clientId === client.id) event.client = name; }));
    saveClients(); saveEvents(); saveTrash();
  }
  els.managerEditor.classList.add('hidden');
  els.managerEditor.classList.remove('over-income');
  if (!els.incomeEditor.classList.contains('hidden')) renderOtherIncomeTagChoices();
  renderManagementPage();
  showToast('资料已保存');
}

function deleteManagerEntity() {
  const type = els.managerEntityType.value;
  const id = els.managerEntityId.value;
  if (!id) return;
  if (!managerDeleteArmed) {
    managerDeleteArmed = true;
    els.managerDeleteEntity.textContent = '再次点击确认';
    managerDeleteTimer = setTimeout(() => { managerDeleteArmed = false; els.managerDeleteEntity.textContent = type === 'tag' ? '删除标签' : '删除客户'; }, 3000);
    return;
  }
  if (type === 'tag') {
    state.tags = state.tags.filter(item => item.id !== id);
    state.events.forEach(event => removeTagFromEvent(event, id));
    state.otherIncome.forEach(item => removeTagFromEvent(item, id));
    state.trash.forEach(group => group.events?.forEach(event => removeTagFromEvent(event, id)));
    saveTags(); saveOtherIncome();
  } else {
    state.clients = state.clients.filter(item => item.id !== id);
    state.events.forEach(event => { if (event.clientId === id) { event.clientId = ''; event.client = ''; } });
    state.trash.forEach(group => group.events?.forEach(event => { if (event.clientId === id) { event.clientId = ''; event.client = ''; } }));
    saveClients();
  }
  saveEvents(); saveTrash();
  els.managerEditor.classList.add('hidden');
  els.managerEditor.classList.remove('over-income');
  if (!els.incomeEditor.classList.contains('hidden')) renderOtherIncomeTagChoices();
  renderManagementPage();
  showToast(type === 'tag' ? '标签已删除' : '客户已删除');
}

function restoreTrashGroup(id) {
  const group = state.trash.find(item => item.id === id);
  if (!group) return;
  const existingIds = new Set(state.events.map(event => event.id));
  (group.events || []).forEach(event => { if (!existingIds.has(event.id)) state.events.push(event); });
  state.trash = state.trash.filter(item => item.id !== id);
  saveEvents(); saveTrash();
  renderTrashPage(); renderTrashBadge();
  showToast('日程已恢复');
}

function permanentlyDeleteTrashGroup(id, button) {
  if (permanentTrashArmedId !== id) {
    permanentTrashArmedId = id;
    button.textContent = '再次点击确认';
    clearTimeout(permanentTrashTimer);
    permanentTrashTimer = setTimeout(() => { permanentTrashArmedId = null; if (button.isConnected) button.textContent = '彻底删除'; }, 3000);
    return;
  }
  state.trash = state.trash.filter(item => item.id !== id);
  permanentTrashArmedId = null;
  saveTrash(); renderTrashPage(); renderTrashBadge();
  showToast('已彻底删除');
}

function formatDuration(value) {
  const n = Number(value);
  return Number.isInteger(n) ? `${n}小时` : `${n}小时`;
}
function formatNumber(value) { return Number(value.toFixed(2)).toString(); }

function openCreate(dateKey = state.selectedDate, preset = {}) {
  const calendarScroll = document.getElementById('calendarScroll');
  const preservedScroll = preset.preserveScroll ? { top: calendarScroll.scrollTop, left: calendarScroll.scrollLeft, pageY: window.scrollY } : null;
  state.draftEvent = {
    id: '__draft__', title: '新日程', date: dateKey,
    start: preset.start || '19:00', duration: Number(preset.duration || .5),
    income: 0, client: '', clientId: '', note: '', tagId: '', tagIds: [], recurrence: null, workMode: preset.workMode || 'online'
  };
  activeEventId = '';
  state.selectedDate = dateKey;
  els.eventForm.reset();
  els.eventId.value = '__draft__';
  els.eventDate.value = dateKey;
  els.eventStart.value = state.draftEvent.start;
  els.eventDuration.value = state.draftEvent.duration;
  els.eventEnd.value = endTimeFromStartDuration(state.draftEvent.start, state.draftEvent.duration);
  els.eventIncome.value = '0';
  setWorkMode(state.draftEvent.workMode);
  renderTagOptions([]);
  renderClientOptions('');
  renderEventTemplates();
  setRepeatFields(null);
  els.dialogTitle.textContent = '新建日程';
  els.dialogEyebrow.textContent = '安排一段时间';
  els.deleteBtn.classList.add('hidden');
  setAutosaveStatus('修改后自动保存', '');
  render();
  showSidebarEditor();
  if (preservedScroll) requestAnimationFrame(() => {
    calendarScroll.scrollTop = preservedScroll.top;
    calendarScroll.scrollLeft = preservedScroll.left;
    window.scrollTo(0, preservedScroll.pageY);
  });
  setTimeout(() => els.eventTitle.focus({ preventScroll: true }), 50);
}

function openEdit(id) {
  if (id === '__draft__') { showSidebarEditor(); return; }
  if (state.draftEvent) {
    state.draftEvent = null;
    render();
  }
  const event = state.events.find(e => e.id === id);
  if (!event) return;
  activeEventId = id;
  els.eventId.value = event.id;
  els.eventTitle.value = event.title;
  els.eventDate.value = event.date;
  els.eventStart.value = event.start;
  els.eventDuration.value = event.duration;
  els.eventEnd.value = endTimeFromStartDuration(event.start, event.duration);
  els.eventIncome.value = event.income;
  setWorkMode(eventWorkMode(event));
  let clientId = event.clientId || '';
  if (!clientId && event.client) {
    const client = ensureClient(event.client);
    clientId = client.id;
    event.clientId = client.id;
    saveEvents();
  }
  renderClientOptions(clientId);
  els.eventNote.value = event.note || '';
  renderTagOptions(getEventTagIds(event));
  renderEventTemplates();
  setRepeatFields(event.recurrence || null);
  els.dialogTitle.textContent = '编辑日程';
  els.dialogEyebrow.textContent = '调整安排与收入';
  els.deleteBtn.classList.remove('hidden');
  setAutosaveStatus('修改后自动保存', '');
  showSidebarEditor();
}

function showSidebarEditor() {
  els.deletePopover.classList.add('hidden');
  els.dayOverview.classList.add('hidden');
  els.sidebarEditor.classList.remove('hidden');
}

function hideSidebarEditor() {
  els.deletePopover.classList.add('hidden');
  els.newTagEditor.classList.add('hidden');
  setTagMenuOpen(false);
  setClientMenuOpen(false);
  closeUnifiedPickers();
  els.clientEditor.classList.add('hidden');
  els.sidebarEditor.classList.add('hidden');
  els.dayOverview.classList.remove('hidden');
}

function setWorkMode(value = 'online') {
  document.querySelectorAll('input[name="eventWorkMode"]').forEach(input => { input.checked = input.value === eventWorkMode({ workMode: value }); });
}

function readWorkMode() {
  return document.querySelector('input[name="eventWorkMode"]:checked')?.value || 'online';
}

function cancelEditor() {
  const hadDraft = Boolean(state.draftEvent);
  state.draftEvent = null;
  hideSidebarEditor();
  renderPreservingPosition();
  if (hadDraft) showToast('未修改的日程没有保存');
}

function readEditorValues(id) {
  const start = els.eventStart.value || '00:00';
  const rawDuration = Number(els.eventDuration.value);
  const maxDuration = Math.max(.25, (24 * 60 - timeToMinutes(start)) / 60);
  const tagIds = parseSelectedTagIds();
  return {
    id,
    title: els.eventTitle.value.trim() || '新日程',
    date: els.eventDate.value,
    start,
    duration: clamp(Number.isFinite(rawDuration) ? rawDuration : .5, .25, maxDuration),
    income: Math.max(0, Number(els.eventIncome.value) || 0),
    clientId: els.eventClient.value,
    client: getClient(els.eventClient.value)?.name || '',
    note: els.eventNote.value.trim(),
    tagId: tagIds[0] || '',
    tagIds,
    recurrence: readRepeatFields(),
    workMode: readWorkMode()
  };
}

function renderTagOptions(selectedIds = []) {
  const requested = Array.isArray(selectedIds) ? selectedIds : String(selectedIds || '').split(',');
  const ids = [...new Set(requested)].filter(id => Boolean(getTag(id)));
  els.eventTag.value = ids.join(',');
  els.tagMenu.innerHTML = `<button class="tag-option${!ids.length ? ' selected' : ''}" type="button" data-tag-id="" role="option" aria-selected="${!ids.length}"><i class="tag-color-dot"></i><span>无标签</span><i class="check">${!ids.length ? '✓' : ''}</i></button>` +
    state.tags.map(tag => `<button class="tag-option${ids.includes(tag.id) ? ' selected' : ''}" type="button" data-tag-id="${tag.id}" role="option" aria-selected="${ids.includes(tag.id)}"><i class="tag-color-dot" style="background:${tag.color}"></i><span>${escapeHtml(tag.name)}</span><i class="check">${ids.includes(tag.id) ? '✓' : ''}</i></button>`).join('') +
    '<button class="tag-option new-option" type="button" data-tag-id="__new__"><b>＋</b><span>新建标签</span></button>';
  const tags = ids.map(getTag).filter(Boolean);
  els.selectedTagList.innerHTML = tags.length
    ? tags.map(tag => `<span class="selected-tag-chip" style="--tag-color:${tag.color}"><i></i><b>${escapeHtml(tag.name)}</b></span>`).join('')
    : '<i class="tag-color-dot"></i><b>无标签</b>';
}

function setTagMenuOpen(open) {
  els.tagPicker.classList.toggle('open', open);
  els.tagMenu.classList.toggle('hidden', !open);
  els.tagPickerButton.setAttribute('aria-expanded', String(open));
}

function selectTag(tagId) {
  if (tagId === '__new__') {
    setTagMenuOpen(false);
    openTagEditor(null);
    return;
  }
  let ids = parseSelectedTagIds();
  if (!tagId) ids = [];
  else if (ids.includes(tagId)) ids = ids.filter(id => id !== tagId);
  else ids.push(tagId);
  els.newTagEditor.classList.add('hidden');
  renderTagOptions(ids);
  setTagMenuOpen(Boolean(tagId));
  autoSaveFromEditor();
}

function openTagEditor(tagId) {
  const tag = getTag(tagId);
  editingTagId = tag?.id || null;
  tagDeleteArmed = false;
  clearTimeout(tagDeleteTimer);
  els.newTagName.value = tag?.name || '';
  els.newTagColor.value = tag?.color || TAG_COLORS[0];
  els.saveTagBtn.textContent = tag ? '保存修改' : '添加标签';
  els.deleteTagBtn.classList.toggle('hidden', !tag);
  els.deleteTagBtn.textContent = '删除标签';
  els.tagEditorHint.textContent = tag ? '正在编辑标签名称和颜色' : '选择一个容易辨认的颜色';
  els.newTagEditor.classList.remove('hidden');
  renderColorPalette(els.newTagColor.value);
  setTimeout(() => els.newTagName.focus(), 0);
}

function renderColorPalette(selectedColor = TAG_COLORS[0]) {
  els.newTagColor.value = selectedColor;
  els.customTagColor.value = selectedColor;
  els.customColorValue.textContent = selectedColor.toUpperCase();
  els.tagColorPalette.innerHTML = TAG_COLORS.map(color => `<button class="color-swatch${color === selectedColor ? ' selected' : ''}" type="button" data-color="${color}" style="--swatch:${color}" aria-label="选择颜色 ${color}"></button>`).join('');
}

function addNewTag() {
  const name = els.newTagName.value.trim();
  if (!name) { els.newTagName.focus(); return; }
  const editing = getTag(editingTagId);
  const sameName = state.tags.find(tag => tag.name === name && tag.id !== editingTagId);
  if (sameName) { els.tagEditorHint.textContent = '这个标签名称已经存在'; return; }
  const tag = editing || {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `tag-${Date.now()}`,
    name: '', color: ''
  };
  tag.name = name;
  tag.color = els.newTagColor.value;
  if (!editing) state.tags.push(tag);
  saveTags();
  const selectedIds = parseSelectedTagIds();
  if (!editing) selectedIds.push(tag.id);
  renderTagOptions(selectedIds);
  els.newTagEditor.classList.add('hidden');
  els.newTagName.value = '';
  if (!editing) autoSaveFromEditor();
  else { renderSelectedDay(); showToast('标签已更新'); }
  editingTagId = null;
  refreshCalendarPreservingScroll();
}

function deleteEditingTag() {
  const tag = getTag(editingTagId);
  if (!tag) return;
  if (!tagDeleteArmed) {
    tagDeleteArmed = true;
    els.deleteTagBtn.textContent = '再次点击确认';
    els.tagEditorHint.textContent = `删除后，“${tag.name}”将从所有日程中移除`;
    clearTimeout(tagDeleteTimer);
    tagDeleteTimer = setTimeout(() => {
      tagDeleteArmed = false;
      els.deleteTagBtn.textContent = '删除标签';
      els.tagEditorHint.textContent = '正在编辑标签名称和颜色';
    }, 3000);
    return;
  }
  state.tags = state.tags.filter(item => item.id !== tag.id);
  state.events.forEach(event => removeTagFromEvent(event, tag.id));
  state.otherIncome.forEach(item => removeTagFromEvent(item, tag.id));
  state.trash.forEach(group => group.events?.forEach(event => removeTagFromEvent(event, tag.id)));
  if (state.draftEvent) removeTagFromEvent(state.draftEvent, tag.id);
  const selectedIds = parseSelectedTagIds().filter(id => id !== tag.id);
  saveTags(); saveEvents(); saveOtherIncome(); saveTrash();
  editingTagId = null;
  tagDeleteArmed = false;
  clearTimeout(tagDeleteTimer);
  els.newTagEditor.classList.add('hidden');
  renderTagOptions(selectedIds);
  render();
  showToast('标签已删除，日程内容保留');
}

function clientAvatarColor(name = '') {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TAG_COLORS[hash % TAG_COLORS.length];
}

function ensureClient(name) {
  let client = state.clients.find(item => item.name === name);
  if (!client) {
    client = { id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `client-${Date.now()}`, name };
    state.clients.push(client);
    saveClients();
  }
  return client;
}

function renderClientOptions(selectedId = '') {
  els.eventClient.value = state.clients.some(client => client.id === selectedId) ? selectedId : '';
  els.clientMenu.innerHTML = `<button class="client-option${!els.eventClient.value ? ' selected' : ''}" type="button" data-client-id=""><i class="client-avatar">—</i><span>无客户</span><i>${!els.eventClient.value ? '✓' : ''}</i></button>` +
    state.clients.map(client => `<button class="client-option${client.id === els.eventClient.value ? ' selected' : ''}" type="button" data-client-id="${client.id}"><i class="client-avatar" style="--avatar:${clientAvatarColor(client.name)}">${escapeHtml(client.name.slice(0, 1))}</i><span>${escapeHtml(client.name)}</span><i>${client.id === els.eventClient.value ? '✓' : ''}</i></button>`).join('') +
    '<button class="client-option new-option" type="button" data-client-id="__new__"><b>＋</b><span>新建客户</span></button>';
  const client = getClient(els.eventClient.value);
  els.selectedClientName.textContent = client?.name || '无客户';
  els.selectedClientAvatar.textContent = client?.name.slice(0, 1) || '—';
  els.selectedClientAvatar.style.setProperty('--avatar', client ? clientAvatarColor(client.name) : '#A8AAA3');
}

function setClientMenuOpen(open) {
  els.clientPicker.classList.toggle('open', open);
  els.clientMenu.classList.toggle('hidden', !open);
  els.clientPickerButton.setAttribute('aria-expanded', String(open));
}

function selectClient(clientId) {
  setClientMenuOpen(false);
  if (clientId === '__new__') { openClientEditor(null); return; }
  els.eventClient.value = clientId;
  els.clientEditor.classList.add('hidden');
  renderClientOptions(clientId);
  autoSaveFromEditor();
}

function openClientEditor(clientId) {
  const client = getClient(clientId);
  editingClientId = client?.id || null;
  clientDeleteArmed = false;
  clearTimeout(clientDeleteTimer);
  els.clientNameInput.value = client?.name || '';
  els.saveClientBtn.textContent = client ? '保存修改' : '添加客户';
  els.deleteClientBtn.classList.toggle('hidden', !client);
  els.deleteClientBtn.textContent = '删除客户';
  els.clientEditorHint.textContent = client ? '正在编辑客户资料' : '客户保存后可以重复选择';
  els.clientEditor.classList.remove('hidden');
  setTimeout(() => els.clientNameInput.focus(), 0);
}

function saveClientEditor() {
  const name = els.clientNameInput.value.trim();
  if (!name) { els.clientNameInput.focus(); return; }
  const editing = getClient(editingClientId);
  const sameName = state.clients.find(client => client.name === name && client.id !== editingClientId);
  if (sameName) { els.clientEditorHint.textContent = '这个客户已经存在'; return; }
  const previousName = editing?.name;
  const client = editing || { id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `client-${Date.now()}`, name: '' };
  client.name = name;
  if (!editing) state.clients.push(client);
  if (editing) state.events.forEach(event => { if (event.clientId === client.id) event.client = name; });
  saveClients(); saveEvents();
  const selectedId = editing ? els.eventClient.value : client.id;
  renderClientOptions(selectedId);
  els.clientEditor.classList.add('hidden');
  editingClientId = null;
  if (!editing) autoSaveFromEditor();
  else { renderSelectedDay(); showToast(`${previousName}已更新为${name}`); }
}

function deleteEditingClient() {
  const client = getClient(editingClientId);
  if (!client) return;
  if (!clientDeleteArmed) {
    clientDeleteArmed = true;
    els.deleteClientBtn.textContent = '再次点击确认';
    els.clientEditorHint.textContent = `将从日程中移除客户“${client.name}”`;
    clientDeleteTimer = setTimeout(() => { clientDeleteArmed = false; els.deleteClientBtn.textContent = '删除客户'; els.clientEditorHint.textContent = '正在编辑客户资料'; }, 3000);
    return;
  }
  state.clients = state.clients.filter(item => item.id !== client.id);
  state.events.forEach(event => { if (event.clientId === client.id) { event.clientId = ''; event.client = ''; } });
  if (state.draftEvent?.clientId === client.id) { state.draftEvent.clientId = ''; state.draftEvent.client = ''; }
  if (els.eventClient.value === client.id) els.eventClient.value = '';
  saveClients(); saveEvents();
  clearTimeout(clientDeleteTimer);
  editingClientId = null;
  els.clientEditor.classList.add('hidden');
  renderClientOptions(els.eventClient.value);
  render();
  showToast('客户已删除，日程内容保留');
}

function setRepeatFields(rule) {
  const frequency = rule?.frequency || 'none';
  const explicitDates = Array.isArray(rule?.dates) ? rule.dates.filter(isValidDateKey) : [];
  const custom = Boolean(rule && (Number(rule.interval) !== 1 || explicitDates.length || !rule.frequency));
  els.eventRepeat.value = rule ? (custom ? 'custom' : frequency) : 'none';
  els.repeatInterval.value = rule?.interval || 2;
  els.repeatUnit.value = frequency === 'none' ? 'weekly' : frequency;
  els.repeatUseFrequency.checked = Boolean(rule?.frequency ?? false);
  els.repeatUntil.value = rule?.until || '';
  selectedRepeatDates = new Set(explicitDates);
  els.repeatDatesInput.value = explicitDates.join(', ');
  const calendarAnchor = explicitDates[0] || els.eventDate.value || toDateKey(new Date());
  repeatCalendarDate = fromDateKey(calendarAnchor);
  updateRepeatEditor();
  renderUnifiedPickerMenus();
}

function updateRepeatEditor() {
  const value = els.eventRepeat.value;
  els.repeatEditor.classList.toggle('hidden', value === 'none');
  els.repeatCustom.classList.toggle('hidden', value !== 'custom');
  const useFrequency = value !== 'custom' || els.repeatUseFrequency.checked;
  els.repeatFrequencyFields.classList.toggle('hidden', !useFrequency);
  els.repeatUntil.closest('label').classList.toggle('hidden', value === 'custom' && !useFrequency);
  if (value === 'custom') renderRepeatCalendar();
}

function readRepeatFields() {
  const value = els.eventRepeat.value;
  if (value === 'none') return null;
  const custom = value === 'custom';
  const dates = custom ? parseRepeatDateList(els.repeatDatesInput.value).dates : [];
  const useFrequency = !custom || els.repeatUseFrequency.checked;
  if (custom && !useFrequency && !dates.length) return null;
  return {
    frequency: useFrequency ? (custom ? els.repeatUnit.value : value) : null,
    interval: custom ? Math.max(1, Number(els.repeatInterval.value) || 1) : 1,
    until: useFrequency ? (els.repeatUntil.value || '') : '',
    dates
  };
}

function isValidDateKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key || '')) return false;
  const date = fromDateKey(key);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === key;
}

function parseRepeatDateList(value) {
  const year = fromDateKey(els.eventDate.value || toDateKey(new Date())).getFullYear();
  const invalid = [];
  const dates = [];
  String(value || '').split(/[\s,，;；]+/).filter(Boolean).forEach(token => {
    const full = token.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    const short = token.match(/^(\d{1,2})[-/.](\d{1,2})$/);
    const key = full
      ? `${full[1]}-${String(full[2]).padStart(2, '0')}-${String(full[3]).padStart(2, '0')}`
      : short ? `${year}-${String(short[1]).padStart(2, '0')}-${String(short[2]).padStart(2, '0')}` : '';
    if (isValidDateKey(key)) dates.push(key); else invalid.push(token);
  });
  return { dates: [...new Set(dates)].sort(), invalid };
}

function syncRepeatDatesFromInput() {
  const parsed = parseRepeatDateList(els.repeatDatesInput.value);
  selectedRepeatDates = new Set(parsed.dates);
  els.repeatDatesHint.textContent = parsed.invalid.length
    ? `未识别：${parsed.invalid.join('、')}，请使用 2026-09-01 或 9.1`
    : `已选择 ${parsed.dates.length} 个指定日期，也可以点击上面的日期`;
  els.repeatDatesHint.classList.toggle('error', parsed.invalid.length > 0);
  renderRepeatCalendar();
}

function writeRepeatDates() {
  const dates = [...selectedRepeatDates].sort();
  els.repeatDatesInput.value = dates.join(', ');
  els.repeatDatesHint.textContent = `已选择 ${dates.length} 个指定日期，也可以手动输入`;
  els.repeatDatesHint.classList.remove('error');
  els.repeatDatesInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function renderRepeatCalendar() {
  const year = repeatCalendarDate.getFullYear();
  const month = repeatCalendarDate.getMonth();
  els.repeatCalendarTitle.textContent = `${year}年 ${month + 1}月`;
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const baseKey = els.eventDate.value;
  els.repeatCalendar.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    return `<button type="button" data-repeat-date="${key}" class="${date.getMonth() !== month ? 'outside ' : ''}${selectedRepeatDates.has(key) ? 'selected ' : ''}${key === baseKey ? 'base' : ''}" ${key === baseKey ? 'disabled' : ''}>${date.getDate()}</button>`;
  }).join('');
}

function addIntervalDate(base, frequency, amount) {
  const result = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (frequency === 'daily') result.setDate(result.getDate() + amount);
  else if (frequency === 'weekly') result.setDate(result.getDate() + amount * 7);
  else if (frequency === 'monthly') {
    const target = new Date(base.getFullYear(), base.getMonth() + amount, 1);
    target.setDate(Math.min(base.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
    return target;
  } else if (frequency === 'yearly') {
    result.setFullYear(result.getFullYear() + amount);
    if (result.getMonth() !== base.getMonth()) result.setDate(0);
  }
  return result;
}

function syncRecurrenceSeries(event) {
  if (!event || event.seriesId) return;
  state.events = state.events.filter(item => item.seriesId !== event.id);
  const rule = event.recurrence;
  if (!rule) return;
  const base = fromDateKey(event.date);
  const oneYear = new Date(base.getFullYear() + 1, base.getMonth(), base.getDate());
  const requestedUntil = rule.until ? fromDateKey(rule.until) : oneYear;
  const until = requestedUntil < oneYear ? requestedUntil : oneYear;
  const occurrenceDates = new Set((rule.dates || []).filter(key => isValidDateKey(key) && key !== event.date));
  if (rule.frequency) {
    for (let index = 1; index <= 400; index++) {
      const date = addIntervalDate(base, rule.frequency, Math.max(1, Number(rule.interval) || 1) * index);
      if (date > until) break;
      occurrenceDates.add(toDateKey(date));
    }
  }
  [...occurrenceDates].sort().slice(0, 400).forEach((date, index) => {
    state.events.push({ ...event, id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${event.id}-${index}-${Date.now()}`, date, recurrence: null, seriesId: event.id });
  });
}

function promoteDraftToSaved() {
  if (!state.draftEvent) return null;
  const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  Object.assign(state.draftEvent, readEditorValues(id));
  const saved = state.draftEvent;
  state.events.push(saved);
  syncRecurrenceSeries(saved);
  state.draftEvent = null;
  els.eventId.value = id;
  els.dialogTitle.textContent = '编辑日程';
  els.dialogEyebrow.textContent = '更改会自动保存';
  els.deleteBtn.classList.remove('hidden');
  saveEvents();
  return saved;
}

function autoSaveFromEditor(e) {
  if (e?.target?.closest?.('.new-tag-editor')) return;
  if (e?.target?.closest?.('.client-editor')) return;
  const editingDraft = Boolean(state.draftEvent);
  let event;
  if (editingDraft) {
    Object.assign(state.draftEvent, readEditorValues('__draft__'));
    event = promoteDraftToSaved();
  } else {
    event = state.events.find(item => item.id === els.eventId.value);
    if (!event) return;
    Object.assign(event, readEditorValues(event.id));
    syncRecurrenceSeries(event);
    saveEvents();
  }
  state.selectedDate = event.date;
  const date = fromDateKey(event.date);
  state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
  refreshCalendarPreservingScroll();
  renderSummary();
  renderContributionGraph();
  setAutosaveStatus('已自动保存', 'saved');
}

function submitEvent(e) {
  e.preventDefault();
}

function refreshCalendarPreservingScroll() {
  const scroll = document.getElementById('calendarScroll');
  const top = scroll.scrollTop;
  const left = scroll.scrollLeft;
  renderCalendar();
  requestAnimationFrame(() => { scroll.scrollTop = top; scroll.scrollLeft = left; });
}

function setAutosaveStatus(message, className) {
  els.autosaveStatus.textContent = message;
  els.autosaveStatus.className = `autosave-status${className ? ` ${className}` : ''}`;
}

function naturalDateKey(year, month, day) {
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const key = toDateKey(date);
  return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day) ? key : '';
}

function addNaturalDateRange(target, startKey, endKey) {
  if (!startKey || !endKey) return;
  const start = fromDateKey(startKey);
  let end = fromDateKey(endKey);
  if (end < start) end = new Date(end.getFullYear() + 1, end.getMonth(), end.getDate());
  const maxEnd = new Date(start.getFullYear() + 2, start.getMonth(), start.getDate());
  if (end > maxEnd) return;
  for (const date = new Date(start); date <= end && target.size < 732; date.setDate(date.getDate() + 1)) target.add(toDateKey(date));
}

function extractNaturalDates(text, now = new Date()) {
  const dates = new Set();
  const currentYear = now.getFullYear();
  const fullRange = /(\d{4})[年/.\-](\d{1,2})[月/.\-](\d{1,2})日?\s*(?:至|到|~|—|–|-)\s*(?:(\d{4})[年/.\-])?(\d{1,2})[月/.\-](\d{1,2})日?/g;
  for (const match of text.matchAll(fullRange)) {
    addNaturalDateRange(dates, naturalDateKey(match[1], match[2], match[3]), naturalDateKey(match[4] || match[1], match[5], match[6]));
  }
  const shortRange = /(\d{1,2})(?:月|[/.])(\d{1,2})日?\s*(?:至|到|~|—|–|-)\s*(\d{1,2})(?:月|[/.])(\d{1,2})日?/g;
  for (const match of text.matchAll(shortRange)) {
    addNaturalDateRange(dates, naturalDateKey(currentYear, match[1], match[2]), naturalDateKey(currentYear, match[3], match[4]));
  }
  const fullToken = /(\d{4})[年/.\-](\d{1,2})[月/.\-](\d{1,2})日?/g;
  for (const match of text.matchAll(fullToken)) {
    const key = naturalDateKey(match[1], match[2], match[3]);
    if (key) dates.add(key);
  }
  const monthToken = /(\d{1,2})月(\d{1,2})日?/g;
  for (const match of text.matchAll(monthToken)) {
    const key = naturalDateKey(currentYear, match[1], match[2]);
    if (key) dates.add(key);
  }
  const shortToken = /\b(\d{1,2})[./](\d{1,2})(?!\d|\s*(?:小时|h\b|元))/gi;
  for (const match of text.matchAll(shortToken)) {
    const key = naturalDateKey(currentYear, match[1], match[2]);
    if (key) dates.add(key);
  }
  return [...dates].sort();
}

function parseNaturalLanguage(text) {
  const now = new Date();
  let date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dates = extractNaturalDates(text, now);
  let hasDate = dates.length > 0;
  if (dates.length) date = fromDateKey(dates[0]);
  else if (/后天/.test(text)) { date.setDate(date.getDate() + 2); hasDate = true; }
  else if (/明天/.test(text)) { date.setDate(date.getDate() + 1); hasDate = true; }
  else if (/今天/.test(text)) { hasDate = true; }
  else {
    const week = text.match(/(?:周|星期)([一二三四五六日天])/);
    if (week) {
      const target = '一二三四五六日'.indexOf(week[1] === '天' ? '日' : week[1]) + 1;
      const current = date.getDay() || 7;
      date.setDate(date.getDate() + ((target - current + 7) % 7));
      hasDate = true;
    }
  }
  if (!dates.length) dates = [toDateKey(date)];

  let hour = 9;
  let minute = 0;
  let hasTime = false;
  let endMinutes = null;
  const timeText = text
    .replace(/\d{4}[年/.\-]\d{1,2}[月/.\-]\d{1,2}日?\s*(?:至|到|~|—|–|-)\s*(?:(?:\d{4})[年/.\-])?\d{1,2}[月/.\-]\d{1,2}日?/g, ' ')
    .replace(/\d{1,2}(?:月|[/.])\d{1,2}日?\s*(?:至|到|~|—|–|-)\s*\d{1,2}(?:月|[/.])\d{1,2}日?/g, ' ')
    .replace(/\d{4}[年/.\-]\d{1,2}[月/.\-]\d{1,2}日?/g, ' ')
    .replace(/\d{1,2}月\d{1,2}日?/g, ' ')
    .replace(/\b\d{1,2}[./]\d{1,2}\b/g, ' ');
  const timeRange = timeText.match(/(上午|下午|晚上|中午|早上|凌晨)?\s*(\d{1,2})(?:[:：](\d{2})|点(?:(半)|(\d{1,2})分)?)\s*(?:-|—|–|~|至|到)\s*(上午|下午|晚上|中午|早上|凌晨)?\s*(\d{1,2})(?:[:：](\d{2})|点(?:(半)|(\d{1,2})分)?)/);
  const clock = timeText.match(/(?:上午|下午|晚上|中午|早上|凌晨)?\s*(\d{1,2})[:：](\d{2})/);
  const point = timeText.match(/(上午|下午|晚上|中午|早上|凌晨)?\s*(\d{1,2})点(?:(半)|(\d{1,2})分)?/);
  const normalizeHour = (h, prefix = '') => {
    let value = Number(h);
    if (/下午|晚上/.test(prefix) && value < 12) value += 12;
    if (prefix === '中午' && value < 11) value += 12;
    return value;
  };
  if (timeRange) {
    const startPrefix = timeRange[1] || '';
    const endPrefix = timeRange[6] || startPrefix;
    hour = normalizeHour(timeRange[2], startPrefix);
    minute = timeRange[4] ? 30 : Number(timeRange[3] || timeRange[5] || 0);
    const endHour = normalizeHour(timeRange[7], endPrefix);
    const endMinute = timeRange[9] ? 30 : Number(timeRange[8] || timeRange[10] || 0);
    endMinutes = endHour * 60 + endMinute;
    hasTime = true;
  } else if (clock) {
    hour = Number(clock[1]); minute = Number(clock[2]);
    const prefix = clock[0].match(/上午|下午|晚上|中午|早上|凌晨/)?.[0] || '';
    hour = normalizeHour(hour, prefix);
    hasTime = true;
  } else if (point) {
    hour = Number(point[2]); minute = point[3] ? 30 : Number(point[4] || 0);
    hour = normalizeHour(hour, point[1] || '');
    hasTime = true;
  }

  let duration = .5;
  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:小时|h\b)/i);
  const minutes = text.match(/(\d+)\s*分钟/);
  if (endMinutes !== null) {
    let startMinutes = hour * 60 + minute;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    duration = Math.max(.25, (endMinutes - startMinutes) / 60);
  } else if (hours) duration = Number(hours[1]);
  else if (minutes) duration = Math.max(.25, Number(minutes[1]) / 60);
  else if (/半小时/.test(text)) duration = .5;

  const incomeMatch = text.match(/(?:收入|收费|课时费|¥|￥)\s*(\d+(?:\.\d+)?)/) || text.match(/(\d+(?:\.\d+)?)\s*元/);
  const clientMatch = text.match(/给\s*([^，,。\s]{1,12}?)(?:上|补|辅导|讲)/);
  const tags = state.tags.filter(item => text.includes(item.name) || text.includes(`#${item.name}`));
  const workMode = /线下|到店|上门|面授/.test(text) ? 'offline' : 'online';
  let title = text
    .replace(/\d{4}[年/.\-]\d{1,2}[月/.\-]\d{1,2}日?/g, '')
    .replace(/(^|[^\d])\d{1,2}[./\-]\d{1,2}(?!\d)/g, '$1')
    .replace(/\d{1,2}月\d{1,2}日?/g, '').replace(/今天|明天|后天|(?:周|星期)[一二三四五六日天]/g, '')
    .replace(/(?:上午|下午|晚上|中午|早上|凌晨)?\s*\d{1,2}(?:[:：]\d{2}|点(?:半|\d{1,2}分)?)\s*(?:-|—|–|~|至|到)\s*(?:上午|下午|晚上|中午|早上|凌晨)?\s*\d{1,2}(?:[:：]\d{2}|点(?:半|\d{1,2}分)?)/g, '')
    .replace(/(?:上午|下午|晚上|中午|早上|凌晨)?\s*\d{1,2}(?::\d{2}|点(?:半|\d{1,2}分)?)/g, '')
    .replace(/\d+(?:\.\d+)?\s*(?:小时|h\b|分钟)/gi, '').replace(/半小时/g, '')
    .replace(/(?:收入|收费|课时费)\s*[¥￥]?\s*\d+(?:\.\d+)?\s*元?/g, '')
    .replace(/[¥￥]\s*\d+(?:\.\d+)?/g, '').replace(/\d+(?:\.\d+)?\s*元/g, '')
    .replace(/线上|线下|到店|上门|面授/g, '')
    .replace(/\s*(?:至|到|~|—|–|-)\s*/g, ' ')
    .replace(/请|帮我|安排|添加|创建|一个|日程/g, '').replace(/[，,。；;]+/g, ' ').replace(/\s+/g, ' ').trim();
  tags.forEach(tag => { title = title.replace(`#${tag.name}`, '').replace(tag.name, '').replace(/\s+/g, ' ').trim(); });
  if (!title) title = '新日程';
  return {
    title, date: dates[0], dates, start: minutesToTime(hour * 60 + minute),
    duration, income: incomeMatch ? Number(incomeMatch[1]) : 0,
    client: clientMatch?.[1] || '', tagId: tags[0]?.id || '', tagIds: tags.map(tag => tag.id),
    workMode, hasDate, hasTime, hasIncome: Boolean(incomeMatch)
  };
}

function createFromNaturalLanguage() {
  const text = els.nlInput.value.trim();
  if (!text) { els.nlInput.focus(); return; }
  const parsed = parseNaturalLanguage(text);
  const missing = [];
  if (!parsed.hasDate) missing.push('日期');
  if (!parsed.hasTime) missing.push('时间');
  if (!parsed.hasIncome) missing.push('收入');
  if (missing.length) {
    showToast(`请补充${missing.join('、')}后再创建`);
    els.nlInput.focus();
    return;
  }
  openCreate(parsed.date, { start: parsed.start, duration: parsed.duration });
  els.eventTitle.value = parsed.title;
  els.eventIncome.value = parsed.income;
  setWorkMode(parsed.workMode);
  if (parsed.client) {
    const client = ensureClient(parsed.client);
    renderClientOptions(client.id);
  } else renderClientOptions('');
  renderTagOptions(parsed.tagIds || (parsed.tagId ? [parsed.tagId] : []));
  autoSaveFromEditor();
  const firstEvent = state.events.find(event => event.id === els.eventId.value);
  if (firstEvent && parsed.dates.length > 1) {
    parsed.dates.slice(1).forEach((date, index) => {
      state.events.push({
        ...firstEvent,
        id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `nl-${Date.now()}-${index}-${Math.random()}`,
        date,
        recurrence: null,
        seriesId: undefined
      });
    });
    saveEvents();
    refreshCalendarPreservingScroll();
    renderSummary();
    renderContributionGraph();
  }
  const count = parsed.dates.length;
  setAutosaveStatus(count > 1 ? `已识别并创建 ${count} 天日程，可继续修改` : '已识别并自动保存，可继续修改', 'saved');
  els.nlInput.value = '';
  els.nlPanel.classList.add('hidden');
  showToast(count > 1 ? `已创建 ${count} 天日程` : '已从文字识别日程');
}

function deleteEvent() {
  els.deletePopover.classList.toggle('hidden');
}

function confirmDeleteEvent() {
  const id = els.eventId.value;
  softDeleteEventById(id);
}

function softDeleteEventById(id) {
  if (!id || id === '__draft__') return;
  const deleting = state.events.filter(event => event.id === id || event.seriesId === id);
  if (!deleting.length) return;
  state.trash.unshift({
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `trash-${Date.now()}`,
    deletedAt: new Date().toISOString(),
    events: deleting
  });
  state.events = state.events.filter(event => event.id !== id && event.seriesId !== id);
  saveEvents(); saveTrash();
  if (deleting.some(event => event.id === els.eventId.value)) hideSidebarEditor();
  activeEventId = '';
  hideCalendarContextMenu();
  renderPreservingPosition();
  showToast('日程已移入回收站');
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
}

document.getElementById('prevMonth').addEventListener('click', () => {
  if (state.viewMode === 'week') {
    navigateWeek(-1);
    return;
  } else {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
    state.selectedDate = toDateKey(state.viewDate);
  }
  render();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  if (state.viewMode === 'week') {
    navigateWeek(1);
    return;
  } else {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
    state.selectedDate = toDateKey(state.viewDate);
  }
  render();
});
document.getElementById('monthViewBtn').addEventListener('click', () => setViewMode('month'));
document.getElementById('weekViewBtn').addEventListener('click', () => setViewMode('week'));
els.monthTitle.addEventListener('click', () => setDateNavigatorOpen(els.dateNavigator.classList.contains('hidden')));
els.monthTitle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDateNavigatorOpen(els.dateNavigator.classList.contains('hidden')); } });
els.dateNavigatorPrev.addEventListener('click', () => { dateNavigatorDate = new Date(dateNavigatorDate.getFullYear(), dateNavigatorDate.getMonth() - 1, 1); renderDateNavigator(); });
els.dateNavigatorNext.addEventListener('click', () => { dateNavigatorDate = new Date(dateNavigatorDate.getFullYear(), dateNavigatorDate.getMonth() + 1, 1); renderDateNavigator(); });
els.dateNavigatorToday.addEventListener('click', () => selectNavigatorDate(toDateKey(new Date())));
els.dateNavigatorGrid.addEventListener('click', e => { const button = e.target.closest('[data-navigator-date]'); if (button) selectNavigatorDate(button.dataset.navigatorDate); });
els.weekPrevButton.addEventListener('click', () => navigateWeek(-1));
els.weekNextButton.addEventListener('click', () => navigateWeek(1));
document.getElementById('calendarScroll').addEventListener('wheel', e => {
  if (state.viewMode !== 'week' || !e.shiftKey || weekWheelLocked) return;
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (Math.abs(delta) < 4) return;
  e.preventDefault();
  weekWheelLocked = true;
  navigateWeek(delta > 0 ? 1 : -1);
  setTimeout(() => { weekWheelLocked = false; }, 450);
}, { passive: false });
document.getElementById('todayBtn').addEventListener('click', () => {
  state.viewDate = new Date(); state.selectedDate = toDateKey(new Date()); render();
});
document.querySelector('.brand').addEventListener('click', e => {
  e.preventDefault(); state.viewDate = new Date(); state.selectedDate = toDateKey(new Date()); showPage('calendar');
});
els.menuBtn.addEventListener('click', () => setDrawerOpen(!els.sideDrawer.classList.contains('open')));
els.closeDrawer.addEventListener('click', () => setDrawerOpen(false));
els.drawerScrim.addEventListener('click', () => setDrawerOpen(false));
els.overviewToggle.addEventListener('click', toggleOverview);
els.backToCalendar.addEventListener('click', () => showPage('calendar'));
els.setIncomeTarget.addEventListener('click', e => { e.stopPropagation(); openIncomeTargetEditor(); });
els.incomeTargetPopover.addEventListener('click', e => e.stopPropagation());
els.cancelIncomeTarget.addEventListener('click', () => els.incomeTargetPopover.classList.add('hidden'));
els.saveIncomeTarget.addEventListener('click', saveIncomeTargetValue);
els.incomeTargetInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveIncomeTargetValue(); });
els.exportWeekBtn.addEventListener('click', openWeekExport);
els.backFromExport.addEventListener('click', () => showPage('calendar'));
els.exportWeekPrev.addEventListener('click', () => changeExportWeek(-1));
els.exportWeekNext.addEventListener('click', () => changeExportWeek(1));
document.querySelectorAll('[data-export-mode]').forEach(button => button.addEventListener('click', () => { exportMode = button.dataset.exportMode; renderWeekExport(); }));
document.querySelectorAll('[data-export-period]').forEach(button => button.addEventListener('click', () => { exportPeriod = button.dataset.exportPeriod; renderWeekExport(); }));
document.querySelectorAll('[data-export-layout]').forEach(button => button.addEventListener('click', () => { exportLayout = button.dataset.exportLayout; renderWeekExport(); }));
els.exportClientChoices.addEventListener('click', e => { const button = e.target.closest('[data-export-client]'); if (button) { exportClientId = button.dataset.exportClient; renderWeekExport(); } });
els.copyWeekExport.addEventListener('click', copyWeekExportText);
els.printWeekExport.addEventListener('click', printWeekExport);
els.exportHideTitle.addEventListener('change', () => { exportHideTitle = els.exportHideTitle.checked; renderWeekExport(); });
els.exportHideClient.addEventListener('change', () => { exportHideClient = els.exportHideClient.checked; renderWeekExport(); });
els.eventTemplate.addEventListener('change', () => { if (els.eventTemplate.value) applyEventTemplate(els.eventTemplate.value); });
els.saveEventTemplate.addEventListener('click', saveCurrentEventTemplate);
els.deleteEventTemplate.addEventListener('click', deleteEventTemplate);
document.querySelectorAll('.drawer-nav [data-page]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
document.querySelectorAll('.summary-card[data-stat-focus]').forEach(card => {
  const open = () => showPage('stats', card.dataset.statFocus);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } });
});
els.statsYear.addEventListener('change', () => { state.statsYear = clamp(Number(els.statsYear.value) || new Date().getFullYear(), 2000, 2100); state.statFocus = ''; renderStatsPage(); });
els.statsMonth.addEventListener('change', () => { state.statsMonth = Number(els.statsMonth.value); state.statFocus = ''; renderStatsPage(); });
document.querySelectorAll('[data-stats-period]').forEach(button => button.addEventListener('click', () => { statsPeriod = button.dataset.statsPeriod; statsBreakdownPeriod = statsPeriod === 'year' ? 'year' : 'month'; renderStatsPage(); }));
els.statsRangeStart.addEventListener('change', renderStatsPage);
els.statsRangeEnd.addEventListener('change', renderStatsPage);
document.querySelectorAll('[data-breakdown-period]').forEach(button => button.addEventListener('click', () => { statsBreakdownPeriod = button.dataset.breakdownPeriod; renderStatsPage(); }));
document.querySelectorAll('[data-breakdown-type]').forEach(button => button.addEventListener('click', () => { statsBreakdownType = button.dataset.breakdownType; renderStatsPage(); }));
els.incomeYear.addEventListener('change', () => { state.incomeYear = clamp(Number(els.incomeYear.value) || new Date().getFullYear(), 2000, 2100); renderOtherIncomePage(); });
els.incomeMonth.addEventListener('change', () => { state.incomeMonth = Number(els.incomeMonth.value) || 1; renderOtherIncomePage(); });
els.contributionTagFilters.addEventListener('click', e => { const button = e.target.closest('[data-contribution-tag]'); if (button) { contributionTagFilter = button.dataset.contributionTag; renderContributionGraph(); } });
els.contributionGraph.addEventListener('click', e => { const cell = e.target.closest('[data-contribution-date]'); if (!cell || cell.classList.contains('future')) return; state.selectedDate = cell.dataset.contributionDate; state.viewDate = fromDateKey(state.selectedDate); showPage('calendar'); });
els.contributionMultiYear.addEventListener('click', e => { const cell = e.target.closest('[data-contribution-date]'); if (!cell || cell.classList.contains('future')) return; state.selectedDate = cell.dataset.contributionDate; state.viewDate = fromDateKey(state.selectedDate); showPage('calendar'); });
els.managerAddTag.addEventListener('click', () => openManagerEditor('tag'));
els.managerAddClient.addEventListener('click', () => openManagerEditor('client'));
els.addOtherIncome.addEventListener('click', () => openOtherIncomeEditor());
els.addHomeOtherIncome.addEventListener('click', () => { const date = fromDateKey(state.selectedDate); state.incomeYear = date.getFullYear(); state.incomeMonth = date.getMonth() + 1; showPage('income'); openOtherIncomeEditor(); });
els.viewOtherIncome.addEventListener('click', () => { otherIncomeTagFilter = ''; const date = fromDateKey(state.selectedDate); state.incomeYear = date.getFullYear(); state.incomeMonth = date.getMonth() + 1; showPage('income'); });
els.homeOtherIncomeList.addEventListener('click', e => {
  const row = e.target.closest('[data-home-income-tag]');
  if (!row) return;
  const date = fromDateKey(state.selectedDate);
  otherIncomeTagFilter = row.dataset.homeIncomeTag;
  state.incomeYear = date.getFullYear();
  state.incomeMonth = date.getMonth() + 1;
  showPage('income');
});
els.newOtherIncomeTag.addEventListener('click', () => { openManagerEditor('tag'); els.managerEditor.classList.add('over-income'); });
els.otherIncomeList.addEventListener('click', e => { const button = e.target.closest('[data-edit-other-income]'); if (button) openOtherIncomeEditor(button.dataset.editOtherIncome); });
els.otherIncomeTagChoices.addEventListener('click', e => { const button = e.target.closest('[data-other-income-tag]'); if (!button) return; const id = button.dataset.otherIncomeTag; if (selectedOtherIncomeTags.has(id)) selectedOtherIncomeTags.delete(id); else selectedOtherIncomeTags.add(id); renderOtherIncomeTagChoices(); });
els.otherIncomeRepeat.addEventListener('change', () => { const value = els.otherIncomeRepeat.value; els.otherIncomeRepeatUntilField.classList.toggle('hidden', !['daily','weekly','monthly','yearly'].includes(value)); els.otherIncomeCustomDatesField.classList.toggle('hidden', value !== 'custom'); });
els.otherIncomeCalendarPrev.addEventListener('click', () => { otherIncomeCalendarDate = new Date(otherIncomeCalendarDate.getFullYear(), otherIncomeCalendarDate.getMonth()-1, 1); renderOtherIncomeCalendar(); });
els.otherIncomeCalendarNext.addEventListener('click', () => { otherIncomeCalendarDate = new Date(otherIncomeCalendarDate.getFullYear(), otherIncomeCalendarDate.getMonth()+1, 1); renderOtherIncomeCalendar(); });
els.otherIncomeCalendar.addEventListener('click', e => { const b = e.target.closest('[data-other-income-date]'); if (!b) return; const key = b.dataset.otherIncomeDate; otherIncomeRepeatDates.has(key) ? otherIncomeRepeatDates.delete(key) : otherIncomeRepeatDates.add(key); renderOtherIncomeCalendar(); });
els.saveOtherIncome.addEventListener('click', saveOtherIncomeRecord);
els.deleteOtherIncome.addEventListener('click', deleteOtherIncomeRecord);
els.cancelOtherIncome.addEventListener('click', () => { els.incomeEditor.classList.add('hidden'); otherIncomeDeleteArmed = false; clearTimeout(otherIncomeDeleteTimer); });
els.managerTagList.addEventListener('click', e => { const button = e.target.closest('[data-edit-tag]'); if (button) openManagerEditor('tag', button.dataset.editTag); });
els.managerClientList.addEventListener('click', e => { const button = e.target.closest('[data-edit-client]'); if (button) openManagerEditor('client', button.dataset.editClient); });
els.trashList.addEventListener('click', e => {
  const restore = e.target.closest('[data-restore-trash]');
  if (restore) { restoreTrashGroup(restore.dataset.restoreTrash); return; }
  const remove = e.target.closest('[data-delete-trash]');
  if (remove) permanentlyDeleteTrashGroup(remove.dataset.deleteTrash, remove);
});
els.managerColorPalette.addEventListener('click', e => { const swatch = e.target.closest('[data-manager-color]'); if (swatch) renderManagerColors(swatch.dataset.managerColor); });
els.managerCustomColor.addEventListener('input', () => renderManagerColors(els.managerCustomColor.value));
els.managerSaveEntity.addEventListener('click', saveManagerEntity);
els.managerDeleteEntity.addEventListener('click', deleteManagerEntity);
els.managerCancelEdit.addEventListener('click', () => { els.managerEditor.classList.add('hidden'); els.managerEditor.classList.remove('over-income'); managerDeleteArmed = false; clearTimeout(managerDeleteTimer); });
document.getElementById('addBtn').addEventListener('click', () => { if (state.activePage !== 'calendar') showPage('calendar'); openCreate(); });
document.getElementById('addForDayBtn').addEventListener('click', () => openCreate());
document.getElementById('closeDialog').addEventListener('click', cancelEditor);
document.getElementById('cancelBtn').addEventListener('click', cancelEditor);
els.deleteBtn.addEventListener('click', deleteEvent);
document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteEvent);
document.getElementById('cancelDeleteBtn').addEventListener('click', () => els.deletePopover.classList.add('hidden'));
els.tagPickerButton.addEventListener('click', () => setTagMenuOpen(els.tagMenu.classList.contains('hidden')));
els.tagMenu.addEventListener('click', e => { const option = e.target.closest('[data-tag-id]'); if (option) selectTag(option.dataset.tagId); });
els.tagMenu.addEventListener('contextmenu', e => {
  const option = e.target.closest('[data-tag-id]');
  if (!option || !option.dataset.tagId || option.dataset.tagId === '__new__') return;
  e.preventDefault();
  setTagMenuOpen(false);
  openTagEditor(option.dataset.tagId);
});
els.tagColorPalette.addEventListener('click', e => { const swatch = e.target.closest('[data-color]'); if (swatch) renderColorPalette(swatch.dataset.color); });
els.customTagColor.addEventListener('input', () => renderColorPalette(els.customTagColor.value.toUpperCase()));
document.getElementById('saveTagBtn').addEventListener('click', addNewTag);
els.deleteTagBtn.addEventListener('click', deleteEditingTag);
document.getElementById('cancelTagBtn').addEventListener('click', () => {
  els.newTagEditor.classList.add('hidden');
  editingTagId = null;
  tagDeleteArmed = false;
  clearTimeout(tagDeleteTimer);
  const event = getEventById(els.eventId.value);
  renderTagOptions(event ? getEventTagIds(event) : []);
});
els.clientPickerButton.addEventListener('click', () => setClientMenuOpen(els.clientMenu.classList.contains('hidden')));
els.clientMenu.addEventListener('click', e => { const option = e.target.closest('[data-client-id]'); if (option) selectClient(option.dataset.clientId); });
els.clientMenu.addEventListener('contextmenu', e => {
  const option = e.target.closest('[data-client-id]');
  if (!option || !option.dataset.clientId || option.dataset.clientId === '__new__') return;
  e.preventDefault(); setClientMenuOpen(false); openClientEditor(option.dataset.clientId);
});
els.saveClientBtn.addEventListener('click', saveClientEditor);
els.deleteClientBtn.addEventListener('click', deleteEditingClient);
document.getElementById('cancelClientBtn').addEventListener('click', () => { els.clientEditor.classList.add('hidden'); editingClientId = null; clientDeleteArmed = false; clearTimeout(clientDeleteTimer); renderClientOptions(els.eventClient.value); });
els.eventRepeat.addEventListener('change', () => { if (els.eventRepeat.value === 'custom') els.repeatUseFrequency.checked = false; updateRepeatEditor(); });
['Start', 'End', 'Repeat'].forEach(name => {
  els[`event${name}Button`].addEventListener('click', e => { e.preventDefault(); toggleUnifiedPicker(name); });
  els[`event${name}Menu`].addEventListener('click', e => { const option = e.target.closest('[data-picker-value]'); if (option) chooseUnifiedPicker(name, option.dataset.pickerValue); });
});
els.repeatUseFrequency.addEventListener('change', updateRepeatEditor);
els.repeatCalendarPrev.addEventListener('click', () => { repeatCalendarDate = new Date(repeatCalendarDate.getFullYear(), repeatCalendarDate.getMonth() - 1, 1); renderRepeatCalendar(); });
els.repeatCalendarNext.addEventListener('click', () => { repeatCalendarDate = new Date(repeatCalendarDate.getFullYear(), repeatCalendarDate.getMonth() + 1, 1); renderRepeatCalendar(); });
els.repeatCalendar.addEventListener('click', e => {
  const button = e.target.closest('[data-repeat-date]');
  if (!button || button.disabled) return;
  const key = button.dataset.repeatDate;
  if (selectedRepeatDates.has(key)) selectedRepeatDates.delete(key); else selectedRepeatDates.add(key);
  writeRepeatDates();
  renderRepeatCalendar();
});
els.repeatDatesInput.addEventListener('input', syncRepeatDatesFromInput);
els.eventDate.addEventListener('change', () => { if (els.eventRepeat.value === 'custom') { repeatCalendarDate = fromDateKey(els.eventDate.value); renderRepeatCalendar(); } });
els.contextCopy.addEventListener('click', () => copyEvent(contextEventId));
els.contextDelete.addEventListener('click', () => softDeleteEventById(contextEventId));
els.contextPaste.addEventListener('click', () => { pasteMode = false; pasteCopiedEvent(contextPasteTarget || { date: state.selectedDate, start: copiedEvent?.start }); });
els.contextCancelPaste.addEventListener('click', () => { pasteMode = false; hideCalendarContextMenu(); showToast('已取消待粘贴状态'); });
document.getElementById('nlToggleBtn').addEventListener('click', () => { if (state.activePage !== 'calendar') showPage('calendar'); els.nlPanel.classList.toggle('hidden'); if (!els.nlPanel.classList.contains('hidden')) els.nlInput.focus(); });
document.getElementById('nlCloseBtn').addEventListener('click', () => els.nlPanel.classList.add('hidden'));
document.getElementById('nlParseBtn').addEventListener('click', createFromNaturalLanguage);
els.nlInput.addEventListener('keydown', e => { if (e.key === 'Enter') createFromNaturalLanguage(); });
document.addEventListener('click', e => {
  if (!e.target.closest('.income-target-actions')) els.incomeTargetPopover.classList.add('hidden');
  if (!e.target.closest('.delete-wrap')) els.deletePopover.classList.add('hidden');
  if (!e.target.closest('.tag-picker')) setTagMenuOpen(false);
  if (!e.target.closest('.client-picker')) setClientMenuOpen(false);
  if (!e.target.closest('.unified-picker')) closeUnifiedPickers();
  if (!e.target.closest('.calendar-context-menu')) hideCalendarContextMenu();
  if (!e.target.closest('.month-nav')) setDateNavigatorOpen(false);
});
document.addEventListener('keydown', e => {
  const editingText = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
  if ((e.ctrlKey || e.metaKey) && !editingText && e.key.toLowerCase() === 'c') {
    if (activeEventId) { e.preventDefault(); copyEvent(activeEventId); }
  }
  if ((e.ctrlKey || e.metaKey) && !editingText && e.key.toLowerCase() === 'v') {
    if (copiedEvent) { e.preventDefault(); pasteMode = false; pasteCopiedEvent(contextPasteTarget || { date: state.selectedDate, start: copiedEvent.start }); }
  }
  if (e.key === 'Delete' && !editingText && activeEventId && state.activePage === 'calendar') {
    e.preventDefault();
    softDeleteEventById(activeEventId);
  }
  if (e.key === 'Escape') {
    hideCalendarContextMenu();
    if (pasteMode) { pasteMode = false; showToast('已取消待粘贴状态'); }
  }
});
els.eventStart.addEventListener('input', () => syncTimeFields('start'));
els.eventDuration.addEventListener('input', () => syncTimeFields('duration'));
els.eventEnd.addEventListener('input', () => syncTimeFields('end'));
els.eventForm.addEventListener('submit', submitEvent);
els.eventForm.addEventListener('input', autoSaveFromEditor);
els.eventForm.addEventListener('change', autoSaveFromEditor);

showPage('calendar');
