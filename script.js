let choice = {};
const medicare = document.getElementById("medicare");
const socialSecurity = document.getElementById("SS");
const federalTax = document.getElementById("federal");
const stateTax = document.getElementById("state");
const careerInfo = document.getElementById("career");

// Detect which page we are on
const currentPage = window.location.pathname.split("/").pop() || "index.html";

// ---- Careers & Taxes (index.html) ----

async function getCareers() {
    const url = "https://eecu-data-server.vercel.app/data";
    try {
        const response = await fetch(url);
        const jobs = await response.json();
        createOptions(jobs);
        return jobs;
    } catch (error) {
        console.error("Error fetching careers data:", error);
        return [];
    }
}

function createOptions(careers) {
    const dropdown = document.getElementById("careers");

    // Create the options
    careers.forEach((career, index) => {
        const option = document.createElement("option");
        option.innerHTML = `${career.Occupation}: $${career.Salary}`;
        option.value = index; // Store the array index as the value
        option.classList.add("option");
        dropdown.appendChild(option);
    });

    // Restore the previously selected career if one was saved
    if (choice.Occupation) {
        const matchIndex = careers.findIndex(c => c.Occupation === choice.Occupation);
        if (matchIndex !== -1) dropdown.value = matchIndex;
    }

    // Listen for the dropdown value to change
    dropdown.addEventListener("change", (event) => {
        const selectedIndex = event.target.value;

        // Update the choice object using the selected index
        choice.Occupation = careers[selectedIndex].Occupation;
        choice.Salary = careers[selectedIndex].Salary;

        saveChoice(choice);
        displayCareerInfo(choice);
        console.log(choice);
    });
}

function saveChoice(choice) {
    let savedChoice = JSON.stringify(choice);
    localStorage.setItem("choices", savedChoice);
    console.log("Choice saved:", choice);
}

function loadChoice() {
    let savedChoices = JSON.parse(localStorage.getItem("choices")) || {};
    choice = savedChoices;
}

function displayCareerInfo(choice) {
    if (!choice.Occupation) return;
    careerInfo.innerHTML = `Occupation: ${choice.Occupation}<br>Salary: $${choice.Salary}`;
    document.getElementById("salary").value = choice.Salary;
    calculateTaxes(choice);
}

function calculateTaxes(choice) {
    const salary = Number(choice.Salary) || 0;

    // FICA taxes
    let medicareAmt = salary * 0.0145;
    let socialSecurityAmt = salary * 0.062;
    let stateTaxAmt = salary * 0.04;

    medicare.innerHTML = `$${medicareAmt.toFixed(2)}`;
    socialSecurity.innerHTML = `$${socialSecurityAmt.toFixed(2)}`;
    stateTax.innerHTML = `$${stateTaxAmt.toFixed(2)}`;

    // Federal income tax — subtract standard deduction first, then apply 2026 brackets
    const standardDeduction = 16100;
    const taxableIncome = Math.max(0, salary - standardDeduction);

    let federalTaxAmount = 0;
    if (taxableIncome <= 12400) {
        // 10% bracket
        let tenPercent = taxableIncome * 0.10;
        federalTaxAmount = tenPercent;
    } else if (taxableIncome <= 50400) {
        // 10% on first $12,400 + 12% on the rest
        let tenPercent = 12400 * 0.10;
        let twelvePercent = (taxableIncome - 12400) * 0.12;
        federalTaxAmount = tenPercent + twelvePercent;
    } else {
        // 10% + 12% + 22% on amount over $50,400
        let tenPercent = 12400 * 0.10;
        let twelvePercent = (50400 - 12400) * 0.12;
        let twentyTwoPercent = (taxableIncome - 50400) * 0.22;
        federalTaxAmount = tenPercent + twelvePercent + twentyTwoPercent;
    }
    federalTax.innerHTML = `$${federalTaxAmount.toFixed(2)}`;

    let totalTaxes = medicareAmt + socialSecurityAmt + stateTaxAmt + federalTaxAmount;
    let netIncome = salary - totalTaxes;

    // Save tax data for use on the completion page
    localStorage.setItem("calculatorData", JSON.stringify({
        grossSalary: salary.toFixed(2),
        medicare: medicareAmt.toFixed(2),
        socialSecurity: socialSecurityAmt.toFixed(2),
        stateTax: stateTaxAmt.toFixed(2),
        federalTax: federalTaxAmount.toFixed(2),
        totalTaxes: totalTaxes.toFixed(2),
        netIncome: netIncome.toFixed(2)
    }));
}

// ---- Expense Pages (housing, lifestyle, essentials, edu, futureproof) ----

// Map each page to its localStorage key
const expensePageMap = {
    "housing.html":     "housingData",
    "lifestyle.html":   "lifestyleData",
    "essentials.html":  "essentialsData",
    "edu.html":         "eduData",
    "futureproof.html": "futureproofData"
};

function saveExpenses(storageKey) {
    const inputs = document.querySelectorAll("input[name]");
    let expenseData = JSON.parse(localStorage.getItem(storageKey)) || {};

    // Save each input value under its name attribute
    inputs.forEach(input => {
        expenseData[input.name] = input.value;
    });

    localStorage.setItem(storageKey, JSON.stringify(expenseData));
}

function loadExpenses(storageKey) {
    let savedExpenses = JSON.parse(localStorage.getItem(storageKey)) || {};
    const inputs = document.querySelectorAll("input[name]");

    // Restore each input from saved data
    inputs.forEach(input => {
        if (savedExpenses[input.name] !== undefined) {
            input.value = savedExpenses[input.name];
        }
    });
}

function initExpensePage() {
    const storageKey = expensePageMap[currentPage];
    if (!storageKey) return;

    // Load any previously saved values into the inputs
    loadExpenses(storageKey);

    // Save on every keystroke
    document.querySelectorAll("input[name]").forEach(input => {
        input.addEventListener("input", () => saveExpenses(storageKey));
    });
}

// ---- Completion Page ----

function sumValues(obj) {
    // Add up all numeric values in an object
    return Object.values(obj).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
}

function buildCompletionPage() {
    // Pull all saved data from localStorage
    let calcData      = JSON.parse(localStorage.getItem("calculatorData")) || {};
    let housingData   = JSON.parse(localStorage.getItem("housingData"))    || {};
    let lifestyleData = JSON.parse(localStorage.getItem("lifestyleData"))  || {};
    let essentialsData= JSON.parse(localStorage.getItem("essentialsData")) || {};
    let eduData       = JSON.parse(localStorage.getItem("eduData"))        || {};
    let futureData    = JSON.parse(localStorage.getItem("futureproofData"))|| {};

    // Salary from API is annual — convert to monthly
    let monthlyNet   = (parseFloat(calcData.netIncome)   || 0) / 12;
    let monthlyTaxes = (parseFloat(calcData.totalTaxes)  || 0) / 12;

    let housingTotal    = sumValues(housingData);
    let lifestyleTotal  = sumValues(lifestyleData);
    let essentialsTotal = sumValues(essentialsData);
    let eduTotal        = sumValues(eduData);
    let futureTotal     = sumValues(futureData);

    let totalExpenses = housingTotal + lifestyleTotal + essentialsTotal + eduTotal + futureTotal;
    let remaining     = monthlyNet - totalExpenses;

    // Build the donut chart using Chart.js
    const ctx = document.getElementById("donutChart");
    if (ctx) {
        new Chart(ctx.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: ["Taxes", "Housing", "Lifestyle", "Essentials", "Education", "Future-Proofing", "Remaining Balance"],
                datasets: [{
                    label: "Budget Distribution",
                    data: [
                        monthlyTaxes.toFixed(2),
                        housingTotal.toFixed(2),
                        lifestyleTotal.toFixed(2),
                        essentialsTotal.toFixed(2),
                        eduTotal.toFixed(2),
                        futureTotal.toFixed(2),
                        Math.max(0, remaining).toFixed(2)
                    ],
                    backgroundColor: [
                        "rgba(220, 53, 69, 0.85)",
                        "rgba(13, 110, 253, 0.85)",
                        "rgba(255, 193, 7, 0.85)",
                        "rgba(25, 135, 84, 0.85)",
                        "rgba(111, 66, 193, 0.85)",
                        "rgba(13, 202, 240, 0.85)",
                        "rgba(108, 117, 125, 0.85)"
                    ],
                    borderWidth: 2,
                    borderColor: "#fff"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: "Your Monthly Budget Distribution" },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.label}: $${parseFloat(context.parsed).toFixed(2)}`
                        }
                    }
                }
            }
        });
    }

    // Display feedback and vibe check
    const feedbackEl = document.getElementById("feedback-message");
    if (feedbackEl) {
        let html = `
            <p><strong>Monthly Net Income:</strong> $${monthlyNet.toFixed(2)}</p>
            <p><strong>Total Monthly Expenses:</strong> $${totalExpenses.toFixed(2)}</p>
            <hr>
        `;

        // Green if surplus, red if shortfall
        if (remaining >= 0) {
            html += `<div class="success-card">
                        <p style="color:green; font-weight:bold;">✅ Monthly Balance: +$${remaining.toFixed(2)} — You're in the green!</p>
                     </div>`;
        } else {
            html += `<div class="wise-up-card">
                        <p style="color:red; font-weight:bold;">⚠️ Monthly Shortfall: -$${Math.abs(remaining).toFixed(2)} — You're spending more than you earn!</p>
                     </div>`;
        }

        // Wise-Up tip if saving less than 10% of monthly net income
        let savingsRate = monthlyNet > 0 ? (futureTotal / monthlyNet) : 0;
        if (savingsRate < 0.10) {
           html += `<div class="wise-up-card">
                        💡 <strong>Wise-Up Tip:</strong> You're saving less than 10% of your income.
                        Try to set aside at least <strong>$${(monthlyNet * 0.10).toFixed(2)}/month</strong> for your future self!
                     </div>`;
        }

        feedbackEl.innerHTML = html;
    }
}

// ---- Run the right code for the current page ----

if (currentPage === "index.html" || currentPage === "") {
    loadChoice();
    displayCareerInfo(choice);
    getCareers();
} else if (expensePageMap[currentPage]) {
    initExpensePage();
} else if (currentPage === "completion.html") {
    buildCompletionPage();
}