const vehicles = {
  mandaragit: {
    name: "Mandaragit PUV X",
    class: "Class 2",
    basePrice: 1950000,
  },
  limbas: {
    name: "Limbas X",
    class: "Class 1",
    basePrice: 1750000,
  },
};

const routeLabels = {
  urban: "Urban (city center)",
  mixed: "Mixed city and provincial",
  hilly: "Hilly or mountainous route",
  tourist: "Tourist / island route",
  assessment: "Still under assessment",
};

const routeMultipliers = {
  urban: 1,
  mixed: 1.04,
  hilly: 1.09,
  tourist: 1.06,
  assessment: 1.05,
};

const hourMultipliers = {
  8: 1,
  12: 1.03,
  16: 1.07,
  18: 1.11,
};

const batteryLabels = {
  charging: "Depot / overnight charging",
  swapping: "Battery swapping (< 2 min)",
  payswap: "Pay-per-swap subscription",
  assessment: "Needs Tojo assessment",
};

const batteryHints = {
  charging: "Requires dedicated charging space at depot or garage.",
  swapping: "Tojo's signature system — always-standby batteries, less than 2-minute swap.",
  payswap: "Pay per swap, no upfront battery cost. Ideal for solo or small operators.",
  assessment: "Tojo's team will evaluate the best setup for your route and depot conditions.",
};

const batteryMultipliers = {
  charging: 1.06,
  swapping: 1.14,
  payswap: 1.08,
  assessment: 1.08,
};

const supportLabels = {
  maintenance: "Preventive maintenance",
  parts: "Parts supply",
  driver_training: "Driver training",
  tech_training: "Technician training",
  fleet_training: "Fleet management training",
  gps_afcs: "GPS & AFCS",
};

const supportCosts = {
  maintenance: 25000,
  parts: 18000,
  driver_training: 12000,
  tech_training: 15000,
  fleet_training: 18000,
  gps_afcs: 25000,
};

const stepTitles = [
  "Route profile",
  "Vehicle and fleet",
  "Battery setup",
  "Support and services",
  "Request review",
];

const form = document.querySelector("#estimateForm");
const steps = [...document.querySelectorAll(".wizard-step")];
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const formStatus = document.querySelector("#formStatus");
const fleetSizeInput = document.querySelector("#fleetSize");
const batteryHintEl = document.querySelector("#batteryHint");
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
  return [...form.querySelectorAll("input[name='support']:checked")].map((el) => el.value);
}

function getTier(fleetSize) {
  if (fleetSize >= 25) {
    return {
      name: "Full Route Deployment",
      note: "Best for route-wide or LGU-backed modernization programs with full operations planning.",
    };
  }
  if (fleetSize >= 5) {
    return {
      name: "Cooperative Fleet Package",
      note: "Best for cooperatives and TODAs preparing a practical route-based rollout.",
    };
  }
  if (fleetSize >= 2) {
    return {
      name: "Pilot PUV Package",
      note: "Best for initial demos or a starter deployment before scaling your fleet.",
    };
  }
  return {
    name: "Solo Operator Package",
    note: "Best for individual franchise holders or solo operators deploying a single Tojo PUV unit.",
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
  progressFill.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
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

function updateBatteryHint() {
  const battery = selectedValue("battery") || "charging";
  if (batteryHintEl) {
    batteryHintEl.textContent = batteryHints[battery] || "";
  }
}

function updateEstimate() {
  const vehicle = vehicles[selectedValue("vehicle")] || vehicles.mandaragit;
  const fleetSize = Math.max(1, Math.min(500, Number(fleetSizeInput.value) || 1));
  const routeType = selectedValue("routeType") || "urban";
  const operatingHours = selectedValue("operatingHours") || "12";
  const battery = selectedValue("battery") || "charging";
  const supports = selectedSupports();
  const supportPerUnit = supports.reduce((sum, s) => sum + (supportCosts[s] || 0), 0);

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
  document.querySelector("#priceRange").textContent = `${currencyShort(lower)} – ${currencyShort(upper)}`;
  document.querySelector("#summaryVehicle").textContent = vehicle.name;
  document.querySelector("#summaryFleet").textContent =
    fleetSize === 1 ? "1 unit (solo)" : `${fleetSize} units`;
  document.querySelector("#summaryRoute").textContent = routeLabels[routeType];
  document.querySelector("#summaryBattery").textContent = batteryLabels[battery];
  document.querySelector("#summarySupport").textContent =
    supports.map((s) => supportLabels[s]).join(", ") || "Basic review only";

  updateBatteryHint();
}

function validateCurrentStep() {
  const activeStep = steps[currentStep];
  const requiredFields = [...activeStep.querySelectorAll("[required]")];
  const invalidField = requiredFields.find((f) => !f.checkValidity());
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
    formStatus.textContent = "Request received — Tojo Motors will be in touch shortly at sales@tojomotors.com or +63 917 516 0202.";
  }, 900);
});

document.querySelectorAll(".stepper-button").forEach((button) => {
  button.addEventListener("click", () => {
    fleetSizeInput.value = Math.max(1, Number(fleetSizeInput.value || 1) + Number(button.dataset.step));
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
