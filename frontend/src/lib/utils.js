// Tooltip action
export function bsTooltip(node, content) {
    // Ensure attributes for Bootstrap
    node.setAttribute("data-bs-toggle", "tooltip");
    node.setAttribute("data-bs-placement", "right");
    node.setAttribute("data-bs-custom-class", "custom-tooltip");
    node.setAttribute("data-bs-title", content ?? "");
    node.removeAttribute("title"); // (bug) prevent native tooltip

    // Create tooltip
    let instance = new bootstrap.Tooltip(node, { trigger: "hover focus" });

    // Return update & dispose for svelte reactivity
    return {
        update(newContent) {
            node.setAttribute("data-bs-title", newContent ?? "");
            node.removeAttribute("title");
            instance?.dispose();
            instance = new bootstrap.Tooltip(node, {
                trigger: "hover focus",
                title: newContent ?? ""
            });
        },
        destroy() {
            instance?.dispose();
        }
    };
}

// Date format helper
export function formatDate(dateString) {
    const d = new Date(dateString);
    const now = new Date();

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    if (year === now.getFullYear()) {
        // current year → skip year
        return `${day}/${month} ${hours}:${minutes}`;
    } else {
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
}

// Fetch settings
export function fetchSettings() {
    let settings = { sortBy: 'id', yellowThreshold: 10, redThreshold: 5 };

    // Load Sort By
    if (localStorage.getItem("sortBy")) {
        let v = localStorage.getItem("sortBy");
        if (v === "id" || v == "amount") {
            settings.sortBy = v;
        }
    }

    // Load Yellow Threshold
    if (localStorage.getItem("yellowThreshold")) {
        let n = Number(localStorage.getItem("yellowThreshold"));
        if (!isNaN(n) && n > 0) {
            settings.yellowThreshold = n;
        }
    }

    // Load Red Threshold
    let redThreshold = 5;
    if (localStorage.getItem("redThreshold")) {
        let n = Number(localStorage.getItem("redThreshold"));
        if (!isNaN(n) && n > 0 && n < settings.yellowThreshold) {
            settings.redThreshold = n;
        }
    }

    return settings;
}