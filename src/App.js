import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import TrafficForm from './components/TrafficForm';
import TrafficHistory from './components/TrafficHistory';
import { getCoaches, getModels } from './services/api';

function App() {
    const [activeTab, setActiveTab] = useState('form');
    const [coaches, setCoaches] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadSelectData = async () => {
        setLoading(true);
        // Se cargan por separado para que si uno falla, el otro igual funcione.
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
                <div className="header-title">
                    <h1>Toyota Pachuca</h1>
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
