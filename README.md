# no-js-filter-table

A small script (about 6 KB, no dependencies) that filters and sorts a server-rendered HTML table. Every row is in the page's HTML, so the table works with JavaScript off and search engines can read all of it. With the script, the form filters the rows in place and keeps the filters in the URL, so a filtered list can be shared.

It powers the [Protein Finder](https://health.dailyappslab.com/macroscout/protein-finder/), which filters 259 fast-food items by protein and calories. A 25-row copy of it is in [`demo/index.html`](demo/index.html).

## Use it

```html
<form data-filter-table="results" data-count="count" method="get">
  <input name="protein" type="number" value="25" data-filter="min">
  <input name="cal" type="number" value="600" data-filter="max">
  <select name="meal" data-filter="eq">
    <option value="">Everything</option>
    <option value="breakfast">Breakfast</option>
  </select>
  <label><input type="checkbox" name="chain" value="subway" data-filter="in" checked> Subway</label>
  <label><input type="checkbox" name="chain" value="chipotle" data-filter="in" checked> Chipotle</label>
  <select name="sort" data-sort>
    <option value="-per,-protein">Protein per 100 calories</option>
    <option value="cal,-protein">Fewest calories</option>
  </select>
  <button type="button" data-preset="protein=30&cal=500">30 g under 500 cal</button>
  <button type="submit">Show matches</button>
</form>
<p id="count" aria-live="polite" data-template="{shown} of {total} items match."></p>

<table id="results">
  <tbody>
    <tr data-chain="subway" data-meal="main" data-cal="410" data-protein="45" data-per="11"> ... </tr>
  </tbody>
</table>

<script src="filter-table.js"></script>
```

Each field's `name` points at a `data-` attribute on the rows:

| Attribute on the field | A row stays when |
|---|---|
| `data-filter="min"` | its value is at least the field's value |
| `data-filter="max"` | its value is at most the field's value |
| `data-filter="eq"` | its value equals the field's value; an empty field allows any |
| `data-filter="in"` (checkboxes with one name) | its value is one of the ticked boxes |

The `data-sort` select takes keys separated by commas, with `-` in front for largest first. Rows with no value for a key go last. A button with `data-preset` fills the fields from a query string and applies it.

The form fires a `filtertable:change` event with `{ shown, total }` after each update, if you want to hook in analytics or a custom count.

## Why the rows are in the HTML

A table that only exists after a script runs is empty for anyone whose script fails and thin for crawlers. Rendering every row on the server and hiding rows in the browser keeps the full content in the page. The script only adds the `hidden` attribute and reorders rows.

## Licence

MIT. The demo data is from [fast-food-protein-us](https://github.com/dailyappslab/fast-food-protein-us) (CC BY 4.0, credit MacroScout by Daily Apps Lab).

Made by [Javed Iqbal](https://github.com/javediqbal-byte) at [Daily Apps Lab](https://dailyappslab.com/).
