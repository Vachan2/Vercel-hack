# Comprehensive Hospital Database

## Overview

**100 hospitals** across **10 Bangalore locations** - 10 hospitals per area

## Database Statistics

| Location | Hospitals | Total ICU Beds | Avg Occupancy | Avg ETA |
|----------|-----------|----------------|---------------|---------|
| Hebbal | 10 | 271 | 63.7% | 6.6 min |
| Whitefield | 10 | 240 | 60.9% | 6.2 min |
| Koramangala | 10 | 266 | 63.9% | 5.9 min |
| Indiranagar | 10 | 214 | 55.3% | 4.6 min |
| Jayanagar | 10 | 240 | 58.6% | 5.6 min |
| Electronic City | 10 | 268 | 62.6% | 5.4 min |
| Rajajinagar | 10 | 212 | 54.1% | 5.5 min |
| Malleshwaram | 10 | 212 | 56.0% | 5.0 min |
| MG Road | 10 | 244 | 59.2% | 3.8 min |
| Brigade Road | 10 | 206 | 52.8% | 3.4 min |
| **TOTAL** | **100** | **2,373** | **58.7%** | **5.2 min** |

## Hospital Types by Location

### Hebbal (North Bangalore - Airport Route)
- Major tertiary care: Aster CMI, Sakra World, Vydehi
- Multi-specialty: Manipal, Columbia Asia, Sparsh
- Specialty: Cloudnine, Motherhood (Pediatric)
- **Strengths:** Trauma, Neurology, Cardiac

### Whitefield (East Bangalore - Tech Hub)
- Major hospitals: Manipal, Columbia Asia, Narayana
- Good coverage for IT professionals
- **Strengths:** General, Cardiac, Pediatric

### Koramangala (South Bangalore - Startup Hub)
- Premium hospitals: Fortis, Manipal, Apollo
- High-end facilities
- **Strengths:** Cardiac, Trauma, General

### Indiranagar (East Bangalore - Commercial)
- Mid-size hospitals, quick access
- Good pediatric coverage
- **Strengths:** General, Pediatric, Cardiac

### Jayanagar (South Bangalore - Residential)
- Well-distributed hospitals
- Family-oriented care
- **Strengths:** Cardiac, Pediatric, General

### Electronic City (South Bangalore - IT Hub)
- Narayana Health City (largest)
- Good IT employee coverage
- **Strengths:** Cardiac, Trauma, Burns

### Rajajinagar (West Bangalore - Residential)
- Traditional area, good coverage
- Mix of sizes
- **Strengths:** General, Neurology, Pediatric

### Malleshwaram (North Bangalore - Traditional)
- Historic Mallya Hospital
- Community-focused
- **Strengths:** Burns, General, Trauma

### MG Road (Central - Business District)
- St. John's Medical College (premier)
- Quick access, central location
- **Strengths:** Cardiac, Neurology, Trauma

### Brigade Road (Central - Shopping District)
- Bangalore Baptist Hospital
- Central, accessible
- **Strengths:** General, Pediatric, Trauma

## Hospital Chains Represented

1. **Manipal Hospitals** - 10 locations
2. **Columbia Asia** - 10 locations
3. **Apollo Hospitals** - 9 locations
4. **Fortis Healthcare** - 9 locations
5. **Cloudnine** - 10 locations (Pediatric specialist)
6. **Motherhood** - 10 locations (Pediatric specialist)
7. **Sagar Hospitals** - 10 locations
8. **Sparsh Hospitals** - 10 locations
9. **Aster** - 8 locations
10. **Narayana Health** - 7 locations

## ICU Capacity Distribution

| Bed Range | Count | Percentage |
|-----------|-------|------------|
| 10-15 beds | 8 | 8% |
| 16-20 beds | 32 | 32% |
| 21-25 beds | 28 | 28% |
| 26-30 beds | 22 | 22% |
| 31-40 beds | 10 | 10% |

## Emergency Support Levels

- **Level 3 (Advanced):** 43 hospitals (43%)
- **Level 2 (Standard):** 57 hospitals (57%)

## Specialties Coverage

| Specialty | Hospitals | Percentage |
|-----------|-----------|------------|
| General | 100 | 100% |
| Cardiac | 78 | 78% |
| Pediatric | 52 | 52% |
| Trauma | 48 | 48% |
| Neurology | 32 | 32% |
| Burns | 4 | 4% |

## Location-Based Routing Logic

When a patient selects **Hebbal**, the system will:
1. Show all 10 Hebbal hospitals first
2. Rank by availability, specialty match, ETA
3. Consider nearby locations if needed
4. Prioritize Level 3 support for critical cases

## Real-Time Updates

Each hospital's occupancy is:
- Updated via web scraping (DuckDuckGo + Bing)
- Simulated with realistic fluctuations
- Cached for 5 minutes
- Falls back to mock data if scraping fails

## Data Quality

✅ **Realistic hospital names** - Based on actual Bangalore hospitals
✅ **Accurate locations** - Matches dropdown areas
✅ **Varied capacity** - 12-40 ICU beds per hospital
✅ **Diverse specialties** - Covers all emergency types
✅ **Realistic occupancy** - 45-78% range
✅ **Accurate ETAs** - Based on location proximity

## Usage in Recommendation Engine

```typescript
import { hospitals } from './lib/hospitalData';

// Filter by location
const hebbalHospitals = hospitals.filter(h => h.location === 'Hebbal');
// Returns: 10 hospitals in Hebbal

// Filter by specialty
const cardiacHospitals = hospitals.filter(h => 
  h.specialties.includes('cardiac')
);
// Returns: 78 hospitals with cardiac specialty

// Filter by availability
const availableHospitals = hospitals.filter(h => 
  h.occupancy < 70
);
// Returns: Hospitals with <70% occupancy
```

## Benefits

1. **Location-specific results** - Shows hospitals in selected area
2. **Comprehensive coverage** - 10 options per location
3. **Realistic data** - Based on actual Bangalore hospitals
4. **Scalable** - Easy to add more hospitals/locations
5. **Zero cost** - No API calls needed for base data

## Next Steps

- ✅ Database created (100 hospitals)
- ✅ All 10 locations covered
- ✅ Realistic data distribution
- 🔄 Integrate with recommendation engine
- 🔄 Test location-based filtering
- 🔄 Add real-time occupancy updates

## File Location

`lib/hospitalData.ts` - 100 hospitals, fully typed, ready to use
