// Obtaining relevant DOM elements
const input = document.getElementById("search") as HTMLInputElement;
const instructionList = document.getElementById("instruction_list") as HTMLUListElement;
const filtersContainer = document.getElementById("extension-filters") as HTMLDivElement;
const items = Array.from(instructionList.querySelectorAll("li"));


// Extracting unique extensions to filter
const activeExtensions = new Set<string>();
const extensionSet = new Set<string>();
for (const li of items) {
    const extension = li.dataset.extension;
    if (extension) extensionSet.add(extension);
}
const extensions = Array.from(extensionSet).sort();


// Creating a checkbox for each unique extension
for (const extension of extensions) {
    const id = `ext-${extension}`;
    const label = document.createElement("label");
    label.className = "filter-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = extension;
    checkbox.id = id;

    checkbox.addEventListener("change", () => {
        if (checkbox.checked) activeExtensions.add(extension);
        else activeExtensions.delete(extension);
        applyFilters();
    });

    const text = document.createElement("span");
    text.textContent = extension;

    label.appendChild(checkbox);
    label.appendChild(text);
    filtersContainer.appendChild(label);
}


// Function to apply both text and extension filters to the instruction list
function applyFilters() {
    const q = input.value.trim().toLowerCase();
    const filtersActive = activeExtensions.size > 0;

    for (const li of items) {
        /* Check if the item matches the text search
            - If the search box is empty, match everything
            - Otherwise, match if the search string includes the query */
        const matchesQuery = !q || (li.dataset.search || "").includes(q);

        /* Check if the item matches an active extension filter
            - If no filters are active, match everything
            - Otherwise, show only if its extension is selected */
        const matchesExtension = !filtersActive || activeExtensions.has(li.dataset.extension);

        // Show or hide this <li> depending on whether both match conditions are true
        li.style.display = matchesQuery && matchesExtension ? "" : "none";
    }
}


// Set up event listeners for the search input
input.addEventListener("input", applyFilters);
input.addEventListener("keydown", (e) => {
    // Only act if Enter is pressed
    if (e.key !== "Enter") return;
    const q = input.value.trim().toLowerCase();
    if (!q) return; // Do nothing if the box is empty
    const filtersActive = activeExtensions.size > 0;

    /* Look for an exact mnemonic match among all instructions
        - If filters are active, also ensure it belongs to one of the selected extensions */
    const exact = items.find((li) => {
        if (li.dataset.mnemonic !== q) return false;
        if (!filtersActive) return true;
        return activeExtensions.has(li.dataset.extension);
    });

    // If an exact match is found, redirect to that instruction's detail page
    if (exact) {
        const link = exact.querySelector("a").getAttribute("href");
        location.href = link;
    }
});


// Apply filters on page load
applyFilters();
