let CURRENT_ROWS = [];

// ==== CSV ADAPTER HELPERS ====
function normalizeAmount(raw) {
  if (raw == null) return 0;
  let s = String(raw).trim();
  const parenNeg = /^\(.*\)$/.test(s);
  s = s.replace(/[,$]/g, '').replace(/[()]/g, '');
  const n = parseFloat(s || '0');
  if (Number.isNaN(n)) return 0;
  return parenNeg ? -Math.abs(n) : n;
}

function normalizeDate(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;      // ISO already
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s); // MM/DD/YYYY
  if (m) {
    const mm = m[1].padStart(2, '0');
    const dd = m[2].padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return s;
}

function cleanDesc(desc) {
  return String(desc || '')
    .replace(/PURCHASE AUTHORIZED ON \d{2}\/\d{2}/i, '')
    .replace(/CARD \d+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toUpperCase();
}

/**
 * Detects which CSV shape we have by inspecting the first row (no headers mode).
 * Returns one of: 'YourBank_NoHeader_5Cols', 'USBank_WithHeaders', 'USBank_NoHeaderBody'
 */
function detectProfile(firstRow) {
  // firstRow is an array of cells
  if (!firstRow || firstRow.length < 3) return 'Unknown';

  const c0 = String(firstRow[0] || '').replace(/"/g,'').trim();
  const c1 = String(firstRow[1] || '').replace(/"/g,'').trim();
  const c2 = String(firstRow[2] || '').replace(/"/g,'').trim();
  const c3 = String(firstRow[3] || '').replace(/"/g,'').trim();
  const c4 = String(firstRow[4] || '').replace(/"/g,'').trim();

  // Exact header row for US Bank
  if (c0.toLowerCase() === 'date' && c1.toLowerCase() === 'transaction' &&
      c2.toLowerCase() === 'name' && c3.toLowerCase() === 'memo' &&
      c4.toLowerCase() === 'amount') {
    return 'USBank_WithHeaders';
  }

  // Your bank body row: MM/DD/YYYY, <amount>, *, <empty>, <desc>
  const looksMDY = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(c0);
  if (looksMDY && c2 === '*') {
    return 'YourBank_NoHeader_5Cols';
  }

  // US Bank body without header: first col looks ISO date and 5+ columns
  const looksISO = /^\d{4}-\d{2}-\d{2}$/.test(c0);
  if (looksISO && firstRow.length >= 5) {
    return 'USBank_NoHeaderBody';
  }

  return 'Unknown';
}
// ==== RULE / KEYWORD HELPERS ====

// words that are common prefixes/noise in bank exports
const RULE_STOPWORDS = new Set([
  'WEB', 'PAYMENT', 'POS', 'DEBIT', 'CREDIT', 'ACH', 'CARD', 'PURCHASE',
  'AUTHORIZED', 'ON', 'THE', 'AND', 'ONLINE', 'TRANSFER', 'FROM', 'TO',
  'CHECK', 'CHECKCARD', 'WITHDRAWAL', 'WITHDRAW', 'ATM', 'DEPOSIT',
  'FEE', 'AUTOPAY', 'AUTO', 'BILL', 'PMT', 'PAY', 'MOBILE'
]);

function tokenizeDesc(desc) {
  return String(desc || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function extractMerchantCandidates(desc) {
  const tokens = tokenizeDesc(desc);

  // Remove pure numbers and stopwords
  const filtered = tokens.filter(t =>
    t.length >= 3 &&
    !/^\d+$/.test(t) &&
    !RULE_STOPWORDS.has(t)
  );

  // Return unique tokens in order
  return Array.from(new Set(filtered));
}

function buildMatchRegex(keyword) {
  const kw = String(keyword || '').trim().toUpperCase();
  if (!kw) return null;

  // Escape regex special chars just in case
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

function countMatchesInData(allRows, keyword) {
  const rx = buildMatchRegex(keyword);
  if (!rx) return 0;

  let count = 0;
  for (const row of allRows) {
    const desc = String(row.Description || '').toUpperCase();
    if (rx.test(desc)) count++;
  }
  return count;
}

function getTopKeywordSuggestions(selectedDescs, max = 8) {
  const counts = {};
  for (const d of selectedDescs) {
    const cands = extractMerchantCandidates(d);
    for (const token of cands) {
      counts[token] = (counts[token] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]) // freq desc
    .map(([token]) => token)
    .slice(0, max);
}

document.getElementById('drop-zone').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleCSV(file);
});

document.getElementById('drop-zone').addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

document.getElementById('drop-zone').addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) handleCSV(file);
});


function handleCSV(file) {
  document.getElementById('instructions').style.display = 'none';

  // First, parse a peek at the first row (no headers) to detect profile
  Papa.parse(file, {
    header: false,
    preview: 1,
    complete: function(previewRes) {
      const firstRow = (previewRes && previewRes.data && previewRes.data[0]) || null;
      const profile = detectProfile(firstRow);
      console.log('Detected CSV profile:', profile);

      // Parse full file (no headers) to keep things consistent
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: function(fullRes) {
          let rows = fullRes.data || [];
          if (!rows.length) {
            alert('No rows found in CSV.');
            return;
          }

          // If the file had a US Bank header, drop it
          if (profile === 'USBank_WithHeaders') {
            rows = rows.slice(1);
          }

          // Map rows to canonical shape
          const mapped = rows.map(r => {
            // Ensure we have at least 5 cells
            const c0 = r[0], c1 = r[1], c2 = r[2], c3 = r[3], c4 = r[4];

            if (profile === 'YourBank_NoHeader_5Cols') {
              return {
                Date: normalizeDate(c0),
                Amount: normalizeAmount(c1),
                Description: cleanDesc(c4)
              };
            }

            // Both US Bank shapes (header or no header) share same column order: Date, Transaction, Name, Memo, Amount
            if (profile === 'USBank_WithHeaders' || profile === 'USBank_NoHeaderBody') {
              const name = c2 || '';
              const memo = c3 || '';
              return {
                Date: normalizeDate(c0),
                Amount: normalizeAmount(c4),
                Description: cleanDesc((name + ' ' + memo).trim())
              };
            }

            // Unknown: best-effort guess
            return {
              Date: normalizeDate(c0),
              Amount: normalizeAmount(c1),
              Description: cleanDesc((c2 || '') + ' ' + (c3 || '') + ' ' + (c4 || ''))
            };
          });
          // Persist, categorize, display
          localStorage.setItem('last-transactions', JSON.stringify(mapped));
          CURRENT_ROWS = mapped;
          const categorized = categorizeTransactions(mapped);
          displayResults(categorized);
        }
      });
    }
  });
}

function getCustomCategories() {
  return JSON.parse(localStorage.getItem('customCategories') || '{}');
}

function saveCustomCategories(data) {
  localStorage.setItem('customCategories', JSON.stringify(data));
}

function getAllCategories() {
  const baseCategories = CATEGORIES;
  const custom = getCustomCategories();
  return { ...baseCategories, ...custom };
}

function categorizeTransactions(data) {
  const categorized = {};
  const custom = getCustomCategories();

  // Merge all categories and keywords
  const allCats = { ...CATEGORIES, ...custom };

  // Sort keywords by length (longest first) to prioritize specific matches
  const sortedKeywords = Object.keys(allCats).sort((a, b) => b.length - a.length);

  data.forEach(row => {
    let desc = (row.Description || '')
      .replace(/PURCHASE AUTHORIZED ON \d{2}\/\d{2}/i, '')
      .replace(/CARD \d+/i, '')
      .replace(/\s{2,}/g, ' ')
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '')
      .trim();

    const amount = parseFloat(row.Amount);
    let category = 'Uncategorized';

    if (amount > 0) {
      category = 'Income';
    } else {
      for (const keyword of sortedKeywords) {
        const keywordUpper = keyword.toUpperCase();
        const pattern = new RegExp(`\\b${keywordUpper}\\b`, 'i');
        if (pattern.test(desc)) {
          category = allCats[keyword];
          break;
        }
      }
    }

    if (!categorized[category]) categorized[category] = [];
    categorized[category].push({
      Date: row.Date,
      Amount: amount,
      Description: desc
    });
  });

  return categorized;
}


function displayResults(categorized) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  const summary = {
    income: 0,
    expenses: 0
  };

  const categories = Object.keys(categorized).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  const reassignDiv = document.createElement('div');
  reassignDiv.innerHTML = `<h3>Assign Selected to Category:</h3>`;
  const dropdown = document.createElement('select');
  const populateDropdown = () => {
    dropdown.innerHTML = '';
    const allCats = [...new Set([...Object.values(getAllCategories()), 'New Category...'])];
    allCats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      dropdown.appendChild(opt);
    });
  };
  populateDropdown();
  reassignDiv.appendChild(dropdown);

  const input = document.createElement('input');
  input.placeholder = 'New category name';
  input.style.display = 'none';
  reassignDiv.appendChild(input);

  dropdown.addEventListener('change', () => {
    input.style.display = dropdown.value === 'New Category...' ? 'inline-block' : 'none';
  });
    // --- Apply-to-all matching controls ---
  const applyAllWrap = document.createElement('div');
  applyAllWrap.style.margin = '0.75rem 0';
  applyAllWrap.style.padding = '0.75rem';
  applyAllWrap.style.border = '1px solid #ddd';
  applyAllWrap.style.background = '#fafafa';

  const applyAllLabel = document.createElement('label');
  applyAllLabel.style.display = 'flex';
  applyAllLabel.style.gap = '0.5rem';
  applyAllLabel.style.alignItems = 'center';

  const applyAllCheckbox = document.createElement('input');
  applyAllCheckbox.type = 'checkbox';

  const applyAllText = document.createElement('span');
  applyAllText.textContent = 'Apply this category to ALL transactions matching a keyword in this file';

  applyAllLabel.appendChild(applyAllCheckbox);
  applyAllLabel.appendChild(applyAllText);
  applyAllWrap.appendChild(applyAllLabel);

  const matchRow = document.createElement('div');
  matchRow.style.display = 'flex';
  matchRow.style.gap = '0.5rem';
  matchRow.style.alignItems = 'center';
  matchRow.style.marginTop = '0.5rem';

  const matchSelect = document.createElement('select');
  matchSelect.disabled = true;

  const matchInput = document.createElement('input');
  matchInput.placeholder = 'Or type a keyword (e.g., AMAZON)';
  matchInput.disabled = true;

  const matchPreview = document.createElement('div');
  matchPreview.style.marginTop = '0.5rem';
  matchPreview.style.fontSize = '0.9rem';
  matchPreview.style.color = '#444';
  matchPreview.textContent = '';

  matchRow.appendChild(matchSelect);
  matchRow.appendChild(matchInput);
  applyAllWrap.appendChild(matchRow);
  applyAllWrap.appendChild(matchPreview);

  reassignDiv.appendChild(applyAllWrap);

    function updateMatchPreview() {
    const kw = (matchInput.value || matchSelect.value || '').trim().toUpperCase();
    if (!applyAllCheckbox.checked || !kw) {
      matchPreview.textContent = '';
      return;
    }
    const total = (CURRENT_ROWS || []).length;
    const hitCount = countMatchesInData(CURRENT_ROWS || [], kw);
    matchPreview.textContent = `Rule preview: "${kw}" will match ${hitCount} of ${total} transactions in this file.`;
  }

  applyAllCheckbox.addEventListener('change', () => {
    const enabled = applyAllCheckbox.checked;
    matchSelect.disabled = !enabled;
    matchInput.disabled = !enabled;

    if (!enabled) {
      matchPreview.textContent = '';
      return;
    }

    // Populate suggestions based on current checked rows (if any)
    const selected = Array.from(document.querySelectorAll('input.txn-select:checked'));
    const selectedDescs = selected.map(x => x.dataset.desc || '').filter(Boolean);

    const suggestions = getTopKeywordSuggestions(selectedDescs, 10);
    matchSelect.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pick a suggested keyword...';
    matchSelect.appendChild(placeholder);

    suggestions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      matchSelect.appendChild(opt);
    });

    updateMatchPreview();
  });

  matchSelect.addEventListener('change', () => {
    // If user picks a suggestion, mirror it into input so they can edit it
    if (matchSelect.value) matchInput.value = matchSelect.value;
    updateMatchPreview();
  });

  matchInput.addEventListener('input', updateMatchPreview);

  const assignBtn = document.createElement('button');
  assignBtn.textContent = 'Assign Selected';
  assignBtn.onclick = () => {
    const selectedRows = document.querySelectorAll('input.txn-select:checked');
    if (!selectedRows.length) return alert("Please select at least one transaction.");

    let chosenCategory = dropdown.value;
    const isNew = dropdown.value === 'New Category...';

    if (isNew) {
      const newCatName = input.value.trim();
      if (!newCatName) return alert("Please enter a new category name.");
      chosenCategory = newCatName;
    }

    // Gather selected descriptions
    const selectedDescs = Array.from(selectedRows).map(x => x.dataset.desc || '').filter(Boolean);

    // Build smarter suggestions (merchant-like tokens)
    const topTokens = getTopKeywordSuggestions(selectedDescs, 8);

    // Default suggestion: first token if available, otherwise fallback to old "first 2-3 words"
    const fallbackPhraseCounts = {};
    selectedDescs.forEach(desc => {
      const phrase = desc.split(' ').slice(0, 3).join(' ');
      if (phrase.length >= 4 && !/^\d+$/.test(phrase)) {
        fallbackPhraseCounts[phrase] = (fallbackPhraseCounts[phrase] || 0) + 1;
      }
    });
    const fallbackTop = Object.entries(fallbackPhraseCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([p]) => p)
      .slice(0, 3);

    const suggested = topTokens.length ? topTokens.join(', ') : fallbackTop.join(', ');
    const defaultKw = topTokens[0] || fallbackTop[0] || '';

    // Determine if we are applying to all matching
    const wantsApplyAll = !!applyAllCheckbox.checked;
    let keywordForRule = '';

    if (wantsApplyAll) {
      keywordForRule = (matchInput.value || matchSelect.value || '').trim().toUpperCase();
      if (!keywordForRule) {
        return alert("If 'Apply to ALL matching' is checked, please choose or type a keyword.");
      }
    } else {
      // Original prompt flow, but with better suggestions
      const rawInput = prompt(
        `Enter one or more keywords (comma separated) to associate with "${chosenCategory}":\nSuggested: ${suggested}`,
        defaultKw
      );

      if (!rawInput) return alert("You must enter at least one keyword.");

      const keywords = rawInput
        .split(',')
        .map(k => k.trim().toUpperCase())
        .filter(k => k.length >= 3 && !/^\d+$/.test(k));

      if (!keywords.length) return alert("You must enter at least one valid keyword (>= 3 chars).");

      // Save keyword rules
      const custom = getCustomCategories();
      keywords.forEach(keyword => {
        custom[keyword] = chosenCategory;
      });
      saveCustomCategories(custom);
      populateDropdown();

      // Move only the selected transactions (existing behavior)
      selectedRows.forEach(input => {
        const desc = input.dataset.desc;
        const date = input.dataset.date;
        const amt = parseFloat(input.dataset.amt);
        if (!categorized[chosenCategory]) categorized[chosenCategory] = [];
        categorized[chosenCategory].push({ Date: date, Amount: amt, Description: desc });
      });

      // Remove from old category
      for (const category in categorized) {
        if (category === chosenCategory) continue;
        categorized[category] = categorized[category].filter(txn =>
          !Array.from(selectedRows).some(input =>
            input.dataset.desc === txn.Description && input.dataset.date === txn.Date
          )
        );
      }

      return displayResults(categorized);
    }

    // ---- APPLY-ALL-MATCHING PATH (structured rule) ----

    // Preview + guardrail for generic rules
    const total = (CURRENT_ROWS || []).length;
    const hitCount = countMatchesInData(CURRENT_ROWS || [], keywordForRule);

    // Warn if very broad, or if keyword looks like a known-generic stopword
    const isStopword = RULE_STOPWORDS.has(keywordForRule);
    const tooBroad = total > 0 && (hitCount / total) > 0.30; // >30% of file

    if (isStopword || tooBroad) {
      const msg = [
        `Warning: "${keywordForRule}" looks broad.`,
        `It will match ${hitCount} of ${total} transactions in this file.`,
        `This can cause future runs to move unrelated transactions into "${chosenCategory}".`,
        '',
        'Continue anyway?'
      ].join('\n');
      const ok = confirm(msg);
      if (!ok) return;
    }

    // Save the single rule keyword -> category
    const custom = getCustomCategories();
    custom[keywordForRule] = chosenCategory;
    saveCustomCategories(custom);
    populateDropdown();

    // Apply category to ALL matching transactions in this file:
    // We'll rebuild categorization from CURRENT_ROWS so everything is consistent.
    // (This prevents partial/inconsistent "moving" between buckets.)
    const rebuilt = categorizeTransactions(CURRENT_ROWS || []);

// Always create the category so it displays even if it ends up empty
if (!rebuilt[chosenCategory]) rebuilt[chosenCategory] = [];

// Force-match: anything that matches the keyword gets placed in chosenCategory
const rx = buildMatchRegex(keywordForRule);
if (rx) {
  // Pull matching txns from all categories and push into chosenCategory
  for (const cat of Object.keys(rebuilt)) {
    if (cat === chosenCategory) continue;
    const keep = [];
    for (const txn of rebuilt[cat]) {
      if (rx.test(String(txn.Description || '').toUpperCase())) {
        rebuilt[chosenCategory].push(txn);
      } else {
        keep.push(txn);
      }
    }
    rebuilt[cat] = keep;
  }
}


    displayResults(rebuilt);
  };




  reassignDiv.appendChild(assignBtn);
  container.appendChild(reassignDiv);

  for (const category of categories) {
    const title = document.createElement('div');
    title.className = 'category-title';
    title.textContent = category;
    container.appendChild(title);

    const table = document.createElement('table');
    const thead = table.insertRow();
    ['Date', 'Amount', 'Description', 'Select'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      thead.appendChild(th);
    });

    let total = 0;
    categorized[category].forEach(txn => {
      const row = table.insertRow();
      row.insertCell().textContent = txn.Date;
      row.insertCell().textContent = txn.Amount.toFixed(2);
      row.insertCell().textContent = txn.Description;

      const cell = row.insertCell();
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'txn-select';
      checkbox.dataset.desc = txn.Description;
      checkbox.dataset.date = txn.Date;
      checkbox.dataset.amt = txn.Amount;
      cell.appendChild(checkbox);

      checkbox.addEventListener('change', () => {
  if (applyAllCheckbox.checked) {
    // re-run the same suggestion population logic you used in applyAllCheckbox change handler
    const selected = Array.from(document.querySelectorAll('input.txn-select:checked'));
    const selectedDescs = selected.map(x => x.dataset.desc || '').filter(Boolean);
    const suggestions = getTopKeywordSuggestions(selectedDescs, 10);

    matchSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pick a suggested keyword...';
    matchSelect.appendChild(placeholder);

    suggestions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      matchSelect.appendChild(opt);
    });

    updateMatchPreview();
  }
});

      total += txn.Amount;
      if (txn.Amount > 0) summary.income += txn.Amount;
      if (txn.Amount < 0) summary.expenses += txn.Amount;
    });

    const footer = document.createElement('div');
    footer.textContent = `Subtotal: ${total.toFixed(2)}`;
    footer.style.marginBottom = '1rem';
    container.appendChild(table);
    container.appendChild(footer);
  }

  const summaryDiv = document.createElement('div');
  summaryDiv.innerHTML = `
    <h2>💰 Summary</h2>
    <p>Total Income: $${summary.income.toFixed(2)}</p>
    <p>Total Expenses: $${summary.expenses.toFixed(2)}</p>
    <p><strong>Net: $${(summary.income + summary.expenses).toFixed(2)}</strong></p>
  `;
  container.appendChild(summaryDiv);
} 
