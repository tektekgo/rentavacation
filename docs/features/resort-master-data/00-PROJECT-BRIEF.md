# Resort Master Data System - Project Brief

**Generated:** February 12, 2026  
**Feature:** Resort & Unit Type Master Data for Rent-A-Vacation  
**Approach:** Hybrid Agent Team + Sequential  
**Estimated Timeline:** 2 hours 15 minutes total

---

## Executive Summary

### The Problem

Currently, property owners manually enter resort information when creating listings:
- Free-text resort names (inconsistent: "Tuscany Village" vs "Hilton Grand Vacations Club at Tuscany Village")
- Manual location entry (errors, inconsistencies)
- No resort amenities, policies, or contact information
- No standardized unit type specifications
- Duplicate data entry across similar properties

### The Solution

Implement a **resort master data system** where:
- Owners select from validated resort dropdown (10 HGV resorts initially)
- Resort information auto-populates (location, contact, amenities, policies)
- Owners select unit type from resort-specific options
- Unit specifications auto-populate (bedrooms, bathrooms, square footage, bedding)
- Owners can override for custom units
- Rich, consistent property listings with professional resort information

### Business Value

- ✅ **Improved Data Quality:** Consistent, validated resort names and locations
- ✅ **Enhanced Listings:** Professional resort information increases booking confidence
- ✅ **Faster Listing Creation:** Auto-populated fields save owner time
- ✅ **Better Search:** Voice search can leverage structured resort data
- ✅ **Scalability:** Easy to add Marriott, Disney, other brands

---

## Technical Architecture

### Current State

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  brand vacation_club_brand,        -- Enum: hilton_grand_vacations, marriott_vacation_club, etc.
  resort_name TEXT,                  -- Free text (inconsistent)
  location TEXT,                     -- Free text (inconsistent)
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  sleeps INTEGER,
  amenities TEXT[],
  images TEXT[],
  ...
);
```

### Future State

```sql
-- NEW: Master resort data
CREATE TABLE resorts (
  id UUID PRIMARY KEY,
  brand vacation_club_brand NOT NULL,
  resort_name TEXT UNIQUE NOT NULL,
  location JSONB NOT NULL,              -- {city, state, country, full_address}
  description TEXT,
  contact JSONB,                        -- {phone, email, website}
  resort_amenities TEXT[],
  policies JSONB,                       -- {check_in, check_out, parking, pets, fees}
  nearby_airports TEXT[],
  guest_rating NUMERIC(2,1),
  main_image_url TEXT,
  additional_images TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- NEW: Standard unit type configurations
CREATE TABLE resort_unit_types (
  id UUID PRIMARY KEY,
  resort_id UUID REFERENCES resorts(id),
  unit_type_name TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC(3,1) NOT NULL,
  max_occupancy INTEGER NOT NULL,
  square_footage INTEGER,
  kitchen_type TEXT,                    -- "Full Kitchen", "Kitchenette", "None"
  bedding_config TEXT,                  -- "1 King, 2 Queens, 1 Sofa Bed"
  features JSONB,                       -- {balcony, view_type, washer_dryer, accessible}
  unit_amenities TEXT[],
  image_urls TEXT[],
  created_at TIMESTAMPTZ
);

-- MODIFIED: Link properties to master data
ALTER TABLE properties
  ADD COLUMN resort_id UUID REFERENCES resorts(id),
  ADD COLUMN unit_type_id UUID REFERENCES resort_unit_types(id);
```

**Backward Compatible:** Existing properties continue working without `resort_id` (nullable foreign key)

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROPERTIES TABLE                         │
│                       (User-Owned Listings)                      │
├─────────────────────────────────────────────────────────────────┤
│ • id (uuid)                                                     │
│ • owner_id (uuid → auth.users)                                 │
│ • brand (vacation_club_brand enum)                             │
│ • resort_name (text) - kept for backward compat                │
│ • resort_id (uuid → resorts.id) [NEW, NULLABLE]                │
│ • unit_type_id (uuid → resort_unit_types.id) [NEW, NULLABLE]   │
│ • bedrooms, bathrooms, sleeps (can override master data)        │
│ • amenities, images (user-specific)                            │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ├─────────────────────┐
                                   │                     │
                                   ▼                     ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│         RESORTS TABLE                │  │    RESORT_UNIT_TYPES TABLE           │
│      (Master Resort Data)            │  │   (Standard Unit Configurations)     │
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ • id (uuid, PK)                      │  │ • id (uuid, PK)                      │
│ • brand (vacation_club_brand)        │  │ • resort_id (uuid → resorts.id)      │
│ • resort_name (text, UNIQUE)         │  │ • unit_type_name (text)              │
│ • location (jsonb)                   │  │ • bedrooms (integer)                 │
│ • description (text)                 │  │ • bathrooms (numeric)                │
│ • contact (jsonb)                    │  │ • max_occupancy (integer)            │
│ • resort_amenities (text[])          │  │ • square_footage (integer)           │
│ • policies (jsonb)                   │  │ • kitchen_type (text)                │
│ • nearby_airports (text[])           │  │ • bedding_config (text)              │
│ • guest_rating (numeric)             │  │ • features (jsonb)                   │
│ • main_image_url (text)              │  │ • unit_amenities (text[])            │
│ • additional_images (text[])         │  │ • image_urls (text[])                │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

---

## Sample Data

### Resorts (10 HGV Properties)

| Resort Name | Location | Unit Types |
|-------------|----------|------------|
| Hilton Grand Vacations Club at Tuscany Village | Orlando, FL | Studio, 1BR, 2BR, 3BR |
| Parc Soleil, a Hilton Grand Vacations Club | Orlando, FL | Studio, 1BR, 2BR, 3BR |
| SeaWorld® Orlando, a Hilton Grand Vacations Club | Orlando, FL | Studio, 1BR, 2BR, 3BR |
| Elara, a Hilton Grand Vacations Club | Las Vegas, NV | Studio, 1BR, 2BR, 3BR |
| The Boulevard, a Hilton Grand Vacations Club | Las Vegas, NV | 1BR, 2BR |
| Grand Waikikian, a Hilton Grand Vacations Club | Honolulu, HI | 1BR, 2BR, Penthouse |
| Ocean Tower, a Hilton Grand Vacations Club | Waikoloa, HI | Studio, 1BR, 2BR, 3BR, Penthouse |
| Hilton Grand Vacations Club at MarBrisa | Carlsbad, CA | 1BR, 2BR |
| Hilton Vacation Club Lake Tahoe Resort | South Lake Tahoe, CA | 1BR, 2BR |
| Ocean 22, a Hilton Grand Vacations Club | Myrtle Beach, SC | 1BR, 2BR, 3BR |

**Total:** 10 resorts, 33 unit types

### Example Resort Data (Tuscany Village)

```json
{
  "resort_name": "Hilton Grand Vacations Club at Tuscany Village",
  "brand": "hilton_grand_vacations",
  "location": {
    "city": "Orlando",
    "state": "Florida",
    "country": "United States",
    "full_address": "8122 Arrezzo Way, Orlando, FL 32821"
  },
  "description": "Just minutes from Walt Disney World and adjacent to Orlando Premium Outlets...",
  "contact": {
    "phone": "+1 407-465-2600",
    "website": "https://www.hiltongrandvacations.com/resorts-and-destinations/florida/central/tuscany-village-a-hilton-grand-vacations-club"
  },
  "resort_amenities": [
    "Resort-style Pool",
    "Fitness Center",
    "Sports Court",
    "Recreation Room",
    "Dining & Bars",
    "Walking Path",
    "Spa Services",
    "Kids Activities",
    "Free WiFi",
    "Business Center"
  ],
  "policies": {
    "check_in": "4:00 PM",
    "check_out": "10:00 AM",
    "parking": "Complimentary self-parking",
    "pets": "Not allowed",
    "resort_fees": "May apply"
  },
  "nearby_airports": [
    "Orlando International Airport (MCO) - 15 miles"
  ],
  "guest_rating": 4.3,
  "main_image_url": "https://via.placeholder.com/800x600?text=Tuscany+Village"
}
```

### Example Unit Type (2-Bedroom Suite)

```json
{
  "resort_name": "Hilton Grand Vacations Club at Tuscany Village",
  "unit_type_name": "2-Bedroom Suite",
  "bedrooms": 2,
  "bathrooms": 2.0,
  "max_occupancy": 6,
  "square_footage": 1050,
  "kitchen_type": "Full Kitchen",
  "bedding_config": "1 King Bed, 2 Queen Beds, 1 Sofa Bed",
  "features": {
    "balcony": true,
    "view_type": "Resort View",
    "washer_dryer": true,
    "accessible": false
  },
  "unit_amenities": [
    "WiFi",
    "Full Kitchen",
    "Washer/Dryer In-Unit",
    "Private Balcony",
    "Flat-Screen TVs",
    "DVD Player",
    "Coffee Maker"
  ],
  "image_urls": []
}
```

---

## User Flows

### Owner: Create New Listing (Enhanced)

```
1. Navigate to /list-property
   ↓
2. SELECT BRAND
   [Dropdown: Hilton Grand Vacations, Marriott Vacation Club, etc.]
   ↓
3. SELECT RESORT
   [Searchable dropdown filtered by brand]
   Shows preview: Location, rating, amenities
   ↓
4. AUTO-POPULATED FIELDS
   ✅ Resort name
   ✅ Location (city, state)
   ✅ Contact information
   ✅ Resort amenities
   ✅ Policies (check-in/out, parking, pets)
   ↓
5. SELECT UNIT TYPE
   [Dropdown filtered by selected resort]
   Shows: "2-Bedroom Suite (sleeps 6, 1050 sq ft)"
   ↓
6. AUTO-POPULATED FIELDS
   ✅ Bedrooms: 2
   ✅ Bathrooms: 2.0
   ✅ Sleeps: 6
   ✅ Square footage: 1,050 sq ft
   ✅ Kitchen: Full Kitchen
   ✅ Bedding: 1 King, 2 Queens, 1 Sofa Bed
   ✅ Unit amenities
   ↓
7. CUSTOMIZE (Optional)
   Owner can override if their unit differs:
   - Custom amenities
   - Different bedding
   - Upload unit-specific photos
   ↓
8. SET PRICING & AVAILABILITY
   (Existing flow continues)
   ↓
9. SUBMIT FOR APPROVAL
```

**Fallback:** "My resort isn't listed" → Use old manual flow

### Traveler: View Property Detail (Enhanced)

```
1. Browse /rentals, click property
   ↓
2. PROPERTY DETAIL PAGE SHOWS:
   
   ┌─────────────────────────────────────┐
   │ Property Title                      │
   │ 2-Bedroom Suite at Tuscany Village  │
   └─────────────────────────────────────┘
   
   ┌─────────────────────────────────────┐
   │ RESORT INFORMATION CARD             │
   ├─────────────────────────────────────┤
   │ Hilton Grand Vacations Club at      │
   │ Tuscany Village ★★★★☆ 4.3           │
   │                                     │
   │ 📍 Orlando, Florida                 │
   │ 📞 +1 407-465-2600                  │
   │ 🌐 View Official Resort Website     │
   │                                     │
   │ ✨ Resort Amenities:                │
   │ • Resort-style Pool                 │
   │ • Fitness Center                    │
   │ • Spa Services                      │
   │ • Kids Activities                   │
   │ • Free WiFi                         │
   │                                     │
   │ ℹ️ Policies:                        │
   │ Check-in: 4:00 PM                   │
   │ Check-out: 10:00 AM                 │
   │ Parking: Complimentary              │
   │ Pets: Not allowed                   │
   └─────────────────────────────────────┘
   
   ┌─────────────────────────────────────┐
   │ UNIT SPECIFICATIONS                 │
   ├─────────────────────────────────────┤
   │ 🏠 2 Bedrooms • 2 Bathrooms         │
   │ 👥 Sleeps 6 guests                  │
   │ 📐 1,050 sq ft                      │
   │ 🍳 Full Kitchen                     │
   │                                     │
   │ 🛏️ Bedding Configuration:          │
   │ • Master: 1 King Bed                │
   │ • Bedroom 2: 2 Queen Beds           │
   │ • Living Room: 1 Sofa Bed           │
   │                                     │
   │ ✨ Unit Amenities:                  │
   │ • WiFi                              │
   │ • Washer/Dryer In-Unit              │
   │ • Private Balcony                   │
   │ • Flat-Screen TVs                   │
   └─────────────────────────────────────┘
```

---

## API Contracts

### Query: Get Resorts by Brand

```typescript
// Query
const { data: resorts } = await supabase
  .from('resorts')
  .select('*')
  .eq('brand', 'hilton_grand_vacations')
  .order('resort_name');

// Response
[
  {
    id: "uuid-1",
    brand: "hilton_grand_vacations",
    resort_name: "Elara, a Hilton Grand Vacations Club",
    location: {
      city: "Las Vegas",
      state: "Nevada",
      country: "United States",
      full_address: "80 East Harmon Avenue, Las Vegas, NV 89109"
    },
    contact: {
      phone: "+1 702-761-0600",
      website: "https://..."
    },
    resort_amenities: ["Rooftop Pool", "Spa", "Fitness Center", ...],
    policies: { check_in: "4:00 PM", ... },
    guest_rating: 4.6,
    main_image_url: "https://...",
    ...
  },
  ...
]
```

### Query: Get Unit Types for Resort

```typescript
// Query
const { data: unitTypes } = await supabase
  .from('resort_unit_types')
  .select('*')
  .eq('resort_id', resortId)
  .order('bedrooms');

// Response
[
  {
    id: "uuid-1",
    resort_id: "uuid-resort",
    unit_type_name: "Studio Suite",
    bedrooms: 0,
    bathrooms: 1.0,
    max_occupancy: 4,
    square_footage: 400,
    kitchen_type: "Kitchenette",
    bedding_config: "1 King Bed, 1 Sofa Bed",
    features: {
      balcony: true,
      view_type: "Resort View",
      washer_dryer: false
    },
    unit_amenities: ["WiFi", "TV", "Kitchenette", ...],
    ...
  },
  ...
]
```

### Query: Get Property with Full Resort Details

```typescript
// Query
const { data: property } = await supabase
  .from('properties')
  .select(`
    *,
    resort:resorts(*),
    unit_type:resort_unit_types(*)
  `)
  .eq('id', propertyId)
  .single();

// Response
{
  id: "property-uuid",
  owner_id: "user-uuid",
  brand: "hilton_grand_vacations",
  resort_name: "Tuscany Village...",  // Kept for backward compat
  resort_id: "resort-uuid",
  unit_type_id: "unit-type-uuid",
  bedrooms: 2,
  bathrooms: 2.0,
  sleeps: 6,
  images: ["user-photo-1.jpg", ...],
  resort: {
    resort_name: "Hilton Grand Vacations Club at Tuscany Village",
    location: { city: "Orlando", state: "Florida", ... },
    resort_amenities: [...],
    policies: {...},
    contact: {...},
    ...
  },
  unit_type: {
    unit_type_name: "2-Bedroom Suite",
    square_footage: 1050,
    kitchen_type: "Full Kitchen",
    bedding_config: "1 King, 2 Queens, 1 Sofa Bed",
    unit_amenities: [...],
    ...
  }
}
```

---

## Component Architecture

### New Components

```
src/components/resort/
├─ ResortSelector.tsx           # Brand → Resort → Unit Type cascade
│  Props: { onResortSelect, onUnitTypeSelect, value }
│  State: selectedBrand, selectedResort, selectedUnitType
│
├─ UnitTypeSelector.tsx         # Filtered unit type dropdown
│  Props: { resortId, value, onChange }
│
├─ ResortPreview.tsx            # Shows resort info during selection
│  Props: { resort }
│  Displays: location, rating, amenities preview
│
├─ ResortInfoCard.tsx           # Full resort details (PropertyDetail)
│  Props: { resort }
│  Displays: contact, amenities, policies, nearby airports
│
├─ UnitTypeSpecs.tsx            # Unit specifications (PropertyDetail)
│  Props: { unitType }
│  Displays: bedrooms, bathrooms, sq ft, bedding, amenities
│
└─ ResortAmenities.tsx          # Amenities grid display
   Props: { amenities: string[] }
```

### Modified Components

```
src/pages/
├─ ListProperty.tsx
│  Add: <ResortSelector />
│  Update: Form schema to include resort_id, unit_type_id
│  Update: Auto-populate fields from selected resort/unit type
│
└─ PropertyDetail.tsx
   Add: <ResortInfoCard resort={property.resort} />
   Add: <UnitTypeSpecs unitType={property.unit_type} />
   Update: Show resort badge on property title
```

---

## Implementation Sessions

### SESSION 1: Agent Team (Database + Listing Flow)
**Duration:** ~1 hour  
**Agents:** Database Engineer + Listing Flow Engineer

**Database Engineer Tasks:**
1. Create `resorts` table
2. Create `resort_unit_types` table
3. Alter `properties` table (add resort_id, unit_type_id)
4. Import 10 HGV resorts from JSON
5. Import 33 unit types from JSON
6. Create indexes
7. Create helper view: `properties_with_resort_details`

**Listing Flow Engineer Tasks:**
1. Create `ResortSelector.tsx` component
2. Create `UnitTypeSelector.tsx` component
3. Create `ResortPreview.tsx` component
4. Update `ListProperty.tsx` form
5. Add Supabase queries for resort/unit data
6. Implement auto-population logic
7. Add "Resort not listed" fallback

**Deliverables:**
- `handoffs/session1-team-handoff.md`
- SQL migration file
- New React components
- Updated ListProperty page

---

### SESSION 2: Display Engineer (Solo)
**Duration:** ~45 min  
**Agent:** Property Display Engineer

**Tasks:**
1. Create `ResortInfoCard.tsx` component
2. Create `UnitTypeSpecs.tsx` component
3. Create `ResortAmenities.tsx` component
4. Update `PropertyDetail.tsx` to show resort info
5. Update `Rentals.tsx` property cards (add resort badge)
6. Add "View Official Website" link
7. Ensure graceful fallback for properties without resort_id

**Deliverables:**
- `handoffs/session2-display-handoff.md`
- New display components
- Updated PropertyDetail page

---

### SESSION 3: Search/QA Engineer (Solo)
**Duration:** ~30 min  
**Agent:** Search Integration & QA

**Tasks:**
1. Update voice search Edge Function to return resort data
2. Test voice search with new resort info
3. Update manual search filters (optional: filter by resort)
4. E2E test listing creation flow
5. E2E test property detail display
6. Verify backward compatibility (properties without resort_id)
7. Accessibility validation
8. Fill out production checklist

**Deliverables:**
- `handoffs/session3-search-qa-handoff.md`
- Updated Edge Function
- Test report
- Production checklist

---

## Success Criteria

### Session 1 (Agent Team)
- ✅ `resorts` table created with 10 HGV resorts
- ✅ `resort_unit_types` table created with 33 unit types
- ✅ `properties` table has resort_id and unit_type_id columns
- ✅ Data imports successfully (no errors)
- ✅ ResortSelector component renders and cascades correctly
- ✅ Selecting resort auto-populates location, contact, amenities
- ✅ Selecting unit type auto-populates bedrooms, bathrooms, sleeps
- ✅ "Resort not listed" fallback works

### Session 2 (Display)
- ✅ PropertyDetail shows resort information card (if resort_id exists)
- ✅ PropertyDetail shows unit type specifications (if unit_type_id exists)
- ✅ Resort amenities display correctly
- ✅ "View Official Website" link works
- ✅ Graceful fallback for old properties (no resort_id)
- ✅ Property cards on /rentals show resort badge

### Session 3 (Search/QA)
- ✅ Voice search returns properties with resort data
- ✅ Voice assistant can describe resort amenities
- ✅ E2E listing flow works (brand → resort → unit type → submit)
- ✅ E2E property detail shows all resort info
- ✅ Old properties still display correctly
- ✅ No accessibility violations
- ✅ All tests passing

---

## Rollback Plan

**If critical issues arise:**

### Option 1: Feature Flag
```typescript
// In .env.local and Vercel env vars
VITE_FEATURE_RESORT_MASTER_DATA=false

// In ListProperty.tsx
const resortMasterDataEnabled = 
  import.meta.env.VITE_FEATURE_RESORT_MASTER_DATA === "true";

return resortMasterDataEnabled ? (
  <ResortSelector {...props} />
) : (
  <OldManualInput {...props} />
);
```

### Option 2: Database Rollback
```sql
-- Remove foreign keys (keeps data intact)
ALTER TABLE properties
  DROP COLUMN resort_id,
  DROP COLUMN unit_type_id;

-- Drop new tables
DROP TABLE resort_unit_types;
DROP TABLE resorts;
```

---

## Next Steps After Phase 2

**Phase 2B: Image Management**
- Admin panel to upload/edit resort images
- Bulk image import for all resorts
- User-uploaded property photos remain

**Phase 2C: Additional Brands**
- Add Marriott Vacation Club (15-20 resorts)
- Add Disney Vacation Club (15 resorts)
- Add Wyndham, Hyatt, others

**Phase 2D: Advanced Features**
- Resort comparison tool
- "Similar properties" based on resort
- Resort-specific booking trends

---

**END OF PROJECT BRIEF**
