import {
  DepartmentsApi,
  BedsApi,
  PatientsApi,
  Configuration,
  Department,
  Bed,
  Patient
} from '../api/hospital-management';

export class HospitalApiService {
  private departmentsApi: DepartmentsApi;
  private bedsApi: BedsApi;
  private patientsApi: PatientsApi;

  constructor(apiBase: string = 'http://localhost:8080/api') {
    const configuration = new Configuration({
      basePath: apiBase,
    });

    this.departmentsApi = new DepartmentsApi(configuration);
    this.bedsApi = new BedsApi(configuration);
    this.patientsApi = new PatientsApi(configuration);
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.departmentsApi.getDepartmentsRaw();
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        throw new Error(`Cannot retrieve departments: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      throw new Error(`Cannot retrieve departments: ${err.message || "unknown"}`);
    }
  }

  async getDepartment(id: string): Promise<Department | null> {
    try {
      const response = await this.departmentsApi.getDepartmentRaw({ departmentId: id });
      if (response.raw.status < 299) {
        return await response.value();
      } else if (response.raw.status === 404) {
        return null;
      } else {
        throw new Error(`Cannot retrieve department: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching department:', err);
      if (err.message.includes('404')) {
        return null;
      }
      throw new Error(`Cannot retrieve department: ${err.message || "unknown"}`);
    }
  }

  async createDepartment(department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    try {
      const response = await this.departmentsApi.createDepartmentRaw({ department });
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        throw new Error(`Cannot create department: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error creating department:', err);
      throw new Error(`Cannot create department: ${err.message || "unknown"}`);
    }
  }

  async updateDepartment(id: string, department: Department): Promise<Department | null> {
    try {
      const response = await this.departmentsApi.updateDepartmentRaw({
        departmentId: id,
        department: department
      });

      if (response.raw.status < 299) {
        return await response.value();
      } else if (response.raw.status === 404) {
        return null;
      } else {
        throw new Error(`Cannot update department: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error updating department:', err);
      if (err.message.includes('404')) {
        return null;
      }
      throw new Error(`Cannot update department: ${err.message || "unknown"}`);
    }
  }

  async deleteDepartment(id: string): Promise<boolean> {
    try {
      console.log('API SERVICE - deleteDepartment called with ID:', id);
      const response = await this.departmentsApi.deleteDepartmentRaw({ departmentId: id });

      if (response.raw.status < 299) {
        console.log('API SERVICE - deleteDepartment successful');
        return true;
      } else if (response.raw.status === 404) {
        console.log('API SERVICE - deleteDepartment - department not found');
        return false;
      } else {
        throw new Error(`Cannot delete department: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error deleting department:', err);
      if (err.message.includes('404')) {
        return false;
      }
      throw new Error(`Cannot delete department: ${err.message || "unknown"}`);
    }
  }

  // Beds
  async getAllBeds(): Promise<Bed[]> {
    try {
      const response = await this.bedsApi.getBedsRaw();
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        throw new Error(`Cannot retrieve beds: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching all beds:', err);
      throw new Error(`Cannot retrieve beds: ${err.message || "unknown"}`);
    }
  }

  async getBedsByDepartment(departmentId: string): Promise<Bed[]> {
    try {
      console.log('API SERVICE - getBedsByDepartment called with departmentId:', departmentId);
      const response = await this.bedsApi.getDepartmentBedsRaw({ departmentId });
      if (response.raw.status < 299) {
        const result = await response.value();
        console.log('API SERVICE - getBedsByDepartment response:', JSON.stringify(result, null, 2));

        // Log each bed's status to see the mapping
        result.forEach((bed, index) => {
          console.log(`API SERVICE - Bed ${index} status:`, JSON.stringify(bed.status, null, 2));
          console.log(`API SERVICE - Bed ${index} patientId:`, bed.status.patientId);
          console.log(`API SERVICE - Bed ${index} is occupied:`, !!bed.status.patientId);
        });

        return result;
      } else {
        throw new Error(`Cannot retrieve beds: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching department beds:', err);
      throw new Error(`Cannot retrieve beds: ${err.message || "unknown"}`);
    }
  }

  async getBed(id: string): Promise<Bed | null> {
    try {
      console.log('API SERVICE - getBed called with ID:', id);
      const response = await this.bedsApi.getBedRaw({ bedId: id });
      if (response.raw.status < 299) {
        const result = await response.value();
        console.log('API SERVICE - getBed response:', JSON.stringify(result, null, 2));
        console.log('API SERVICE - getBed departmentId:', result?.departmentId);
        console.log('API SERVICE - getBed bedType:', result?.bedType);
        console.log('API SERVICE - getBed bedQuality:', result?.bedQuality);
        return result;
      } else if (response.raw.status === 404) {
        return null;
      } else {
        throw new Error(`Cannot retrieve bed: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching bed:', err);
      if (err.message.includes('404')) {
        return null;
      }
      throw new Error(`Cannot retrieve bed: ${err.message || "unknown"}`);
    }
  }

  async createBed(departmentId: string, bed: Omit<Bed, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bed> {
    try {
      // Add departmentId to bed object since the API expects it in the body
      const bedData = { ...bed, departmentId: departmentId } as Bed;
      const response = await this.bedsApi.createBedRaw({ bed: bedData });
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        throw new Error(`Cannot create bed: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error creating bed:', err);
      throw new Error(`Cannot create bed: ${err.message || "unknown"}`);
    }
  }

  async updateBed(id: string, bed: Bed): Promise<Bed | null> {
    try {
      console.log('API SERVICE - updateBed called with ID:', id);
      console.log('API SERVICE - updateBed called with bed object:', JSON.stringify(bed, null, 2));
      console.log('API SERVICE - bed.departmentId:', bed.departmentId);
      console.log('API SERVICE - bed.bedType:', bed.bedType);
      console.log('API SERVICE - bed.bedQuality:', bed.bedQuality);

      const response = await this.bedsApi.updateBedRaw({
        bedId: id,
        bed: bed
      });

      if (response.raw.status < 299) {
        const result = await response.value();
        console.log('API SERVICE - updateBed response:', JSON.stringify(result, null, 2));
        return result;
      } else if (response.raw.status === 404) {
        return null;
      } else {
        throw new Error(`Cannot update bed: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error updating bed:', err);
      if (err.message.includes('404')) {
        return null;
      }
      throw new Error(`Cannot update bed: ${err.message || "unknown"}`);
    }
  }

  async deleteBed(id: string): Promise<boolean> {
    try {
      console.log('API SERVICE - deleteBed called with ID:', id);
      const response = await this.bedsApi.deleteBedRaw({ bedId: id });

      if (response.raw.status < 299) {
        console.log('API SERVICE - deleteBed successful');
        return true;
      } else if (response.raw.status === 404) {
        console.log('API SERVICE - deleteBed - bed not found');
        return false;
      } else {
        throw new Error(`Cannot delete bed: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error deleting bed:', err);
      if (err.message.includes('404')) {
        return false;
      }
      throw new Error(`Cannot delete bed: ${err.message || "unknown"}`);
    }
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    try {
      const response = await this.patientsApi.getPatientsRaw();
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        throw new Error(`Cannot retrieve patients: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      throw new Error(`Cannot retrieve patients: ${err.message || "unknown"}`);
    }
  }

  async getPatient(id: string): Promise<Patient | null> {
    try {
      const response = await this.patientsApi.getPatientRaw({ patientId: id });
      if (response.raw.status < 299) {
        return await response.value();
      } else if (response.raw.status === 404) {
        return null;
      } else {
        throw new Error(`Cannot retrieve patient: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching patient:', err);
      if (err.message.includes('404')) {
        return null;
      }
      throw new Error(`Cannot retrieve patient: ${err.message || "unknown"}`);
    }
  }

  async updatePatient(id: string, patient: Patient): Promise<Patient | null> {
    try {
      const response = await this.patientsApi.updatePatientRaw({
        patientId: id,
        patient: patient
      });

      if (response.raw.status < 299) {
        return await response.value();
      } else if (response.raw.status === 404) {
        return null;
      } else {
        throw new Error(`Cannot update patient: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error updating patient:', err);
      if (err.message.includes('404')) {
        return null;
      }
      throw new Error(`Cannot update patient: ${err.message || "unknown"}`);
    }
  }

  async createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    try {
      const response = await this.patientsApi.createPatientRaw({ patient });
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        throw new Error(`Cannot create patient: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error creating patient:', err);
      throw new Error(`Cannot create patient: ${err.message || "unknown"}`);
    }
  }

  async deletePatient(id: string): Promise<boolean> {
    try {
      const response = await this.patientsApi.deletePatientRaw({ patientId: id });
      if (response.raw.status < 299) {
        return true;
      } else if (response.raw.status === 404) {
        return false;
      } else {
        throw new Error(`Cannot delete patient: ${response.raw.statusText}`);
      }
    } catch (err: any) {
      console.error('Error deleting patient:', err);
      if (err.message.includes('404')) {
        return false;
      }
      throw new Error(`Cannot delete patient: ${err.message || "unknown"}`);
    }
  }

  // Hospitalization Records
  async addHospitalizationRecord(patientId: string, record: { description: string }): Promise<Patient | null> {
    try {
      // Get current patient
      const patient = await this.getPatient(patientId);
      if (!patient) {
        return null;
      }

      // Add new record with generated ID
      const newRecord = {
        id: 'hosp_' + Date.now(),
        description: record.description
      };

      const updatedRecords = [...(patient.hospitalizationRecords || []), newRecord];

      // Update patient with new records - pass complete patient object
      const updatedPatient: Patient = {
        ...patient,
        hospitalizationRecords: updatedRecords
      };

      return await this.updatePatient(patientId, updatedPatient);
    } catch (err: any) {
      console.error('Error adding hospitalization record:', err);
      throw new Error(`Cannot add hospitalization record: ${err.message || "unknown"}`);
    }
  }

  async updateHospitalizationRecord(patientId: string, recordId: string, updates: { description: string }): Promise<Patient | null> {
    try {
      // Get current patient
      const patient = await this.getPatient(patientId);
      if (!patient) {
        return null;
      }

      // Update the specific record
      const updatedRecords = patient.hospitalizationRecords.map(record =>
        record.id === recordId
          ? { ...record, description: updates.description }
          : record
      );

      // Update patient with modified records - pass complete patient object
      const updatedPatient: Patient = {
        ...patient,
        hospitalizationRecords: updatedRecords
      };

      return await this.updatePatient(patientId, updatedPatient);
    } catch (err: any) {
      console.error('Error updating hospitalization record:', err);
      throw new Error(`Cannot update hospitalization record: ${err.message || "unknown"}`);
    }
  }

  async deleteHospitalizationRecord(patientId: string, recordId: string): Promise<Patient | null> {
    try {
      // Get current patient
      const patient = await this.getPatient(patientId);
      if (!patient) {
        return null;
      }

      // Remove the specific record
      const updatedRecords = patient.hospitalizationRecords.filter(
        record => record.id !== recordId
      );

      // Update patient with filtered records - pass complete patient object
      const updatedPatient: Patient = {
        ...patient,
        hospitalizationRecords: updatedRecords
      };

      return await this.updatePatient(patientId, updatedPatient);
    } catch (err: any) {
      console.error('Error deleting hospitalization record:', err);
      throw new Error(`Cannot delete hospitalization record: ${err.message || "unknown"}`);
    }
  }
}
