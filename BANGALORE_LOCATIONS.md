# Bangalore Locations - Dropdown Reference

## Supported Locations (10 Areas)

The system **ONLY** supports these 10 Bangalore locations from the dropdown:

1. **Whitefield** - East Bangalore (Tech Hub)
2. **Koramangala** - South Bangalore (Startup Hub)
3. **Jayanagar** - South Bangalore (Residential)
4. **Hebbal** - North Bangalore (Airport Route)
5. **Indiranagar** - East Bangalore (Commercial)
6. **Electronic City** - South Bangalore (IT Hub)
7. **Rajajinagar** - West Bangalore (Residential)
8. **Malleshwaram** - North Bangalore (Traditional)
9. **MG Road** - Central Bangalore (Business District)
10. **Brigade Road** - Central Bangalore (Shopping District)

## Hospital Coverage

Each location has at least one hospital in the dataset:

| Location | Hospital | ICU Beds | Support Level |
|----------|----------|----------|---------------|
| Whitefield | Manipal Hospital Whitefield | 32 | Level 3 |
| Koramangala | Fortis Hospital Bannerghatta | 28 | Level 3 |
| Jayanagar | Apollo Hospital Jayanagar | 24 | Level 3 |
| Hebbal | Aster CMI Hospital Hebbal | 36 | Level 3 |
| Indiranagar | Manipal Hospital Indiranagar | 20 | Level 2 |
| Electronic City | Narayana Health City | 40 | Level 3 |
| Rajajinagar | Columbia Asia Rajajinagar | 16 | Level 2 |
| Malleshwaram | Mallya Hospital | 12 | Level 2 |
| MG Road | St. John's Medical College Hospital | 30 | Level 3 |
| Brigade Road | Bangalore Baptist Hospital | 18 | Level 2 |

## Coordinates (for Distance Calculation)

```typescript
const BANGALORE_LOCATIONS = {
  'Whitefield': { lat: 12.9698, lng: 77.7499 },
  'Koramangala': { lat: 12.9352, lng: 77.6245 },
  'Jayanagar': { lat: 12.9250, lng: 77.5838 },
  'Hebbal': { lat: 13.0358, lng: 77.5970 },
  'Indiranagar': { lat: 12.9716, lng: 77.6412 },
  'Electronic City': { lat: 12.8456, lng: 77.6603 },
  'Rajajinagar': { lat: 12.9916, lng: 77.5520 },
  'Malleshwaram': { lat: 13.0039, lng: 77.5710 },
  'MG Road': { lat: 12.9716, lng: 77.6040 },
  'Brigade Road': { lat: 12.9716, lng: 77.6070 },
};
```

## Real-Time Data Behavior

### When fetching real-time data:
1. **Location validation** - Only dropdown locations are accepted
2. **Hospital filtering** - Only hospitals in these 10 areas are returned
3. **Fallback** - If location not found, uses mock data

### Example:
```typescript
// ✅ Valid - in dropdown
fetchRealTimeHospitals('Whitefield', true)

// ❌ Invalid - not in dropdown (falls back to mock)
fetchRealTimeHospitals('Yelahanka', true)
```

## Adding New Locations

To add a new location:

1. **Update dropdown** in `components/icu/emergency-form.tsx`:
   ```typescript
   const LOCATIONS = [
     // ... existing
     "New Location",
   ]
   ```

2. **Add coordinates** in `lib/realTimeHospitalData.ts`:
   ```typescript
   const BANGALORE_LOCATIONS = {
     // ... existing
     'New Location': { lat: 12.xxxx, lng: 77.xxxx },
   }
   ```

3. **Add hospital** in `lib/hospitalData.ts`:
   ```typescript
   {
     id: 'hosp-011',
     name: 'Hospital Name',
     location: 'New Location',
     // ... other fields
   }
   ```

## Distance Matrix

Approximate distances between key locations (km):

- Whitefield ↔ MG Road: ~18 km
- Electronic City ↔ Hebbal: ~35 km
- Koramangala ↔ Indiranagar: ~5 km
- Jayanagar ↔ MG Road: ~6 km

## Traffic Patterns

Peak hours (higher ETA):
- Morning: 8:00 AM - 11:00 AM
- Evening: 5:00 PM - 9:00 PM

Routes with heavy traffic:
- Whitefield → Central (ORR congestion)
- Electronic City → North (Hosur Road)
- Hebbal → South (Airport Road)
