const vehicles = {
  mandaragit: {
    name: "Mandaragit PUV X",
    basePrice: 3600000,
  },
  limbas: {
    name: "Limbas X",
    basePrice: 3900000,
  },
};

const routeLabels = {
  urban: "Urban route",
  mixed: "Mixed city and provincial",
  hilly: "Hilly or high-load route",
  assessment: "Still under assessment",
};

const routeMultipliers = {
  urban: 1,
  mixed: 1.04,
  hilly: 1.09,
  assessment: 1.05,
};

const hourMultipliers = {
  8: 1,
  12: 1.03,
  16: 1.07,
  18: 1.11,
};

const batteryLabels = {
  charging: "Depot charging",
  swapping: "Battery swapping",
  subscription: "Battery subscription",
  assessment: "Needs Tojo assessment",
};

const batteryMultipliers = {
  charging: 1.08,
  swapping: 1.16,
  subscription: 1.04,
  assessment: 1.1,
};

const supportLabels = {
  maintenance: "Maintenance",
  parts: "Parts",
  training: "Training",
  operations: "Operations planning",
  gps: "GPS / AFCS",
  hauling: "Hauling",
};

const supportCosts = {
  maintenance: 45000,
  parts: 35000,
  training: 25000,
  operations: 55000,
  gps: 40000,
  hauling: 30000,
};

const stepTitles = [
  "Route profile",
  "Vehicle and fleet",
  "Battery setup",
  "Support needs",
  "Contact form",
];

const form = document.querySelector("#estimateForm");
const steps = [...document.querySelectorAll(".wizard-step")];
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const formStatus = document.querySelector("#formStatus");
const fleetSizeInput = document.querySelector("#fleetSize");
let currentStep = 0;

function currencyShort(value) {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `PHP ${millions.toFixed(millions >= 10 ? 0 : 1)}M`;
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function selectedValue(name) {
  return new FormData(form).get(name);
}

function selectedSupports() {
  return [...form.querySelectorAll("input[name='support']:checked")].map((input) => input.value);
}

function getTier(fleetSize) {
  if (fleetSize >= 25) {
    return {
      name: "Full Route Deployment",
      note: "Best for route-wide or LGU-backed modernization programs with stronger operations planning.",
    };
  }

  if (fleetSize >= 5) {
    return {
      name: "Cooperative Fleet Package",
      note: "Best for cooperatives and operators preparing a practical route-based rollout.",
    };
  }

  return {
    name: "Pilot PUV Package",
    note: "Best for initial validation, demos, or a starter deployment before scaling units.",
  };
}

function updateStepDots() {
  document.querySelectorAll(".step-dot").forEach((dot, i) => {
    const isDone = i < currentStep;
    const isActive = i === currentStep;
    dot.classList.toggle("is-done", isDone);
    dot.classList.toggle("is-active", isActive);
    dot.textContent = isDone ? "✓" : String(i + 1);
  });
  document.querySelectorAll(".step-connector").forEach((conn, i) => {
    conn.classList.toggle("is-done", i < currentStep);
  });
}

function updateWizard(shouldFocus = false) {
  steps.forEach((step, index) => {
    step.classList.toggle("is-active", index === currentStep);
  });

  document.querySelector("#stepCounter").textContent = `Step ${currentStep + 1} of ${steps.length}`;
  document.querySelector("#stepTitle").textContent = stepTitles[currentStep];

  const progressFill = document.querySelector("#progressFill");
  const pct = ((currentStep + 1) / steps.length) * 100;
  progressFill.style.width = `${pct}%`;
  progressFill.closest("[role='progressbar']")?.setAttribute("aria-valuenow", currentStep + 1);

  prevButton.disabled = currentStep === 0;
  nextButton.textContent = currentStep === steps.length - 1 ? "Submit Request" : "Next";

  updateStepDots();

  if (shouldFocus) {
    const heading = steps[currentStep].querySelector("h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: false });
    }
  }
}

function updateEstimate() {
  const vehicle = vehicles[selectedValue("vehicle")] || vehicles.mandaragit;
  const fleetSize = Math.max(1, Math.min(500, Number(fleetSizeInput.value) || 1));
  const routeType = selectedValue("routeType") || "urban";
  const operatingHours = selectedValue("operatingHours") || "12";
  const battery = selectedValue("battery") || "charging";
  const supports = selectedSupports();
  const supportPerUnit = supports.reduce((total, support) => total + supportCosts[support], 0);
  const unitEstimate =
    vehicle.basePrice *
      routeMultipliers[routeType] *
      hourMultipliers[operatingHours] *
      batteryMultipliers[battery] +
    supportPerUnit;
  const lower = unitEstimate * fleetSize * 0.94;
  const upper = unitEstimate * fleetSize * 1.12;
  const tier = getTier(fleetSize);

  fleetSizeInput.value = fleetSize;
  document.querySelector("#packageTier").textContent = tier.name;
  document.querySelector("#resultNote").textContent = tier.note;
  document.querySelector("#priceRange").textContent = `${currencyShort(lower)} - ${currencyShort(upper)}`;
  document.querySelector("#summaryVehicle").textContent = vehicle.name;
  document.querySelector("#summaryFleet").textContent = `${fleetSize} ${fleetSize === 1 ? "unit" : "units"}`;
  document.querySelector("#summaryRoute").textContent = routeLabels[routeType];
  document.querySelector("#summaryBattery").textContent = batteryLabels[battery];
  document.querySelector("#summarySupport").textContent =
    supports.map((support) => supportLabels[support]).join(", ") || "Basic review only";
}

function validateCurrentStep() {
  const activeStep = steps[currentStep];
  const requiredFields = [...activeStep.querySelectorAll("[required]")];
  const invalidField = requiredFields.find((field) => !field.checkValidity());

  if (invalidField) {
    invalidField.reportValidity();
    return false;
  }

  return true;
}

prevButton.addEventListener("click", () => {
  currentStep = Math.max(0, currentStep - 1);
  formStatus.textContent = "";
  updateWizard(true);
});

nextButton.addEventListener("click", () => {
  if (!validateCurrentStep()) return;

  if (currentStep < steps.length - 1) {
    currentStep += 1;
    formStatus.textContent = "";
    updateWizard(true);
    return;
  }

  nextButton.disabled = true;
  nextButton.textContent = "Sending…";
  setTimeout(() => {
    nextButton.disabled = false;
    nextButton.textContent = "Submit Request";
    formStatus.textContent = "Request captured — connect this form to your CRM or email handler for live submissions.";
  }, 800);
});

document.querySelectorAll(".stepper-button").forEach((button) => {
  button.addEventListener("click", () => {
    fleetSizeInput.value = Number(fleetSizeInput.value || 1) + Number(button.dataset.step);
    updateEstimate();
  });
});

document.querySelectorAll(".quick-sizes button").forEach((button) => {
  button.addEventListener("click", () => {
    fleetSizeInput.value = button.dataset.size;
    updateEstimate();
  });
});

form.addEventListener("input", updateEstimate);
form.addEventListener("change", updateEstimate);

updateWizard(false);
updateEstimate();
