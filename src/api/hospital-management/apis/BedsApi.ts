/* tslint:disable */
/* eslint-disable */
/**
 * Hospital Management Api
 * Hospital Management System for Web-In-Cloud system
 *
 * The version of the OpenAPI document: 1.0.0
 * Contact: student@stuba.sk
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  Bed,
} from '../models';
import {
    BedFromJSON,
    BedToJSON,
} from '../models';

export interface CreateBedRequest {
    bed: Bed;
}

export interface DeleteBedRequest {
    bedId: string;
}

export interface GetBedRequest {
    bedId: string;
}

export interface GetDepartmentBedsRequest {
    departmentId: string;
}

export interface UpdateBedRequest {
    bedId: string;
    bed: Bed;
}

/**
 * BedsApi - interface
 *
 * @export
 * @interface BedsApiInterface
 */
export interface BedsApiInterface {
    /**
     * Use this method to create a new bed
     * @summary Creates new bed
     * @param {Bed} bed Bed to create
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BedsApiInterface
     */
    createBedRaw(requestParameters: CreateBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Bed>>;

    /**
     * Use this method to create a new bed
     * Creates new bed
     */
    createBed(requestParameters: CreateBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Bed>;

    /**
     * Use this method to delete specific bed
     * @summary Deletes specific bed
     * @param {string} bedId Bed ID
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BedsApiInterface
     */
    deleteBedRaw(requestParameters: DeleteBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     * Use this method to delete specific bed
     * Deletes specific bed
     */
    deleteBed(requestParameters: DeleteBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

    /**
     * Get details of particular bed
     * @summary Provides details about specific bed
     * @param {string} bedId Bed ID
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BedsApiInterface
     */
    getBedRaw(requestParameters: GetBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Bed>>;

    /**
     * Get details of particular bed
     * Provides details about specific bed
     */
    getBed(requestParameters: GetBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Bed>;

    /**
     * Get list of all beds in hospital
     * @summary Provides the list of all beds
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BedsApiInterface
     */
    getBedsRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<Bed>>>;

    /**
     * Get list of all beds in hospital
     * Provides the list of all beds
     */
    getBeds(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<Bed>>;

    /**
     * Get list of beds in specific department
     * @summary Provides beds for specific department
     * @param {string} departmentId Department ID
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BedsApiInterface
     */
    getDepartmentBedsRaw(requestParameters: GetDepartmentBedsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<Bed>>>;

    /**
     * Get list of beds in specific department
     * Provides beds for specific department
     */
    getDepartmentBeds(requestParameters: GetDepartmentBedsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<Bed>>;

    /**
     * Use this method to update bed details
     * @summary Updates specific bed
     * @param {string} bedId Bed ID
     * @param {Bed} bed Bed data to update
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BedsApiInterface
     */
    updateBedRaw(requestParameters: UpdateBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Bed>>;

    /**
     * Use this method to update bed details
     * Updates specific bed
     */
    updateBed(requestParameters: UpdateBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Bed>;

}

/**
 *
 */
export class BedsApi extends runtime.BaseAPI implements BedsApiInterface {

    /**
     * Use this method to create a new bed
     * Creates new bed
     */
    async createBedRaw(requestParameters: CreateBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Bed>> {
        if (requestParameters.bed === null || requestParameters.bed === undefined) {
            throw new runtime.RequiredError('bed','Required parameter requestParameters.bed was null or undefined when calling createBed.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/beds`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: BedToJSON(requestParameters.bed),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => BedFromJSON(jsonValue));
    }

    /**
     * Use this method to create a new bed
     * Creates new bed
     */
    async createBed(requestParameters: CreateBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Bed> {
        const response = await this.createBedRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Use this method to delete specific bed
     * Deletes specific bed
     */
    async deleteBedRaw(requestParameters: DeleteBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.bedId === null || requestParameters.bedId === undefined) {
            throw new runtime.RequiredError('bedId','Required parameter requestParameters.bedId was null or undefined when calling deleteBed.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/beds/{bedId}`.replace(`{${"bedId"}}`, encodeURIComponent(String(requestParameters.bedId))),
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Use this method to delete specific bed
     * Deletes specific bed
     */
    async deleteBed(requestParameters: DeleteBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.deleteBedRaw(requestParameters, initOverrides);
    }

    /**
     * Get details of particular bed
     * Provides details about specific bed
     */
    async getBedRaw(requestParameters: GetBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Bed>> {
        if (requestParameters.bedId === null || requestParameters.bedId === undefined) {
            throw new runtime.RequiredError('bedId','Required parameter requestParameters.bedId was null or undefined when calling getBed.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/beds/{bedId}`.replace(`{${"bedId"}}`, encodeURIComponent(String(requestParameters.bedId))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => BedFromJSON(jsonValue));
    }

    /**
     * Get details of particular bed
     * Provides details about specific bed
     */
    async getBed(requestParameters: GetBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Bed> {
        const response = await this.getBedRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get list of all beds in hospital
     * Provides the list of all beds
     */
    async getBedsRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<Bed>>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/beds`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(BedFromJSON));
    }

    /**
     * Get list of all beds in hospital
     * Provides the list of all beds
     */
    async getBeds(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<Bed>> {
        const response = await this.getBedsRaw(initOverrides);
        return await response.value();
    }

    /**
     * Get list of beds in specific department
     * Provides beds for specific department
     */
    async getDepartmentBedsRaw(requestParameters: GetDepartmentBedsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<Bed>>> {
        if (requestParameters.departmentId === null || requestParameters.departmentId === undefined) {
            throw new runtime.RequiredError('departmentId','Required parameter requestParameters.departmentId was null or undefined when calling getDepartmentBeds.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/departments/{departmentId}/beds`.replace(`{${"departmentId"}}`, encodeURIComponent(String(requestParameters.departmentId))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(BedFromJSON));
    }

    /**
     * Get list of beds in specific department
     * Provides beds for specific department
     */
    async getDepartmentBeds(requestParameters: GetDepartmentBedsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<Bed>> {
        const response = await this.getDepartmentBedsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Use this method to update bed details
     * Updates specific bed
     */
    async updateBedRaw(requestParameters: UpdateBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Bed>> {
        if (requestParameters.bedId === null || requestParameters.bedId === undefined) {
            throw new runtime.RequiredError('bedId','Required parameter requestParameters.bedId was null or undefined when calling updateBed.');
        }

        if (requestParameters.bed === null || requestParameters.bed === undefined) {
            throw new runtime.RequiredError('bed','Required parameter requestParameters.bed was null or undefined when calling updateBed.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/beds/{bedId}`.replace(`{${"bedId"}}`, encodeURIComponent(String(requestParameters.bedId))),
            method: 'PUT',
            headers: headerParameters,
            query: queryParameters,
            body: BedToJSON(requestParameters.bed),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => BedFromJSON(jsonValue));
    }

    /**
     * Use this method to update bed details
     * Updates specific bed
     */
    async updateBed(requestParameters: UpdateBedRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Bed> {
        const response = await this.updateBedRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
