import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

data = json.loads((DATA / "objects.json").read_text(encoding="utf-8"))

features = []
for o in data["objects"]:
    c = o["coordinates"]
    features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [c["lng"], c["lat"]]},
        "properties": {
            "id": o["id"],
            "slug": o.get("slug", ""),
            "type": o.get("type", "other"),
            "category": o.get("category", "sacred"),
            "name_kk": o["name"]["kk"],
            "name_ru": o["name"]["ru"],
            "region_kk": o["region"]["kk"],
            "region_ru": o["region"]["ru"],
            "period_kk": o["period"]["kk"],
            "period_ru": o["period"]["ru"],
            "photo": o.get("photo", "")
        }
    })

geojson = {"type": "FeatureCollection", "features": features}
(DATA / "objects.geojson").write_text(json.dumps(geojson, ensure_ascii=False, indent=2), encoding="utf-8")

js = "window.MURA_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n"
(DATA / "objects.js").write_text(js, encoding="utf-8")

print("точек в geojson:", len(features))
