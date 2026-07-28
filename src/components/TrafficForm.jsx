import React, { useState, useRef } from 'react';
import { saveRecord, getRecordsByPhone } from '../services/api';
import './TrafficForm.css';

const initialFormData = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    coachName: '',
    greeters: '',
    adv: '',
    requiredModel: '',
    appointment: 'No',
    internetOther: '',
    prospection: 'No',
    demoEstatica: 'No',
    pruebaManejo: 'No',
    hojaOpciones: 'No',
    planFinanciamiento: 'No',
    toyotour: 'No',
    autoActualAvaluo: 'No',
    intervinoCoach: 'No',
    entryTime: '',
    entryTimeLocked: false
};

// NOTA IMPORTANTE: el backend (Traffic/TrafficRequestDTO) no tiene concepto de
// "cliente único" — no existe clienteId ni tabla clientes en el modelo activo.
// Cada "Registrar" siempre crea una fila nueva en /traffic/save.
// Este chequeo de teléfono es solo informativo: le avisa a la recepcionista
// que ese teléfono ya tiene visitas y le autocompleta nombre/correo para no
// volver a teclearlos, pero el registro que se guarda sigue siendo independiente.
function TrafficForm({ coaches, models, onSaveSuccess }) {
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [checkingPhone, setCheckingPhone] = useState(false);
    const [pendingMatch, setPendingMatch] = useState(null); // { record, count }
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [matchedInfo, setMatchedInfo] = useState(null); // { visits }
    const lastCheckedPhone = useRef('');

    const greetersList = ['Ana García', 'María López', 'Laura Pérez', 'Carmen Rodríguez', 'Sofía Martínez'];
    const advList = ['Juan Pérez', 'Carlos Gómez', 'Luis Fernández', 'Miguel Torres', 'Javier Ruiz'];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (name === 'phone') {
            // Si cambia el teléfono manualmente, el banner de "datos completados" ya no aplica
            // y se permite volver a verificar ese número.
            lastCheckedPhone.current = '';
            setMatchedInfo(null);
        }
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePhoneBlur = async () => {
        const phone = formData.phone.trim();
        if (phone.length < 10) return;
        if (lastCheckedPhone.current === phone) return;
        lastCheckedPhone.current = phone;

        setCheckingPhone(true);
        try {
            const res = await getRecordsByPhone(phone);
            const visits = Array.isArray(res.data) ? res.data : [];
            if (visits.length > 0) {
                setPendingMatch({ record: visits[0], count: visits.length });
                setShowDuplicateModal(true);
            }
        } catch (error) {
            console.error('Error verificando teléfono:', error);
        } finally {
            setCheckingPhone(false);
        }
    };

    const confirmUseExisting = () => {
        if (!pendingMatch) return;
        const { record, count } = pendingMatch;
        const fullName = (record.clienteNombre || '').trim();
        const [first, ...rest] = fullName.split(' ');

        setFormData(prev => ({
            ...prev,
            firstName: first || prev.firstName,
            lastName: rest.join(' ') || prev.lastName,
            phone: record.clienteTelefono || prev.phone,
            email: record.clienteEmail || prev.email
        }));
        setMatchedInfo({ visits: count });
        setShowDuplicateModal(false);
        setPendingMatch(null);
    };

    const dismissDuplicate = () => {
        setShowDuplicateModal(false);
        setPendingMatch(null);
        setFormData(prev => ({ ...prev, phone: '' }));
        lastCheckedPhone.current = '';
    };

    const handleEntryTimeAuto = () => {
        if (!formData.entryTimeLocked) {
            const now = new Date().toISOString().slice(0, 16);
            setFormData(prev => ({
                ...prev,
                entryTime: now,
                entryTimeLocked: true
            }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
        if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
        if (!formData.phone.trim()) {
            newErrors.phone = 'El número de teléfono es requerido';
        } else if (formData.phone.length < 10) {
            newErrors.phone = 'El teléfono debe tener 10 dígitos';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Correo electrónico inválido';
        }
        if (!formData.adv.trim()) newErrors.adv = 'El Asesor (ADV) es requerido';
        if (!formData.greeters.trim()) newErrors.greeters = 'El Greeters es requerido';
        return newErrors;
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setMatchedInfo(null);
        setPendingMatch(null);
        lastCheckedPhone.current = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        setSuccessMessage('');

        try {
            // Debe coincidir exactamente con TrafficRequestDTO — el backend
            // ignora cualquier campo extra y rechaza (400) si faltan firstName/lastName/phone/email.
            const dataToSend = {
                coachName: formData.coachName || null,
                greeters: formData.greeters,
                adv: formData.adv,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                email: formData.email,
                requiredModel: formData.requiredModel || null,
                appointment: formData.appointment,
                internetOther: formData.internetOther || null,
                prospection: formData.prospection,
                firstVisit: matchedInfo ? 'No' : 'Si',
                demoEstatica: formData.demoEstatica,
                pruebaManejo: formData.pruebaManejo,
                hojaOpciones: formData.hojaOpciones,
                planFinanciamiento: formData.planFinanciamiento,
                toyotour: formData.toyotour,
                autoActualAvaluo: formData.autoActualAvaluo,
                intervinoCoach: formData.intervinoCoach,
                entryTime: formData.entryTime ? new Date(formData.entryTime).toISOString() : null
            };

            await saveRecord(dataToSend);
            setSuccessMessage(matchedInfo ? 'Nueva visita registrada exitosamente' : 'Cliente registrado exitosamente');

            setTimeout(() => {
                resetForm();
                setSuccessMessage('');
                if (onSaveSuccess) onSaveSuccess();
            }, 1600);

        } catch (error) {
            console.error('Error guardando:', error);
            setErrors({
                submit: error.response?.data?.message || 'Error al guardar el registro'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="traffic-form">
            <form onSubmit={handleSubmit}>

                {/* DATOS DEL CLIENTE */}
                <div className="form-section">
                    <h3>Datos del Cliente</h3>

                    {matchedInfo && (
                        <div className="matched-banner">
                            ✓ Datos completados de un cliente existente — {matchedInfo.visits} visita{matchedInfo.visits === 1 ? '' : 's'} previa{matchedInfo.visits === 1 ? '' : 's'} encontrada{matchedInfo.visits === 1 ? '' : 's'}
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="required">Nombre</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Nombre"
                                className={errors.firstName ? 'error' : ''}
                            />
                            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                        </div>
                        <div className="form-group">
                            <label className="required">Apellido</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Apellido"
                                className={errors.lastName ? 'error' : ''}
                            />
                            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="required">Teléfono</label>
                            <div className="phone-input-wrap">
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onBlur={handlePhoneBlur}
                                    placeholder="10 dígitos"
                                    maxLength={10}
                                    className={errors.phone ? 'error' : ''}
                                />
                                {checkingPhone && <span className="phone-checking">Verificando…</span>}
                            </div>
                            {errors.phone && <span className="error-text">{errors.phone}</span>}
                            <small className="hint">Si el cliente ya tiene visitas, te avisamos y podemos autocompletar sus datos</small>
                        </div>
                        <div className="form-group">
                            <label className="required">Correo Electrónico</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="cliente@email.com"
                                className={errors.email ? 'error' : ''}
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>
                    </div>
                </div>

                {/* ATENCIÓN */}
                <div className="form-section">
                    <h3>Atención</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Coach de Ventas <span className="optional-tag">(opcional)</span></label>
                            <select name="coachName" value={formData.coachName} onChange={handleChange}>
                                <option value="">Sin Coach</option>
                                {(coaches || []).map(coach => (
                                    <option key={coach.id} value={coach.name}>{coach.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="required">Greeters (Recepcionista)</label>
                            <select name="greeters" value={formData.greeters} onChange={handleChange}>
                                <option value="">Seleccionar Recepcionista</option>
                                {greetersList.map((name, index) => (
                                    <option key={index} value={name}>{name}</option>
                                ))}
                            </select>
                            {errors.greeters && <span className="error-text">{errors.greeters}</span>}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="required">ADV (Asesor de Ventas)</label>
                            <select name="adv" value={formData.adv} onChange={handleChange}>
                                <option value="">Seleccionar Asesor</option>
                                {advList.map((name, index) => (
                                    <option key={index} value={name}>{name}</option>
                                ))}
                            </select>
                            {errors.adv && <span className="error-text">{errors.adv}</span>}
                        </div>
                        <div className="form-group">
                            <label>Fecha y Hora de Entrada</label>
                            <div className="entry-time-group">
                                <input
                                    type="datetime-local"
                                    name="entryTime"
                                    value={formData.entryTime}
                                    onChange={handleChange}
                                    disabled={formData.entryTimeLocked}
                                    className={formData.entryTimeLocked ? 'disabled-input' : ''}
                                />
                                <button
                                    type="button"
                                    className="btn-entry"
                                    onClick={handleEntryTimeAuto}
                                    disabled={formData.entryTimeLocked}
                                >
                                    Auto
                                </button>
                            </div>
                            {formData.entryTimeLocked && (
                                <small className="hint">Hora registrada — no se puede modificar</small>
                            )}
                        </div>
                    </div>
                </div>

                {/* INTERÉS DEL CLIENTE */}
                <div className="form-section">
                    <h3>Interés del Cliente</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Modelo Requerido</label>
                            <select name="requiredModel" value={formData.requiredModel} onChange={handleChange}>
                                <option value="">Seleccionar modelo</option>
                                {(models || []).map(model => (
                                    <option key={model.id} value={model.name}>{model.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Cita Previa</label>
                            <select name="appointment" value={formData.appointment} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Internet u Otros</label>
                            <input
                                type="text"
                                name="internetOther"
                                value={formData.internetOther}
                                onChange={handleChange}
                                placeholder="Especificar"
                            />
                        </div>
                        <div className="form-group">
                            <label>Prospección</label>
                            <select name="prospection" value={formData.prospection} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ACTIVIDADES */}
                <div className="form-section">
                    <h3>Actividades Realizadas</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Demo Estática</label>
                            <select name="demoEstatica" value={formData.demoEstatica} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Prueba de Manejo</label>
                            <select name="pruebaManejo" value={formData.pruebaManejo} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Hoja de Opciones</label>
                            <select name="hojaOpciones" value={formData.hojaOpciones} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Plan de Financiamiento</label>
                            <select name="planFinanciamiento" value={formData.planFinanciamiento} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>TOYOTOUR</label>
                            <select name="toyotour" value={formData.toyotour} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Auto Actual — Avalúo Mecánico</label>
                            <select name="autoActualAvaluo" value={formData.autoActualAvaluo} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Intervino Coach</label>
                            <select name="intervinoCoach" value={formData.intervinoCoach} onChange={handleChange}>
                                <option value="Si">Si</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="form-group" />
                    </div>
                </div>

                {errors.submit && <div className="error-message">{errors.submit}</div>}
                {successMessage && <div className="success-message">✓ {successMessage}</div>}

                <div className="form-actions">
                    <button type="submit" className="btn-save" disabled={submitting}>
                        {submitting ? 'Guardando…' : matchedInfo ? 'Registrar Nueva Visita' : 'Registrar Cliente'}
                    </button>
                </div>
            </form>

            {/* MODAL: TELÉFONO YA REGISTRADO */}
            {showDuplicateModal && pendingMatch && (
                <div className="modal-overlay" onClick={dismissDuplicate}>
                    <div className="modal-card duplicate-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">⚠️</div>
                        <h3>Este teléfono ya tiene visitas registradas</h3>
                        <div className="client-summary-card inline">
                            <div className="client-summary-info">
                                <span className="client-summary-badge">
                                    {pendingMatch.count} visita{pendingMatch.count === 1 ? '' : 's'} encontrada{pendingMatch.count === 1 ? '' : 's'}
                                </span>
                                <div className="client-summary-name">{pendingMatch.record.clienteNombre || 'N/A'}</div>
                                <div className="client-summary-meta">
                                    <span>📞 {pendingMatch.record.clienteTelefono}</span>
                                    <span>✉️ {pendingMatch.record.clienteEmail}</span>
                                </div>
                            </div>
                        </div>
                        <p className="modal-hint">
                            ¿Es la misma persona? Podemos completar nombre y correo automáticamente para que no los captures de nuevo.
                        </p>
                        <div className="modal-actions">
                            <button type="button" className="btn-back" onClick={dismissDuplicate}>
                                No, es otro cliente
                            </button>
                            <button type="button" className="btn-save" onClick={confirmUseExisting}>
                                Sí, usar estos datos
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrafficForm;
