import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import TrafficForm from './components/TrafficForm';
import TrafficHistory from './components/TrafficHistory';
import { getCoaches, getModels } from './services/api';
import logoToyota from './assets/toyotaPachuca.png';

function App() {
    const [activeTab, setActiveTab] = useState('form');
    const [coaches, setCoaches] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadSelectData = async () => {
        setLoading(true);
        try {
            const coachesRes = await getCoaches();
            setCoaches(coachesRes.data);
        } catch (error) {
            console.error('Error cargando coaches:', error);
        }
        try {
            const modelsRes = await getModels();
            setModels(modelsRes.data);
        } catch (error) {
            console.error('Error cargando modelos:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadSelectData();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-ring" />
                <p>Cargando datos…</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="header">
                <div className="header-brand">
                    <img 
                        src={logoToyota}
                        alt="Toyota Pachuca"
                        className="header-logo"
                        onClick={() => setActiveTab('form')}
                        style={{ cursor: 'pointer' }}
                        title="Ir a Nuevo Registro"
                    />
                    <div className="subtitle">Hoja de Tráfico</div>
                </div>
                <div className="header-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
                        onClick={() => setActiveTab('form')}
                    >
                        Nuevo Registro
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Historial
                    </button>
                </div>
            </header>

            <main className="main-content">
                {activeTab === 'form' ? (
                    <TrafficForm
                        coaches={coaches}
                        models={models}
                        onSaveSuccess={() => setActiveTab('history')}
                    />
                ) : (
                    <TrafficHistory />
                )}
            </main>
        </div>
    );
}

export default App;