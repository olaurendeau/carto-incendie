"use client";

import L from "leaflet";
import { useCallback, useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD_PX = 12;
const TOUCH_IGNORE_MS = 300;

type MapLongPressHandlerProps = {
  onLongPress: (lat: number, lng: number) => void;
};

export const MapLongPressHandler = ({
  onLongPress,
}: MapLongPressHandlerProps) => {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const startLatLngRef = useRef<L.LatLng | null>(null);
  const touchIgnoreUntilRef = useRef<number>(0);
  const onLongPressRef = useRef(onLongPress);
  useEffect(() => {
    onLongPressRef.current = onLongPress;
  }, [onLongPress]);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
    startLatLngRef.current = null;
  }, []);

  useMapEvents({
    contextmenu: (e) => {
      e.originalEvent.preventDefault();
      onLongPress(e.latlng.lat, e.latlng.lng);
    },
    mousedown: (e) => {
      if (Date.now() < touchIgnoreUntilRef.current) return;
      clearTimer();
      const pos = e.originalEvent as MouseEvent;
      startPosRef.current = { x: pos.clientX, y: pos.clientY };
      startLatLngRef.current = e.latlng;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (startLatLngRef.current != null) {
          onLongPressRef.current(
            startLatLngRef.current.lat,
            startLatLngRef.current.lng
          );
        }
        startPosRef.current = null;
        startLatLngRef.current = null;
      }, LONG_PRESS_MS);
    },
    mouseup: clearTimer,
    mouseout: clearTimer,
    mousemove: (e) => {
      if (startPosRef.current == null) return;
      const pos = e.originalEvent as MouseEvent;
      const dx = pos.clientX - startPosRef.current.x;
      const dy = pos.clientY - startPosRef.current.y;
      if (
        Math.abs(dx) > MOVE_THRESHOLD_PX ||
        Math.abs(dy) > MOVE_THRESHOLD_PX
      ) {
        clearTimer();
      }
    },
  });

  useEffect(() => {
    const container = map.getContainer();

    const getLatLngFromTouch = (touch: Touch): L.LatLng => {
      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const point = L.point(x, y);
      return map.containerPointToLatLng(point);
    };

    // Sur tactile, l'appui long n'est déclenché qu'au relâcher du doigt :
    // ouvrir le dialog (mutation du DOM) sous un doigt encore posé peut
    // coincer le scroll de la page sur iOS Safari — état qui persiste
    // ensuite à travers les navigations client (même document).
    let pendingLatLng: L.LatLng | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      clearTimer();
      pendingLatLng = null;
      const touch = e.touches[0];
      if (!touch) return;
      const latlng = getLatLngFromTouch(touch);
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      startLatLngRef.current = latlng;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        touchIgnoreUntilRef.current = Date.now() + TOUCH_IGNORE_MS;
        pendingLatLng = startLatLngRef.current;
      }, LONG_PRESS_MS);
    };

    const handleTouchEnd = () => {
      const latlng = pendingLatLng;
      pendingLatLng = null;
      clearTimer();
      if (latlng != null) {
        onLongPressRef.current(latlng.lat, latlng.lng);
      }
    };

    const handleTouchCancel = () => {
      pendingLatLng = null;
      clearTimer();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startPosRef.current == null) return;
      const touch = e.touches[0];
      if (!touch) {
        pendingLatLng = null;
        clearTimer();
        return;
      }
      const dx = touch.clientX - startPosRef.current.x;
      const dy = touch.clientY - startPosRef.current.y;
      if (
        Math.abs(dx) > MOVE_THRESHOLD_PX ||
        Math.abs(dy) > MOVE_THRESHOLD_PX
      ) {
        pendingLatLng = null;
        clearTimer();
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchCancel);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      clearTimer();
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchCancel);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [map, clearTimer]);

  return null;
};
