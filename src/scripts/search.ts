const input = document.getElementById("search");
const instruction_list = document.getElementById("instruction_list");
const filtersFieldset = document.getElementById("extension-filters-fieldset");
// The blank area where we’ll insert checkboxes
const filtersContainer = document.getElementById("extension-filters");
const items = Array.from(instruction_list.querySelectorAll("a"));
const dropdowns = Array.from(document.querySelectorAll(".dropdown-callout"));
const activeExtensionGroups = new Set();

// Gather unique extension names from the rendered instruction <li> items.
const extensionGroupSet = new Set();
for (const a of items) {
    const extension = a.dataset.extensionGroup;
    extensionGroupSet.add(extension);
}

const extensionGroups = Array.from(extensionGroupSet);
for (const extensionGroup of extensionGroups) {
    const id = `ext-group-${extensionGroup}`;
    const label = document.createElement("label");
    label.className = "filter-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = extensionGroup;
    checkbox.id = id;

    checkbox.addEventListener("change", () => {
        if (checkbox.checked) activeExtensionGroups.add(extensionGroup);
        else activeExtensionGroups.delete(extensionGroup);
        applyFilters();
    });

    const text = document.createElement("span");
    text.textContent = extensionGroup;

    label.appendChild(checkbox);
    label.appendChild(text);
    filtersContainer.appendChild(label);
}

function applyFilters() {
    const q = input.value.trim().toLowerCase();
    const filtersActive = activeExtensionGroups.size > 0;

    if (q || filtersActive) {
        // If there’s a search query, hide the dropdowns to save space
        instruction_list.style.display = "grid";
        for (const dropdown of dropdowns) {
            dropdown.style.display = "none";
        }
    } else {
        // If the search box is empty, show the dropdowns again
        instruction_list.style.display = "none";
        for (const dropdown of dropdowns) {
            dropdown.style.display = "block";
        }
    }

    for (const a of items) {
        /* Check if the item matches the text search
        - If the search box is empty, match everything
        - Otherwise, match if the search string includes the query */
        const matchesQuery = !q || (a.dataset.search || "").includes(q);

        /* Check if the item matches an active extension filter
        - If no filters are active, match everything
        - Otherwise, show only if its extension is selected */
        const matchesExtensionGroup = !filtersActive || activeExtensionGroups.has(a.dataset.extensionGroup);

        // Show or hide this <li> depending on whether both match conditions are true
        a.style.display = matchesQuery && matchesExtensionGroup ? "grid" : "none";
    }
}

input.addEventListener("input", applyFilters);

input.addEventListener("keydown", (e) => {
    // Only act if Enter is pressed
    if (e.key !== "Enter") return;

    const q = input.value.trim().toLowerCase();

    // Do nothing if the box is empty
    if (!q) return;

    const filtersActive = activeExtensionGroups.size > 0;

    /* Look for an exact mnemonic match among all instructions
     - If filters are active, also ensure it belongs to one of the selected extensions */
    const exact = items.find((a) => {
        if (a.dataset.mnemonic !== q) return false;
        if (!filtersActive) return true;
        return activeExtensionGroups.has(a.dataset.extensionGroup);
    });

    // If an exact match is found, redirect to that instruction's detail page
    if (exact) {
        const link = exact.getAttribute("href");
        location.href = link;
    }
});

applyFilters();
