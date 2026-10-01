/* ===========================================================================
   Stromverbrauch – Offline-Dienst (Service Worker), Stand 01.10.2026

   Aufgabe: beim ersten Besuch die paar Dateien der App in den Browser-Speicher
   legen, damit sie danach ohne Netz startet. Mehr tut diese Datei nicht –
   es werden keine Daten erhoben und nichts nach außen geschickt.

   Neue Fassung veröffentlichen: unten die Zahl in SPEICHER hochzählen.
   Der Browser merkt die Änderung, lädt alles neu und wirft den alten
   Speicher weg.
   =========================================================================== */

var SPEICHER = 'stromverbrauch-v1';

var DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './symbol-192.png',
  './symbol-512.png',
  './symbol-maskable-512.png'
];

// Einbau: alles einmal in den Speicher legen.
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(SPEICHER)
      .then(function(c){ return c.addAll(DATEIEN); })
      .then(function(){ return self.skipWaiting(); })
  );
});

// Übernahme: Speicher früherer Fassungen löschen.
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(namen){
      return Promise.all(namen.map(function(n){
        return (n === SPEICHER) ? null : caches.delete(n);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Abruf: zuerst aus dem Speicher ausliefern (dadurch startet die App sofort
   und auch im Flugmodus), im Hintergrund still nach einer neueren Fassung
   sehen. Fremde Adressen und alles außer GET bleiben unangetastet. */
self.addEventListener('fetch', function(e){
  var anfrage = e.request;
  if(anfrage.method !== 'GET') return;
  if(new URL(anfrage.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(anfrage).then(function(treffer){
      var ausDemNetz = fetch(anfrage).then(function(antwort){
        if(antwort && antwort.ok){
          var kopie = antwort.clone();
          caches.open(SPEICHER).then(function(c){ c.put(anfrage, kopie); });
        }
        return antwort;
      })['catch'](function(){
        return treffer || caches.match('./index.html');
      });
      return treffer || ausDemNetz;
    })
  );
});
