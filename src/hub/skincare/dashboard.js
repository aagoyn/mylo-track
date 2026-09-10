import { DASHBOARD_CSS, escapeHtml, faviconLink, iconLabel, navHeader, progressFormScript } from "../../shared/dashboard-layout.js";

// duplikat kecil dari ./supabase.js (dipakai buat validasi di sana) - sengaja nggak di-import
// dari situ biar dashboard.js (layer render doang) nggak ikut narik shared/supabase-client.js
// cuma buat baca 2 array constant, sama kayak pola di hub/wishlist/dashboard.js
const CATEGORY_VALUES = [
  "Cleansing Oil",
  "Micellar Water",
  "Cleanser",
  "Toner",
  "Essence",
  "Ampoule",
  "Serum",
  "Treatment",
  "Eye Cream",
  "Moisturizer",
  "Sunscreen",
  "Mask",
  "Exfoliant",
  "Spot Treatment",
  "Body Lotion",
  "Body Treatment",
  "Body Sunscreen",
  "Other",
];
const AREA_VALUES = ["FACE", "BODY"];

// icon PNG asli per kategori - dipakai di tabel produk dan di custom category dropdown
// (lihat categoryDropdownHtml) yang gantiin <select> native karena <option> nggak bisa
// render <img>.
const CATEGORY_ICON = {
  "Cleansing Oil": "/icons/cleansing-oil.png",
  "Micellar Water": "/icons/micellar-water.png",
  Cleanser: "/icons/face-cleanser.png",
  Toner: "/icons/toner.png",
  Essence: "/icons/essence.png",
  Ampoule: "/icons/ampoule.png",
  Serum: "/icons/serum.png",
  Treatment: "/icons/treatment.png",
  "Eye Cream": "/icons/eye-cream.png",
  Moisturizer: "/icons/moisturizer.png",
  Sunscreen: "/icons/sunscreen.png",
  Mask: "/icons/face-mask.png",
  Exfoliant: "/icons/exfoliant.png",
  "Spot Treatment": "/icons/spot-treatment.png",
  "Body Lotion": "/icons/body-lotion.png",
  "Body Treatment": "/icons/body-treatment.png",
  "Body Sunscreen": "/icons/body-sunscreen.png",
  Other: "/icons/other.png",
};

const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_ICON = { AM: "/icons/sun.png", PM: "/icons/moon.png", BOTH: "/icons/day-night.png" };
const TIME_TEXT = { AM: "AM", PM: "PM", BOTH: "AM & PM" };
function timeLabelHtml(routineTime) {
  return iconLabel(TIME_ICON[routineTime] || TIME_ICON.AM, TIME_TEXT[routineTime] || routineTime);
}

const SUBNAV_TABS = [
  { key: "today", href: "/hub/skincare", label: "Today" },
  { key: "products", href: "/hub/skincare/products", label: "My Products" },
  { key: "rules", href: "/hub/skincare/rules", label: "Rules" },
];

function subnavHtml(active) {
  return `<nav class="subnav">${SUBNAV_TABS.map(
    (tab) => `<a href="${tab.href}" class="${tab.key === active ? "active" : ""}">${tab.label}</a>`
  ).join("")}</nav>`;
}

// active: "today" | "products" | "rules" | undefined (halaman lepas dari 3 tab utama, mis.
// edit product / review saran AI - subnav tetep muncul tanpa tab yang di-highlight)
function pageShell({ title, body, active, progressForms = [] }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${faviconLink("/icons/skincare.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({ icon: "/icons/skincare.png", title: "Skincare", links: [{ href: "/hub", label: iconLabel("/icons/home.png", "Home") }] })}
    ${subnavHtml(active)}
    ${body}
  </div>
  <script>
    // Satu delegated listener buat dua komponen dropdown custom di halaman ini:
    // - .category-dropdown (form Add/Edit Product) - <option> nggak bisa render <img>, jadi
    //   kategori pakai icon PNG asli via komponen custom ini, bukan <select> native.
    // - .actions-menu (tabel My Products) - kebab menu buat Edit/Analyze/Pause/Finish/Delete
    //   biar nggak numpuk jadi banyak tombol sejajar di kolom Actions.
    document.addEventListener("click", function (e) {
      var catTrigger = e.target.closest(".category-dropdown-trigger");
      var menuTrigger = e.target.closest(".actions-menu-trigger");
      var openCategory = document.querySelectorAll(".category-dropdown.open");
      var openMenus = document.querySelectorAll(".actions-menu.open");

      if (catTrigger) {
        var dd = catTrigger.closest(".category-dropdown");
        var wasOpen = dd.classList.contains("open");
        for (var i = 0; i < openCategory.length; i++) openCategory[i].classList.remove("open");
        if (!wasOpen) dd.classList.add("open");
        return;
      }
      if (menuTrigger) {
        var menu = menuTrigger.closest(".actions-menu");
        var menuWasOpen = menu.classList.contains("open");
        for (var k = 0; k < openMenus.length; k++) openMenus[k].classList.remove("open");
        if (!menuWasOpen) menu.classList.add("open");
        return;
      }
      var item = e.target.closest(".category-dropdown-menu li");
      if (item) {
        var wrap = item.closest(".category-dropdown");
        wrap.querySelector('input[type="hidden"]').value = item.dataset.value;
        wrap.querySelector(".category-dropdown-label").textContent = item.dataset.value;
        wrap.querySelector(".category-dropdown-icon").src = item.dataset.icon;
        wrap.classList.remove("open");
        return;
      }
      for (var j = 0; j < openCategory.length; j++) openCategory[j].classList.remove("open");
      for (var m = 0; m < openMenus.length; m++) openMenus[m].classList.remove("open");
    });
  </script>
  ${progressFormScript(progressForms)}
</body>
</html>`;
}

function flashHtml(flash) {
  return flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : "";
}

function selectOptions(values, selected) {
  return values.map((v) => `<option value="${v}" ${v === selected ? "selected" : ""}>${escapeHtml(v)}</option>`).join("");
}

// Custom dropdown (bukan <select> native) khusus kategori, biar bisa nampilin icon PNG asli
// per opsi - <option> HTML nggak bisa render <img>. Value-nya tetep dikirim lewat form via
// hidden input "category", jadi router/supabase.js nggak perlu berubah sama sekali.
function categoryDropdownHtml(selected) {
  const selectedIcon = CATEGORY_ICON[selected] || "/icons/other.png";
  const items = CATEGORY_VALUES.map(
    (v) => `<li data-value="${v}" data-icon="${CATEGORY_ICON[v]}">
        <img src="${CATEGORY_ICON[v]}" alt="">
        ${escapeHtml(v)}
      </li>`
  ).join("");

  return `<div class="category-dropdown">
    <input type="hidden" name="category" value="${escapeHtml(selected)}">
    <button type="button" class="category-dropdown-trigger">
      <img class="category-dropdown-icon" src="${selectedIcon}" alt="">
      <span class="category-dropdown-label">${escapeHtml(selected)}</span>
      <span class="category-dropdown-caret">▾</span>
    </button>
    <ul class="category-dropdown-menu">${items}</ul>
  </div>`;
}

// ---------- today's routine ----------

function choiceBoxHtml(choice) {
  const options = choice.options
    .map(
      (o) => `<form method="POST" action="/hub/skincare/groups/${choice.groupId}/choose-today" style="display:inline;">
        <input type="hidden" name="product_id" value="${o.id}">
        <button type="submit">${escapeHtml(o.name)}</button>
      </form>`
    )
    .join("");
  return `<div class="choice-box">
    🤔 ${escapeHtml(choice.label)} — choose one for today:
    <div class="choice-options">${options}</div>
  </div>`;
}

function routineBlockHtml(label, routine) {
  const stepsHtml = routine.steps.length
    ? `<ol class="routine-steps">${routine.steps
        .map(
          (s) =>
            `<li><span class="step-num">${s.step}.</span> <span${s.optional ? ' class="step-optional"' : ""}>${escapeHtml(s.name)}</span>${
              s.optional ? '<span class="step-tag">(optional)</span>' : ""
            }</li>`
        )
        .join("")}</ol>`
    : `<div class="empty-state">Nothing scheduled.</div>`;

  const choicesHtml = routine.needsChoice.map(choiceBoxHtml).join("");

  return `<div class="routine-block">
    <h3>${label}</h3>
    ${stepsHtml}
    ${choicesHtml}
  </div>`;
}

function conflictBannerHtml(conflicts, productById) {
  if (!conflicts.length) return "";
  const items = conflicts
    .map((c) => {
      const names = c.productIds.map((id) => escapeHtml(productById.get(id)?.name || "Unknown product"));
      return `<div>${names.join(" ⚡ ")} — both are approved to exclude each other.</div>`;
    })
    .join("");
  return `<div class="conflict-banner">⚠️ <strong>Routine needs your attention</strong><br>${items}<br><a class="nav-link" href="/hub/skincare/rules">Review rules</a></div>`;
}

export function renderSkincareDashboard({ productsCount, dayRoutine, productById, dateLabel, recovery }) {
  if (productsCount === 0) {
    return pageShell({
      title: "Skincare",
      active: "today",
      body: `
        <div class="card">
          <h2 style="margin-top:0;">🧴 Build your skincare routine</h2>
          <p style="color:#94a3b8; font-size:14px;">Add the products you already have. We'll help organize them.</p>
          <a class="nav-link" href="/hub/skincare/products">+ Add your first product</a>
        </div>`,
    });
  }

  const allConflicts = [...dayRoutine.faceAM.conflicts, ...dayRoutine.facePM.conflicts];

  const bodySection = dayRoutine.hasBodyProducts
    ? `<h2>Body</h2>
       ${routineBlockHtml(iconLabel(TIME_ICON.AM, "Body AM"), dayRoutine.bodyAM)}
       ${routineBlockHtml(iconLabel(TIME_ICON.PM, "Body PM"), dayRoutine.bodyPM)}`
    : "";

  const pmBlock = recovery
    ? `<div class="routine-block">
        <h3>${iconLabel(TIME_ICON.PM, "Recovery Night")}</h3>
        <div class="recovery-banner">Simplified for tonight only — nothing saved.</div>
        ${
          recovery.steps.length
            ? `<ol class="routine-steps">${recovery.steps
                .map((s, i) => `<li><span class="step-num">${i + 1}.</span> ${escapeHtml(s.name)}</li>`)
                .join("")}</ol>`
            : `<div class="empty-state">No Cleanser/Moisturizer found among your active products.</div>`
        }
      </div>`
    : routineBlockHtml(iconLabel(TIME_ICON.PM, "Face PM"), dayRoutine.facePM);

  return pageShell({
    title: "Skincare",
    active: "today",
    body: `
      <p style="color:#94a3b8; font-size:13px; margin:4px 0 16px;">TODAY — ${escapeHtml(dateLabel)}</p>
      ${conflictBannerHtml(allConflicts, productById)}

      <h2 style="margin-top:16px;">Face</h2>
      ${routineBlockHtml(iconLabel(TIME_ICON.AM, "Face AM"), dayRoutine.faceAM)}
      ${pmBlock}
      ${
        recovery
          ? `<a class="nav-link" href="/hub/skincare">Back to normal routine</a>`
          : `<a class="nav-link" href="/hub/skincare?recovery=1">${iconLabel(TIME_ICON.PM, "Simplify tonight (Recovery Night)")}</a>`
      }

      ${bodySection}

      <h2>AI Assistant</h2>
      <div class="card">
        <p style="color:#94a3b8; font-size:13px; margin:0 0 10px;">Let AI look at your products and suggest how to organize them. Nothing changes until you approve.</p>
        <form method="POST" action="/hub/skincare/review" id="review-form">
          <button type="submit" class="btn-primary" id="review-submit">✨ Analyze my skincare routine</button>
          <div class="upload-progress" id="review-progress" hidden>
            <div class="upload-progress-bar"></div>
          </div>
        </form>
      </div>
    `,
    progressForms: [
      { formId: "review-form", submitId: "review-submit", progressId: "review-progress", loadingLabel: "Analyzing your routine..." },
    ],
  });
}

// ---------- products ----------

function productFormFields(product = {}) {
  return `
    <input type="text" name="name" placeholder="Product name" value="${escapeHtml(product.name || "")}" required>
    <input type="text" name="brand" placeholder="Brand (optional)" value="${escapeHtml(product.brand || "")}">
    ${categoryDropdownHtml(product.category || "Other")}
    <select name="area">${selectOptions(AREA_VALUES, product.area || "FACE")}</select>
    <input type="text" name="notes" placeholder="Notes (optional) — e.g. what it's for" value="${escapeHtml(product.notes || "")}">
  `;
}

const STATUS_BADGE_CLASS = { ACTIVE: "skincare-status-active", PAUSED: "skincare-status-paused", FINISHED: "skincare-status-finished" };

// Nama produk sering panjang banget (mis. "SKIN1004 Madagascar Centella Tone Brightening
// Cleansing Gel Foam") - daripada ngandelin wrap alami browser (jatuhnya nanggung/beda-beda
// tiap lebar layar), paksa turun baris tiap N kata biar konsisten.
function wrapEveryNWords(text, n = 3) {
  const words = String(text).split(" ").filter(Boolean);
  const lines = [];
  for (let i = 0; i < words.length; i += n) {
    lines.push(words.slice(i, i + n).map(escapeHtml).join(" "));
  }
  return lines.join("<br>");
}

function routineSummaryHtml(rule) {
  if (!rule) return `<span style="color:#64748b;">Not configured yet</span>`;
  const timeText = TIME_TEXT[rule.routine_time] || rule.routine_time;
  const freqText =
    rule.frequency_type === "DAYS_OF_WEEK"
      ? (rule.days_of_week || []).map((d) => DAY_LABELS_SHORT[d]).join("/") || "no days set"
      : "Daily";
  return `<div class="routine-summary-time">${escapeHtml(timeText)}</div>
    <div class="routine-summary-freq">${escapeHtml(freqText)}${rule.enabled ? "" : " (disabled)"}</div>`;
}

function productRowHtml(product, rule) {
  return `<tr>
    <td>
      <div class="product-name-cell">${wrapEveryNWords(product.name, 3)}</div>
      ${product.brand ? `<div class="product-brand-cell">${escapeHtml(product.brand)}</div>` : ""}
    </td>
    <td>
      <div class="category-cell-main">${iconLabel(CATEGORY_ICON[product.category] || "/icons/other.png", escapeHtml(product.category))}</div>
      <div class="category-cell-area"><span class="badge status-badge">${product.area}</span></div>
    </td>
    <td><span class="badge ${STATUS_BADGE_CLASS[product.status] || "status-badge"}">${product.status}</span></td>
    <td style="font-size:12px;">${routineSummaryHtml(rule)}</td>
    <td style="text-align:center;">
      <div class="actions-menu">
        <button type="button" class="actions-menu-trigger" aria-label="Actions">⋮</button>
        <div class="actions-menu-list">
          <a class="actions-menu-item" href="/hub/skincare/products/${product.id}/edit">✏️ Edit</a>
          <form method="POST" action="/hub/skincare/analyze">
            <input type="hidden" name="product_id" value="${product.id}">
            <button type="submit" class="actions-menu-item">🤖 Analyze with AI</button>
          </form>
          ${
            product.status !== "PAUSED"
              ? `<form method="POST" action="/hub/skincare/products/${product.id}/pause"><button type="submit" class="actions-menu-item">⏸️ Pause</button></form>`
              : ""
          }
          ${
            product.status !== "FINISHED"
              ? `<form method="POST" action="/hub/skincare/products/${product.id}/finish"><button type="submit" class="actions-menu-item">✅ Finish</button></form>`
              : ""
          }
          <form method="POST" action="/hub/skincare/products/${product.id}/delete" onsubmit="return confirm('Delete this product?');"><button type="submit" class="actions-menu-item actions-menu-item-danger">🗑️ Delete</button></form>
        </div>
      </div>
    </td>
  </tr>`;
}

export function renderProductsPage({ products, rulesByProductId, flash }) {
  const rows = products.length
    ? products.map((p) => productRowHtml(p, rulesByProductId.get(p.id))).join("")
    : `<tr><td colspan="5"><div class="empty-state">No products yet. Add one below.</div></td></tr>`;

  return pageShell({
    title: "My Products",
    active: "products",
    body: `
      ${flashHtml(flash)}
      <h2>Add Product</h2>
      <div class="form-card">
        <form method="POST" action="/hub/skincare/products" id="add-product-form">
          ${productFormFields()}
          <button type="submit" id="add-product-submit">Add</button>
          <div class="upload-progress" id="add-product-progress" hidden>
            <div class="upload-progress-bar"></div>
          </div>
        </form>
      </div>

      <h2>My Products</h2>
      <div class="product-table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Status</th><th>Routine</th><th style="text-align:center;">Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
    progressForms: [
      { formId: "add-product-form", submitId: "add-product-submit", progressId: "add-product-progress", loadingLabel: "Adding & analyzing with AI..." },
    ],
  });
}

export function renderProductFormPage({ mode, product, flash }) {
  const action = mode === "edit" ? `/hub/skincare/products/${product.id}/update` : "/hub/skincare/products";
  return pageShell({
    title: mode === "edit" ? "Edit Product" : "Add Product",
    active: "products",
    body: `
      ${flashHtml(flash)}
      <h2>${mode === "edit" ? "Edit Product" : "Add Product"}</h2>
      <div class="form-card">
        <form method="POST" action="${action}">
          ${productFormFields(product)}
          <button type="submit">Save</button>
        </form>
      </div>
      <a class="nav-link" href="/hub/skincare/products">Back to products</a>
    `,
  });
}

// ---------- AI suggestion review ----------

function dayCheckboxesHtml(selectedDays, frequencyType) {
  // .day-checkboxes punya display:flex di CSS, jadi atribut `hidden` bawaan browser ketimpa
  // (author style vs UA style, specificity sama tapi author menang) - makanya toggle-nya pakai
  // inline style.display langsung, bukan .hidden, biar beneran ke-hide.
  const initialDisplay = frequencyType === "DAYS_OF_WEEK" ? "flex" : "none";
  return `<div class="day-checkboxes" style="display:${initialDisplay}">${DAY_LABELS_SHORT.map(
    (label, idx) =>
      `<label><input type="checkbox" name="days" value="${idx}" ${selectedDays.includes(idx) ? "checked" : ""}>${label}</label>`
  ).join("")}</div>`;
}

// Satu kartu saran AI + form approve yang bisa diedit langsung (edit = ubah nilai sebelum
// submit, jadi nggak butuh mode "edit" terpisah - lihat test-prompt.txt #10).
export function suggestionCardHtml({ product, enriched, cancelHref }) {
  const { suggestion, relationships, rotation, reasoning, warnings } = enriched;

  const relRows = relationships.length
    ? `<div class="relationship-list">${relationships
        .map(
          (r) => `<label>
            <input type="checkbox" name="${r.type === "EXCLUDE" ? "exclude_target" : "optional_target"}" value="${r.targetId}" checked>
            ${r.type === "EXCLUDE" ? `🔄 Keep separate from <strong>${escapeHtml(r.targetName)}</strong>` : `Mark optional when using <strong>${escapeHtml(r.targetName)}</strong>`}
            ${r.reason ? `<span class="rel-reason">— ${escapeHtml(r.reason)}</span>` : ""}
          </label>`
        )
        .join("")}</div>`
    : "";

  const rotationRow =
    rotation.mode && rotation.targetIds.length
      ? `<label style="display:flex; align-items:flex-start; gap:6px; font-size:13px;">
          <input type="checkbox" name="apply_rotation" value="1" checked>
          ${rotation.mode === "ROTATE" ? "🔁 Alternate automatically with" : "🔀 Treat as an alternative choice with"}
          <strong>${rotation.targetNames.map(escapeHtml).join(", ")}</strong>
          ${rotation.note ? `<span class="rel-reason">— ${escapeHtml(rotation.note)}</span>` : ""}
        </label>
        <input type="hidden" name="rotation_mode" value="${rotation.mode}">
        ${rotation.targetIds.map((id) => `<input type="hidden" name="rotate_target" value="${id}">`).join("")}`
      : "";

  const warningsHtml = warnings.length
    ? warnings.map((w) => `<div class="ai-warning">⚠️ ${escapeHtml(w)}</div>`).join("")
    : "";

  return `<div class="ai-suggestion-card">
    <span class="ai-badge">🤖 AI analyzed this — review below, not active until you approve</span>
    <h3 style="margin:4px 0 8px;">${escapeHtml(product.name)}</h3>
    <div class="ai-reasoning">${escapeHtml(reasoning || "No reasoning provided.")}</div>
    ${warningsHtml}

    <form method="POST" action="/hub/skincare/suggestions/approve">
      <input type="hidden" name="product_id" value="${product.id}">

      <div class="field-group">
        <div class="field-label">When</div>
        <div class="radio-row">
          <label><input type="radio" name="routine_time" value="AM" ${suggestion.routine_time === "AM" ? "checked" : ""}>AM</label>
          <label><input type="radio" name="routine_time" value="PM" ${suggestion.routine_time === "PM" ? "checked" : ""}>PM</label>
          <label><input type="radio" name="routine_time" value="BOTH" ${suggestion.routine_time === "BOTH" ? "checked" : ""}>AM & PM</label>
        </div>
      </div>

      <div class="field-group">
        <div class="field-label">Frequency</div>
        <div class="radio-row">
          <label><input type="radio" name="frequency_type" value="DAILY" ${suggestion.frequency_type === "DAILY" ? "checked" : ""} onchange="this.closest('.field-group').querySelector('.day-checkboxes').style.display = 'none'">Every day</label>
          <label><input type="radio" name="frequency_type" value="DAYS_OF_WEEK" ${suggestion.frequency_type === "DAYS_OF_WEEK" ? "checked" : ""} onchange="this.closest('.field-group').querySelector('.day-checkboxes').style.display = 'flex'">Specific days</label>
        </div>
        ${dayCheckboxesHtml(suggestion.days_of_week, suggestion.frequency_type)}
      </div>

      <div class="field-group">
        <div class="field-label">Order (smaller number = used first, e.g. 10 before 90)</div>
        <input type="number" name="routine_order" value="${suggestion.routine_order}" step="10" style="max-width:120px;">
      </div>

      ${relRows ? `<div class="field-group"><div class="field-label">With other products</div>${relRows}</div>` : ""}
      ${rotationRow ? `<div class="field-group">${rotationRow}</div>` : ""}

      <div class="button-row">
        <button type="submit" class="btn-primary">Approve</button>
        <a class="btn-secondary" href="${cancelHref}">Don't use this suggestion</a>
      </div>
    </form>
  </div>`;
}

export function renderSuggestionPage({ product, enriched, backHref }) {
  return pageShell({
    title: "AI Routine Suggestion",
    body: `
      <h2>AI Routine Suggestion</h2>
      ${suggestionCardHtml({ product, enriched, cancelHref: backHref })}
    `,
  });
}

export function renderRoutineReviewPage({ cards, overallNotes, hasNoSuggestions }) {
  return pageShell({
    title: "Routine Review",
    body: `
      <h2>✨ I found some ideas for your routine</h2>
      ${overallNotes ? `<div class="card" style="margin-bottom:16px;">${escapeHtml(overallNotes)}</div>` : ""}
      ${
        hasNoSuggestions
          ? `<div class="empty-state">Your current routine already looks reasonable — no changes suggested right now.</div>`
          : cards.join("")
      }
      <a class="nav-link" href="/hub/skincare">Back to today's routine</a>
    `,
  });
}

// ---------- rules ----------

function relationshipRuleCard(rel) {
  const label = rel.relationship_type === "EXCLUDE" ? "🔄 Keep separate from" : "Optional when using";
  return `<div class="rule-card">
    <div class="rule-title">${escapeHtml(rel.source.name)}</div>
    <div class="rule-facts"><span>${label} <strong>${escapeHtml(rel.target.name)}</strong></span></div>
    ${rel.note ? `<div class="rule-note">${escapeHtml(rel.note)}</div>` : ""}
    <div class="rule-actions">
      <form method="POST" action="/hub/skincare/relationships/${rel.id}/toggle"><button type="submit">${rel.enabled ? "Disable" : "Enable"}</button></form>
      <form method="POST" action="/hub/skincare/relationships/${rel.id}/delete" onsubmit="return confirm('Remove this rule?');"><button type="submit">Remove</button></form>
    </div>
  </div>`;
}

function rotationGroupCard(group, productById) {
  const names = group.product_ids.map((id) => productById.get(id)?.name).filter(Boolean);
  const isAlternative = group.mode === "ALTERNATIVE";
  const preferenceOptions = isAlternative
    ? `<form method="POST" action="/hub/skincare/groups/${group.id}/preference" style="margin-top:8px;">
        <div class="radio-row">
          ${group.product_ids
            .map(
              (id) =>
                `<label><input type="radio" name="preferred_product_id" value="${id}" ${group.preferred_product_id === id ? "checked" : ""}>Always use ${escapeHtml(productById.get(id)?.name || "?")}</label>`
            )
            .join("")}
          <label><input type="radio" name="preferred_product_id" value="" ${!group.preferred_product_id ? "checked" : ""}>Let me choose each morning</label>
        </div>
        <button type="submit" class="btn-primary btn-sm" style="margin-top:6px;">Save preference</button>
      </form>`
    : "";

  return `<div class="rule-card">
    <div class="rule-title">${isAlternative ? "🔀 Choose one" : "🔁 Alternate automatically"}: ${names.map(escapeHtml).join(", ")}</div>
    ${group.label ? `<div class="rule-note">${escapeHtml(group.label)}</div>` : ""}
    ${preferenceOptions}
    <div class="rule-actions">
      <form method="POST" action="/hub/skincare/groups/${group.id}/toggle"><button type="submit">${group.enabled ? "Disable" : "Enable"}</button></form>
      <form method="POST" action="/hub/skincare/groups/${group.id}/delete" onsubmit="return confirm('Remove this group?');"><button type="submit">Remove</button></form>
    </div>
  </div>`;
}

function ruleCard(product, rule) {
  const facts = rule
    ? [
        timeLabelHtml(rule.routine_time),
        rule.frequency_type === "DAYS_OF_WEEK"
          ? `📅 ${(rule.days_of_week || []).map((d) => DAY_LABELS_SHORT[d]).join("/") || "no days set"}`
          : "📅 Every day",
      ]
    : ["Not configured — use \"Analyze with AI\" or set it manually from My Products."];

  return `<div class="rule-card">
    <div class="rule-title">${escapeHtml(product.name)}</div>
    <div class="rule-facts">${facts.map((f) => `<span>${f}</span>`).join("")}</div>
    ${
      rule
        ? `<div class="rule-actions">
            <form method="POST" action="/hub/skincare/rules/${rule.id}/toggle"><button type="submit">${rule.enabled ? "Disable" : "Enable"}</button></form>
          </div>`
        : ""
    }
  </div>`;
}

export function renderRulesPage({ products, rulesByProductId, relationships, rotationGroups, productById }) {
  const ruleCards = products.map((p) => ruleCard(p, rulesByProductId.get(p.id))).join("");
  const relCards = relationships.length
    ? relationships.map(relationshipRuleCard).join("")
    : `<div class="empty-state">No separation rules yet.</div>`;
  const groupCards = rotationGroups.length
    ? rotationGroups.map((g) => rotationGroupCard(g, productById)).join("")
    : `<div class="empty-state">No rotation/alternative groups yet.</div>`;

  return pageShell({
    title: "Routine Rules",
    active: "rules",
    body: `
      <h2>Routine Rules</h2>
      ${ruleCards || `<div class="empty-state">No products yet.</div>`}

      <h2>Separation Rules</h2>
      ${relCards}

      <h2>Rotation & Alternatives</h2>
      ${groupCards}
    `,
  });
}
