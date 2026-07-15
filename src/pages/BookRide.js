import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const CAB_ICONS  = { economy: '🚗', comfort: '🚙', premium: '🏎️' };
const CAB_COLORS = { economy: '#28a745', comfort: '#007bff', premium: '#f5a623' };
const CAB_DESC   = { economy: '₹6/km', comfort: '₹9/km', premium: '₹14/km' };

// Andhra Pradesh center coordinates
const AP_CENTER = [16.5, 80.6];

// Local area suggestions
const LOCAL_PLACES = [
  'Gudivada Bus Stand, Gudivada',
  'Gudivada Railway Station, Gudivada',
  'Gudivada Town Center, Gudivada',
  'Machilipatnam Bus Stand, Machilipatnam',
  'Machilipatnam Beach, Machilipatnam',
  'Machilipatnam Railway Station, Machilipatnam',
  'Vijayawada Railway Station, Vijayawada',
  'Pandit Nehru Bus Station, Vijayawada',
  'Vijayawada Airport, Vijayawada',
  'Kanaka Durga Temple, Vijayawada',
  'MG Road, Vijayawada',
  'Benz Circle, Vijayawada',
  'Vuyyuru Bus Stand, Vuyyuru',
  'Vuyyuru Town, Vuyyuru',
  'Pedana Bus Stand, Pedana',
  'Pedana Town, Pedana',
];

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

// Reverse geocode lat/lng → address label
async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

// Forward geocode address → lat/lon
async function geocode(address) {
  const query = `${address}, Andhra Pradesh, India`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error(`Location not found: "${address}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name };
}

// Map click handler component
function MapClickHandler({ onPickup, onDropoff, selectingFor }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const label = await reverseGeocode(lat, lng);
      if (selectingFor === 'pickup') onPickup({ lat, lon: lng, label });
      else onDropoff({ lat, lon: lng, label });
    },
  });
  return null;
}

export default function BookRide() {
  const [form, setForm]           = useState({ pickup: '', dropoff: '', cabType: 'economy' });
  const [pickupCoord, setPickupCoord]   = useState(null);
  const [dropoffCoord, setDropoffCoord] = useState(null);
  const [distance, setDistance]   = useState(null);
  const [estimate, setEstimate]   = useState(null);
  const [drivers, setDrivers]     = useState([]);
  const [selectingFor, setSelectingFor] = useState('pickup'); // 'pickup' or 'dropoff'
  const [geoError, setGeoError]   = useState('');
  const [geoLoading, setGeoLoading] = useState(false); // eslint-disable-line no-unused-vars
  const [booking, setBooking]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState('');
  const navigate = useNavigate();

  // Auto-calculate distance when both coords are set
  useEffect(() => {
    if (pickupCoord && dropoffCoord) {
      const dist = haversine(pickupCoord.lat, pickupCoord.lon, dropoffCoord.lat, dropoffCoord.lon);
      setDistance(dist);
    }
  }, [pickupCoord, dropoffCoord]);

  useEffect(() => {
    if (distance) fetchEstimate(distance, form.cabType);
  }, [distance, form.cabType]);

  useEffect(() => {
    fetchDrivers(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [form.cabType]);

  const fetchEstimate = async (dist, cabType) => {
    try {
      const { data } = await api.get('/rides/estimate', { params: { distance: dist, cabType } });
      setEstimate(data);
    } catch {}
  };

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/rides/nearby', { params: { cabType: form.cabType } });
      setDrivers(data);
    } catch {}
  };

  const handlePickupSet = useCallback((coord) => {
    setPickupCoord(coord);
    setForm(f => ({ ...f, pickup: coord.label.split(',').slice(0, 3).join(',') }));
    setSelectingFor('dropoff'); // auto-switch to dropoff after pickup selected
    setGeoError('');
  }, []);

  const handleDropoffSet = useCallback((coord) => {
    setDropoffCoord(coord);
    setForm(f => ({ ...f, dropoff: coord.label.split(',').slice(0, 3).join(',') }));
    setGeoError('');
  }, []);

  // Geocode typed address
  const handleGeocode = async (field) => {
    const address = field === 'pickup' ? form.pickup : form.dropoff;
    if (!address.trim()) return;
    setGeoLoading(true);
    setGeoError('');
    try {
      const geo = await geocode(address);
      if (field === 'pickup') handlePickupSet(geo);
      else handleDropoffSet(geo);
    } catch (err) {
      setGeoError(err.message);
    } finally {
      setGeoLoading(false);
      setSuggestions([]);
    }
  };

  const filterSuggestions = (value) =>
    LOCAL_PLACES.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 5);

  const handleSuggestSelect = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setSuggestions([]);
    setActiveField('');
    setTimeout(() => handleGeocode(field), 100);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!pickupCoord || !dropoffCoord) {
      setGeoError('Please select both pickup and drop-off on the map.');
      return;
    }
    setBooking(true);
    try {
      const { data } = await api.post('/rides/book', {
        pickup: form.pickup,
        dropoff: form.dropoff,
        cabType: form.cabType,
        distance,
      });
      navigate(`/ride/${data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const polyline = pickupCoord && dropoffCoord
    ? [[pickupCoord.lat, pickupCoord.lon], [dropoffCoord.lat, dropoffCoord.lon]]
    : null;

  return (
    <div className="min-vh-100 py-4" style={{ background: '#f8f9fa' }}>
      <div className="container-fluid px-4">
        <h2 className="fw-bold mb-4">🚕 Book Your Ride</h2>
        <div className="row g-4">

          {/* LEFT — Form */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Trip Details</h5>

              {/* Selecting mode indicator */}
              <div className="alert py-2 mb-3 text-center fw-semibold"
                style={{ background: selectingFor === 'pickup' ? '#e8f5e9' : '#fce4ec', fontSize: '0.85rem' }}>
                {selectingFor === 'pickup'
                  ? '📍 Click on map to set Pickup'
                  : '🏁 Click on map to set Drop-off'}
              </div>

              <form onSubmit={handleBook}>
                {/* Pickup */}
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold d-flex justify-content-between">
                    <span>📍 Pickup</span>
                    <button type="button" className="btn btn-sm btn-outline-success py-0 px-2"
                      onClick={() => setSelectingFor('pickup')}>
                      {selectingFor === 'pickup' ? '✅ Selecting' : 'Select on Map'}
                    </button>
                  </label>
                  <input type="text" className="form-control"
                    placeholder="Gudivada, Vijayawada..."
                    value={form.pickup}
                    onChange={e => {
                      setForm(f => ({ ...f, pickup: e.target.value }));
                      setSuggestions(filterSuggestions(e.target.value));
                      setActiveField('pickup');
                    }}
                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGeocode('pickup'))}
                  />
                  {activeField === 'pickup' && suggestions.length > 0 && (
                    <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 9999, top: '100%' }}>
                      {suggestions.map(s => (
                        <li key={s} className="list-group-item list-group-item-action py-2"
                          style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                          onMouseDown={() => handleSuggestSelect('pickup', s)}>
                          📍 {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  {pickupCoord && (
                    <small className="text-success d-block mt-1">
                      ✅ {pickupCoord.lat.toFixed(4)}, {pickupCoord.lon.toFixed(4)}
                    </small>
                  )}
                </div>

                {/* Dropoff */}
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold d-flex justify-content-between">
                    <span>🏁 Drop-off</span>
                    <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2"
                      onClick={() => setSelectingFor('dropoff')}>
                      {selectingFor === 'dropoff' ? '✅ Selecting' : 'Select on Map'}
                    </button>
                  </label>
                  <input type="text" className="form-control"
                    placeholder="Machilipatnam, Pedana..."
                    value={form.dropoff}
                    onChange={e => {
                      setForm(f => ({ ...f, dropoff: e.target.value }));
                      setSuggestions(filterSuggestions(e.target.value));
                      setActiveField('dropoff');
                    }}
                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGeocode('dropoff'))}
                  />
                  {activeField === 'dropoff' && suggestions.length > 0 && (
                    <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 9999, top: '100%' }}>
                      {suggestions.map(s => (
                        <li key={s} className="list-group-item list-group-item-action py-2"
                          style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                          onMouseDown={() => handleSuggestSelect('dropoff', s)}>
                          🏁 {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  {dropoffCoord && (
                    <small className="text-danger d-block mt-1">
                      ✅ {dropoffCoord.lat.toFixed(4)}, {dropoffCoord.lon.toFixed(4)}
                    </small>
                  )}
                </div>

                {geoError && <div className="alert alert-danger py-2 small">{geoError}</div>}

                {/* Distance badge */}
                {distance && (
                  <div className="alert py-2 mb-3 text-center" style={{ background: '#e8f5e9' }}>
                    <strong className="text-success">📏 {distance} km</strong>
                  </div>
                )}

                {/* Cab Type */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Cab Type</label>
                  <div className="row g-2">
                    {['economy', 'comfort', 'premium'].map(type => (
                      <div key={type} className="col-4">
                        <div className="card text-center p-2"
                          style={{
                            cursor: 'pointer',
                            border: `2px solid ${form.cabType === type ? CAB_COLORS[type] : '#dee2e6'}`,
                            background: form.cabType === type ? '#fffbf0' : '#fff',
                          }}
                          onClick={() => setForm(f => ({ ...f, cabType: type }))}>
                          <div style={{ fontSize: '1.5rem' }}>{CAB_ICONS[type]}</div>
                          <small className="fw-semibold text-capitalize d-block" style={{ fontSize: '0.75rem' }}>{type}</small>
                          <small className="text-muted" style={{ fontSize: '0.65rem' }}>{CAB_DESC[type]}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fare Breakdown */}
                {estimate && (
                  <div className="p-3 rounded mb-3" style={{ background: '#fff8e1' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Fare Estimate</span>
                      <span className="fs-5 fw-bold" style={{ color: '#f5a623' }}>₹{estimate.fare}</span>
                    </div>
                    <div className="border-top pt-2">
                      <div className="d-flex justify-content-between"><small className="text-muted">Distance ({distance} km)</small><small>₹{estimate.breakdown.distanceCharge}</small></div>
                      <div className="d-flex justify-content-between"><small className="text-muted">⏱ ETA</small><small>~{estimate.eta} mins</small></div>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-warning btn-lg w-100 fw-bold"
                  disabled={booking || !pickupCoord || !dropoffCoord}>
                  {booking ? '⏳ Booking...' : '🚕 Book Now'}
                </button>
                {(!pickupCoord || !dropoffCoord) && (
                  <small className="text-muted d-block text-center mt-2">
                    Select pickup & drop-off on the map to book
                  </small>
                )}
              </form>
            </div>

            {/* Nearby Drivers */}
            {drivers.length > 0 && (
              <div className="card border-0 shadow-sm p-3 mt-3">
                <h6 className="fw-bold mb-3">🚗 Nearby Drivers</h6>
                <div className="d-flex flex-column gap-2">
                  {drivers.map(driver => (
                    <div key={driver._id} className="d-flex align-items-center gap-2 p-2 rounded"
                      style={{ background: '#f8f9fa' }}>
                      <span style={{ fontSize: '1.5rem' }}>{CAB_ICONS[driver.cabType]}</span>
                      <div className="flex-grow-1">
                        <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{driver.name}</div>
                        <small className="text-muted">⭐ {driver.rating}</small>
                      </div>
                      <span className="badge bg-success">Available</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Full Map */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm overflow-hidden">
              <div className="p-2 d-flex gap-2 align-items-center" style={{ background: '#1a1a2e' }}>
                <span className="text-white fw-semibold ms-2">🗺 Andhra Pradesh Map</span>
                <span className="badge ms-auto" style={{ background: '#28a745' }}>📍 Green = Pickup</span>
                <span className="badge" style={{ background: '#dc3545' }}>🏁 Red = Drop-off</span>
              </div>
              <MapContainer
                center={AP_CENTER}
                zoom={8}
                style={{ height: '75vh', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler
                  onPickup={handlePickupSet}
                  onDropoff={handleDropoffSet}
                  selectingFor={selectingFor}
                />
                {pickupCoord && (
                  <Marker position={[pickupCoord.lat, pickupCoord.lon]} icon={pickupIcon}>
                    <Popup>📍 Pickup<br /><small>{form.pickup}</small></Popup>
                  </Marker>
                )}
                {dropoffCoord && (
                  <Marker position={[dropoffCoord.lat, dropoffCoord.lon]} icon={dropoffIcon}>
                    <Popup>🏁 Drop-off<br /><small>{form.dropoff}</small></Popup>
                  </Marker>
                )}
                {polyline && (
                  <Polyline positions={polyline} color="#f5a623" weight={3} dashArray="8,6" />
                )}
              </MapContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
