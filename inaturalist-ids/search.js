const csvUrl = "taxa-filtered.csv"; // Replace with your CSV URL

async function loadCSV(url) {
    const response = await fetch(url);
    const csvText = await response.text();
    const rows = csvText.split("\n").slice(1).map(row => row.split(","));
    const keys = csvText.split("\n")[0].split(",").map(key => key.trim());
    return rows.map(row => {
        let obj = {};
        row.forEach((value, index) => obj[keys[index]] = value.trim());
        return obj;
    });
}

function makeSearch(rows) {
    return function search() {
        const input = document.getElementById('inputNames').value;
        const names = input.split("\n").map(name => name.trim()).filter(name => name);

        const results = names.map(name => {
            const match = fuzzysort.go(name, rows, {key: "scientificName"})[0];
            return match ? ["success", match.obj] : ["failure", name];
        });
        const successes = results.filter(([result]) => result === "success");
        const commaSeparatedIds = successes.map(([_, { id }]) => id).join(",");
        const url = `https://www.inaturalist.org/observations?taxon_ids=${commaSeparatedIds}`;
        const anchorDiv = document.createElement("div");
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.textContent = "iNaturalist Search";
        anchorDiv.appendChild(anchor);

        document.getElementById('results').innerHTML = "";
        document.getElementById('results').appendChild(anchorDiv);

        successes.forEach(([_, { id, scientificName }]) => {
            const div = document.createElement('div');
            div.textContent = `${scientificName}: ${id}`;
            document.getElementById('results').appendChild(div);
        });

        document.getElementById('results').innerHTML += commaSeparatedIds;

        const failures = results.filter(([result]) => result === "failure").map(([_, search]) => search);
        if (failures.length) {
            document.getElementById('errors').style.display = "block";
            document.getElementById('errors').textContent = "Could not find ids for:"
            failures.forEach(failure => {
                const div = document.createElement('div');
                div.textContent = failure;
                document.getElementById('errors').appendChild(div);
            });
        } else {
            document.getElementById('errors').style.display = "none";
        }
    }
}


loadCSV(csvUrl).then(rows => {
    document.getElementById('searchButton').addEventListener('click', makeSearch(rows));
});
