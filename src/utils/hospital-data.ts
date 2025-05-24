// Types based on simplified MongoDB models
export interface Department {
  _id: string;
  name: string;
  description: string;
  floor: number;
  capacity: {
    maximum_beds: number;
    actual_beds: number;
    occupied_beds: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Bed {
  _id: string;
  department_id: string;
  bed_type: string;
  bed_quality: number;
  status: {
    patient_id?: string;
    description: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Patient {
  _id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  phone: string;
  email: string;
  hospitalization_records: {
    id: string;
    description: string;
  }[];
  created_at: string;
  updated_at: string;
}

// Mock Data
const mockDepartments: Department[] = [
  {
    _id: "673a1b2c3d4e5f6789012345",
    name: "Interné oddelenie",
    description: "Oddelenie vnútorného lekárstva",
    floor: 2,
    capacity: {
      maximum_beds: 40,
      actual_beds: 30,
      occupied_beds: 15
    },
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  },
  {
    _id: "673a1b2c3d4e5f6789012349",
    name: "Chirurgické oddelenie",
    description: "Oddelenie všeobecnej chirurgie",
    floor: 3,
    capacity: {
      maximum_beds: 25,
      actual_beds: 20,
      occupied_beds: 18
    },
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  },
  {
    _id: "673a1b2c3d4e5f678901234a",
    name: "Pediátrické oddelenie",
    description: "Oddelenie pre deti a dorastencov",
    floor: 1,
    capacity: {
      maximum_beds: 20,
      actual_beds: 15,
      occupied_beds: 8
    },
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  }
];

const mockBeds: Bed[] = [
  {
    _id: "673a1b2c3d4e5f6789012346",
    department_id: "673a1b2c3d4e5f6789012345",
    bed_type: "standard",
    bed_quality: 0.8,
    status: {
      patient_id: "673a1b2c3d4e5f6789012347",
      description: "Pacient po operácii"
    },
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  },
  {
    _id: "673a1b2c3d4e5f678901234b",
    department_id: "673a1b2c3d4e5f6789012345",
    bed_type: "standard",
    bed_quality: 0.9,
    status: {
      description: "Lôžko je voľné"
    },
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  },
  {
    _id: "673a1b2c3d4e5f678901234c",
    department_id: "673a1b2c3d4e5f6789012345",
    bed_type: "intensive",
    bed_quality: 0.95,
    status: {
      patient_id: "673a1b2c3d4e5f678901234d",
      description: "JIS pacient"
    },
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  }
];

const mockPatients: Patient[] = [
  {
    _id: "673a1b2c3d4e5f6789012347",
    first_name: "Mária",
    last_name: "Svobodová",
    birth_date: "1985-03-15",
    gender: "F",
    phone: "+421902345678",
    email: "maria.svobodova@email.sk",
    hospitalization_records: [
      {
        id: "673a1b2c3d4e5f6789012348",
        description: "Hospitalizácia pre infekčnú chorobu"
      },
      {
        id: "673a1b2c3d4e5f678901234e",
        description: "Kontrolná prehliadka po operácii"
      }
    ],
    created_at: "2024-01-20T10:30:00Z",
    updated_at: "2024-01-20T10:30:00Z"
  },
  {
    _id: "673a1b2c3d4e5f678901234d",
    first_name: "Ján",
    last_name: "Novák",
    birth_date: "1978-11-22",
    gender: "M",
    phone: "+421905123456",
    email: "jan.novak@email.sk",
    hospitalization_records: [
      {
        id: "673a1b2c3d4e5f678901234f",
        description: "Urgentná hospitalizácia - infarkt"
      }
    ],
    created_at: "2024-01-18T14:20:00Z",
    updated_at: "2024-01-18T14:20:00Z"
  },
  {
    _id: "673a1b2c3d4e5f6789012350",
    first_name: "Anna",
    last_name: "Kováčová",
    birth_date: "1992-07-08",
    gender: "F",
    phone: "+421907654321",
    email: "anna.kovacova@email.sk",
    hospitalization_records: [],
    created_at: "2024-01-22T09:15:00Z",
    updated_at: "2024-01-22T09:15:00Z"
  }
];

// Mock API Service
export class HospitalDataService {
  // Departments
  static getDepartments(): Promise<Department[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...mockDepartments]), 300);
    });
  }

  static getDepartment(id: string): Promise<Department | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const dept = mockDepartments.find(d => d._id === id) || null;
        resolve(dept);
      }, 200);
    });
  }

  static createDepartment(dept: Omit<Department, '_id' | 'created_at' | 'updated_at'>): Promise<Department> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newDept: Department = {
          ...dept,
          _id: 'new_' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockDepartments.push(newDept);
        resolve(newDept);
      }, 300);
    });
  }

  static updateDepartment(id: string, updates: Partial<Department>): Promise<Department | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const deptIndex = mockDepartments.findIndex(d => d._id === id);
        if (deptIndex >= 0) {
          mockDepartments[deptIndex] = {
            ...mockDepartments[deptIndex],
            ...updates,
            updated_at: new Date().toISOString()
          };
          resolve(mockDepartments[deptIndex]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }

  // Beds
  static getBedsByDepartment(departmentId: string): Promise<Bed[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const beds = mockBeds.filter(b => b.department_id === departmentId);
        resolve(beds);
      }, 200);
    });
  }

  static getBed(id: string): Promise<Bed | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const bed = mockBeds.find(b => b._id === id) || null;
        resolve(bed);
      }, 200);
    });
  }

  static createBed(bed: Omit<Bed, '_id' | 'created_at' | 'updated_at'>): Promise<Bed> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newBed: Bed = {
          ...bed,
          _id: 'new_' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockBeds.push(newBed);
        resolve(newBed);
      }, 300);
    });
  }

  static updateBed(id: string, updates: Partial<Bed>): Promise<Bed | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const bedIndex = mockBeds.findIndex(b => b._id === id);
        if (bedIndex >= 0) {
          mockBeds[bedIndex] = {
            ...mockBeds[bedIndex],
            ...updates,
            updated_at: new Date().toISOString()
          };
          resolve(mockBeds[bedIndex]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }

  // Patients
  static getPatients(): Promise<Patient[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...mockPatients]), 300);
    });
  }

  static getPatient(id: string): Promise<Patient | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const patient = mockPatients.find(p => p._id === id) || null;
        resolve(patient);
      }, 200);
    });
  }

  static updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const patientIndex = mockPatients.findIndex(p => p._id === id);
        if (patientIndex >= 0) {
          mockPatients[patientIndex] = {
            ...mockPatients[patientIndex],
            ...updates,
            updated_at: new Date().toISOString()
          };
          resolve(mockPatients[patientIndex]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }

  static createPatient(patient: Omit<Patient, '_id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newPatient: Patient = {
          ...patient,
          _id: 'new_' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockPatients.push(newPatient);
        resolve(newPatient);
      }, 300);
    });
  }

  static deletePatient(id: string): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        const index = mockPatients.findIndex(p => p._id === id);
        if (index >= 0) {
          mockPatients.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }
}
