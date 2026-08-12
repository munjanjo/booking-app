import { useEffect, useRef } from "react";

let scriptPromise = null;

function loadGoogleMapsScript() {
    if (window.google?.maps?.places) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return scriptPromise;
}

// Veze Google Places Autocomplete na dani <input> ref; poziva onSelect(formattedAddress) kad korisnik odabere prijedlog.
export default function useGooglePlacesAutocomplete(inputRef, onSelect) {
    const autocompleteRef = useRef(null);

    useEffect(() => {
        if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || !inputRef.current) return;
        let cancelled = false;

        loadGoogleMapsScript().then(() => {
            if (cancelled || !inputRef.current || autocompleteRef.current) return;
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                fields: ["formatted_address"],
                types: ["address"],
            });
            autocompleteRef.current.addListener("place_changed", () => {
                const place = autocompleteRef.current.getPlace();
                if (place?.formatted_address) onSelect(place.formatted_address);
            });
        });

        return () => {
            cancelled = true;
        };
    }, [inputRef.current]);
}
