import csv
import json
from Postcode import Postcode, Distance

csvFilePath = 'input.csv'
jsonFilePath = 'output.json'

jsonData = []

print("Converting", end="")

with open(csvFilePath) as csvFile:
  csvReader = csv.DictReader(csvFile)
  for row in csvReader:
    print(".", end="", flush=True)
    if(len(row["POSTCODE"]) > 0):
      try:
        p = Postcode(row["POSTCODE"])
        row["LAT"] = p.lat
        row["LON"] = p.lon
      except:
        pass
    jsonData.append(row)
  print("\n")

with open(jsonFilePath, 'w', encoding='ascii') as jsonf:
  jsonString = json.dumps(jsonData, indent=4)
  jsonf.write(jsonString)
