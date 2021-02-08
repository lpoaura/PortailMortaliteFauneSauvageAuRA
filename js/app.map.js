export default () => {
  L.ImageOverlay.include({
    getBounds: function () {
      return this._bounds;
    },
  });
  const lat = 45.42; /* la latitude du centroid de la carte */
  const lng = 5.32; /* la longitude du centroid de la carte */
  const zoom = 7; /* le zoom par défault de la carte */
  const map = L.map("map", {
    fullscreenControl: true,
    // OR
    fullscreenControl: {
      pseudoFullscreen: false, // if true, fullscreen to page width and height
    },
    zoomControl: true,
    maxZoom: 19,
    minZoom: zoom,
  });
  // setView([lat, lng], zoom);

  L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const depts = L.geoJSON(json_Depts, {
    style: {
      weight: 3,
      color: "#1779ba",
      lineCap: "round",
      lineJoin: "bevel",
      opacity: 1,
      fillOpacity: 0,
    },
  }).addTo(map);
  map.fitBounds(depts.getBounds());

  const setBounds = () => {
    map.setMaxBounds(depts.getBounds());
  };

  /* La configuration du style des points des données de mortalité */
  const style_MortaliteRA = {
    radius: 5,
    fillColor: "#ff5050",
    color: "#ddd",
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.8,
  };

  /* l'ajout de la couche de mortalité à la carte */
  // var layer_MortaliteRA = new L.geoJson(json_Mortalite, {
  //     pointToLayer: function(feature, latlng) {
  //         return L.circleMarker(latlng, style_MortaliteRA);
  //     }
  // }).addTo(map);

  const progress = document.getElementById("progress");
  const progressBar = document.getElementById("progress-bar");

  const updateProgressBar = (processed, total, elapsed, layersArray) => {
    if (elapsed > 1000) {
      // if it takes more than a second to load, display the progress bar:
      progress.style.display = "block";
      progressBar.style.width = Math.round((processed / total) * 100) + "%";
    }
    if (processed === total) {
      // all markers processed - hide the progress bar:
      progress.style.display = "none";
    }
  };

  const layer_MortaliteRA = L.markerClusterGroup({
    chunkedLoading: true,
    chunkProgress: updateProgressBar,
  });

  const marker_MortaliteRA = new L.geoJson(json_Mortalite, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, style_MortaliteRA);
    },
  });

  layer_MortaliteRA.addLayer(marker_MortaliteRA);

  map.on("zoomend", () => {
    if (map.getZoom() < 12) {
      map.removeLayer(marker_MortaliteRA);
      layer_MortaliteRA.addLayer(marker_MortaliteRA);
    }
    if (map.getZoom() > 12) {
      map.addLayer(marker_MortaliteRA);
      layer_MortaliteRA.removeLayer(marker_MortaliteRA);
    }
  });

  // layer_MortaliteRA.addLayer(marker_MortaliteRA);

  map.addLayer(layer_MortaliteRA);

  // Carte de chaleur à partir de la couche de données MortaliteRA.js
  const geoJson2heat = (geojson) => {
    return geojson.features.map(function (feature) {
      return [
        parseFloat(feature.geometry.coordinates[1]),
        parseFloat(feature.geometry.coordinates[0]),
      ];
    });
  };

  const geoData = geoJson2heat(json_Mortalite, 1);

  const heatMap = new L.heatLayer(geoData, {
    radius: 40,
    blur: 25,
    maxZoom: 17,
    gradient: {
      0.1: "#FFD5D5",
      0.65: "#FF5555",
      1: "#FF0000",
    },
  });

  // Carte de chaleur affichée lorsque le zoom dépasse 10
  map.on("zoomend", () => {
    if (map.getZoom() < 10 && map.hasLayer(heatMap)) {
      map.removeLayer(heatMap);
    }
    if (map.getZoom() > 10 && map.hasLayer(heatMap) == false) {
      map.addLayer(heatMap);
    }
  });

  // map.addLayer(heatMap);
  setBounds();
};
