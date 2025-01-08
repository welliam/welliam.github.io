import csv

input_csv = "taxa.csv"
output_csv = "taxa-filtered.csv"


def filter_csv(input_file, output_file):
    with open(input_file, mode="r", newline="", encoding="utf-8") as infile:
        reader = csv.DictReader(infile)
        with open(output_file, mode="w", newline="", encoding="utf-8") as outfile:
            writer = csv.DictWriter(outfile, fieldnames=["id", "scientificName"])
            writer.writeheader()
            for row in reader:
                writer.writerow({"id": row["id"], "scientificName": row["scientificName"]})


filter_csv(input_csv, output_csv)
print(f"Filtered CSV saved to {output_csv}")
