const vehicleCatalog = {
  puv: [
    {
      id: "mandaragit",
      name: "Mandaragit PUV X",
      description: "Modern e-jeepney for route-based public transport.",
      basePrice: 3600000,
    },
    {
      id: "limbasx",
      name: "Limbas X",
      description: "Public transport EV for larger deployment programs.",
      basePrice: 3900000,
    },
  ],
  etrike: [
    {
      id: "emotorela",
      name: "E-Motorela",
      description: "Electric tricycle for TODA and livelihood programs.",
      basePrice: 520000,
    },
    {
      id: "lawinx",
      name: "Lawin X",
      description: "Higher-capability e-trike for local mobility routes.",
      basePrice: 680000,
    },
  ],
  tourism: [
    {
      id: "tourister",
      name: "Tourister",
      description: "Quiet EV for resorts, islands, and tourism operations.",
      basePrice: 1450000,
    },
    {
      id: "maya",
      name: "Maya E-Quad",
      description: "Compact passenger EV for short-distance movement.",
      basePrice: 780000,
    },
  ],
  utility: [
    {
      id: "limbasz",
      name: "Limbas Z",
      description: "Utility EV for service, support, and cargo operations.",
      basePrice: 1250000,
    },
    {
      id: "maya",
      name: "Maya E-Quad",
      description: "Compact EV for private, campus, or business fleets.",
      basePrice: 780000,
    },
  ],
};

const programLabels = {
  puv: "PUV Modernization",
  etrike: "E-Trike Program",
  tourism: "Tourism Transport",
  utility: "Utility / Corporate Fleet",
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

const form = document.querySelector("#estimateForm");
const programSelect = document.querySelector("#program");
const vehicleOptions = document.querySelector("#vehicleOptions");
const fleetSizeInput = document.querySelector("#fleetSize");
const batterySelect = document.querySelector("#battery");

function formatPeso(value) {
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

function getSelectedVehicle() {
  const selected = form.querySelector("input[name='vehicle']:checked");
  const currentVehicles = vehicleCatalog[programSelect.value];
  return currentVehicles.find((vehicle) => vehicle.id === selected?.value) || currentVehicles[0];
}

function getSelectedSupports() {
  return [...form.querySelectorAll("input[name='support']:checked")].map((input) => input.value);
}

function renderVehicles() {
  const vehicles = vehicleCatalog[programSelect.value];
  vehicleOptions.innerHTML = vehicles
    .map(
      (vehicle, index) => `
        <label class="vehicle-option">
          <input type="radio" name="vehicle" value="${vehicle.id}" ${index === 0 ? "checked" : ""} />
          <strong>${vehicle.name}</strong>
          <span>${vehicle.description}</span>
        </label>
      `
    )
    .join("");
}

function getTier(fleetSize) {
  if (fleetSize >= 25) {
    return {
      name: "Full Deployment Package",
      note: "A multi-unit deployment package for LGU, city, or route-wide transport operations.",
    };
  }

  if (fleetSize >= 5) {
    return {
      name: "Cooperative Fleet Package",
      note: "A route-based deployment package with vehicle units, battery setup, and core support services.",
    };
  }

  return {
    name: "Starter Deployment Package",
    note: "A compact starter estimate for pilot operations, demos, or early fleet rollout.",
  };
}

function updateEstimate() {
  const vehicle = getSelectedVehicle();
  const fleetSize = Math.max(1, Math.min(500, Number(fleetSizeInput.value) || 1));
  const supports = getSelectedSupports();
  const supportPerUnit = supports.reduce((total, support) => total + supportCosts[support], 0);
  const batteryMultiplier = batteryMultipliers[batterySelect.value];
  const subtotal = vehicle.basePrice * batteryMultiplier + supportPerUnit;
  const lower = subtotal * fleetSize * 0.94;
  const upper = subtotal * fleetSize * 1.12;
  const tier = getTier(fleetSize);

  fleetSizeInput.value = fleetSize;
  document.querySelector("#packageTier").textContent = tier.name;
  document.querySelector("#resultNote").textContent = tier.note;
  document.querySelector("#priceRange").textContent = `${formatPeso(lower)} - ${formatPeso(upper)}`;
  document.querySelector("#summaryProgram").textContent = programLabels[programSelect.value];
  document.querySelector("#summaryVehicle").textContent = vehicle.name;
  document.querySelector("#summaryFleet").textContent = `${fleetSize} ${fleetSize === 1 ? "unit" : "units"}`;
  document.querySelector("#summaryBattery").textContent = batteryLabels[batterySelect.value];
  document.querySelector("#summarySupport").textContent =
    supports.map((support) => supportLabels[support]).join(", ") || "Basic inquiry only";
}

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

programSelect.addEventListener("change", () => {
  renderVehicles();
  updateEstimate();
});

form.addEventListener("input", updateEstimate);
form.addEventListener("change", updateEstimate);

renderVehicles();
updateEstimate();
