# JSON Modely pre Správu lôžkovej časti nemocnice (MongoDB)

## 1. Model pre Oddelenie (Department)

```json
{
    "_id": "673a1b2c3d4e5f6789012345",
    "name": "Interné oddelenie",
    "description": "Oddelenie vnútorného lekárstva",
    "floor": 2,
    "capacity": {
        "maximum_beds": 40,
        "actual_beds": 30,
        "occupied_beds": 15
    },
    "created_at": "2024-01-15T08:00:00Z",
    "updated_at": "2024-01-15T08:00:00Z"
}
```

## 2. Model pre Lôžko (Bed)

```json
{
    "_id": "673a1b2c3d4e5f6789012346",
    "department_id": "673a1b2c3d4e5f6789012345",
    "bed_type": "standard",
    "bed_quality": 0.1,
    "status": {
        "patient_id": "673a1b2c3d4e5f6789012347",
        "description": "akurat je po nehode"
    },
    "created_at": "2024-01-15T08:00:00Z",
    "updated_at": "2024-01-15T08:00:00Z"
}
```

## 3. Model pre Pacienta s Hospitalizačnými záznamami (Patient)

```json
{
    "_id": "673a1b2c3d4e5f6789012347",
    "first_name": "Mária",
    "last_name": "Svobodová",
    "birth_date": "1985-03-15",
    "gender": "F",
    "phone": "+421902345678",
    "email": "maria.svobodova@email.sk",
    "hospitalization_records": [
        {
            "id": "673a1b2c3d4e5f6789012348",
            "description": "Hospitalizácia pre infekčnú chorobu"
        }
    ],
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
}
```

## 4. Model pre Hospitalizáciu/Obsadenie (Bed Occupation)

```json
{
  "_id": "ObjectId('...')",
  "id": "hospitalizacia-001",
  "patient_id": "pacient-123",
  "bed_id": "lozko-001",
  "department_id": "oddelenie-001",
  "admission_date": "2024-01-15T08:00:00Z",
  "planned_discharge_date": "2024-01-20T12:00:00Z",
  "actual_discharge_date": null,
  "admission_type": "emergency", // emergency, planned, transfer
  "diagnosis": {
    "primary": "acute gastritis",
    "secondary": ["dehydration"],
    "icd10_codes": ["K29.1", "E86"]
  },
  "attending_doctor": {
    "id": "doctor-001",
    "name": "MUDr. Peter Svoboda",
    "department": "Interné oddelenie"
  },
  "treatment_plan": {
    "description": "Infúzna terapia, diéta",
    "medications": [
      {
        "name": "Omeprazol",
        "dosage": "40mg",
        "frequency": "1x denne",
        "route": "per os"
      }
    ]
  },
  "status": "active", // active, completed, transferred, cancelled
  "notes": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "author": "MUDr. Peter Svoboda",
      "content": "Pacient prijatý s bolesťami brucha"
    }
  ],
  "billing_info": {
    "insurance_covered": true,
    "daily_rate": 150.00,
    "currency": "EUR"
  },
  "created_at": "2024-01-15T08:00:00Z",
  "updated_at": "2024-01-15T16:30:00Z"
}
```

## 5. Pomocný model pre Štatistiky oddelenia (Department Statistics)

```json
{
  "_id": "ObjectId('...')",
  "department_id": "oddelenie-001",
  "date": "2024-01-15",
  "statistics": {
    "occupancy_rate": 83.33,
    "total_beds": 30,
    "occupied_beds": 25,
    "available_beds": 5,
    "admissions_today": 3,
    "discharges_today": 2,
    "average_stay_duration": 4.5,
    "emergency_admissions": 1,
    "planned_admissions": 2
  },
  "generated_at": "2024-01-15T23:59:59Z"
}
```

## Indexy pre MongoDB

### Pre optimálnu výkonnosť odporúčam tieto indexy:

```javascript
// Department collection
db.departments.createIndex({ "id": 1 }, { unique: true })
db.departments.createIndex({ "status": 1 })
db.departments.createIndex({ "floor": 1, "building": 1 })

// Bed collection  
db.beds.createIndex({ "id": 1 }, { unique: true })
db.beds.createIndex({ "department_id": 1 })
db.beds.createIndex({ "status": 1 })
db.beds.createIndex({ "bed_number": 1 }, { unique: true })
db.beds.createIndex({ "current_patient_id": 1 })

// Patient collection
db.patients.createIndex({ "id": 1 }, { unique: true })
db.patients.createIndex({ "personal_info.birth_number": 1 }, { unique: true })
db.patients.createIndex({ "status": 1 })
db.patients.createIndex({ "personal_info.last_name": 1, "personal_info.first_name": 1 })

// Bed Occupation collection
db.bed_occupations.createIndex({ "id": 1 }, { unique: true })
db.bed_occupations.createIndex({ "patient_id": 1 })
db.bed_occupations.createIndex({ "bed_id": 1 })
db.bed_occupations.createIndex({ "department_id": 1 })
db.bed_occupations.createIndex({ "status": 1 })
db.bed_occupations.createIndex({ "admission_date": 1 })
db.bed_occupations.createIndex({ "planned_discharge_date": 1 })

// Department Statistics collection
db.department_statistics.createIndex({ "department_id": 1, "date": 1 }, { unique: true })
```

## Výhody tohto návrhu:

1. **Normalizácia**: Každá entita má svoj vlastný dokument
2. **Flexibilita**: Schéma umožňuje jednoduché rozšírenia
3. **Referencie**: Používanie ID referencií medzi dokumentami
4. **Historické údaje**: Podpora pre históriu hospitalizácií
5. **Štatistiky**: Možnosť generovania reportov
6. **Validácia**: Jasne definované typy a povinné polia
7. **Auditovanie**: Timestamps pre created_at a updated_at 