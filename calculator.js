// ----- Simple Calculator using only Vanilla JS -----
    // Core state:
    // - currentInput: string that user is building (current number / expression segment)
    // - previousOperand: stored number (as string or number) before operator
    // - currentOperator: pending operator (null or '+','-','*','/')
    // - shouldResetDisplay: flag to reset display after an operator or equals
    // - expressionHistory: string to show the ongoing expression in small line (optional)
    
    let currentInput = "0";        // what's shown on main display
    let previousOperand = null;    // numeric value stored from before
    let currentOperator = null;     // pending operation
    let shouldResetDisplay = false;  // when true, next digit replaces currentInput
    let expressionHistory = "";      // for the small expression line
    
    // DOM elements
    const currentDisplayElem = document.getElementById("currentDisplay");
    const expressionElem = document.getElementById("expressionDisplay");
    
    // Helper: update the UI (both main display and expression line)
    function updateDisplay() {
        // format main number: if it's a decimal without integer part, keep it readable
        let displayValue = currentInput;
        if (displayValue === "") displayValue = "0";
        // avoid showing trailing dot if user typed . but no digits (edge case)
        if (displayValue === ".") displayValue = "0.";
        currentDisplayElem.innerText = displayValue;
        
        // build expression line based on state
        if (previousOperand !== null && currentOperator !== null && !shouldResetDisplay) {
            // e.g., "12 + " or "45 - " style
            let prevStr = formatNumberForExpression(previousOperand);
            let opSymbol = getOperatorSymbol(currentOperator);
            expressionElem.innerText = `${prevStr} ${opSymbol}`;
        } else if (expressionHistory && previousOperand === null && currentOperator === null) {
            expressionElem.innerText = expressionHistory;
        } else if (previousOperand !== null && currentOperator === null && shouldResetDisplay === false) {
            // after equals -> show previous result but no operator
            let prevStr = formatNumberForExpression(previousOperand);
            expressionElem.innerText = `${prevStr} =`;
        } else if (previousOperand !== null && shouldResetDisplay && currentOperator === null) {
            // just finished equal, no pending operation
            let prevStr = formatNumberForExpression(previousOperand);
            expressionElem.innerText = `${prevStr} =`;
        } else {
            // default clean
            if (expressionHistory) expressionElem.innerText = expressionHistory;
            else expressionElem.innerText = "";
        }
        
        // edge: if no history and all null, clear expression
        if (previousOperand === null && currentOperator === null && currentInput === "0" && !expressionHistory) {
            expressionElem.innerText = "";
        }
    }
    
    // convert internal operator symbol to visual friendly char
    function getOperatorSymbol(op) {
        if (op === '+') return '+';
        if (op === '-') return '−';
        if (op === '*') return '×';
        if (op === '/') return '÷';
        return op;
    }
    
    // format number to avoid scientific notation for expression line
    function formatNumberForExpression(num) {
        if (num === null || num === undefined) return '';
        let n = parseFloat(num);
        if (isNaN(n)) return '0';
        // if integer, show as integer
        if (Number.isInteger(n)) return n.toString();
        // trim trailing zeros but keep up to 8 decimal digits clean
        return parseFloat(n.toFixed(8)).toString();
    }
    
    // core compute function: result = previousOperand (operator) currentInputNumber
    function computeResult() {
        if (previousOperand === null || currentOperator === null) return null;
        const prev = parseFloat(previousOperand);
        const current = parseFloat(currentInput);
        if (isNaN(prev) || isNaN(current)) return null;
        
        let computation;
        switch (currentOperator) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '*':
                computation = prev * current;
                break;
            case '/':
                if (current === 0) {
                    return "Error";   // division by zero
                }
                computation = prev / current;
                break;
            default:
                return null;
        }
        // handle floating precision, trim long decimals
        if (computation === "Error") return "Error";
        // limit decimal digits for better display (max 10 decimal places)
        if (typeof computation === 'number') {
            // round to avoid 0.1 + 0.2 artifacts but keep sensible
            computation = parseFloat(computation.toFixed(10));
        }
        return computation;
    }
    
    // append digit or decimal point
    function appendNumber(numberChar) {
        // if display is "Error", reset everything before typing number
        if (currentInput === "Error") {
            clearAll();
        }
        
        // if we need to reset display (after operator or equals), start fresh
        if (shouldResetDisplay) {
            currentInput = "";
            shouldResetDisplay = false;
        }
        
        // handle decimal point: avoid multiple dots
        if (numberChar === '.') {
            if (currentInput.includes('.')) return;
            // if input is empty or reset, start with "0."
            if (currentInput === "" || currentInput === null) {
                currentInput = "0.";
                updateDisplay();
                return;
            }
        }
        
        // prevent leading multiple zeros: if currentInput is "0" and not decimal, replace with digit
        if (currentInput === "0" && numberChar !== '.') {
            currentInput = numberChar;
        } else {
            currentInput += numberChar;
        }
        
        // limit length to avoid overflow in UI (max 16 digits before decimal, but flexible)
        if (currentInput.length > 20) {
            currentInput = currentInput.slice(0, 20);
        }
        updateDisplay();
    }
    
    // choose operator (+, -, *, /)
    function setOperator(op) {
        // if current display is Error, clear first
        if (currentInput === "Error") {
            clearAll();
        }
        
        // special: if there's already a pending operator, we might need to compute before assigning new one
        if (previousOperand !== null && currentOperator !== null && !shouldResetDisplay) {
            // compute with existing operator using current input
            const result = computeResult();
            if (result === "Error") {
                currentInput = "Error";
                previousOperand = null;
                currentOperator = null;
                shouldResetDisplay = false;
                expressionHistory = "";
                updateDisplay();
                return;
            }
            if (result !== null && !isNaN(result)) {
                previousOperand = result;
                currentInput = result.toString();
                // after implicit compute, we set new operator but display ready
                currentOperator = op;
                shouldResetDisplay = true;  // next number will overwrite
                updateDisplay();
                return;
            }
        }
        
        // if we have no previous operand, set previousOperand from currentInput
        if (previousOperand === null) {
            if (currentInput !== "" && currentInput !== "Error") {
                previousOperand = parseFloat(currentInput);
                if (isNaN(previousOperand)) previousOperand = 0;
            } else {
                previousOperand = 0;
            }
            currentOperator = op;
            shouldResetDisplay = true;   // next number entry starts fresh
            updateDisplay();
            return;
        }
        
        // if previousOperand exists and no pending operator? (edge)
        if (previousOperand !== null && currentOperator === null) {
            currentOperator = op;
            shouldResetDisplay = true;
            updateDisplay();
            return;
        }
        
        // otherwise just update operator (if we're in middle of typing new number)
        if (shouldResetDisplay && previousOperand !== null) {
            currentOperator = op;
            updateDisplay();
        }
    }
    
    // equals (=) perform final calculation
    function evaluate() {
        // if error state, clear and restart
        if (currentInput === "Error") {
            clearAll();
            return;
        }
        
        // if no operator or previous operand, just keep current (nothing to compute)
        if (currentOperator === null || previousOperand === null) {
            // still update expression history: show current as result? just nothing changes.
            if (previousOperand !== null && currentOperator === null && !shouldResetDisplay) {
                // do nothing
            }
            updateDisplay();
            return;
        }
        
        // avoid compute if display is freshly reset without actual new number, use previousOperand if needed
        let currentValue = parseFloat(currentInput);
        if (shouldResetDisplay && currentOperator !== null && previousOperand !== null) {
            // happens when user pressed operator twice? treat currentInput as previousOperand (already stored)
            currentValue = parseFloat(previousOperand);
        }
        
        // compute result with stored operator and current value
        const result = computeResult();
        if (result === "Error") {
            currentInput = "Error";
            previousOperand = null;
            currentOperator = null;
            shouldResetDisplay = false;
            expressionHistory = "";
            updateDisplay();
            return;
        }
        
        if (result !== null && !isNaN(result)) {
            // store result as new previousOperand? but typical calculator: after equals, ready for new ops
            // get expression history string
            let prevStr = formatNumberForExpression(previousOperand);
            let opSym = getOperatorSymbol(currentOperator);
            let currStr = formatNumberForExpression(parseFloat(currentInput));
            expressionHistory = `${prevStr} ${opSym} ${currStr} =`;
            
            // update state: result becomes new currentInput
            currentInput = result.toString();
            // avoid weird large decimal overflow
            if (currentInput.includes('.') && currentInput.split('.')[1]?.length > 10) {
                currentInput = parseFloat(result).toFixed(10).replace(/\.?0+$/, '');
                if (currentInput === "-0") currentInput = "0";
            }
            previousOperand = null;
            currentOperator = null;
            shouldResetDisplay = true;   // next number starts fresh
            updateDisplay();
        } else {
            // fallback
            clearAll();
        }
    }
    
    // backspace: remove last character from current number
    function backspace() {
        if (currentInput === "Error") {
            clearAll();
            return;
        }
        // if reset flag is true and we have stored operand, we might need to cancel operator? 
        // Usually backspace should affect current input only.
        if (shouldResetDisplay && previousOperand !== null && currentOperator !== null) {
            // we are about to start new number: better just set empty or "0"?
            currentInput = "0";
            shouldResetDisplay = false;
            updateDisplay();
            return;
        }
        
        if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith("-") && currentInput[1] !== '')) {
            currentInput = "0";
        } else {
            currentInput = currentInput.slice(0, -1);
            if (currentInput === "" || currentInput === "-") currentInput = "0";
        }
        updateDisplay();
    }
    
    // clear all: reset everything
    function clearAll() {
        currentInput = "0";
        previousOperand = null;
        currentOperator = null;
        shouldResetDisplay = false;
        expressionHistory = "";
        updateDisplay();
    }
    
    // additional: clear entry (soft clear) but for simplicity, AC does full.
    // attach event listeners via data attributes
    function attachEvents() {
        // numbers and decimal using data-num
        const numBtns = document.querySelectorAll("[data-num]");
        numBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const numVal = btn.getAttribute("data-num");
                appendNumber(numVal);
            });
        });
        
        // operators (+, -, *, /)
        const opBtns = document.querySelectorAll("[data-op]");
        opBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const op = btn.getAttribute("data-op");
                setOperator(op);
            });
        });
        
        // equals action
        const equalsBtn = document.querySelector("[data-action='equals']");
        if (equalsBtn) {
            equalsBtn.addEventListener("click", (e) => {
                e.preventDefault();
                evaluate();
            });
        }
        
        // clear action
        const clearBtn = document.querySelector("[data-action='clear']");
        if (clearBtn) {
            clearBtn.addEventListener("click", (e) => {
                e.preventDefault();
                clearAll();
            });
        }
        
        // backspace action
        const backBtn = document.querySelector("[data-action='backspace']");
        if (backBtn) {
            backBtn.addEventListener("click", (e) => {
                e.preventDefault();
                backspace();
            });
        }
        
        // optional: keyboard support (bonus for better UX but still pure JS)
        window.addEventListener("keydown", (e) => {
            const key = e.key;
            // numbers and dot
            if (/[0-9]/.test(key)) {
                e.preventDefault();
                appendNumber(key);
            } else if (key === '.') {
                e.preventDefault();
                appendNumber('.');
            } else if (key === '+' || key === '-') {
                e.preventDefault();
                setOperator(key);
            } else if (key === '*') {
                e.preventDefault();
                setOperator('*');
            } else if (key === '/') {
                e.preventDefault();
                setOperator('/');
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                evaluate();
            } else if (key === 'Backspace') {
                e.preventDefault();
                backspace();
            } else if (key === 'Escape' || key === 'Delete') {
                e.preventDefault();
                clearAll();
            }
        });
    }
    
    // initialize display
    function init() {
        updateDisplay();
        attachEvents();
    }
    
    init();