import axios from 'axios';

// src/services/api.js
const API_URL = "https://traficobackendtoyota.onrender.com/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const saveRecord = (data) => api.post('/save', data);
export const getAllRecords = (params) => api.get(`/records${params || ''}`);
export const getRecordsByPhone = (phone) => api.get(`/records/phone/${phone}`);
export const getRecordsByClientName = (name) => api.get(`/records/client?name=${name}`);
export const updateRecord = (id, data) => api.put(`/record/${id}`, data);
// Usa el endpoint real de actualización parcial (TrafficController.partialUpdate),
// que acepta exactamente { exitTime, comments, nextVisit } vía TrafficUpdateDTO.
export const completeExit = (id, data) => api.patch(`/record/${id}`, data || {});
export const deleteRecord = (id) => api.delete(`/record/${id}`);
export const getCoaches = () => api.get('/coaches');
export const getModels = () => api.get('/models');
export const getOptions = (category) => api.get(`/options/${category}`);

export default {
    saveRecord,
    getAllRecords,
    getRecordsByPhone,
    getRecordsByClientName,
    updateRecord,
    completeExit,
    deleteRecord,
    getCoaches,
    getModels,
    getOptions
};
