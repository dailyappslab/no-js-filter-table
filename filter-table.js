/*! no-js-filter-table v1.0.0 | MIT | https://github.com/dailyappslab/no-js-filter-table */
/*
 * Progressive enhancement for a server-rendered HTML table.
 * Without JavaScript the page shows every row and the form submits as a normal GET.
 * With this script the form filters and sorts the rows in place and keeps the filters in the URL.
 *
 * Markup:
 *   <form data-filter-table="results" data-count="count"> ... </form>
 *   <p id="count" aria-live="polite"></p>
 *   <table id="results"><tbody><tr data-cal="400" data-protein="31" data-chain="mcdonalds"> ...
 *
 * Fields, matched to row data-* attributes by their name:
 *   data-filter="min"  row value >= field value (empty field = no limit)
 *   data-filter="max"  row value <= field value (empty field = no limit)
 *   data-filter="eq"   row value === field value (empty field = any)
 *   data-filter="in"   checkboxes sharing one name; row value must be one of the checked values
 *   data-sort          a select whose option values are comma-separated keys, "-key" for descending,
 *                      e.g. value="-per,-protein". Rows with an empty value sort last.
 * Buttons with data-preset="protein=30&cal=500" fill the fields and apply.
 */
(function () {
	'use strict';

	function init(form) {
		var table = document.getElementById(form.dataset.filterTable);
		if (!table || !table.tBodies[0]) return;
		var tbody = table.tBodies[0];
		var rows = Array.prototype.slice.call(tbody.rows);
		var total = rows.length;
		var count = form.dataset.count ? document.getElementById(form.dataset.count) : null;
		var template = (count && count.dataset.template) || '{shown} of {total} rows match.';
		var empty = (count && count.dataset.empty) || 'No rows match. Loosen a filter to see more.';
		var fields = Array.prototype.slice.call(form.querySelectorAll('[data-filter], [data-sort]'));
		var defaults = snapshot();

		function key(el) { return el.name; }
		function rowValue(tr, name) { var v = tr.dataset[name]; return v === undefined ? '' : v; }
		function number(v) { return v === '' ? NaN : Number(v); }

		function snapshot() {
			var s = {};
			fields.forEach(function (el) {
				if (el.type === 'checkbox') {
					(s[key(el)] = s[key(el)] || []).push(el.checked ? el.value : null);
				} else s[key(el)] = el.value;
			});
			return JSON.stringify(s);
		}

		function matches(tr) {
			var groups = {};
			for (var i = 0; i < fields.length; i++) {
				var el = fields[i];
				var op = el.dataset.filter;
				if (!op) continue;
				var v = rowValue(tr, key(el));
				if (op === 'in') {
					var g = groups[key(el)] || (groups[key(el)] = { any: false, hit: false });
					g.any = true;
					if (el.checked && el.value === v) g.hit = true;
					continue;
				}
				if (el.value === '') continue;
				if (op === 'min' && !(number(v) >= Number(el.value))) return false;
				if (op === 'max' && !(number(v) <= Number(el.value))) return false;
				if (op === 'eq' && v !== el.value) return false;
			}
			for (var name in groups) if (groups[name].any && !groups[name].hit) return false;
			return true;
		}

		function comparator() {
			var sortField = form.querySelector('[data-sort]');
			if (!sortField || !sortField.value) return null;
			var keys = sortField.value.split(',').map(function (k) {
				k = k.trim();
				return { name: k.replace(/^-/, ''), desc: k.charAt(0) === '-' };
			});
			return function (a, b) {
				for (var i = 0; i < keys.length; i++) {
					var x = number(rowValue(a, keys[i].name));
					var y = number(rowValue(b, keys[i].name));
					var xe = isNaN(x), ye = isNaN(y);
					if (xe || ye) { if (xe && ye) continue; return xe ? 1 : -1; }
					if (x !== y) return keys[i].desc ? y - x : x - y;
				}
				return 0;
			};
		}

		function writeUrl() {
			if (!window.history || !history.replaceState) return;
			var p = new URLSearchParams();
			if (snapshot() !== defaults) {
				fields.forEach(function (el) {
					if (el.type === 'checkbox') { if (el.checked) p.append(key(el), el.value); }
					else if (el.value !== '') p.set(key(el), el.value);
				});
			}
			var q = p.toString();
			history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
		}

		function readUrl() {
			var p = new URLSearchParams(location.search);
			if (!Array.from(p.keys()).length) return;
			fields.forEach(function (el) {
				if (el.type === 'checkbox') {
					if (p.has(key(el))) el.checked = p.getAll(key(el)).indexOf(el.value) !== -1;
				} else if (p.has(key(el))) el.value = p.get(key(el));
			});
		}

		function apply() {
			var shown = rows.filter(matches);
			var cmp = comparator();
			if (cmp) shown.sort(cmp);
			rows.forEach(function (tr) { tr.hidden = true; });
			shown.forEach(function (tr) { tr.hidden = false; tbody.appendChild(tr); });
			if (count) count.textContent = shown.length ? template.replace('{shown}', shown.length).replace('{total}', total) : empty;
			writeUrl();
			form.dispatchEvent(new CustomEvent('filtertable:change', { detail: { shown: shown.length, total: total } }));
		}

		Array.prototype.forEach.call(form.querySelectorAll('[data-preset]'), function (b) {
			b.addEventListener('click', function () {
				var p = new URLSearchParams(b.dataset.preset);
				fields.forEach(function (el) {
					if (el.type === 'checkbox') el.checked = p.has(key(el)) ? p.getAll(key(el)).indexOf(el.value) !== -1 : true;
					else if (p.has(key(el))) el.value = p.get(key(el));
				});
				apply();
				if (count) count.focus();
			});
		});
		if (count && !count.hasAttribute('tabindex')) count.tabIndex = -1;

		readUrl();
		apply();
		form.addEventListener('input', apply);
		form.addEventListener('change', apply);
		form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
	}

	function boot() { Array.prototype.forEach.call(document.querySelectorAll('form[data-filter-table]'), init); }
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
	else boot();
})();
