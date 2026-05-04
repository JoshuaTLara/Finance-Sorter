# Supported CSV Formats

Finance Sorter accepts a few bank CSV layouts and maps them into one internal transaction shape:

```js
{
  Date: 'YYYY-MM-DD',
  Amount: -12.34,
  Description: 'MERCHANT DESCRIPTION'
}
```

Parsing happens in `script.js`.

## Wells Fargo Checking - Current Header Format

Wells Fargo changed the checking CSV export layout in 2026. The app now supports the newer header-based format:

```csv
DATE,DESCRIPTION,AMOUNT,CHECK #,STATUS
05/01/2026,WALMART SUPERCENTER,-43.27,,Posted
05/02/2026,PAYROLL DEPOSIT,2500.00,,Posted
```

Mapping:

- `DATE` -> `Date`
- `DESCRIPTION` -> `Description`
- `AMOUNT` -> `Amount`
- `CHECK #` is currently ignored.
- `STATUS` is currently ignored.

Detected profile name in code:

```js
WellsFargo_WithHeaders
```

## Wells Fargo Checking - Legacy No-Header Format

The older Wells Fargo-style export had no header row and used five columns:

```csv
05/01/2026,-43.27,*,,PURCHASE AUTHORIZED ON 04/30 WALMART SUPERCENTER CARD 1234
05/02/2026,2500.00,*,,PAYROLL DEPOSIT
```

Mapping:

- Column 0 -> `Date`
- Column 1 -> `Amount`
- Column 4 -> `Description`

Detected profile name in code:

```js
YourBank_NoHeader_5Cols
```

## US Bank Header Format

The app also supports this US Bank format:

```csv
Date,Transaction,Name,Memo,Amount
2026-05-01,Debit,WALMART SUPERCENTER,Purchase,-43.27
```

Mapping:

- `Date` -> `Date`
- `Amount` -> `Amount`
- `Name` + `Memo` -> `Description`

Detected profile name in code:

```js
USBank_WithHeaders
```

## US Bank No-Header Body Format

The app can also map US Bank body rows without the header if the first column is an ISO date and the row has at least five columns.

Detected profile name in code:

```js
USBank_NoHeaderBody
```

## Unknown Formats

Unknown CSVs fall back to a best-effort mapping:

- Column 0 -> `Date`
- Column 1 -> `Amount`
- Columns 2, 3, and 4 combined -> `Description`

If a new bank export breaks the app, inspect only the header row and a few redacted rows, then add a new explicit profile instead of relying on the unknown fallback.

## When A Bank Changes Its Export

Use this checklist when a previously working CSV stops importing correctly:

1. Confirm whether the CSV now has a header row.
2. Identify which column contains the date.
3. Identify which column contains the amount.
4. Identify which column or columns contain the merchant description.
5. Add a new profile in `detectProfile`.
6. Drop the header row during import if the format includes one.
7. Map the row into the internal `{ Date, Amount, Description }` shape.
8. Test with fake or redacted rows before using real monthly data.

## Privacy Rule

Never commit real bank exports, account numbers, or private transaction data. Use fake CSV rows for docs and tests.
