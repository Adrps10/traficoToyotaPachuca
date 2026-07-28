import React, { useState, useEffect } from 'react';
import { getAllRecords, deleteRecord, completeExit } from '../services/api';
import './TrafficHistory.css';

function TrafficHistory() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const pageSize = 20;

    // --- Modal de salida ---
    const [exitTarget, setExitTarget] = useState(null);
    const [exitForm, setExitForm] = useState({ exitTime: '', hasNextVisit: false, nextVisit: '', comments: '' });
    const [exitSubmitting, setExitSubmitting] = useState(false);
    const [exitError, setExitError] = useState('');

    useEffect(() => {
        loadRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filterDate]);

    const loadRecords = async () => {
        try {
            setLoading(true);

            let params = `?page=${currentPage}&size=${pageSize}`;

            if (filterDate) {
                params += `&date=${filterDate}`;
            }

            if (searchTerm.trim()) {
                params += `&search=${encodeURIComponent(searchTerm.trim())}`;
            }

            const res = await getAllRecords(params);
            setRecords(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalRecords(res.data.totalRecords || 0);
            setTodayCount(res.data.todayCount || 0);
        } catch (error) {
            console.error('Error cargando registros:', error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(0);
        loadRecords();
    };

    const handleDateChange = (e) => {
        setFilterDate(e.target.value);
        setCurrentPage(0);
    };

    const handleFilterToday = () => {
        setFilterDate('');
        setSearchTerm('');
        setCurrentPage(0);
        loadRecords();
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterDate('');
        setCurrentPage(0);
        loadRecords();
    };

    const handleDelete = async (id, clientName) => {
        if (window.confirm(`¿Eliminar el registro de ${clientName}?`)) {
            try {
                await deleteRecord(id);
                loadRecords();
            } catch (error) {
                console.error('Error eliminando:', error);
                alert('Error al eliminar el registro');
            }
        }
    };

    // --- Flujo de salida ---
    const openExitModal = (record) => {
        setExitTarget(record);
        setExitError('');
        setExitForm({
            exitTime: new Date().toISOString().slice(0, 16),
            hasNextVisit: false,
            nextVisit: '',
            comments: ''
        });
    };

    const closeExitModal = () => {
        setExitTarget(null);
        setExitError('');
    };

    const handleExitFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setExitForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const confirmExit = async () => {
        if (!exitForm.exitTime) {
            setExitError('La hora de salida es requerida');
            return;
        }
        setExitSubmitting(true);
        setExitError('');
        try {
            await completeExit(exitTarget.id, {
                exitTime: new Date(exitForm.exitTime).toISOString(),
                nextVisit: exitForm.hasNextVisit && exitForm.nextVisit
                    ? new Date(exitForm.nextVisit).toISOString()
                    : null,
                comments: exitForm.comments || null
            });
            closeExitModal();
            loadRecords();
        } catch (error) {
            console.error('Error completando salida:', error);
            setExitError('Error al registrar la salida. Intenta de nuevo.');
        } finally {
            setExitSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-ring" />
                <p>Cargando historial…</p>
            </div>
        );
    }

    return (
        <div className="traffic-history">
            <div className="history-header">
                <h3>Historial de Registros</h3>
                <div className="badges">
                    <span className="badge-toyota">{totalRecords.toLocaleString()} registros</span>
                    <span className="badge-today">Hoy: {todayCount}</span>
                </div>
            </div>

            {/* FILTROS — también funciona como buscador por nombre/teléfono/email */}
            <div className="history-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o email…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn-filter" onClick={handleSearch}>Buscar</button>
                </div>

                <div className="filter-group">
                    <label>Fecha</label>
                    <input type="date" value={filterDate} onChange={handleDateChange} />
                </div>

                <button className="btn-filter-outline" onClick={handleFilterToday}>Hoy</button>
                <button className="btn-filter-clear" onClick={handleClearFilters}>Limpiar filtros</button>
            </div>

            {/* TABLA */}
            {records.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-icon">📭</p>
                    <p>No hay registros para mostrar</p>
                    <p className="empty-subtext">
                        {searchTerm || filterDate ? 'Prueba cambiando los filtros' : 'Aún no hay registros guardados'}
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Cliente</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Coach</th>
                                <th>Entrada</th>
                                <th>Salida</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record, index) => (
                                <tr key={record.id} className={record.exitTime ? 'completed' : ''}>
                                    <td>{currentPage * pageSize + index + 1}</td>
                                    <td>
                                        <strong>{record.clienteNombre || 'N/A'}</strong>
                                        <br />
                                        <small className="row-subtext">{formatDateShort(record.entryTime)}</small>
                                    </td>
                                    <td>{record.clienteTelefono || '-'}</td>
                                    <td>{record.clienteEmail || '-'}</td>
                                    <td>{record.coachName || '-'}</td>
                                    <td>{formatDate(record.entryTime)}</td>
                                    <td>{formatDate(record.exitTime)}</td>
                                    <td>
                                        <span className={`status ${record.exitTime ? 'completed' : 'active'}`}>
                                            {record.exitTime ? 'Completado' : 'Activo'}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        {!record.exitTime && (
                                            <button
                                                className="btn-exit-action"
                                                onClick={() => openExitModal(record)}
                                                title="Registrar salida"
                                            >
                                                Salida
                                            </button>
                                        )}
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(record.id, record.clienteNombre || '')}
                                            title="Eliminar"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                    >
                        ◀ Anterior
                    </button>
                    <span>Página {currentPage + 1} de {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                    >
                        Siguiente ▶
                    </button>
                </div>
            )}

            {/* MODAL: REGISTRAR SALIDA */}
            {exitTarget && (
                <div className="modal-overlay" onClick={closeExitModal}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Registrar salida</h3>
                        <p className="modal-hint">
                            {exitTarget.clienteNombre || 'Cliente'} — {exitTarget.clienteTelefono || ''}
                        </p>

                        <div className="form-group">
                            <label className="required">Hora de Salida</label>
                            <input
                                type="datetime-local"
                                name="exitTime"
                                value={exitForm.exitTime}
                                onChange={handleExitFormChange}
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="hasNextVisit"
                                    checked={exitForm.hasNextVisit}
                                    onChange={handleExitFormChange}
                                />
                                Agendar próxima visita (opcional)
                            </label>
                        </div>

                        {exitForm.hasNextVisit && (
                            <div className="form-group">
                                <label>Próxima Visita</label>
                                <input
                                    type="datetime-local"
                                    name="nextVisit"
                                    value={exitForm.nextVisit}
                                    onChange={handleExitFormChange}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Comentarios (opcional)</label>
                            <textarea
                                name="comments"
                                value={exitForm.comments}
                                onChange={handleExitFormChange}
                                maxLength={500}
                                rows={3}
                                placeholder="Comentarios adicionales sobre la visita…"
                            />
                            <span className="char-count">{exitForm.comments.length}/500</span>
                        </div>

                        {exitError && <div className="error-message">{exitError}</div>}

                        <div className="modal-actions">
                            <button type="button" className="btn-back" onClick={closeExitModal}>
                                Cancelar
                            </button>
                            <button type="button" className="btn-save" onClick={confirmExit} disabled={exitSubmitting}>
                                {exitSubmitting ? 'Guardando…' : 'Confirmar Salida'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrafficHistory;
