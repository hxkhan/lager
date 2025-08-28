<script>
    import { onMount } from "svelte";
    import { bsTooltip, formatDate, fetchSettings } from "./lib/utils";
    import {
        listItems,
        getItem,
        createItem,
        updateItem,
        deleteItem,
    } from "./lib/api";

    let settings = fetchSettings();
    $: {
        let yt = Number(settings.yellowThreshold);
        if (!isNaN(yt) && yt > 0) localStorage.setItem("yellowThreshold", yt);

        let rt = Number(settings.redThreshold);
        if (!isNaN(rt) && rt > 0) localStorage.setItem("redThreshold", rt);
    }

    // Just sorting
    $: {
        if (settings.sortBy === "id" || settings.sortBy == "amount") {
            localStorage.setItem("sortBy", settings.sortBy);
            if (settings.sortBy === "amount")
                items = items.sort((a, b) => a.amount - b.amount);
            else items = items.sort((a, b) => a.id - b.id);
        }
    }

    // Now prepare app state
    let items = [];
    let loadError = null;

    onMount(async () => {
        await loadItems();
    });

    async function loadItems() {
        loadError = null;
        try {
            items = await listItems();
            if (settings.sortBy === "amount") {
                items = items.sort((a, b) => a.amount - b.amount);
            }
        } catch (e) {
            console.error(e);
            loadError = e.message || "Failed to load items";
        }
    }

    async function newItem(name, amount, unit) {
        try {
            const created = await createItem({
                name: name,
                amount: amount,
                unit: unit,
            });
            loadItems(); // do a reload of items anyways
        } catch (e) {
            if (e.status === 409) {
                // Duplicate name
                alert(e.message);
            } else {
                console.error(e);
            }
        }
    }

    async function editItem(id, name, amount, unit) {
        await updateItem(id, {
            name: name,
            amount: amount,
            unit: unit,
        });
        loadItems(); // do a reload of items anyways
    }

    async function removeItem(id) {
        await deleteItem(id);
        loadItems(); // do a reload of items anyways
    }

    // Form state
    let form = { id: null, name: "", amount: 0, unit: "st" };
    let editing = false;
    let search = "";

    // reference to the Amount input
    let amountInput;

    const resetForm = async () => {
        form = { id: null, name: "", amount: 0, unit: "st" };
        editing = false;
    };

    const submit = (e) => {
        e?.preventDefault?.();

        // Basic validation
        if (!form.name?.trim()) return alert("Namn krävs");
        const amount = Number(form.amount);
        if (Number.isNaN(amount) || amount < 0)
            return alert("Antal måste vara ett icke-negativt tal");

        if (editing) {
            editItem(form.id, form.name.trim(), amount, form.unit.trim());
        } else {
            newItem(form.name.trim(), amount, form.unit.trim());
        }
        resetForm();
    };

    const edit = async (item) => {
        form = { ...item };
        editing = true;
        amountInput?.focus();
        amountInput?.select();
    };

    const remove = (id) => {
        if (confirm("Vill du verkligen radera den?")) {
            removeItem(id);
            if (editing && form.id === id) resetForm();
        }
    };

    // fixed: search by id, name, amount
    $: filtered = items.filter((i) =>
        [String(i.id), i.name, String(i.amount)]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
    );

    function rowClass(amount, yellowThreshold, redThreshold) {
        if (amount < redThreshold) return "table-danger";
        if (amount < yellowThreshold) return "table-warning";
        return "";
    }
</script>

<!-- Settings Modal -->
<div
    class="modal fade rubik"
    id="settingsModal"
    tabindex="-1"
    aria-labelledby="settingsModalLabel"
    aria-hidden="true"
>
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="settingsModalLabel">
                    Inställningar
                </h1>
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                ></button>
            </div>
            <div class="modal-body">
                <div>
                    <label class="form-label" for="sorting-input"
                        >Välj Sortering</label
                    >
                    <select
                        id="sorting-input"
                        class="form-select mb-3"
                        aria-label="Default select example"
                        bind:value={settings.sortBy}
                    >
                        <option value="id">ID</option>
                        <option value="amount">Saldo</option>
                    </select>
                </div>

                <label class="form-label" for="yellow-threshold-input"
                    >Gul Tröskelvärde</label
                >
                <input
                    id="yellow-threshold-input"
                    class="form-control mb-2"
                    type="number"
                    step="1"
                    min={settings.redThreshold}
                    bind:value={settings.yellowThreshold}
                />

                <label class="form-label" for="red-threshold-input"
                    >Röd Tröskelvärde</label
                >
                <input
                    id="red-threshold-input"
                    class="form-control"
                    type="number"
                    step="1"
                    min="0"
                    max={settings.yellowThreshold}
                    bind:value={settings.redThreshold}
                />
            </div>
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-secondary"
                    data-bs-dismiss="modal">Stäng</button
                >
            </div>
        </div>
    </div>
</div>

<div class="container py-4 rubik">
    <h2 class="m-0 mb-3">Lager Hantering</h2>

    <!-- Form -->
    <form class="card mb-4" on:submit|preventDefault={submit}>
        <div class="card-header">
            {#if editing}
                <strong>Redigera #{form.id}</strong>
            {:else}
                <strong>Lägg till</strong>
            {/if}
        </div>
        <div class="card-body">
            <div class="row g-3">
                <!-- Name input -->
                <div class="col-12 col-md-8">
                    <label class="form-label" for="form-name">Namn</label>
                    <input
                        id="form-name"
                        class="form-control"
                        placeholder="t.ex. Munskydd"
                        bind:value={form.name}
                        required
                    />
                </div>

                <!-- Amount input -->
                <div class="col-6 col-md-2">
                    <label class="form-label" for="form-amount">Saldo</label>
                    <input
                        id="form-amount"
                        class="form-control"
                        type="number"
                        step="1"
                        min="0"
                        bind:value={form.amount}
                        bind:this={amountInput}
                        required
                    />
                </div>

                <!-- Unit input -->
                <div class="col-6 col-md-2">
                    <label class="form-label" for="form-unit">Enhet</label>
                    <select
                        id="form-unit"
                        class="form-select"
                        bind:value={form.unit}
                        required
                    >
                        <option value="st">st</option>
                        <option value="fp">fp</option>
                        <option value="fl">fl</option>
                        <option value="lådor">lådor</option>
                        <option value="par">par</option>
                        <option value="set">set</option>
                        <option value="rullar">rullar</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="card-footer d-flex gap-2">
            <!-- Update/Add button -->
            <button type="submit" class="btn btn-success">
                {editing ? "Uppdatera" : "Lägg till"}
            </button>
            {#if editing}
                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    on:click={resetForm}
                >
                    Avbryt
                </button>
            {/if}
        </div>
    </form>

    <div class="d-flex align-items-center justify-content-between mb-3">
        <h3 class="m-0">Lista</h3>

        <div class="d-flex align-items-center gap-2 pre-table">
            <div class="input-group">
                <span class="input-group-text">Sök</span>
                <input
                    class="form-control"
                    placeholder="namn, id, saldo..."
                    bind:value={search}
                />

                {#if search}
                    <button
                        aria-labelledby="clear button"
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        on:click={() => (search = "")}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            class="bi bi-x-lg"
                            viewBox="0 0 16 16"
                        >
                            <path
                                d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"
                            />
                        </svg>
                    </button>
                {/if}
            </div>

            <button
                type="button"
                class="btn btn-secondary"
                data-bs-toggle="modal"
                data-bs-target="#settingsModal"
                aria-labelledby="settingsIcon"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-gear-fill"
                    viewBox="0 0 16 16"
                >
                    <path
                        d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"
                    />
                </svg>
            </button>
        </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
        <table class="table table-hover align-middle">
            <thead class="table-light">
                <tr>
                    <th>ID</th>
                    <th>Namn</th>
                    <th>Saldo</th>
                    <th class="text-end">Åtgärder</th>
                </tr>
            </thead>
            <tbody>
                {#if filtered.length === 0}
                    <tr>
                        <td colspan="5" class="text-center text-muted py-4"
                            >Inga varor</td
                        >
                    </tr>
                {:else}
                    {#each filtered as item}
                        <tr
                            class={rowClass(
                                item.amount,
                                settings.yellowThreshold,
                                settings.redThreshold,
                            )}
                            use:bsTooltip={`Redigerad: ${formatDate(item.lastUpdated)}`}
                        >
                            <td class="fw-medium">#{item.id}</td>
                            <td>{item.name}</td>
                            <td>{item.amount + " " + item.unit}</td>
                            <td class="text-end">
                                <div class="btn-group">
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-warning"
                                        on:click={() => edit(item)}
                                    >
                                        Redigera
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-danger"
                                        on:click={() => remove(item.id)}
                                    >
                                        Radera
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>
</div>
