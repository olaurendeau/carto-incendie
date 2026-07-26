// Le bundle de leaflet-geoman attend un `L` global (UMD) : ce module doit
// être importé AVANT "@geoman-io/leaflet-geoman-free" (l'ordre des imports
// ES détermine l'ordre d'évaluation). Client uniquement (ssr:false).
import L from "leaflet";

(window as unknown as { L: typeof L }).L = L;
