import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getConfirmedPointIds,
  getMyZones,
  getStoredIdentity,
  hasConfirmedPoint,
  markPointConfirmed,
  rememberMyZone,
  saveIdentity,
} from "@/lib/storage";

/** localStorage en mémoire, suffisant pour les fonctions testées. */
const createLocalStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
};

describe("sans window (SSR)", () => {
  it("retourne les valeurs par défaut", () => {
    expect(getStoredIdentity()).toBeNull();
    expect(getConfirmedPointIds()).toEqual([]);
    expect(hasConfirmedPoint("p1")).toBe(false);
    expect(getMyZones()).toEqual([]);
  });

  it("les écritures sont des no-op", () => {
    expect(() =>
      saveIdentity({ name: "Jean", qualite: "pompier" })
    ).not.toThrow();
    expect(() => markPointConfirmed("p1")).not.toThrow();
    expect(() =>
      rememberMyZone({ zoneId: "z1", adminToken: "t1" })
    ).not.toThrow();
  });
});

describe("avec localStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: createLocalStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("identité", () => {
    it("retourne null quand rien n'est stocké", () => {
      expect(getStoredIdentity()).toBeNull();
    });

    it("persiste et relit nom et qualité", () => {
      saveIdentity({ name: "Jean", qualite: "pompier" });
      expect(getStoredIdentity()).toEqual({ name: "Jean", qualite: "pompier" });
    });

    it("accepte une qualité nulle", () => {
      saveIdentity({ name: "Jean", qualite: null });
      expect(getStoredIdentity()).toEqual({ name: "Jean", qualite: null });
    });

    it("retourne null sur JSON corrompu", () => {
      window.localStorage.setItem("carto-incendie-identity", "{invalide");
      expect(getStoredIdentity()).toBeNull();
    });

    it("tolère un nom manquant (chaîne vide par défaut)", () => {
      window.localStorage.setItem(
        "carto-incendie-identity",
        JSON.stringify({ qualite: "habitant" })
      );
      expect(getStoredIdentity()).toEqual({ name: "", qualite: "habitant" });
    });

    it("ignore les erreurs d'écriture (mode privé, quota)", () => {
      vi.stubGlobal("window", {
        localStorage: {
          setItem: () => {
            throw new Error("QuotaExceededError");
          },
        },
      });
      expect(() =>
        saveIdentity({ name: "Jean", qualite: "pompier" })
      ).not.toThrow();
    });
  });

  describe("points confirmés", () => {
    it("retourne un tableau vide par défaut", () => {
      expect(getConfirmedPointIds()).toEqual([]);
    });

    it("marque un point comme confirmé", () => {
      markPointConfirmed("p1");
      expect(getConfirmedPointIds()).toEqual(["p1"]);
      expect(hasConfirmedPoint("p1")).toBe(true);
      expect(hasConfirmedPoint("p2")).toBe(false);
    });

    it("accumule les confirmations dans l'ordre", () => {
      markPointConfirmed("p1");
      markPointConfirmed("p2");
      expect(getConfirmedPointIds()).toEqual(["p1", "p2"]);
    });

    it("n'enregistre pas de doublon", () => {
      markPointConfirmed("p1");
      markPointConfirmed("p1");
      expect(getConfirmedPointIds()).toEqual(["p1"]);
    });

    it("retourne un tableau vide sur JSON corrompu", () => {
      window.localStorage.setItem(
        "carto-incendie-confirmed-points",
        "{invalide"
      );
      expect(getConfirmedPointIds()).toEqual([]);
    });

    it("ignore les valeurs non chaînes stockées", () => {
      window.localStorage.setItem(
        "carto-incendie-confirmed-points",
        JSON.stringify(["p1", 42, null, "p2"])
      );
      expect(getConfirmedPointIds()).toEqual(["p1", "p2"]);
    });
  });

  describe("mes zones", () => {
    it("retourne un tableau vide par défaut", () => {
      expect(getMyZones()).toEqual([]);
    });

    it("mémorise une zone créée", () => {
      rememberMyZone({ zoneId: "z1", adminToken: "t1" });
      expect(getMyZones()).toEqual([{ zoneId: "z1", adminToken: "t1" }]);
    });

    it("accumule plusieurs zones", () => {
      rememberMyZone({ zoneId: "z1", adminToken: "t1" });
      rememberMyZone({ zoneId: "z2", adminToken: "t2" });
      expect(getMyZones()).toEqual([
        { zoneId: "z1", adminToken: "t1" },
        { zoneId: "z2", adminToken: "t2" },
      ]);
    });

    it("n'enregistre pas deux fois la même zone", () => {
      rememberMyZone({ zoneId: "z1", adminToken: "t1" });
      rememberMyZone({ zoneId: "z1", adminToken: "t1" });
      expect(getMyZones()).toEqual([{ zoneId: "z1", adminToken: "t1" }]);
    });

    it("retourne un tableau vide sur JSON corrompu", () => {
      window.localStorage.setItem("carto-incendie-my-zones", "{invalide");
      expect(getMyZones()).toEqual([]);
    });
  });
});
