/* ============================================================
   POSEIDON GEODYNAMICS — Helical Pile Calculator
   ICC-ES AC358 torque-to-capacity + pricing logic
   ============================================================ */

(function () {
  "use strict";

  // ─── Engineering Data (ICC-ES AC358 Table 2) ───
  var SHAFT_DATA = {
    RS150: {
      od: '1.500"',
      type: "Round",
      kt: 10,
      maxTorque: 5500,
      maxCapacity: 55,
      label: 'RS150 — 1.5" Round',
    },
    RS2875: {
      od: '2.875"',
      type: "Round",
      kt: 10,
      maxTorque: 10000,
      maxCapacity: 100,
      label: 'RS2875 — 2.875" Round',
    },
    RS350: {
      od: '3.500"',
      type: "Round",
      kt: 7,
      maxTorque: 15000,
      maxCapacity: 105,
      label: 'RS350 — 3.5" Round',
    },
    RS450: {
      od: '4.500"',
      type: "Round",
      kt: 7,
      maxTorque: 20000,
      maxCapacity: 140,
      label: 'RS450 — 4.5" Round',
    },
    RS6625: {
      od: '6.625"',
      type: "Round",
      kt: 5,
      maxTorque: 30000,
      maxCapacity: 150,
      label: 'RS6625 — 6.625" Round',
    },
    RS8625: {
      od: '8.625"',
      type: "Round",
      kt: 4,
      maxTorque: 40000,
      maxCapacity: 160,
      label: 'RS8625 — 8.625" Round',
    },
    SS150: {
      od: '1.500"',
      type: "Square",
      kt: 10,
      maxTorque: 5500,
      maxCapacity: 55,
      label: 'SS150 — 1.5" Square',
    },
    SS175: {
      od: '1.750"',
      type: "Square",
      kt: 10,
      maxTorque: 6500,
      maxCapacity: 65,
      label: 'SS175 — 1.75" Square',
    },
    SS200: {
      od: '2.000"',
      type: "Square",
      kt: 10,
      maxTorque: 11000,
      maxCapacity: 110,
      label: 'SS200 — 2.0" Square',
    },
  };

  // Pricing data (ranges)
  var PRICING = {
    RS150: { leadMin: 150, leadMax: 400 },
    RS2875: { leadMin: 200, leadMax: 600 },
    RS350: { leadMin: 400, leadMax: 800 },
    RS450: { leadMin: 500, leadMax: 1000 },
    RS6625: { leadMin: 700, leadMax: 1200 },
    RS8625: { leadMin: 900, leadMax: 1500 },
    SS150: { leadMin: 120, leadMax: 350 },
    SS175: { leadMin: 150, leadMax: 400 },
    SS200: { leadMin: 200, leadMax: 500 },
  };

  var EXT_PRICING = {
    small: { min: 80, max: 150 }, // 5' ext
    large: { min: 120, max: 250 }, // 7' ext
  };

  var LABOR_PER_PILE = { min: 250, max: 500 };
  var MOBILIZATION = { min: 1500, max: 5000 };
  var BRACKET_PRICE = { min: 50, max: 150 };

  // ─── DOM Elements ───
  var form, results;
  var modeDesign, modeVerify;
  var inputLoad, inputFOS, inputShaft, inputCount, inputDepth, inputTorque;
  var torqueField;

  // Result elements
  var resUltimate, resTorque, resShaft, resKt, resMaxTorque, resStatus;
  var resMaterialCost, resLaborCost, resMobCost, resTotalCost;
  var verificationRow;

  function init() {
    form = document.getElementById("calc-form");
    if (!form) return;

    // Mode buttons
    modeDesign = document.getElementById("mode-design");
    modeVerify = document.getElementById("mode-verify");

    // Inputs
    inputLoad = document.getElementById("calc-load");
    inputFOS = document.getElementById("calc-fos");
    inputShaft = document.getElementById("calc-shaft");
    inputCount = document.getElementById("calc-count");
    inputDepth = document.getElementById("calc-depth");
    inputTorque = document.getElementById("calc-torque");
    torqueField = document.getElementById("torque-field");

    // Slider sync
    var loadSlider = document.getElementById("calc-load-slider");
    var depthSlider = document.getElementById("calc-depth-slider");

    if (loadSlider && inputLoad) {
      loadSlider.addEventListener("input", function () {
        inputLoad.value = this.value;
        calculate();
      });
      inputLoad.addEventListener("input", function () {
        loadSlider.value = this.value;
        calculate();
      });
    }

    if (depthSlider && inputDepth) {
      depthSlider.addEventListener("input", function () {
        inputDepth.value = this.value;
        calculate();
      });
      inputDepth.addEventListener("input", function () {
        depthSlider.value = this.value;
        calculate();
      });
    }

    // Results
    resUltimate = document.getElementById("res-ultimate");
    resTorque = document.getElementById("res-torque");
    resShaft = document.getElementById("res-shaft");
    resKt = document.getElementById("res-kt");
    resMaxTorque = document.getElementById("res-max-torque");
    resStatus = document.getElementById("res-status");
    resMaterialCost = document.getElementById("res-material");
    resLaborCost = document.getElementById("res-labor");
    resMobCost = document.getElementById("res-mob");
    resTotalCost = document.getElementById("res-total");
    verificationRow = document.getElementById("verification-row");

    // Mode toggle
    if (modeDesign) {
      modeDesign.addEventListener("click", function () {
        modeDesign.classList.add("active");
        modeVerify.classList.remove("active");
        if (torqueField) torqueField.style.display = "none";
        if (verificationRow) verificationRow.style.display = "none";
        calculate();
      });
    }

    if (modeVerify) {
      modeVerify.addEventListener("click", function () {
        modeVerify.classList.add("active");
        modeDesign.classList.remove("active");
        if (torqueField) torqueField.style.display = "block";
        if (verificationRow) verificationRow.style.display = "flex";
        calculate();
      });
    }

    // Populate shaft dropdown
    populateShafts();

    // Event listeners for auto-calculation
    var inputs = form.querySelectorAll("input, select");
    inputs.forEach(function (el) {
      el.addEventListener("input", calculate);
      el.addEventListener("change", calculate);
    });

    // Initial calculation
    calculate();
  }

  function populateShafts() {
    if (!inputShaft) return;

    inputShaft.innerHTML = "";

    var roundGroup = document.createElement("optgroup");
    roundGroup.label = "Round Shaft (RS)";

    var squareGroup = document.createElement("optgroup");
    squareGroup.label = "Square Shaft (SS)";

    Object.keys(SHAFT_DATA).forEach(function (key) {
      var shaft = SHAFT_DATA[key];
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = shaft.label;

      if (shaft.type === "Round") {
        roundGroup.appendChild(opt);
      } else {
        squareGroup.appendChild(opt);
      }
    });

    inputShaft.appendChild(roundGroup);
    inputShaft.appendChild(squareGroup);

    // Default to RS2875
    inputShaft.value = "RS2875";
  }

  function calculate() {
    var load = parseFloat(inputLoad ? inputLoad.value : 0) || 0;
    var fos = parseFloat(inputFOS ? inputFOS.value : 2.0) || 2.0;
    var shaftKey = inputShaft ? inputShaft.value : "RS2875";
    var count = parseInt(inputCount ? inputCount.value : 1) || 1;
    var depth = parseFloat(inputDepth ? inputDepth.value : 20) || 20;
    var actualTorque = parseFloat(inputTorque ? inputTorque.value : 0) || 0;

    var shaft = SHAFT_DATA[shaftKey];
    if (!shaft) return;

    // ─── Design Calculations ───
    var ultimateCapacity = load * fos; // kips
    var ultimateLbs = ultimateCapacity * 1000; // lbs
    var requiredTorque = ultimateLbs / shaft.kt; // ft-lbs

    // Check if shaft can handle it
    var shaftOk =
      requiredTorque <= shaft.maxTorque &&
      ultimateCapacity <= shaft.maxCapacity;

    // Find best recommendation
    var recommended = shaftKey;
    if (!shaftOk) {
      var bestKey = findBestShaft(ultimateCapacity, requiredTorque);
      if (bestKey) recommended = bestKey;
    }

    var recShaft = SHAFT_DATA[recommended];
    var recTorque = ultimateLbs / recShaft.kt;

    // ─── Pricing ───
    var pricing = PRICING[recommended];
    var leadAvg = (pricing.leadMin + pricing.leadMax) / 2;

    // Extensions needed: (depth - 10) / 5, minimum 0
    var extCount = Math.max(0, Math.ceil((depth - 10) / 5));
    var extAvg = (EXT_PRICING.small.min + EXT_PRICING.small.max) / 2;

    var bracketAvg = (BRACKET_PRICE.min + BRACKET_PRICE.max) / 2;
    var materialPerPile = leadAvg + extCount * extAvg + bracketAvg;
    var totalMaterial = materialPerPile * count;

    var laborAvg = (LABOR_PER_PILE.min + LABOR_PER_PILE.max) / 2;
    var totalLabor = laborAvg * count;

    var mobAvg = (MOBILIZATION.min + MOBILIZATION.max) / 2;
    var totalProject = totalMaterial + totalLabor + mobAvg;

    // ─── Update Results ───
    if (resUltimate)
      resUltimate.textContent = ultimateCapacity.toFixed(1) + " kips";
    if (resTorque)
      resTorque.textContent = formatNumber(Math.round(recTorque)) + " ft-lbs";
    if (resShaft) resShaft.textContent = recShaft.label;
    if (resKt) resKt.textContent = recShaft.kt + " ft⁻¹";
    if (resMaxTorque)
      resMaxTorque.textContent = formatNumber(recShaft.maxTorque) + " ft-lbs";

    // Material cost
    if (resMaterialCost) {
      resMaterialCost.textContent =
        "$" + formatNumber(Math.round(totalMaterial));
    }

    // Labor cost
    if (resLaborCost) {
      resLaborCost.textContent = "$" + formatNumber(Math.round(totalLabor));
    }

    // Mobilization
    if (resMobCost) {
      resMobCost.textContent = "$" + formatNumber(Math.round(mobAvg));
    }

    // Total
    if (resTotalCost) {
      resTotalCost.textContent = "$" + formatNumber(Math.round(totalProject));
    }

    // Status
    if (resStatus) {
      if (load === 0) {
        resStatus.textContent = "Enter load";
        resStatus.className = "calc-result-value";
      } else if (shaftOk) {
        resStatus.textContent = "PASS";
        resStatus.className = "calc-result-value pass";
      } else {
        resStatus.textContent = "Use " + recommended;
        resStatus.className = "calc-result-value gold";
      }
    }

    // ─── Verification Mode ───
    if (
      verificationRow &&
      modeVerify &&
      modeVerify.classList.contains("active")
    ) {
      var verResult = document.getElementById("res-verification");
      if (verResult && actualTorque > 0) {
        var actualCapacity = (actualTorque * shaft.kt) / 1000; // kips
        var allowable = actualCapacity / fos;
        if (allowable >= load) {
          verResult.textContent =
            "PASS — " + allowable.toFixed(1) + " kips allowable";
          verResult.className = "calc-result-value pass";
        } else {
          verResult.textContent =
            "FAIL — " +
            allowable.toFixed(1) +
            " kips < " +
            load +
            " kips required";
          verResult.className = "calc-result-value fail";
        }
      } else if (verResult) {
        verResult.textContent = "Enter torque value";
        verResult.className = "calc-result-value";
      }
    }
  }

  function findBestShaft(ultimateCapacity, requiredTorque) {
    var keys = Object.keys(SHAFT_DATA);
    for (var i = 0; i < keys.length; i++) {
      var s = SHAFT_DATA[keys[i]];
      var torque = (ultimateCapacity * 1000) / s.kt;
      if (torque <= s.maxTorque && ultimateCapacity <= s.maxCapacity) {
        return keys[i];
      }
    }
    return keys[keys.length - 1]; // Largest available
  }

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // ─── Start ───
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
