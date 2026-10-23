const STORAGE_KEYS = {
  history: 'scientific-calculator-history',
  theme: 'scientific-calculator-theme',
  format: 'scientific-calculator-format',
  angle: 'scientific-calculator-angle'
};

const state = {
  expression: '',
  result: '0',
  lastAnswer: 0,
  memory: 0,
  history: [],
  angleMode: 'DEG',
  theme: 'dark',
  formatMode: 'auto'
};

const expressionInput = document.getElementById('expressionInput');
const resultDisplay = document.getElementById('resultDisplay');
const statusText = document.getElementById('statusText');
const historyList = document.getElementById('historyList');
const historyToggle = document.getElementById('historyToggle');
const historyPanel = document.getElementById('historyPanel');
const themeToggle = document.getElementById('themeToggle');
const formatModeSelect = document.getElementById('formatMode');
const memoryIndicator = document.getElementById('memoryIndicator');

const FORMATTERS = {
  auto: (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Error';
    if (Math.abs(number) === 0) return '0';
    if (Math.abs(number) >= 1e15 || (Math.abs(number) > 0 && Math.abs(number) < 1e-6)) {
      return number.toExponential(6).replace(/\.?0+e/, 'e');
    }
    return Number(number.toPrecision(15)).toString();
  },
  fixed: (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Error';
    return Number(number.toFixed(10)).toString();
  },
  scientific: (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Error';
    return number.toExponential(6).replace(/\.?0+e/, 'e');
  }
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // ignore storage failures in non-persistent or private modes
  }
}

function persistHistory() {
  writeStorage(STORAGE_KEYS.history, JSON.stringify(state.history));
}

function setStatus(message, type = '') {
  statusText.textContent = message;
  statusText.className = `status-text ${type}`.trim();
}

function setTheme(theme) {
  state.theme = theme;
  document.body.setAttribute('data-theme', theme);
  writeStorage(STORAGE_KEYS.theme, theme);
  themeToggle.textContent = theme === 'dark' ? '☀' : '🌙';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

function setAngleMode(mode) {
  state.angleMode = mode;
  writeStorage(STORAGE_KEYS.angle, mode);
  document.querySelectorAll('.mode-btn').forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function setFormatMode(mode) {
  state.formatMode = mode;
  writeStorage(STORAGE_KEYS.format, mode);
  formatModeSelect.value = mode;
  renderResult();
}

function updateMemoryIndicator() {
  const hasMemory = state.memory !== 0;
  memoryIndicator.classList.toggle('is-active', hasMemory);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNumber(value) {
  const formatter = FORMATTERS[state.formatMode] || FORMATTERS.auto;
  return formatter(value);
}

function renderResult() {
  resultDisplay.textContent = formatNumber(state.result);
}

function setExpression(nextExpression, cursorIndex = nextExpression.length) {
  state.expression = nextExpression;
  expressionInput.value = nextExpression;
  expressionInput.focus();
  const safeIndex = Math.min(cursorIndex, nextExpression.length);
  expressionInput.setSelectionRange(safeIndex, safeIndex);
}

function writeToExpression(value) {
  const start = expressionInput.selectionStart ?? state.expression.length;
  const end = expressionInput.selectionEnd ?? state.expression.length;
  const next = `${state.expression.slice(0, start)}${value}${state.expression.slice(end)}`;
  setExpression(next, start + value.length);
  setStatus('');
}

function deleteAtCursor(direction = 'back') {
  const start = expressionInput.selectionStart ?? state.expression.length;
  const end = expressionInput.selectionEnd ?? state.expression.length;

  if (start !== end) {
    const next = `${state.expression.slice(0, start)}${state.expression.slice(end)}`;
    setExpression(next, start);
    return;
  }

  if (direction === 'back') {
    if (start === 0) return;
    const next = `${state.expression.slice(0, start - 1)}${state.expression.slice(start)}`;
    setExpression(next, start - 1);
    return;
  }

  if (start >= state.expression.length) return;
  const next = `${state.expression.slice(0, start)}${state.expression.slice(start + 1)}`;
  setExpression(next, start);
}

function clearExpression() {
  setExpression('');
  setStatus('');
}

function toggleSign() {
  const expression = state.expression.trim();
  if (!expression) {
    writeToExpression('-');
    return;
  }

  const lastTokenMatch = expression.match(/(?:[-+*/%(^]|\d+\.?\d*|\.?\d+|pi|e|phi|[a-zA-Z_][a-zA-Z0-9_]*|\))$/);
  const lastToken = lastTokenMatch ? lastTokenMatch[0] : '';

  if (!lastToken || lastToken === '+' || lastToken === '-' || lastToken === '*' || lastToken === '/' || lastToken === '%' || lastToken === '^' || lastToken === '(') {
    writeToExpression('-');
    return;
  }

  const start = expression.length - lastToken.length;
  const next = `${expression.slice(0, start)}(-${lastToken})`;
  setExpression(next, next.length);
}

function factorial(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error('Factorial requires a non-negative integer');
  }
  if (number === 0 || number === 1) return 1;
  let total = 1;
  for (let i = 2; i <= number; i += 1) total *= i;
  return total;
}

function doubleFactorial(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error('Double factorial requires a non-negative integer');
  }
  if (number <= 1) return 1;
  let total = 1;
  for (let i = number; i > 1; i -= 2) {
    total *= i;
  }
  return total;
}

function permutation(n, r) {
  const first = Number(n);
  const second = Number(r);
  if (!Number.isInteger(first) || !Number.isInteger(second) || first < 0 || second < 0 || second > first) {
    throw new Error('Invalid permutation input');
  }
  return factorial(first) / factorial(first - second);
}

function combination(n, r) {
  const first = Number(n);
  const second = Number(r);
  if (!Number.isInteger(first) || !Number.isInteger(second) || first < 0 || second < 0 || second > first) {
    throw new Error('Invalid combination input');
  }
  return factorial(first) / (factorial(second) * factorial(first - second));
}

function degreesToRadians(value) {
  const numericValue = Number(value);
  if (state.angleMode === 'DEG') return (numericValue * Math.PI) / 180;
  if (state.angleMode === 'GRAD') return (numericValue * Math.PI) / 200;
  return numericValue;
}

function radiansToDegrees(value) {
  const numericValue = Number(value);
  if (state.angleMode === 'DEG') return (numericValue * 180) / Math.PI;
  if (state.angleMode === 'GRAD') return (numericValue * 200) / Math.PI;
  return numericValue;
}

function getFunctionMap() {
  return {
    sin: (value) => Math.sin(degreesToRadians(value)),
    cos: (value) => Math.cos(degreesToRadians(value)),
    tan: (value) => Math.tan(degreesToRadians(value)),
    asin: (value) => radiansToDegrees(Math.asin(value)),
    acos: (value) => radiansToDegrees(Math.acos(value)),
    atan: (value) => radiansToDegrees(Math.atan(value)),
    cot: (value) => 1 / Math.tan(degreesToRadians(value)),
    sec: (value) => 1 / Math.cos(degreesToRadians(value)),
    csc: (value) => 1 / Math.sin(degreesToRadians(value)),
    sinh: (value) => Math.sinh(value),
    cosh: (value) => Math.cosh(value),
    tanh: (value) => Math.tanh(value),
    coth: (value) => 1 / Math.tanh(value),
    sech: (value) => 1 / Math.cosh(value),
    csch: (value) => 1 / Math.sinh(value),
    asinh: (value) => Math.asinh(value),
    acosh: (value) => Math.acosh(value),
    atanh: (value) => Math.atanh(value),
    log: (value, base = 10) => {
      if (arguments.length < 2) return Math.log10(value);
      if (base <= 0 || base === 1) {
        throw new Error('Invalid logarithm base');
      }
      return Math.log(value) / Math.log(base);
    },
    ln: (value) => Math.log(value),
    sqrt: (value) => Math.sqrt(value),
    cbrt: (value) => Math.cbrt(value),
    abs: (value) => Math.abs(value),
    floor: (value) => Math.floor(value),
    ceil: (value) => Math.ceil(value),
    exp: (value) => Math.exp(value),
    e: Math.E,
    pi: Math.PI,
    phi: (1 + Math.sqrt(5)) / 2,
    gcd: (a, b) => {
      let first = Math.abs(Number(a));
      let second = Math.abs(Number(b));
      while (second !== 0) {
        const remainder = first % second;
        first = second;
        second = remainder;
      }
      return first;
    },
    lcm: (a, b) => {
      const first = Math.abs(Number(a));
      const second = Math.abs(Number(b));
      if (first === 0 || second === 0) return 0;
      return Math.abs(first / Math.gcd(first, second) * second);
    },
    factorial,
    doubleFactorial,
    nPr: permutation,
    nCr: combination,
    random: () => Math.random(),
    sign: (value) => Math.sign(value),
    round: (value) => Math.round(value),
    min: (...args) => Math.min(...args),
    max: (...args) => Math.max(...args),
    pow: (base, exponent) => Math.pow(base, exponent),
    nthRoot: (value, root = 2) => Math.pow(value, 1 / root),
    perm: permutation,
    comb: combination,
    fact: factorial
  };
}

function prepareExpression(expression) {
  let prepared = String(expression).trim();
  if (!prepared) return '0';

  prepared = prepared
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/π/g, 'pi')
    .replace(/φ/g, 'phi')
    .replace(/√/g, 'sqrt(')
    .replace(/∛/g, 'cbrt(')
    .replace(/ANS/gi, `(${state.lastAnswer})`);

  return prepared;
}

function safeEvaluateMath(expression) {
  if (!window.math) {
    throw new Error('Math engine unavailable');
  }

  const scope = {
    ...getFunctionMap(),
    ans: state.lastAnswer,
    pi: Math.PI,
    e: Math.E,
    phi: (1 + Math.sqrt(5)) / 2
  };

  const prepared = prepareExpression(expression);
  const result = window.math.evaluate(prepared, scope);

  if (typeof result === 'number' && !Number.isFinite(result)) {
    throw new Error('Math error');
  }

  return result;
}

function tokenizeExpression(expression) {
  const tokens = [];
  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index];
    if (/\s/.test(char)) continue;

    if (/[0-9.]/.test(char)) {
      let value = char;
      let decimalSeen = char === '.';
      while (index + 1 < expression.length) {
        const nextChar = expression[index + 1];
        if (/[0-9]/.test(nextChar)) {
          value += nextChar;
          index += 1;
        } else if (nextChar === '.' && !decimalSeen) {
          value += nextChar;
          decimalSeen = true;
          index += 1;
        } else {
          break;
        }
      }
      tokens.push(value);
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let value = char;
      while (index + 1 < expression.length && /[A-Za-z0-9_]/.test(expression[index + 1])) {
        value += expression[index + 1];
        index += 1;
      }
      tokens.push(value.toLowerCase());
      continue;
    }

    if ('()+-*/%^!,'.includes(char)) {
      tokens.push(char);
      continue;
    }

    throw new Error(`Unsupported character: ${char}`);
  }

  const expanded = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    expanded.push(token);

    const nextToken = tokens[index + 1];
    if (!nextToken) continue;

    const shouldMultiply =
      (/[0-9)]/.test(token) && /[0-9A-Za-z_(]/.test(nextToken)) ||
      (/[A-Za-z)]/.test(token) && /[0-9A-Za-z_(]/.test(nextToken) && !(token === 'sin' || token === 'cos' || token === 'tan' || token === 'ln' || token === 'log' || token === 'sqrt' || token === 'asin' || token === 'acos' || token === 'atan' || token === 'exp' || token === 'factorial' || token === 'abs' || token === 'floor' || token === 'ceil' || token === 'sign' || token === 'round' || token === 'gcd' || token === 'lcm' || token === 'npr' || token === 'ncr' || token === 'max' || token === 'min' || token === 'pow'));

    if (shouldMultiply) {
      expanded.push('*');
    }
  }

  return expanded;
}

function parseExpression(tokens) {
  let index = 0;

  function currentToken() {
    return tokens[index];
  }

  function match(token) {
    if (currentToken() === token) {
      index += 1;
      return true;
    }
    return false;
  }

  function parsePrimary() {
    const token = currentToken();

    if (!token) {
      throw new Error('Invalid expression');
    }

    if (token === '(') {
      index += 1;
      const value = parseAdditive();
      if (!match(')')) {
        throw new Error('Missing closing parenthesis');
      }
      return value;
    }

    if (token === '-') {
      index += 1;
      return -parsePrimary();
    }

    if (token === '+') {
      index += 1;
      return parsePrimary();
    }

    if (token === 'pi' || token === 'e' || token === 'phi') {
      index += 1;
      return getFunctionMap()[token];
    }

    if (/^\d+(?:\.\d+)?$/.test(token) || /^\.\d+$/.test(token)) {
      index += 1;
      return Number(token);
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
      const name = token;
      index += 1;

      const fnMap = getFunctionMap();
      if (!(name in fnMap)) {
        throw new Error(`Unknown function: ${name}`);
      }

      if (match('(')) {
        const args = [];
        if (currentToken() !== ')') {
          args.push(parseAdditive());
          while (match(',')) {
            args.push(parseAdditive());
          }
        }
        if (!match(')')) {
          throw new Error(`Missing closing parenthesis for ${name}`);
        }
        return fnMap[name](...args);
      }

      return fnMap[name];
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  function parsePostfix() {
    let value = parsePrimary();
    while (match('!')) {
      value = factorial(value);
    }
    return value;
  }

  function parsePower() {
    let value = parsePostfix();
    if (match('^')) {
      value = Math.pow(value, parseUnary());
    }
    return value;
  }

  function parseUnary() {
    if (match('+')) return parseUnary();
    if (match('-')) return -parseUnary();
    return parsePower();
  }

  function parseMultiplicative() {
    let value = parseUnary();
    while (true) {
      if (match('*')) {
        value *= parseUnary();
      } else if (match('/')) {
        const divisor = parseUnary();
        if (divisor === 0) {
          throw new Error('Division by zero');
        }
        value /= divisor;
      } else if (match('%')) {
        const divisor = parseUnary();
        if (divisor === 0) {
          throw new Error('Division by zero');
        }
        value %= divisor;
      } else {
        return value;
      }
    }
  }

  function parseAdditive() {
    let value = parseMultiplicative();
    while (true) {
      if (match('+')) {
        value += parseMultiplicative();
      } else if (match('-')) {
        value -= parseMultiplicative();
      } else {
        return value;
      }
    }
  }

  const result = parseAdditive();
  if (index !== tokens.length) {
    throw new Error(`Unexpected token: ${tokens[index]}`);
  }
  return result;
}

function evaluateExpression() {
  const expression = state.expression.trim();
  if (!expression) {
    state.result = '0';
    renderResult();
    return;
  }

  try {
    const tokens = tokenizeExpression(expression.replace(/ANS/gi, String(state.lastAnswer)));
    const result = parseExpression(tokens);

    if (!Number.isFinite(result)) {
      throw new Error('Math error');
    }

    state.lastAnswer = result;
    state.result = String(result);

    const entry = {
      expression,
      result,
      timestamp: new Date().toISOString()
    };

    state.history = [entry, ...state.history].slice(0, 30);
    persistHistory();
    renderHistory();
    renderResult();
    setStatus('Calculated successfully.', 'success');
  } catch (error) {
    state.result = 'Error';
    renderResult();

    if (error.message && error.message.includes('Division by zero')) {
      setStatus('Division by zero', 'error');
    } else if (error.message && error.message.includes('Factorial requires')) {
      setStatus('Domain error', 'error');
    } else {
      setStatus('Invalid expression', 'error');
    }
  }
}

function renderHistory() {
  historyList.innerHTML = '';

  if (!state.history.length) {
    const item = document.createElement('li');
    item.className = 'history-empty';
    item.textContent = 'No calculations yet';
    historyList.appendChild(item);
    return;
  }

  state.history.forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = 'history-item';
    item.innerHTML = `
      <button type="button" class="history-expression" data-history-index="${index}" data-action="reuse-expression">${escapeHtml(entry.expression)}</button>
      <button type="button" class="history-result" data-history-index="${index}" data-action="copy-result">= ${escapeHtml(formatNumber(entry.result))}</button>
      <div class="history-meta">
        <span>${new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <button type="button" class="history-delete" data-history-index="${index}" data-action="delete-history" aria-label="Delete history item">×</button>
      </div>
    `;
    historyList.appendChild(item);
  });
}

function setHistoryOpen(isOpen, restoreFocus = true) {
  historyPanel.hidden = !isOpen;
  historyToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

  if (isOpen) {
    document.getElementById('closeHistory').focus();
  } else if (restoreFocus) {
    historyToggle.focus();
  }
}

function useHistoryExpression(index) {
  const entry = state.history[index];
  if (!entry) return;
  setHistoryOpen(false, false);
  setExpression(entry.expression, entry.expression.length);
  requestAnimationFrame(() => expressionInput.focus());
}

function deleteHistoryItem(index) {
  state.history.splice(index, 1);
  persistHistory();
  renderHistory();
}

async function copyCurrentResult() {
  const value = String(state.result).replace('Error', '');
  if (!value || value === 'Error') {
    setStatus('Nothing to copy', 'error');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const temp = document.createElement('textarea');
      temp.value = value;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }

    setStatus('✓ Copied', 'success');
    setTimeout(() => setStatus(''), 1200);
  } catch (error) {
    setStatus('Copy failed', 'error');
  }
}

function handleActionEvents(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;

  if (action === 'clear') {
    clearExpression();
    state.result = '0';
    renderResult();
    return;
  }

  if (action === 'delete') {
    const start = expressionInput.selectionStart ?? state.expression.length;
    const end = expressionInput.selectionEnd ?? state.expression.length;
    if (start === end) {
      deleteAtCursor('forward');
    } else {
      deleteAtCursor('back');
    }
    return;
  }

  if (action === 'backspace') {
    deleteAtCursor('back');
    return;
  }

  if (action === 'toggle-sign') {
    toggleSign();
    return;
  }

  if (action === 'evaluate') {
    evaluateExpression();
    return;
  }

  if (action === 'ans') {
    writeToExpression(String(state.lastAnswer));
  }
}

function handleMemory(event) {
  const btn = event.target.closest('[data-memory]');
  if (!btn) return;

  const action = btn.dataset.memory;
  const numberValue = Number(state.result) || Number(state.lastAnswer) || 0;

  switch (action) {
    case 'MC':
      state.memory = 0;
      break;
    case 'MR':
      setExpression(String(state.memory), String(state.memory).length);
      break;
    case 'M+':
      state.memory += numberValue;
      break;
    case 'M-':
      state.memory -= numberValue;
      break;
    case 'MS':
      state.memory = numberValue;
      break;
    default:
      break;
  }

  updateMemoryIndicator();
}

function onInsertClick(event) {
  const button = event.target.closest('[data-insert]');
  if (!button) return;
  writeToExpression(button.dataset.insert);
}

function handleHistoryEvents(event) {
  const target = event.target.closest('[data-history-index]');
  if (!target) return;

  const index = Number(target.dataset.historyIndex);
  const action = target.dataset.action;

  if (action === 'reuse-expression') {
    useHistoryExpression(index);
    return;
  }

  if (action === 'copy-result') {
    const value = String(state.history[index].result);
    navigator.clipboard.writeText(value)
      .then(() => setStatus('✓ Copied', 'success'))
      .catch(() => setStatus('Copy failed', 'error'));
    return;
  }

  if (action === 'delete-history') {
    deleteHistoryItem(index);
  }
}

function bindControls() {
  document.querySelectorAll('.mode-btn').forEach((button) => {
    button.addEventListener('click', () => setAngleMode(button.dataset.mode));
  });

  document.querySelectorAll('[data-insert]').forEach((button) => {
    button.addEventListener('click', onInsertClick);
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', handleActionEvents);
  });

  document.querySelectorAll('[data-memory]').forEach((button) => {
    button.addEventListener('click', handleMemory);
  });

  document.getElementById('copyResult').addEventListener('click', copyCurrentResult);
  historyToggle.addEventListener('click', () => setHistoryOpen(historyPanel.hidden));
  document.getElementById('closeHistory').addEventListener('click', () => setHistoryOpen(false));
  historyPanel.addEventListener('click', (event) => {
    if (event.target === historyPanel) {
      setHistoryOpen(false);
    }
  });
  document.getElementById('clearHistory').addEventListener('click', () => {
    state.history = [];
    persistHistory();
    renderHistory();
  });

  themeToggle.addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  formatModeSelect.addEventListener('change', (event) => setFormatMode(event.target.value));

  expressionInput.addEventListener('input', (event) => {
    state.expression = event.target.value;
    setStatus('');
  });

  expressionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      evaluateExpression();
    }

    if (event.key === 'Escape') {
      clearExpression();
      state.result = '0';
      renderResult();
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      deleteAtCursor('back');
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      deleteAtCursor('forward');
    }
  });

  historyList.addEventListener('click', handleHistoryEvents);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !historyPanel.hidden) {
      event.preventDefault();
      setHistoryOpen(false);
      return;
    }
    if (!historyPanel.hidden) {
      if (event.key === 'Tab') {
        const focusableElements = historyPanel.querySelectorAll('button:not([disabled])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Backspace' || event.key === 'Delete') return;
    if (/^[0-9+\-*/().%=, ]$/.test(event.key)) {
      if (event.key === 'x' || event.key === 'X') {
        writeToExpression('*');
      }
      return;
    }

    if (event.key === 'p' || event.key === 'P') {
      writeToExpression('pi');
      return;
    }
    if (event.key === 'e' || event.key === 'E') {
      writeToExpression('e');
      return;
    }
    if (event.key === 's' || event.key === 'S') {
      writeToExpression('sin(');
      return;
    }
    if (event.key === 'c' || event.key === 'C') {
      writeToExpression('cos(');
      return;
    }
    if (event.key === 't' || event.key === 'T') {
      writeToExpression('tan(');
      return;
    }

    if (!/[A-Za-z]/.test(event.key)) {
      writeToExpression(event.key);
    }
  });
}

function initialize() {
  const storedHistory = JSON.parse(readStorage(STORAGE_KEYS.history, '[]'));
  state.history = Array.isArray(storedHistory) ? storedHistory : [];
  state.angleMode = readStorage(STORAGE_KEYS.angle, 'DEG');
  state.theme = readStorage(STORAGE_KEYS.theme, 'dark');
  state.formatMode = readStorage(STORAGE_KEYS.format, 'auto');

  setTheme(state.theme);
  setAngleMode(state.angleMode);
  setFormatMode(state.formatMode);
  updateMemoryIndicator();
  renderHistory();
  renderResult();
  bindControls();
  expressionInput.value = state.expression;
}

initialize();
