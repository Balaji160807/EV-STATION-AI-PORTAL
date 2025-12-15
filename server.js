// server.js (Node.js/Express Backend)

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Enable CORS for frontend communication (Important for development)
app.use(cors());
// Middleware for parsing JSON bodies
app.use(express.json());

// --- Simulated Data (Initial State) ---
let stationData = {
    totalEVs: 12,
    chargersInUse: 8,
    chargersAvailable: 4,
    gridLoad: 75, 
    loadLimit: 100, 
    powerConsumed: 55.0, 
    aiStatus: "Active - Load Balancing",
    revenueToday: 450.75,
    energyCostToday: 112.30,
    costSavingsAI: 35.10,
    peakAvoidanceSavings: 15.50
};

let chargingSessions = [
    { id: 'EV-12', charger: 1, battery: 65, target: 80, departure: '06:30 PM', priority: 'Low', status: 'Slowing (Grid)', power: 5.5, aiDisabled: false },
    { id: 'EV-07', charger: 3, battery: 85, target: 95, departure: '07:50 PM', priority: 'High', status: 'Boosting', power: 15.0, aiDisabled: false },
    { id: 'EV-03', charger: 5, battery: 12, target: 100, departure: '10:00 PM', priority: 'Low', status: 'Active (Slow)', power: 3.0, aiDisabled: false },
    { id: 'EV-19', charger: 8, battery: 45, target: 90, departure: '09:30 PM', priority: 'Medium', status: 'Charging Normal', power: 7.7, aiDisabled: false },
    { id: 'EV-21', charger: 2, battery: 20, target: 80, departure: '08:00 PM', priority: 'Medium', status: 'Charging Normal', power: 7.0, aiDisabled: false },
];

let aiLogs = [
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: 'Alert', message: '⚠️ **Grid Load High** — slowing non-urgent charging.' },
    // ... other initial logs
];
// --- End Simulated Data ---


// --- API Endpoints ---

// 1. Get Live Station Data (for Dashboard/Grid)
app.get('/api/station-data', (req, res) => {
    // In a real application, this would query a database or an EV management system
    res.json(stationData);
});

// 2. Get Charging Sessions
app.get('/api/sessions', (req, res) => {
    res.json(chargingSessions);
});

// 3. Get AI Logs
app.get('/api/logs', (req, res) => {
    res.json(aiLogs);
});

// 4. Update Charging Priority (Responsive Action)
app.post('/api/sessions/priority', (req, res) => {
    const { evId, newPriority } = req.body;
    const session = chargingSessions.find(s => s.id === evId);

    if (session) {
        session.priority = newPriority;
        session.status = `Owner set to ${newPriority} Priority`;
        
        // Log the action on the server
        const log = { time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: 'Action', message: `Owner manually set **${evId}** to ${newPriority} priority.` };
        aiLogs.unshift(log); // Add to the front of the log list
        
        // Simulate AI response for high priority
        if (newPriority === 'High') {
            stationData.gridLoad += 5; // Simulate load increase
            session.power = 15.0;
            aiLogs.unshift({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: 'Action', message: `AI boosts ${evId} charging speed (safe adjustment).` });
        }
        
        res.status(200).json({ message: 'Priority updated successfully', session, newLog: log });
    } else {
        res.status(404).json({ message: 'EV Session not found' });
    }
});

// 5. Toggle AI Control
app.post('/api/sessions/toggle-ai', (req, res) => {
    const { chargerId } = req.body;
    const session = chargingSessions.find(s => s.charger === chargerId);

    if (session) {
        session.aiDisabled = !session.aiDisabled;
        session.status = session.aiDisabled ? 'AI OFF (Manual Control)' : 'AI Active';
        
        const action = session.aiDisabled ? 'disabled' : 'enabled';
        const log = { time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: 'Action', message: `Owner manually **${action}** AI for Charger #${chargerId}.` };
        aiLogs.unshift(log);
        
        res.status(200).json({ message: 'AI Toggled successfully', session, newLog: log });
    } else {
        res.status(404).json({ message: 'Charger not found' });
    }
});

// 6. Pause Charging
app.post('/api/sessions/pause', (req, res) => {
    const { evId } = req.body;
    const session = chargingSessions.find(s => s.id === evId);

    if (session) {
        session.status = `Paused by Owner`;
        session.power = 0;
        
        const log = { time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: 'Action', message: `Owner manually **Paused** charging for **${evId}**.` };
        aiLogs.unshift(log);
        
        res.status(200).json({ message: 'Charging paused successfully', session, newLog: log });
    } else {
        res.status(404).json({ message: 'EV Session not found' });
    }
});

// 7. Endpoint for Revenue Data (Read-only)
app.get('/api/revenue', (req, res) => {
    const totalProfit = stationData.revenueToday - stationData.energyCostToday + stationData.costSavingsAI;
    const revenueData = {
        ...stationData,
        totalProfit: totalProfit.toFixed(2),
        savingsSolar: 10.50.toFixed(2)
    };
    res.json(revenueData);
});


// Start the server
app.listen(PORT, () => {
    console.log(`⚡ Backend running on http://localhost:${PORT}`);
});