let choice = {};
const medicare = document.getElementById("medicare");
const socialSecurity = document.getElementById("SS");
const federalTax = document.getElementById("federal");
const stateTax = document.getElementById("state");
const careerInfo = document.getElementById("career");

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
    careerInfo.innerHTML = `Occupation: ${choice.Occupation}<br>Salary: $${choice.Salary}`; 
    document.getElementById("salary").value = choice.Salary;
    calculateTaxes(choice);
}

function calculateTaxes(choice) {
    const salary = choice.Salary || 0;
    medicare.innerHTML = `$${(salary * 0.0145).toFixed(2)}`;
    socialSecurity.innerHTML = `$${(salary * 0.062).toFixed(2)}`;
    stateTax.innerHTML = `$${(salary * 0.04).toFixed(2)}`;

    let federalTaxAmount = 0;
    if (salary <= 50400) {
        let tenPercent = (12400 * 0.10);
        let twelvePercent = (50400 * 0.12);
        let twentyTwoPercent = (salary - 50400) * 0.22;
        federalTaxAmount = tenPercent + twelvePercent + twentyTwoPercent;
    }
    else if (salary <= 12,401) {
        let tenPercent = (12400 * 0.10);
        let twelvePercent = (salary - 12400) * 0.12;
        federalTaxAmount = tenPercent + twelvePercent;
    }
    else {
        federalTaxAmount = salary * 0.10;
    } federalTax.innerHTML = `$${federalTaxAmount.toFixed(2)}`;

    localStorage.setItem("calculatorData", JSON.stringify({
        medicare: (salary * 0.0145).toFixed(2),
        socialSecurity: (salary * 0.062).toFixed(2),
        stateTax: (salary * 0.04).toFixed(2),
        federalTax: federalTaxAmount.toFixed(2),
        netIncome: (salary - (salary * 0.0145) - (salary * 0.062) - (salary * 0.04) - federalTaxAmount).toFixed(2)

    }));
}

    
    document.getElementById("tax").addEventListener("click", () => {
        let salary = document.getElementById("salary").value;
        salary = salary.replace("$", "");
        console.log(salary);
        const other = document.getElementById("annual"); 
        taxing = 0;
    });
        


loadChoice();
displayCareerInfo(choice);
getCareers();