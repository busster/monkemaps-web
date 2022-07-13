export const CONSTANTS = {
  API_URL: process.env.REACT_APP_API_URL ?? 'https://api.monkemaps.com/monkemaps',
  MAPBOX_PLACES_API:
    process.env.REACT_APP_MAPBOX_PLACES_API ??
    'https://api.mapbox.com/geocoding/v5/mapbox.places',
  MAPBOX_ACCESS_TOKEN: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
}
